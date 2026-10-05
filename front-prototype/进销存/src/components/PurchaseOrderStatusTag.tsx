import { Tag } from 'antd'
import { STATUS_LABEL } from '@/features/purchaseOrders/constants'
import type { PurchaseOrderStatus } from '@/features/purchaseOrders/types'

const STATUS_TAG_COLOR: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'default',
  PENDING_AUDIT: 'orange',
  PENDING_STOCK_IN: 'blue',
  PARTIAL_STOCK_IN: 'cyan',
  COMPLETED: 'green',
  VOIDED: 'red',
}

type PurchaseOrderStatusTagProps = {
  status: PurchaseOrderStatus
  className?: string
}

export function PurchaseOrderStatusTag({ status }: PurchaseOrderStatusTagProps) {
  return <Tag color={STATUS_TAG_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
}
