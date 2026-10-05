import { App } from 'antd'
import { useEffect } from 'react'

type ToastProps = {
  message: string | null
  onDismiss: () => void
  className?: string
}

/** 兼容旧页面：将 toast 文案映射为 Ant Design message */
export function Toast({ message, onDismiss }: ToastProps) {
  const { message: messageApi } = App.useApp()

  useEffect(() => {
    if (!message) return
    messageApi.success(message)
    onDismiss()
  }, [message, messageApi, onDismiss])

  return null
}
