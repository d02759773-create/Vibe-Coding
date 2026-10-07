import { Tag } from 'antd'
import { RETURN_INBOUND_STATUS_LABEL } from '@/features/salesReturnInbound/constants'
import type { SalesReturnInboundStatus } from '@/features/salesReturnInbound/types'

const COLOR: Record<SalesReturnInboundStatus, string> = {
  DRAFT: 'default',
  STOCKED_IN: 'green',
}

export function SalesReturnInboundStatusTag({ status }: { status: SalesReturnInboundStatus }) {
  return <Tag color={COLOR[status]}>{RETURN_INBOUND_STATUS_LABEL[status]}</Tag>
}
