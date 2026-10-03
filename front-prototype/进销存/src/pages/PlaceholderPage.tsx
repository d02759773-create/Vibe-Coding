import { useLocation, useSearchParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{meta.title}</CardTitle>
        <CardDescription>{extra}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        路由：{pathname}
        {params.toString() ? `?${params.toString()}` : ''}
      </CardContent>
    </Card>
  )
}
