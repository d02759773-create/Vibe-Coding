import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FilterFieldProps = {
  label: string
  className?: string
  children: ReactNode
}

export function FilterField({ label, className, children }: FilterFieldProps) {
  return (
    <label className={cn('grid gap-1 text-sm', className)}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
