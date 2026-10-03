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
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
