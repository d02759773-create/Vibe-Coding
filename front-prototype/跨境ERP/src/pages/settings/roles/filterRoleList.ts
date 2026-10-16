import type { EnableStatus } from '@/features/settings/constants'
import type { RoleRecord } from '@/features/settings/types'

export function roleListHasFilters(params: Record<string, unknown>): boolean {
  return !!(
    params.角色编码 ||
    String(params.角色名称 ?? '').trim() ||
    params.启停用状态
  )
}

export function filterRoleListRows(
  allRoles: RoleRecord[],
  statusTab: 'all' | EnableStatus,
  params: Record<string, unknown>,
): RoleRecord[] {
  let rows = [...allRoles]
  if (statusTab !== 'all') {
    rows = rows.filter((r) => r.启停用状态 === statusTab)
  }
  const code = params.角色编码 as string | undefined
  const name = String(params.角色名称 ?? '').trim().toLowerCase()
  const status = params.启停用状态 as EnableStatus | undefined
  if (code) rows = rows.filter((r) => r.角色编码 === code)
  if (name) rows = rows.filter((r) => r.角色名称.toLowerCase().includes(name))
  if (statusTab === 'all' && status) {
    rows = rows.filter((r) => r.启停用状态 === status)
  }
  return rows
}
