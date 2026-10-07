import { Tag } from 'antd'
import { RETURN_OUTBOUND_STATUS_LABEL } from '@/features/purchaseReturnOutbound/constants'
import type { PurchaseReturnOutboundStatus } from '@/features/purchaseReturnOutbound/types'

const COLOR: Record<PurchaseReturnOutboundStatus, string> = {
  DRAFT: 'default',
  STOCKED_OUT: 'green',
}

export function PurchaseReturnOutboundStatusTag({ status }: { status: PurchaseReturnOutboundStatus }) {
  return <Tag color={COLOR[status]}>{RETURN_OUTBOUND_STATUS_LABEL[status]}</Tag>
}
