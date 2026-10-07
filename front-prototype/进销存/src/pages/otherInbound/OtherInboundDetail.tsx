import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Col, Row, Space, Table, Typography } from 'antd'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { OtherInboundStatusTag } from '@/components/OtherInboundStatusTag'
import { partnerLabel } from '@/features/otherInbound/constants'
import { confirmOtherInbound, deleteOtherInbound, getOtherInboundById } from '@/features/otherInbound/storage'
import { validateConfirm } from '@/features/otherInbound/validate'
import { Toast } from '@/components/Toast'
import { displayValue, formatDateTime } from '@/features/products/format'

export function OtherInboundDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const doc = useMemo(() => {
    void refreshKey
    return id ? getOtherInboundById(id) : undefined
  }, [id, refreshKey])

  if (!doc) {
    return <PageContainer><Typography.Text>单据不存在</Typography.Text></PageContainer>
  }

  return (
    <PageContainer
      title={`其他入库 ${doc.inboundNo}`}
      tags={<OtherInboundStatusTag status={doc.status} />}
      extra={
        <Space wrap data-anno="other-inbound-detail-actions">
          <Button type="default" size="sm" onClick={() => navigate('/inventory/other-inbound')}>返回列表</Button>
          {doc.status === 'DRAFT' && (
            <>
              <Button type="default" size="sm" onClick={() => navigate(`/inventory/other-inbound/${doc.id}/edit`)}>编辑</Button>
              <Button size="sm" variant="destructive" onClick={() => {
                if (deleteOtherInbound(doc.id)) navigate('/inventory/other-inbound')
              }}>删除</Button>
              <Button size="sm" onClick={() => {
                const err = validateConfirm(doc)
                if (err) setToast(err)
                else if (confirmOtherInbound(doc.id)) setRefreshKey((k) => k + 1)
              }}>确认入库</Button>
            </>
          )}
        </Space>
      }
      data-anno="other-inbound-detail"
    >
      <PageSection title="基本信息" data-anno="other-inbound-detail-basic">
        <Row gutter={[16, 16]}>
          <Col span={8}>入库单号：{doc.inboundNo}</Col>
          <Col span={8}>仓库：{partnerLabel(doc.warehouseCode, doc.warehouseName)}</Col>
          <Col span={8}>入库日期：{doc.inboundDate}</Col>
          <Col span={8}>入库原因：{doc.reason}</Col>
          <Col span={24}>备注：{displayValue(doc.remark)}</Col>
        </Row>
      </PageSection>
      <PageSection title="明细">
        <Table rowKey="id" dataSource={doc.lines} pagination={false} columns={[
          { title: '商品编码', dataIndex: 'productCode' },
          { title: '商品名称', dataIndex: 'productName' },
          { title: '数量', dataIndex: 'qty' },
        ]} />
        <Typography.Text style={{ marginTop: 8, display: 'block' }}>合计数量：{doc.totalQty}</Typography.Text>
      </PageSection>
      {doc.confirmedAt && (
        <PageSection title="确认信息" data-anno="other-inbound-detail-meta">
          <Row gutter={[16, 16]}>
            <Col span={8}>确认人：{displayValue(doc.confirmedBy)}</Col>
            <Col span={8}>确认时间：{formatDateTime(doc.confirmedAt)}</Col>
          </Row>
        </PageSection>
      )}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageContainer>
  )
}
