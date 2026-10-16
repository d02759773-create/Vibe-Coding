import { sidebarNavigation, type NavItem } from '@/config/sidebarMenu'
import { pathToSecondaryMenuCode } from '@/features/settings/constants'

export type MenuCatalogRow = {
  一级菜单编码: string
  一级菜单名称: string
  二级菜单编码: string
  二级菜单名称: string
}

function collectFromGroup(group: NavItem): MenuCatalogRow[] {
  if (!group.children?.length) return []
  const l1Code = group.children[0]?.path?.split('/').filter(Boolean)[0] ?? 'root'
  const l1Name = group.title
  const rows: MenuCatalogRow[] = []
  for (const child of group.children) {
    if (!child.path) continue
    rows.push({
      一级菜单编码: l1Code,
      一级菜单名称: l1Name,
      二级菜单编码: pathToSecondaryMenuCode(child.path),
      二级菜单名称: child.title,
    })
  }
  return rows
}

export function buildMenuCatalog(): MenuCatalogRow[] {
  const rows: MenuCatalogRow[] = []
  for (const item of sidebarNavigation) {
    if (item.path === '/') {
      rows.push({
        一级菜单编码: 'home',
        一级菜单名称: '首页',
        二级菜单编码: 'home',
        二级菜单名称: '首页',
      })
      continue
    }
    if (item.children?.length) {
      rows.push(...collectFromGroup(item))
    }
  }
  return rows
}
