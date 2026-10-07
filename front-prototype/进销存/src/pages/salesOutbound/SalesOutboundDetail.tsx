import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Alert, Col, Row, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { SalesOutboundStatusTag } from '@/components/SalesOutboundStatusTag'
import { formatYuan, partnerLabel } from '@/features/salesOutbound/constants'
import { taxRateLabel } from '@/features/purchaseOrders/constants'
import {
  confirmSalesOutbound,
  deleteSalesOutbound,
  getSalesOutboundById,
} from '@/features/salesOutbound/storage'
import type { SalesOutboundLine } from '@/features/salesOutbound/types'
import { confirmFailureToast, validateConfirm } from '@/features/salesOutbound/validate'
import { displayValue, formatDateTime } from '@/features/products/format'

export function SalesOutboundDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<'delete' | 'confirm' | null>(null)
  const [pending, setPending] = useState(false)

  const doc = useMemo(() => {
    void refreshKey
    return id ? getSalesOutboundById(id) : undefined
  }, [id, refreshKey])

  const lineColumns: ColumnsType<SalesOutboundLine> = [
    { title: '序号', width: 60, render: (_v, _r, i) => i + 1 },
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '商品名称', dataIndex: 'productName' },
    { title: '参考未出库数量', dataIndex: 'refUnshippedQty' },
    { title: '本次拣货数量', dataIndex: 'pickedQty' },
    { title: '本次出库数量', dataIndex: 'shipQty' },
    {
      title: '破损拒收数量',
      render: (_, l) => Math.max(0, l.pickedQty - l.shipQty),
    },
    { title: '差异原因', dataIndex: 'diffReason', render: (v) => displayValue(v) },
    { title: '单价（含税）', render: (_, l) => formatYuan(l.unitPrice) },
    { title: '税率', render: (_, l) => taxRateLabel(l.taxRate) },
    { title: '出库金额（含税）', render: (_, l) => formatYuan(l.lineAmount) },
    { title: '行备注', dataIndex: 'lineRemark', render: (v) => displayValue(v) },
  ]

  if (!doc) {
    return (
      <PageContainer>
        <Typography.Text>出库单不存在</Typography.Text>
        <Link to="/sales/outbound">返回列表</Link>
      </PageContainer>
    )
  }

  function runAction() {
    if (!confirmKind || !doc) return
    const current = doc
    setPending(true)
    try {
      if (confirmKind === 'delete') {
        if (deleteSalesOutbound(current.id)) {
          setToast('销售出库单已删除')
          navigate('/sales/outbound')
        }
      } else {
        const v = validateConfirm(current)
        if (!v.ok) {
          setToast(v.message ?? confirmFailureToast(v))
          return
        }
        if (confirmSalesOutbound(current.id)) {
          setToast('出库确认成功')
          setRefreshKey((k) => k + 1)
        }
      }
      setConfirmKind(null)
    } finally {
      setPending(false)
    }
  }

  return (
    <PageContainer
      title={`销售出库单 ${doc.outboundNo}`}
      tags={<SalesOutboundStatusTag status={doc.status} />}
      extra={
        <Space wrap data-anno="sales-outbound-detail-actions">
          <Button type="default" size="sm" onClick={() => navigate('/sales/outbound')}>返回列表</Button>
          {doc.status === 'DRAFT' && (
            <>
              <Button type="default" size="sm" onClick={() => navigate(`/sales/outbound/${doc.id}/edit`)}>编辑</Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmKind('delete')}>
                删除
              </Button>
              {!doc.confirmBlocked && (
                <Button type="button" size="sm" onClick={() => setConfirmKind('confirm')}>
                  确认出库
                </Button>
              )}
            </>
          )}
          {doc.status === 'SHIPPED' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigate(`/sales/returns/new?outboundId=${encodeURIComponent(doc.id)}`)}
            >
              发起退货
            </Button>
          )}
        </Space>
      }
      data-anno="sales-outbound-detail"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {doc.status === 'DRAFT' && doc.confirmBlocked && (
          <Alert type="warning" showIcon message="关联销售订单已关闭，无法确认出库，请删除本草稿或联系销售员。" />
        )}
        <PageSection title="基本信息" data-anno="sales-outbound-detail-basic">
          <Row gutter={[16, 16]}>
            <Field label="出库单号" value={doc.outboundNo} />
            <Field
              label="关联销售订单号"
              value={
                <Link to={`/sales/orders/${doc.salesOrderId}`}>{doc.salesOrderNo}</Link>
              }
            />
            <Field label="客户" value={partnerLabel(doc.customerCode, doc.customerName)} />
            <Field label="出库仓库" value={partnerLabel(doc.warehouseCode, doc.warehouseName)} />
            <Field label="出库日期" value={doc.outboundDate} />
            <Field label="出库备注" value={displayValue(doc.remark)} span={24} />
          </Row>
        </PageSection>

        <PageSection title="商品明细">
          <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
            拣货 {doc.totalReceivedQty} 件 | 出库 {doc.totalShipQty} 件 | 拒收 {doc.totalRejectQty} 件 |{' '}
            {formatYuan(doc.totalAmount)}
          </Typography.Paragraph>
          <Table rowKey="id" size="small" pagination={false} scroll={{ x: 1200 }} columns={lineColumns} dataSource={doc.lines} />
        </PageSection>

        <PageSection title="关联信息">
          <Row gutter={[16, 16]}>
            <Field label="库存流水" value={doc.status === 'SHIPPED' ? '已生成' : '-'} />
            <Field label="应收记录" value={doc.status === 'SHIPPED' ? '已生成（演示）' : '-'} />
          </Row>
        </PageSection>

        <PageSection title="制单信息" data-anno="sales-outbound-detail-meta">
          <Row gutter={[16, 16]}>
            <Field label="创建人" value={doc.createdBy} />
            <Field label="创建时间" value={formatDateTime(doc.createdAt)} />
            <Field label="最后修改人" value={displayValue(doc.updatedBy)} />
            <Field label="最后修改时间" value={formatDateTime(doc.updatedAt)} />
            <Field label="确认人" value={displayValue(doc.confirmedBy)} />
            <Field label="确认时间" value={formatDateTime(doc.confirmedAt)} />
          </Row>
        </PageSection>
      </Space>

      <Modal
        open={Boolean(confirmKind)}
        title={confirmKind === 'delete' ? '确认删除' : '确认出库'}
        confirmLabel={confirmKind === 'delete' ? '确认删除' : '确认出库'}
        confirmVariant={confirmKind === 'delete' ? 'destructive' : 'default'}
        confirmDisabled={pending}
        onClose={() => setConfirmKind(null)}
        onConfirm={runAction}
      >
        {confirmKind === 'delete'
          ? '删除后不可恢复，该出库单将从系统中永久移除，确认删除？'
          : '确认后将减少库存，是否继续？'}
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}

function Field({
  label,
  value,
  span = 6,
}: {
  label: string
  value: ReactNode
  span?: number
}) {
  return (
    <Col xs={24} md={12} lg={span}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <div style={{ marginTop: 2 }}>{typeof value === 'string' ? <Typography.Text>{value}</Typography.Text> : value}</div>
    </Col>
  )
}
