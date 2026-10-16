import { Tag } from 'antd'
import type { EnableStatus } from '@/features/settings/constants'
import { ENABLE_STATUS_LABEL } from '@/features/settings/constants'

export function EnableStatusTag({ status }: { status: EnableStatus }) {
  if (status === 'ENABLED') {
    return <Tag color="success">{ENABLE_STATUS_LABEL.ENABLED}</Tag>
  }
  return <Tag>{ENABLE_STATUS_LABEL.DISABLED}</Tag>
}
