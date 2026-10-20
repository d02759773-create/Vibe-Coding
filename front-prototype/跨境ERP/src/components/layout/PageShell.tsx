import { PageHeader, Space } from '@arco-design/web-react'
import type { ReactNode } from 'react'

type PageShellProps = {
  title: string
  subTitle?: string
  tags?: ReactNode
  extra?: ReactNode
  onBack?: () => void
  children: ReactNode
}

export function PageShell({ title, subTitle, tags, extra, onBack, children }: PageShellProps) {
  return (
    <div>
      <PageHeader
        style={{ padding: '0 0 16px' }}
        title={
          tags ? (
            <Space align="center">
              <span>{title}</span>
              {tags}
            </Space>
          ) : (
            title
          )
        }
        subTitle={subTitle}
        backIcon={onBack ? true : false}
        onBack={onBack}
        extra={extra}
      />
      {children}
    </div>
  )
}
