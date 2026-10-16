import dayjs from 'dayjs'
import type { InternalUser } from '@/features/settings/types'

/** ProTable dateTimeRange → 按日过滤最后登录时间 */
export function filterByLastLoginRange(
  rows: InternalUser[],
  range: unknown,
): InternalUser[] {
  if (!Array.isArray(range) || range.length === 0) return rows
  const [from, to] = range as [string?, string?]
  if (!from && !to) return rows

  const start = from ? dayjs(from).startOf('day') : null
  const end = to ? dayjs(to).endOf('day') : null

  return rows.filter((u) => {
    if (!u.最后登录时间) return false
    const t = dayjs(u.最后登录时间)
    if (!t.isValid()) return false
    if (start && t.isBefore(start)) return false
    if (end && t.isAfter(end)) return false
    return true
  })
}
