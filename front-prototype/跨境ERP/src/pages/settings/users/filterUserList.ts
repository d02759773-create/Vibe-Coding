import type { EnableStatus } from '@/features/settings/constants'
import type { InternalUser } from '@/features/settings/types'
import { filterByLastLoginRange } from '@/pages/settings/users/filterByLastLogin'

export function userListHasFilters(params: Record<string, unknown>): boolean {
  return !!(
    String(params.用户账号 ?? '').trim() ||
    String(params.用户姓名 ?? '').trim() ||
    String(params.手机号 ?? '').trim() ||
    String(params.邮箱 ?? '').trim() ||
    params.启停用状态 ||
    params.最后登录时间
  )
}

export function filterUserListRows(
  allUsers: InternalUser[],
  statusTab: 'all' | EnableStatus,
  params: Record<string, unknown>,
): InternalUser[] {
  let rows = [...allUsers]
  if (statusTab !== 'all') {
    rows = rows.filter((u) => u.启停用状态 === statusTab)
  }
  const account = String(params.用户账号 ?? '').trim().toLowerCase()
  const name = String(params.用户姓名 ?? '').trim().toLowerCase()
  const phone = String(params.手机号 ?? '').trim().toLowerCase()
  const email = String(params.邮箱 ?? '').trim().toLowerCase()
  const status = params.启停用状态 as EnableStatus | undefined
  if (account) rows = rows.filter((u) => u.用户账号.toLowerCase().includes(account))
  if (name) rows = rows.filter((u) => u.用户姓名.toLowerCase().includes(name))
  if (phone) rows = rows.filter((u) => u.手机号.toLowerCase().includes(phone))
  if (email) rows = rows.filter((u) => u.邮箱.toLowerCase().includes(email))
  if (statusTab === 'all' && status) {
    rows = rows.filter((u) => u.启停用状态 === status)
  }
  return filterByLastLoginRange(rows, params.最后登录时间)
}
