import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Col, Row, Space, Table, Typography } from 'antd'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/PageSection'
import { OtherOutboundStatusTag } from '@/components/OtherOutboundStatusTag'
import { partnerLabel } from '@/features/otherOutbound/constants'
import { confirmOtherOutbound, deleteOtherOutbound, getOtherOutboundById } from '@/features/otherOutbound/storage'
import { validateConfirm } from '@/features/otherOutbound/validate'
import { Toast } from '@/components/Toast'
import { displayValue, formatDateTime } from '@/features/products/format'

export function OtherOutboundDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const doc = useMemo(() => {
    void refreshKey
    return id ? getOtherOutboundById(id) : undefined
  }, [id, refreshKey])

  if (!doc) return <PageContainer><Typography.Text>单据不存在</Typography.Text></PageContainer>

  return (
    <PageContainer
      title={`其他出库 ${doc.outboundNo}`}
      tags={<OtherOutboundStatusTag status={doc.status} />}
      extra={
        <Space wrap data-anno="other-outbound-detail-actions">
          <Button type="default" size="sm" onClick={() => navigate('/inventory/other-outbound')}>返回列表</Button>
          {doc.status === 'DRAFT' && (
            <>
              <Button type="default" size="sm" onClick={() => navigate(`/inventory/other-outbound/${doc.id}/edit`)}>编辑</Button>
              <Button size="sm" variant="destructive" onClick={() => {
                if (deleteOtherOutbound(doc.id)) navigate('/inventory/other-outbound')
              }}>删除</Button>
              <Button size="sm" onClick={() => {
                const err = validateConfirm(doc)
                if (err) setToast(err)
                else if (confirmOtherOutbound(doc.id)) setRefreshKey((k) => k + 1)
              }}>确认出库</Button>
            </>
          )}
        </Space>
      }
      data-anno="other-outbound-detail"
    >
      <PageSection title="基本信息" data-anno="other-outbound-detail-basic">
        <Row gutter={[16, 16]}>
          <Col span={8}>出库单号：{doc.outboundNo}</Col>
          <Col span={8}>仓库：{partnerLabel(doc.warehouseCode, doc.warehouseName)}</Col>
          <Col span={8}>出库日期：{doc.outboundDate}</Col>
          <Col span={8}>出库原因：{doc.reason}</Col>
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
        <PageSection title="确认信息" data-anno="other-outbound-detail-meta">
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
