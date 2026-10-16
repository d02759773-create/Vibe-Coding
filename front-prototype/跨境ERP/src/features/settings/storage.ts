import { buildMenuCatalog } from '@/features/settings/menuCatalog'
import { BUILTIN_ROLE_CODES, ROLE_CODE_LABEL, type RoleCode } from '@/features/settings/constants'
import type { InternalUser, RoleMenuPermission, RoleRecord } from '@/features/settings/types'

const USERS_KEY = 'cb-erp-internal-users'
const ROLES_KEY = 'cb-erp-roles'
const PERMS_KEY = 'cb-erp-role-menu-perms'

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function defaultPermissionTemplate(): RoleMenuPermission[] {
  const catalog = buildMenuCatalog()
  return catalog.map((r) => ({
    二级菜单编码: r.二级菜单编码,
    菜单可见性: (r.二级菜单编码.startsWith('settings_') ? 'VISIBLE' : 'HIDDEN') as
      | 'VISIBLE'
      | 'HIDDEN',
  }))
}

function defaultPermissionsSeed(): Record<string, RoleMenuPermission[]> {
  const catalog = buildMenuCatalog()
  const allVisible = catalog.map((r) => ({
    二级菜单编码: r.二级菜单编码,
    菜单可见性: 'VISIBLE' as const,
  }))
  const hiddenExceptSettings = defaultPermissionTemplate()
  const out: Record<string, RoleMenuPermission[]> = {}
  for (const code of BUILTIN_ROLE_CODES) {
    out[code] = code === 'ADMIN' ? allVisible : hiddenExceptSettings
  }
  return out
}

function syncPermissionsForRoles(
  perms: Record<string, RoleMenuPermission[]>,
  roles: RoleRecord[],
): Record<string, RoleMenuPermission[]> {
  const next = { ...perms }
  const template = defaultPermissionTemplate()
  for (const r of roles) {
    if (!next[r.角色编码]) {
      next[r.角色编码] = template.map((p) => ({ ...p }))
    }
  }
  return next
}

function seedUsers(): InternalUser[] {
  const t = '2026-01-10 09:00:00'
  return [
    {
      用户账号: 'admin',
      用户姓名: '系统管理员',
      手机号: '13800138000',
      邮箱: 'admin@demo.local',
      启停用状态: 'ENABLED',
      停用原因: '',
      用户备注: '种子管理员',
      最后登录时间: '2026-10-16 08:30:00',
      角色明细: [{ 角色编码: 'ADMIN' }],
      创建人: 'system',
      创建时间: t,
      最后修改人: 'system',
      最后修改时间: t,
    },
    {
      用户账号: 'ops.zhang',
      用户姓名: '张运营',
      手机号: '',
      邮箱: '',
      启停用状态: 'ENABLED',
      停用原因: '',
      用户备注: '',
      最后登录时间: '',
      角色明细: [{ 角色编码: 'OPS_SPECIALIST' }, { 角色编码: 'WH' }],
      创建人: 'admin',
      创建时间: t,
      最后修改人: 'admin',
      最后修改时间: t,
    },
    {
      用户账号: 'wh.li',
      用户姓名: '李仓管',
      手机号: '021-12345678',
      邮箱: 'wh@demo.local',
      启停用状态: 'DISABLED',
      停用原因: '离职',
      用户备注: '',
      最后登录时间: '2026-09-01 17:00:00',
      角色明细: [{ 角色编码: 'WH' }],
      创建人: 'admin',
      创建时间: t,
      最后修改人: 'admin',
      最后修改时间: '2026-09-02 10:00:00',
    },
  ]
}

function seedRoles(): RoleRecord[] {
  const t = '2026-01-01 00:00:00'
  return BUILTIN_ROLE_CODES.map((code) => ({
    角色编码: code,
    角色名称: ROLE_CODE_LABEL[code] ?? code,
    启停用状态: code === 'MATERIAL_MGR' ? 'DISABLED' : 'ENABLED',
    角色说明: '',
    创建人: 'system',
    创建时间: t,
    最后修改人: 'system',
    最后修改时间: t,
  }))
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function listUsers(): InternalUser[] {
  const seeded = readJson<InternalUser[] | null>(USERS_KEY, null)
  if (!seeded) {
    const data = seedUsers()
    writeJson(USERS_KEY, data)
    return data
  }
  return seeded
}

export function saveUsers(users: InternalUser[]) {
  writeJson(USERS_KEY, users)
}

export function getUser(account: string): InternalUser | undefined {
  return listUsers().find((u) => u.用户账号 === account)
}

export function listRoles(): RoleRecord[] {
  const seeded = readJson<RoleRecord[] | null>(ROLES_KEY, null)
  if (!seeded) {
    const data = seedRoles()
    writeJson(ROLES_KEY, data)
    return data
  }
  return seeded
}

export function saveRoles(roles: RoleRecord[]) {
  writeJson(ROLES_KEY, roles)
  const perms = syncPermissionsForRoles(listRolePermissions(), roles)
  writeJson(PERMS_KEY, perms)
}

export function getRole(code: RoleCode): RoleRecord | undefined {
  return listRoles().find((r) => r.角色编码 === code)
}

export function createRole(record: RoleRecord): void {
  const roles = listRoles()
  if (roles.some((r) => r.角色编码 === record.角色编码)) {
    throw new Error('角色编码已存在')
  }
  roles.push(record)
  saveRoles(roles)
}

export function listRolePermissions(): Record<string, RoleMenuPermission[]> {
  const roles = listRoles()
  const seeded = readJson<Record<string, RoleMenuPermission[]> | null>(PERMS_KEY, null)
  if (!seeded) {
    const data = syncPermissionsForRoles(defaultPermissionsSeed(), roles)
    writeJson(PERMS_KEY, data)
    return data
  }
  const synced = syncPermissionsForRoles(seeded, roles)
  if (JSON.stringify(synced) !== JSON.stringify(seeded)) {
    writeJson(PERMS_KEY, synced)
  }
  return synced
}

export function saveRolePermissions(perms: Record<string, RoleMenuPermission[]>) {
  writeJson(PERMS_KEY, perms)
}

export function getRolePermissionRows(code: RoleCode) {
  const catalog = buildMenuCatalog()
  const perms = listRolePermissions()[code] ?? defaultPermissionTemplate()
  const map = new Map(perms.map((p) => [p.二级菜单编码, p.菜单可见性]))
  return catalog.map((row) => ({
    ...row,
    菜单可见性: map.get(row.二级菜单编码) ?? 'HIDDEN',
  }))
}

export function countEnabledUsersWithAdmin(users = listUsers()): number {
  return users.filter(
    (u) => u.启停用状态 === 'ENABLED' && u.角色明细.some((r) => r.角色编码 === 'ADMIN'),
  ).length
}

export function roleSummary(user: InternalUser): string {
  const roles = listRoles()
  const names = user.角色明细
    .map((a) => roles.find((r) => r.角色编码 === a.角色编码)?.角色名称 ?? a.角色编码)
    .filter(Boolean)
  return names.length ? names.join('、') : '-'
}

export function enabledRoleOptions() {
  return listRoles()
    .filter((r) => r.启停用状态 === 'ENABLED')
    .map((r) => ({
      value: r.角色编码,
      label: `${r.角色编码} ${r.角色名称}`,
    }))
}

export function countUsersForRole(code: RoleCode): number {
  return listUsers().filter(
    (u) => u.启停用状态 === 'ENABLED' && u.角色明细.some((r) => r.角色编码 === code),
  ).length
}

export { nowString }
