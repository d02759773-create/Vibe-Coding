import { useLocation } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getRouteMeta } from '@/config/routes'

export function PlaceholderPage() {
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)
  const description =
    meta.message ?? `${meta.title}功能页面将在后续步骤中生成，当前为占位展示。`

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{meta.title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        路由：{pathname}
      </CardContent>
    </Card>
  )
}
