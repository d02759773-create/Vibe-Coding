import { cn } from '@/lib/utils'
import type { ProductStatus } from '@/features/products/types'

const statusConfig: Record<
  ProductStatus,
  { label: string; className: string }
> = {
  ENABLED: {
    label: '启用',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  DISABLED: {
    label: '停用',
    className: 'bg-muted text-muted-foreground ring-border',
  },
}

type StatusPillProps = {
  status: ProductStatus
  className?: string
  /** 禁用态展示文案，默认「停用」；物流模块使用「禁用」 */
  disabledLabel?: string
}

export function StatusPill({ status, className, disabledLabel }: StatusPillProps) {
  const config = statusConfig[status]
  const label = status === 'DISABLED' && disabledLabel ? disabledLabel : config.label
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
        className,
      )}
    >
      {label}
    </span>
  )
}
