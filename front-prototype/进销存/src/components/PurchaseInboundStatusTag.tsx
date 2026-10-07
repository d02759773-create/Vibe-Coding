import { Tag } from 'antd'
import { INBOUND_STATUS_LABEL } from '@/features/purchaseInbound/constants'
import type { PurchaseInboundStatus } from '@/features/purchaseInbound/types'

const COLOR: Record<PurchaseInboundStatus, string> = {
  DRAFT: 'default',
  STOCKED_IN: 'green',
  VOIDED: 'red',
}

export function PurchaseInboundStatusTag({ status }: { status: PurchaseInboundStatus }) {
  return <Tag color={COLOR[status]}>{INBOUND_STATUS_LABEL[status]}</Tag>
}
