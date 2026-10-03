import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  confirmVariant?: 'default' | 'destructive'
  children?: ReactNode
  dataAnno?: string
}

export function Modal({
  open,
  title,
  onClose,
  onConfirm,
  confirmLabel = '确认',
  confirmVariant = 'default',
  children,
  dataAnno,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="关闭"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        data-anno={dataAnno}
        className="relative z-10 w-full max-w-md rounded-xl border bg-background p-5 shadow-lg"
      >
        <h2 className="text-base font-semibold">{title}</h2>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            type="button"
            variant={confirmVariant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
