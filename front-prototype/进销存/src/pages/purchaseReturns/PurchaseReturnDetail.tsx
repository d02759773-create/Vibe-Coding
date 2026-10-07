import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Col, Row, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseReturnStatusTag } from '@/components/PurchaseReturnStatusTag'
import { formatYuan, partnerLabel } from '@/features/purchaseReturns/constants'
import {
  approvePurchaseReturn,
  deletePurchaseReturn,
  getPurchaseReturnById,
  maxReturnableQty,
  rejectPurchaseReturn,
  submitPurchaseReturn,
  voidPurchaseReturn,
} from '@/features/purchaseReturns/storage'
import type { PurchaseReturnLine, PurchaseReturnOutboundLink } from '@/features/purchaseReturns/types'
import { submitFailureToast, validateSubmit } from '@/features/purchaseReturns/validate'
import { taxRateLabel } from '@/features/purchaseOrders/constants'
import { displayValue, formatDateTime } from '@/features/products/format'

type ConfirmAction = 'delete' | 'submit' | 'approve' | 'reject' | 'void'

export function PurchaseReturnDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const doc = useMemo(() => {
    void refreshKey
    return id ? getPurchaseReturnById(id) : undefined
  }, [id, refreshKey])

  const lineColumns: ColumnsType<PurchaseReturnLine> = [
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '商品名称', dataIndex: 'productName' },
    { title: '本次退货数量', dataIndex: 'returnQty' },
    { title: '累计已出库', dataIndex: 'outboundQty' },
    { title: '未出库', render: (_, l) => Math.max(0, l.returnQty - l.outboundQty) },
    { title: '单价', render: (_, l) => formatYuan(l.unitPrice) },
    { title: '税率', render: (_, l) => taxRateLabel(l.taxRate) },
    { title: '退货金额', render: (_, l) => formatYuan(l.lineAmount) },
    { title: '行备注', dataIndex: 'lineRemark', render: (v) => displayValue(v) },
  ]

  const linkColumns: ColumnsType<PurchaseReturnOutboundLink> = [
    {
      title: '出库单号',
      dataIndex: 'outboundNo',
      render: (no, row) => (
        <Link to={`/purchase/return-outbound/${row.id}`}>
          <Typography.Link>{no}</Typography.Link>
        </Link>
      ),
    },
    { title: '出库日期', dataIndex: 'outboundDate' },
    { title: '本次出库数量', dataIndex: 'totalQty' },
    { title: '操作人', dataIndex: 'operator' },
    { title: '状态', dataIndex: 'status', render: (s) => (s === 'STOCKED_OUT' ? '已出库' : '草稿') },
  ]

  if (!doc) {
    return (
      <PageContainer>
        <Typography.Text>退货单不存在</Typography.Text>
        <Link to="/purchase/returns">返回列表</Link>
      </PageContainer>
    )
  }

  function runAction() {
    if (!confirmAction || !doc) return
    let ok = false
    if (confirmAction === 'delete') ok = deletePurchaseReturn(doc.id)
    if (confirmAction === 'submit') {
      const err = validateSubmit(doc, (lid) => maxReturnableQty(doc.inboundId, lid, doc.id))
      if (err) {
        setToast(submitFailureToast(err))
        setConfirmAction(null)
        return
      }
      ok = submitPurchaseReturn(doc.id)
    }
    if (confirmAction === 'approve') ok = approvePurchaseReturn(doc.id)
    if (confirmAction === 'reject') ok = rejectPurchaseReturn(doc.id)
    if (confirmAction === 'void') ok = voidPurchaseReturn(doc.id)
    if (ok) {
      setToast('操作成功')
      if (confirmAction === 'delete') navigate('/purchase/returns')
      else setRefreshKey((k) => k + 1)
    }
    setConfirmAction(null)
  }

  return (
    <PageContainer
      title={`采购退货单 ${doc.returnNo}`}
      tags={<PurchaseReturnStatusTag status={doc.status} />}
      extra={
        <Space wrap>
          <Button type="default" size="sm" onClick={() => navigate('/purchase/returns')}>返回列表</Button>
          {doc.status === 'DRAFT' && (
            <>
              <Button type="default" size="sm" onClick={() => navigate(`/purchase/returns/${doc.id}/edit`)}>编辑</Button>
              <Button size="sm" onClick={() => setConfirmAction('submit')}>提交审核</Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmAction('delete')}>删除</Button>
            </>
          )}
          {doc.status === 'PENDING_AUDIT' && (
            <>
              <Button size="sm" onClick={() => setConfirmAction('approve')}>审核通过</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmAction('reject')}>驳回</Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmAction('void')}>作废</Button>
            </>
          )}
          {['PENDING_OUTBOUND', 'PARTIAL_OUTBOUND'].includes(doc.status) && (
            <Button size="sm" onClick={() => navigate(`/purchase/return-outbound/new?returnId=${doc.id}`)}>
              创建退货出库单
            </Button>
          )}
        </Space>
      }
    >
      <PageSection title="基本信息">
        <Row gutter={[16, 16]}>
          <Col span={8}>关联入库单：<Link to={`/purchase/inbound/${doc.inboundId}`}>{doc.inboundNo}</Link></Col>
          <Col span={8}>关联采购单：<Link to={`/purchase/orders/${doc.purchaseOrderId}`}>{doc.purchaseOrderNo}</Link></Col>
          <Col span={8}>供应商：{partnerLabel(doc.supplierCode, doc.supplierName)}</Col>
          <Col span={8}>出库仓库：{partnerLabel(doc.warehouseCode, doc.warehouseName)}</Col>
          <Col span={8}>退货日期：{doc.returnDate}</Col>
          <Col span={24}>退货原因：{displayValue(doc.returnReason)}</Col>
        </Row>
      </PageSection>
      <PageSection title="退货明细">
        <Table rowKey="id" columns={lineColumns} dataSource={doc.lines} pagination={false} size="small" />
        <Typography.Text style={{ display: 'block', marginTop: 8 }}>
          退货总数量 {doc.totalReturnQty}，累计已出库 {doc.totalOutboundQty}，总金额 {formatYuan(doc.totalAmount)}
        </Typography.Text>
      </PageSection>
      {doc.outboundLinks.length > 0 && (
        <PageSection title="关联退货出库单">
          <Table rowKey="id" columns={linkColumns} dataSource={doc.outboundLinks} pagination={false} size="small" />
        </PageSection>
      )}
      <PageSection title="系统信息">
        <Row gutter={[16, 16]}>
          <Col span={8}>创建人：{doc.createdBy}</Col>
          <Col span={8}>创建时间：{formatDateTime(doc.createdAt)}</Col>
          <Col span={8}>审核人：{displayValue(doc.auditedBy)}</Col>
          <Col span={8}>审核时间：{formatDateTime(doc.auditedAt)}</Col>
        </Row>
      </PageSection>
      <Modal
        open={Boolean(confirmAction)}
        title="请确认"
        confirmLabel="确认"
        confirmVariant={confirmAction === 'delete' || confirmAction === 'void' ? 'destructive' : 'default'}
        onClose={() => setConfirmAction(null)}
        onConfirm={runAction}
      >
        <Typography.Text type="secondary">确认执行该操作？</Typography.Text>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
