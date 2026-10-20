import { Card, Typography } from '@arco-design/web-react'
import { useLocation } from 'react-router-dom'
import { getRouteMeta } from '@/config/routes'

export function PlaceholderPage() {
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)

  return (
    <Card title={meta.title} style={{ maxWidth: 720 }}>
      <Typography.Paragraph style={{ marginTop: 0, color: 'var(--color-text-3)' }}>
        {meta.message ??
          '本页为一期菜单框架占位，业务页面将按 PRD 与建设优先级（09）逐步落地。'}
      </Typography.Paragraph>
      <Typography.Text type="secondary">路由：{pathname}</Typography.Text>
    </Card>
  )
}
