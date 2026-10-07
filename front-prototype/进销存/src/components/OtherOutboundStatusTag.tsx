import { Tag } from 'antd'
import { OTHER_OUTBOUND_STATUS_LABEL } from '@/features/otherOutbound/constants'
import type { OtherOutboundStatus } from '@/features/otherOutbound/types'

export function OtherOutboundStatusTag({ status }: { status: OtherOutboundStatus }) {
  const color = status === 'SHIPPED' ? 'green' : 'default'
  return <Tag color={color}>{OTHER_OUTBOUND_STATUS_LABEL[status]}</Tag>
}
