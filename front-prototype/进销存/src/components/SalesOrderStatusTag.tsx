import { Tag } from 'antd'
import { STATUS_LABEL } from '@/features/salesOrders/constants'
import type { SalesOrderStatus } from '@/features/salesOrders/types'

const STATUS_TAG_COLOR: Record<SalesOrderStatus, string> = {
  DRAFT: 'default',
  PENDING_AUDIT: 'orange',
  PENDING_SHIPMENT: 'blue',
  PARTIAL_SHIPMENT: 'cyan',
  COMPLETED: 'green',
  VOIDED: 'red',
}

export function SalesOrderStatusTag({ status }: { status: SalesOrderStatus }) {
  return <Tag color={STATUS_TAG_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
}
