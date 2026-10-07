import { Tag } from 'antd'
import { RETURN_STATUS_LABEL } from '@/features/salesReturns/constants'
import type { SalesReturnStatus } from '@/features/salesReturns/types'

const COLOR: Record<SalesReturnStatus, string> = {
  DRAFT: 'default',
  PENDING_AUDIT: 'orange',
  PENDING_INBOUND: 'blue',
  PARTIAL_INBOUND: 'cyan',
  COMPLETED: 'green',
  VOIDED: 'red',
}

export function SalesReturnStatusTag({ status }: { status: SalesReturnStatus }) {
  return <Tag color={COLOR[status]}>{RETURN_STATUS_LABEL[status]}</Tag>
}
