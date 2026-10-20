import { navigation, type NavItem } from '@/config/navigation'

export type ArcoMenuNode =
  | { type: 'item'; key: string; title: string }
  | { type: 'sub'; key: string; title: string; children: ArcoMenuNode[] }

export function sidebarGroupKey(children: { path?: string }[]): string {
  const first = children.find((c) => c.path)?.path
  if (!first) return '/'
  const parts = first.split('/').filter(Boolean)
  return parts.length >= 1 ? `/${parts[0]}` : '/'
}

function navToMenuNodes(items: NavItem[]): ArcoMenuNode[] {
  return items.map((item) => {
    if (item.children?.length) {
      return {
        type: 'sub',
        key: sidebarGroupKey(item.children),
        title: item.title,
        children: navToMenuNodes(item.children),
      }
    }
    return {
      type: 'item',
      key: item.path ?? '/',
      title: item.title,
    }
  })
}

export const sidebarMenuNodes: ArcoMenuNode[] = navToMenuNodes(navigation)

export function defaultOpenMenuKeys(): string[] {
  return navigation
    .filter((item) => item.children?.length)
    .map((item) => sidebarGroupKey(item.children!))
}
