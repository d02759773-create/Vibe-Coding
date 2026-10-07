import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Col, Row, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { Modal } from '@/components/Modal'
import { Toast } from '@/components/Toast'
import { SalesReturnInboundStatusTag } from '@/components/SalesReturnInboundStatusTag'
import { formatYuan, partnerLabel } from '@/features/salesReturnInbound/constants'
import {
  confirmSalesReturnInbound,
  deleteSalesReturnInbound,
  getSalesReturnInboundById,
} from '@/features/salesReturnInbound/storage'
import type { SalesReturnInboundLine } from '@/features/salesReturnInbound/types'
import { confirmFailureToast, validateConfirm } from '@/features/salesReturnInbound/validate'
import { displayValue, formatDateTime } from '@/features/products/format'

export function SalesReturnInboundDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<'delete' | 'confirm' | null>(null)

  const doc = useMemo(() => {
    void refreshKey
    return id ? getSalesReturnInboundById(id) : undefined
  }, [id, refreshKey])

  const lineColumns: ColumnsType<SalesReturnInboundLine> = [
    { title: '商品编码', dataIndex: 'productCode' },
    { title: '商品名称', dataIndex: 'productName' },
    { title: '本次入库数量', dataIndex: 'inboundQty' },
    { title: '单价', render: (_, l) => formatYuan(l.unitPrice) },
    { title: '入库金额', render: (_, l) => formatYuan(l.lineAmount) },
  ]

  if (!doc) {
    return (
      <PageContainer>
        <Typography.Text>入库单不存在</Typography.Text>
        <Link to="/sales/return-inbound">返回</Link>
      </PageContainer>
    )
  }

  function run() {
    if (!doc || !confirmKind) return
    if (confirmKind === 'delete') {
      if (deleteSalesReturnInbound(doc.id)) navigate('/sales/return-inbound')
      return
    }
    const err = validateConfirm(doc)
    if (err) {
      setToast(confirmFailureToast(err))
      return
    }
    if (confirmSalesReturnInbound(doc.id)) {
      setToast('确认入库成功')
      setRefreshKey((k) => k + 1)
    }
    setConfirmKind(null)
  }

  return (
    <PageContainer
      title={`销售退货入库单 ${doc.inboundNo}`}
      tags={<SalesReturnInboundStatusTag status={doc.status} />}
      extra={
        <Space data-anno="sales-return-inbound-detail-actions">
          <Button type="default" size="sm" onClick={() => navigate('/sales/return-inbound')}>返回列表</Button>
          {doc.status === 'DRAFT' && (
            <>
              <Button type="default" size="sm" onClick={() => navigate(`/sales/return-inbound/${doc.id}/edit`)}>编辑</Button>
              <Button size="sm" onClick={() => setConfirmKind('confirm')}>确认入库</Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmKind('delete')}>删除</Button>
            </>
          )}
        </Space>
      }
      data-anno="sales-return-inbound-detail"
    >
      <PageSection title="基本信息" data-anno="sales-return-inbound-detail-basic">
        <Row gutter={[16, 16]}>
          <Col span={8}>退货单：<Link to={`/sales/returns/${doc.returnId}`}>{doc.returnNo}</Link></Col>
          <Col span={8}>出库单：<Link to={`/sales/outbound/${doc.outboundId}`}>{doc.outboundNo}</Link></Col>
          <Col span={8}>客户：{partnerLabel(doc.customerCode, doc.customerName)}</Col>
          <Col span={8}>入库日期：{doc.inboundDate}</Col>
          <Col span={8}>物流：{displayValue(doc.logisticsInfo)}</Col>
        </Row>
      </PageSection>
      <PageSection title="入库明细">
        <Table rowKey="id" columns={lineColumns} dataSource={doc.lines} pagination={false} size="small" />
        <Typography.Text style={{ marginTop: 8, display: 'block' }}>
          入库总数量 {doc.totalInboundQty}，总金额 {formatYuan(doc.totalAmount)}
        </Typography.Text>
      </PageSection>
      {doc.status === 'STOCKED_IN' && (
        <PageSection title="确认信息" data-anno="sales-return-inbound-detail-meta">
          <Row gutter={[16, 16]}>
            <Col span={8}>确认人：{displayValue(doc.confirmedBy)}</Col>
            <Col span={8}>确认时间：{formatDateTime(doc.confirmedAt)}</Col>
          </Row>
        </PageSection>
      )}
      <Modal
        open={Boolean(confirmKind)}
        title={confirmKind === 'delete' ? '删除' : '确认入库'}
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
