import { Tag } from 'antd'
import type { ProductStatus } from '@/features/products/types'

type StatusPillProps = {
  status: ProductStatus
  className?: string
  /** 禁用态展示文案，默认「停用」；物流模块使用「禁用」 */
  disabledLabel?: string
}

export function StatusPill({ status, disabledLabel }: StatusPillProps) {
  const label =
    status === 'DISABLED' ? (disabledLabel ?? '停用') : '启用'
  return (
    <Tag color={status === 'ENABLED' ? 'success' : 'default'}>{label}</Tag>
  )
}
