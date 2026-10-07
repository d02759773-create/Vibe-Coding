import { Tag } from 'antd'
import { RETURN_STATUS_LABEL } from '@/features/purchaseReturns/constants'
import type { PurchaseReturnStatus } from '@/features/purchaseReturns/types'

const COLOR: Record<PurchaseReturnStatus, string> = {
  DRAFT: 'default',
  PENDING_AUDIT: 'orange',
  PENDING_OUTBOUND: 'blue',
  PARTIAL_OUTBOUND: 'cyan',
  COMPLETED: 'green',
  VOIDED: 'red',
}

export function PurchaseReturnStatusTag({ status }: { status: PurchaseReturnStatus }) {
  return <Tag color={COLOR[status]}>{RETURN_STATUS_LABEL[status]}</Tag>
}
