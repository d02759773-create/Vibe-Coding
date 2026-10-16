import type { ReactNode } from 'react'
import { App, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          borderRadius: 6,
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
