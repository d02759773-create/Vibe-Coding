import type { UserRoleAssignment } from '@/features/settings/types'

type RoleRow = UserRoleAssignment & { id: string }

export function snapshotRoleCodes(rows: UserRoleAssignment[]): string {
  return JSON.stringify(rows.map((r) => r.角色编码).sort())
}

export function isUserRoleRowsDirty(
  initial: UserRoleAssignment[],
  current: RoleRow[],
): boolean {
  if (current.length !== initial.length) return true
  const codes = current.map((r) => r.角色编码).filter(Boolean)
  if (codes.length !== current.length) return true
  return snapshotRoleCodes(initial) !== snapshotRoleCodes(codes.map((c) => ({ 角色编码: c })))
}
