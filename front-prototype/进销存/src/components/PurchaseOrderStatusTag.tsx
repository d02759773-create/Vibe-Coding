import { cn } from '@/lib/utils'
import { STATUS_LABEL, STATUS_TAG_CLASS } from '@/features/purchaseOrders/constants'
import type { PurchaseOrderStatus } from '@/features/purchaseOrders/types'

type PurchaseOrderStatusTagProps = {
  status: PurchaseOrderStatus
  className?: string
}

export function PurchaseOrderStatusTag({ status, className }: PurchaseOrderStatusTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_TAG_CLASS[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
