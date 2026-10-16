import { collectNavLeavesFromAll, type RouteMeta } from '@/config/navigation'

export const routeMetaList: RouteMeta[] = collectNavLeavesFromAll()

export function getRouteMeta(pathname: string): RouteMeta {
  const exact = routeMetaList.find((r) => r.path === pathname)
  if (exact) return exact
  return { path: pathname, title: '页面建设中' }
}
