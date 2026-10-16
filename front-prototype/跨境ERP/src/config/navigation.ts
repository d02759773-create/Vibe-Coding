import { sidebarNavigation, type NavItem } from '@/config/sidebarMenu'

export type { NavItem }

export type RouteMeta = {
  path: string
  title: string
  message?: string
}

/** 左侧 ProLayout 全量菜单（一级业务域 + 二级页面） */
export const navigation: NavItem[] = sidebarNavigation

function collectNavLeaves(items: NavItem[]): RouteMeta[] {
  const out: RouteMeta[] = []
  for (const item of items) {
    if (item.children?.length) {
      out.push(...collectNavLeaves(item.children))
    } else if (item.path) {
      out.push({ path: item.path, title: item.title })
    }
  }
  return out
}

export function collectNavLeavesFromAll(): RouteMeta[] {
  return collectNavLeaves(navigation)
}
