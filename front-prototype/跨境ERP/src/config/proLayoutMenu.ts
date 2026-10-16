import type { ProLayoutProps } from '@ant-design/pro-components'
import { navigation, type NavItem } from '@/config/navigation'

export type ProLayoutRoute = NonNullable<ProLayoutProps['route']>

function groupPath(item: NavItem): string {
  if (item.path) return item.path
  const first = item.children?.find((c) => c.path)?.path
  if (!first) return '/'
  const parts = first.split('/').filter(Boolean)
  return parts.length >= 1 ? `/${parts[0]}` : '/'
}

function navToRoutes(items: NavItem[]): ProLayoutRoute['routes'] {
  return items.map((item) => {
    if (item.children?.length) {
      return {
        path: groupPath(item),
        name: item.title,
        routes: navToRoutes(item.children),
      }
    }
    return {
      path: item.path ?? '/',
      name: item.title,
    }
  })
}

export const proLayoutRoute: ProLayoutRoute = {
  path: '/',
  routes: navToRoutes(navigation),
}
