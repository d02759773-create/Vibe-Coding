import { Tag } from 'antd'
import { OTHER_INBOUND_STATUS_LABEL } from '@/features/otherInbound/constants'
import type { OtherInboundStatus } from '@/features/otherInbound/types'

export function OtherInboundStatusTag({ status }: { status: OtherInboundStatus }) {
  const color = status === 'STOCKED_IN' ? 'green' : 'default'
  return <Tag color={color}>{OTHER_INBOUND_STATUS_LABEL[status]}</Tag>
}
