import { Tag } from 'antd'
import { STATUS_LABEL } from '@/features/salesOrders/constants'
import type { SalesOrderStatus } from '@/features/salesOrders/types'

const STATUS_TAG_COLOR: Record<SalesOrderStatus, string> = {
  DRAFT: 'default',
  PENDING_AUDIT: 'orange',
  PENDING_OUTBOUND: 'blue',
  PARTIAL_OUTBOUND: 'cyan',
  COMPLETED: 'green',
  VOIDED: 'red',
}

type SalesOrderStatusTagProps = {
  status: SalesOrderStatus
  className?: string
}

export function SalesOrderStatusTag({ status }: SalesOrderStatusTagProps) {
  return <Tag color={STATUS_TAG_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
}
