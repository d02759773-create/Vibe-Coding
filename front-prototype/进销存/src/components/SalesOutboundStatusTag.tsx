import { Tag } from 'antd'
import { OUTBOUND_STATUS_LABEL } from '@/features/salesOutbound/constants'
import type { SalesOutboundStatus } from '@/features/salesOutbound/types'

const COLOR: Record<SalesOutboundStatus, string> = {
  DRAFT: 'default',
  SHIPPED: 'green',
  VOIDED: 'red',
}

export function SalesOutboundStatusTag({ status }: { status: SalesOutboundStatus }) {
  return <Tag color={COLOR[status]}>{OUTBOUND_STATUS_LABEL[status]}</Tag>
}
