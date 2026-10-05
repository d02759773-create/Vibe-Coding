import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Col, Row, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseOrderStatusTag } from '@/components/PurchaseOrderStatusTag'
import {
  formatYuan,
  partnerLabel,
  taxRateLabel,
  closeOrderConfirmBody,
  inboundLinkStatusLabel,
} from '@/features/purchaseOrders/constants'
import {
  deletePurchaseOrder,
  getPurchaseOrderById,
  nowString,
  unreceivedQty,
  updateOrderStatus,
} from '@/features/purchaseOrders/storage'
import {
  submitFailureToast,
  validateOrderForSubmit,
} from '@/features/purchaseOrders/validate'
import type {
  PurchaseInboundLink,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
} from '@/features/purchaseOrders/types'
import { displayValue, formatDateTime } from '@/features/products/format'

type ConfirmAction = 'delete' | 'submit' | 'approve' | 'reject' | 'void' | 'close'

export function PurchaseOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [actionPending, setActionPending] = useState(false)

  const order = useMemo(() => {
    void refreshKey
    return id ? getPurchaseOrderById(id) : undefined
  }, [id, refreshKey])

  const showInboundCols = Boolean(
    order && ['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN', 'COMPLETED'].includes(order.status),
  )
  const showUnreceived = Boolean(
    order && ['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN'].includes(order.status),
  )
  const showInboundCard = showInboundCols

  const lineColumns = useMemo(() => {
    if (!order) return []
    const cols: ColumnsType<PurchaseOrderLine> = [
      { title: '序号', width: 60, render: (_v, _r, index) => index + 1 },
      {
        title: '商品编码',
        dataIndex: 'productCode',
        render: (code: string) => <Typography.Text code>{code}</Typography.Text>,
      },
      { title: '商品名称', dataIndex: 'productName' },
      { title: '商品条码', dataIndex: 'barcode', render: (v) => displayValue(v) },
      { title: '规格型号', dataIndex: 'specModel', render: (v) => displayValue(v) },
      { title: '单位', dataIndex: 'unit', render: (v) => displayValue(v) },
      { title: '采购数量', dataIndex: 'quantity' },
      { title: '单价（含税）', dataIndex: 'unitPrice', render: (v) => formatYuan(v) },
      { title: '税率', dataIndex: 'taxRate', render: (v) => taxRateLabel(v) },
      { title: '金额（含税）', dataIndex: 'lineAmount', render: (v) => formatYuan(v) },
    ]
    if (showInboundCols) {
      cols.push({ title: '累计已入库数量', dataIndex: 'receivedQty' })
    }
    if (showUnreceived) {
      cols.push({
        title: '未入库数量',
        render: (_v, line) => unreceivedQty(line),
      })
    }
    cols.push({ title: '行备注', dataIndex: 'lineRemark', render: (v) => displayValue(v) })
    return cols
  }, [order, showInboundCols, showUnreceived])

  const inboundColumns = useMemo(
    (): ColumnsType<PurchaseInboundLink> => [
      {
        title: '入库单号',
        dataIndex: 'inboundNo',
        render: (no: string) => (
          <Link to={`/purchase/inbound?inboundNo=${encodeURIComponent(no)}`}>
            <Typography.Link>{no}</Typography.Link>
          </Link>
        ),
      },
      { title: '入库日期', dataIndex: 'inboundDate' },
      { title: '本次入库数量', dataIndex: 'totalQty' },
      { title: '操作人', dataIndex: 'operator' },
      {
        title: '状态',
        dataIndex: 'status',
        render: (status) => inboundLinkStatusLabel(status),
      },
    ],
    [],
  )

  if (!order) {
    return (
      <PageContainer title="采购订单">
        <Typography.Text type="secondary">采购订单不存在</Typography.Text>
        <div style={{ marginTop: 16 }}>
          <Link to="/purchase/orders">
            <Typography.Link>返回列表</Typography.Link>
          </Link>
        </div>
      </PageContainer>
    )
  }

  function runAction(action: ConfirmAction) {
    if (!order || actionPending) return
    const current = order

    if (action === 'submit') {
      const result = validateOrderForSubmit(current)
      if (!result.ok) {
        setToast(submitFailureToast(result))
        setConfirmAction(null)
        return
      }
    }

    setActionPending(true)
    try {
      const ts = nowString()
      switch (action) {
        case 'delete':
          if (deletePurchaseOrder(current.id)) {
            setToast('采购订单已删除')
            navigate('/purchase/orders')
          }
          break
        case 'submit':
          updateOrderStatus(current.id, 'PENDING_AUDIT')
          setToast('已提交审核，等待审核确认')
          break
        case 'approve':
          updateOrderStatus(current.id, 'PENDING_STOCK_IN', {
            auditedBy: '林强',
            auditedAt: ts,
          })
          setToast('审核通过')
          break
        case 'reject':
          updateOrderStatus(current.id, 'DRAFT', { auditedBy: null, auditedAt: null })
          setToast('已驳回，单据已退回草稿')
          break
        case 'void':
          updateOrderStatus(current.id, 'VOIDED')
          setToast('采购订单已作废')
          break
        case 'close':
          updateOrderStatus(current.id, 'COMPLETED')
          setToast('订单已关闭，剩余数量不再接收')
          break
      }
      setConfirmAction(null)
      setRefreshKey((k) => k + 1)
    } finally {
      setActionPending(false)
    }
  }

  const confirmCopy: Record<ConfirmAction, { title: string; body: string; ok: string }> = {
    delete: {
      title: '确认删除',
      body: '删除后不可恢复，该采购订单将从系统中永久移除，确认删除？',
      ok: '确认删除',
    },
    submit: {
      title: '提交审核',
      body: '提交后单据将进入待审核状态，确认提交？',
      ok: '确认提交',
    },
    approve: {
      title: '确认审核',
      body: '审核通过后关键字段将锁定，不可再修改，确认审核通过？',
      ok: '确认审核',
    },
    reject: {
      title: '确认驳回',
      body: '驳回后单据将退回草稿，采购员可重新修改，确认驳回？',
      ok: '确认驳回',
    },
    void: {
      title: '确认作废',
      body: '作废后不可恢复，单据将进入已作废状态，确认作废？',
      ok: '确认作废',
    },
    close: {
      title: '确认关闭',
      body: '关闭后剩余未入库数量将不再接收，确认关闭订单？',
      ok: '确认关闭',
    },
  }

  return (
    <PageContainer
      title={`采购订单 ${order.orderNo}`}
      subTitle="采购管理 / 采购订单"
      tags={<PurchaseOrderStatusTag status={order.status} />}
      extra={
        <div data-anno="purchase-order-detail-actions">
          <DetailActions
            order={order}
            onAction={(a) => setConfirmAction(a)}
            onInbound={() =>
              navigate(
                `/purchase/inbound?purchaseOrderId=${order.id}&orderNo=${encodeURIComponent(order.orderNo)}`,
              )
            }
          />
        </div>
      }
      data-anno="purchase-order-detail"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageSection variant="form" title="基本信息" data-anno="purchase-order-detail-basic">
        <Row gutter={[16, 16]}>
          <Field label="采购单号" value={order.orderNo} />
          <Field label="供应商" value={partnerLabel(order.supplierCode, order.supplierName)} />
          <Field label="入库仓库" value={partnerLabel(order.warehouseCode, order.warehouseName)} />
          <Field label="下单日期" value={order.orderDate} />
          <Field label="预计到货日期" value={displayValue(order.expectedArrivalDate)} />
          <Field label="采购备注" value={displayValue(order.remark)} span={24} />
        </Row>
      </PageSection>

      <PageSection variant="form" title="商品明细" data-anno="purchase-order-detail-lines">
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          共 {order.skuCount} 种商品 | 总数量 {order.totalQuantity} 件 | 总金额{' '}
          {formatYuan(order.totalAmount)}
        </Typography.Paragraph>
        <Table<PurchaseOrderLine>
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 900 }}
          columns={lineColumns}
          dataSource={order.lines}
        />
        <div
          style={{
            marginTop: 12,
            padding: '12px 16px',
            borderRadius: 8,
            background: 'var(--ant-color-fill-quaternary)',
            fontWeight: 600,
          }}
        >
          共 {order.skuCount} 种商品　合计 {order.totalQuantity} 件　{formatYuan(order.totalAmount)}
        </div>
      </PageSection>

      {showInboundCard ? (
        <PageSection variant="form" title="关联入库单" data-anno="purchase-order-detail-inbound">
          {order.inboundLinks.length === 0 ? (
            <Typography.Text type="secondary">暂无关联入库单</Typography.Text>
          ) : (
            <Table<PurchaseInboundLink>
              rowKey="id"
              size="small"
              pagination={false}
              columns={inboundColumns}
              dataSource={order.inboundLinks}
            />
          )}
        </PageSection>
      ) : (
        <PageSection variant="form" title="关联入库单" data-anno="purchase-order-detail-inbound">
          <Typography.Text type="secondary">审核通过后可查看关联入库单</Typography.Text>
        </PageSection>
      )}

      <PageSection variant="form" title="制单信息" data-anno="purchase-order-detail-meta">
        <Row gutter={[16, 16]}>
          <Field label="创建人" value={order.createdBy} />
          <Field label="创建时间" value={formatDateTime(order.createdAt)} />
          <Field label="最后修改人" value={displayValue(order.updatedBy)} />
          <Field label="最后修改时间" value={formatDateTime(order.updatedAt)} />
          <Field label="审核人" value={displayValue(order.auditedBy)} />
          <Field label="审核时间" value={formatDateTime(order.auditedAt)} />
        </Row>
      </PageSection>
      </Space>

      <Modal
        open={Boolean(confirmAction)}
        title={confirmAction ? confirmCopy[confirmAction].title : ''}
        confirmLabel={confirmAction ? confirmCopy[confirmAction].ok : '确认'}
        confirmVariant={
          confirmAction === 'delete' || confirmAction === 'void' ? 'destructive' : 'default'
        }
        confirmDisabled={actionPending}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && runAction(confirmAction)}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {confirmAction
            ? confirmAction === 'close'
              ? closeOrderConfirmBody(order)
              : confirmCopy[confirmAction].body
            : ''}
        </Typography.Paragraph>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

function Field({ label, value, span = 6 }: { label: string; value: string; span?: number }) {
  return (
    <Col xs={24} md={12} lg={span}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <div style={{ marginTop: 2, wordBreak: 'break-all' }}>
        <Typography.Text>{value}</Typography.Text>
      </div>
    </Col>
  )
}

function DetailActions({
  order,
  onAction,
  onInbound,
}: {
  order: PurchaseOrder
  onAction: (a: ConfirmAction) => void
  onInbound: () => void
}) {
  const s: PurchaseOrderStatus = order.status
  return (
    <Space wrap>
      <Link to="/purchase/orders">
        <Typography.Link>返回列表</Typography.Link>
      </Link>
      {s === 'DRAFT' && (
        <>
          <Link to={`/purchase/orders/${order.id}/edit`}>
            <Typography.Link>编辑</Typography.Link>
          </Link>
          <Button type="button" size="sm" variant="destructive" onClick={() => onAction('delete')}>
            删除
          </Button>
          <Button type="button" size="sm" onClick={() => onAction('submit')}>
            提交审核
          </Button>
        </>
      )}
      {s === 'PENDING_AUDIT' && (
        <>
          <Button type="button" size="sm" onClick={() => onAction('approve')}>
            审核通过
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onAction('reject')}>
            驳回
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => onAction('void')}>
            作废
          </Button>
        </>
      )}
      {(s === 'PENDING_STOCK_IN' || s === 'PARTIAL_STOCK_IN') && (
        <>
          <Button type="button" size="sm" onClick={onInbound}>
            创建入库单
          </Button>
          {s === 'PENDING_STOCK_IN' ? (
            <Button type="button" size="sm" variant="destructive" onClick={() => onAction('void')}>
              作废
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => onAction('close')}>
              关闭订单
            </Button>
          )}
        </>
      )}
    </Space>
  )
}
