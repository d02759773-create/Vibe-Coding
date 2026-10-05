import { cn } from '@/lib/utils'

export function controlInputClass(invalid?: boolean, className?: string) {
  return cn(
    'h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    invalid && 'border-destructive',
    className,
  )
}

export const controlTextareaClass =
  'min-h-9 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

export const filterControlClass =
  'h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
