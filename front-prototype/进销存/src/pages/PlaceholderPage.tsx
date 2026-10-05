import { useLocation, useSearchParams } from 'react-router-dom'
import { Card, Typography } from 'antd'
import { getRouteMeta } from '@/config/routes'

export function PlaceholderPage() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const meta = getRouteMeta(pathname)
  const orderNo = params.get('orderNo')
  const purchaseOrderId = params.get('purchaseOrderId')
  const inboundNo = params.get('inboundNo')

  let extra = meta.message ?? `${meta.title}功能页面将在后续步骤中生成，当前为占位展示。`
  if (pathname.includes('/purchase/inbound') && (orderNo || purchaseOrderId)) {
    extra = `采购入库单模块待建设。已从采购订单带入：${orderNo ?? purchaseOrderId}。`
  }
  if (inboundNo) {
    extra = `采购入库单 ${inboundNo} 详情待建设。`
  }

  return (
    <Card title={meta.title} style={{ maxWidth: 672 }}>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        {extra}
      </Typography.Paragraph>
      <Typography.Text type="secondary">
        路由：{pathname}
        {params.toString() ? `?${params.toString()}` : ''}
      </Typography.Text>
    </Card>
  )
}
