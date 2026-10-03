import { useEffect } from 'react'
import { cn } from '@/lib/utils'

type ToastProps = {
  message: string | null
  onDismiss: () => void
  className?: string
}

export function Toast({ message, onDismiss, className }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, 2500)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[100] rounded-lg border bg-foreground px-4 py-2 text-sm text-background shadow-lg',
        className,
      )}
      role="status"
    >
      {message}
    </div>
  )
}
