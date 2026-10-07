import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Col, Row, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { PurchaseReturnOutboundStatusTag } from '@/components/PurchaseReturnOutboundStatusTag'
import { formatYuan, partnerLabel } from '@/features/purchaseReturnOutbound/constants'
import {
  confirmPurchaseReturnOutbound,
  deletePurchaseReturnOutbound,
  getPurchaseReturnOutboundById,
} from '@/features/purchaseReturnOutbound/storage'
import type { PurchaseReturnOutboundLine } from '@/features/purchaseReturnOutbound/types'
import { confirmFailureToast, validateConfirm } from '@/features/purchaseReturnOutbound/validate'
import { displayValue, formatDateTime } from '@/features/products/format'

export function PurchaseReturnOutboundDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<'delete' | 'confirm' | null>(null)

  const doc = useMemo(() => {
    void refreshKey
    return id ? getPurchaseReturnOutboundById(id) : undefined
  }, [id, refreshKey])

  const lineColumns: ColumnsType<PurchaseReturnOutboundLine> = [
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '商品名称', dataIndex: 'productName' },
    { title: '本次出库数量', dataIndex: 'outboundQty' },
    { title: '单价', render: (_, l) => formatYuan(l.unitPrice) },
    { title: '出库金额', render: (_, l) => formatYuan(l.lineAmount) },
  ]

  if (!doc) {
    return (
      <PageContainer>
        <Typography.Text>出库单不存在</Typography.Text>
        <Link to="/purchase/return-outbound">返回</Link>
      </PageContainer>
    )
  }

  function run() {
    if (!doc || !confirmKind) return
    if (confirmKind === 'delete') {
      if (deletePurchaseReturnOutbound(doc.id)) navigate('/purchase/return-outbound')
      return
    }
    const err = validateConfirm(doc)
    if (err) {
      setToast(confirmFailureToast(err))
      return
    }
    if (confirmPurchaseReturnOutbound(doc.id)) {
      setToast('确认出库成功')
      setRefreshKey((k) => k + 1)
    }
    setConfirmKind(null)
  }

  return (
    <PageContainer
      title={`退货出库单 ${doc.outboundNo}`}
      tags={<PurchaseReturnOutboundStatusTag status={doc.status} />}
      extra={
        <Space>
          <Button type="default" size="sm" onClick={() => navigate('/purchase/return-outbound')}>返回列表</Button>
          {doc.status === 'DRAFT' && (
            <>
              <Button type="default" size="sm" onClick={() => navigate(`/purchase/return-outbound/${doc.id}/edit`)}>编辑</Button>
              <Button size="sm" onClick={() => setConfirmKind('confirm')}>确认出库</Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmKind('delete')}>删除</Button>
            </>
          )}
        </Space>
      }
    >
      <PageSection title="基本信息">
        <Row gutter={[16, 16]}>
          <Col span={8}>退货单：<Link to={`/purchase/returns/${doc.returnId}`}>{doc.returnNo}</Link></Col>
          <Col span={8}>入库单：<Link to={`/purchase/inbound/${doc.inboundId}`}>{doc.inboundNo}</Link></Col>
          <Col span={8}>供应商：{partnerLabel(doc.supplierCode, doc.supplierName)}</Col>
          <Col span={8}>出库日期：{doc.outboundDate}</Col>
          <Col span={8}>物流：{displayValue(doc.logisticsInfo)}</Col>
        </Row>
      </PageSection>
      <PageSection title="出库明细">
        <Table rowKey="id" columns={lineColumns} dataSource={doc.lines} pagination={false} size="small" />
        <Typography.Text style={{ marginTop: 8, display: 'block' }}>
          出库总数量 {doc.totalOutboundQty}，总金额 {formatYuan(doc.totalAmount)}
        </Typography.Text>
      </PageSection>
      {doc.status === 'STOCKED_OUT' && (
        <PageSection title="确认信息">
          <Row gutter={[16, 16]}>
            <Col span={8}>确认人：{displayValue(doc.confirmedBy)}</Col>
            <Col span={8}>确认时间：{formatDateTime(doc.confirmedAt)}</Col>
          </Row>
        </PageSection>
      )}
      <Modal
        open={Boolean(confirmKind)}
        title={confirmKind === 'delete' ? '删除' : '确认出库'}
        confirmLabel="确认"
        confirmVariant={confirmKind === 'delete' ? 'destructive' : 'default'}
        onClose={() => setConfirmKind(null)}
        onConfirm={run}
      >
        <Typography.Text type="secondary">确认执行？</Typography.Text>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
