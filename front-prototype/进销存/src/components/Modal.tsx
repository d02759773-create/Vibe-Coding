import type { ReactNode } from 'react'
import { Modal as AntModal } from 'antd'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  confirmVariant?: 'default' | 'destructive'
  confirmDisabled?: boolean
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
  confirmDisabled = false,
  children,
  dataAnno,
}: ModalProps) {
  return (
    <AntModal
      open={open}
      title={title}
      onCancel={onClose}
      onOk={onConfirm}
      okText={confirmLabel}
      cancelText="取消"
      okButtonProps={{
        danger: confirmVariant === 'destructive',
        disabled: confirmDisabled,
      }}
      destroyOnClose
      data-anno={dataAnno}
    >
      {children}
    </AntModal>
  )
}
