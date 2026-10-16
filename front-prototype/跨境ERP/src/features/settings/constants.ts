export type EnableStatus = 'ENABLED' | 'DISABLED'

export type MenuVisibility = 'VISIBLE' | 'HIDDEN'

/** 系统预置角色编码（种子数据） */
export const BUILTIN_ROLE_CODES = [
  'ADMIN',
  'OPS_SPECIALIST',
  'OPS_LEAD',
  'OPS_DIRECTOR',
  'SCM_DATA',
  'WH',
  'FIN',
  'PRODUCT',
  'MATERIAL_MGR',
] as const

export const ROLE_CODES = BUILTIN_ROLE_CODES

export type BuiltinRoleCode = (typeof BUILTIN_ROLE_CODES)[number]

/** 角色档案主键，支持预置与手工新增 */
export type RoleCode = string

export const ROLE_CODE_LABEL: Record<string, string> = {
  ADMIN: '系统管理员',
  OPS_SPECIALIST: '运营专员',
  OPS_LEAD: '运营组长',
  OPS_DIRECTOR: '运营总监',
  SCM_DATA: '供应链数据专员',
  WH: '仓储',
  FIN: '账务',
  PRODUCT: '商品版师',
  MATERIAL_MGR: '面辅料管理',
}

export const ENABLE_STATUS_LABEL: Record<EnableStatus, string> = {
  ENABLED: '启用',
  DISABLED: '停用',
}

/** G-PHONE-REGEX 语义等价 */
export function isValidEmail(value: string): boolean {
  const v = value.trim()
  if (!v) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export function isValidPhone(value: string): boolean {
  const v = value.trim()
  if (!v) return true
  if (/^1[3-9]\d{9}$/.test(v)) return true
  if (/^0\d{2,3}-?\d{7,8}$/.test(v)) return true
  return false
}

export function pathToSecondaryMenuCode(path: string): string {
  return path.replace(/^\//, '').replace(/\//g, '_')
}

/** 角色编码：大写字母开头，仅字母数字与下划线，2–32 位 */
export function isValidRoleCode(value: string): boolean {
  const v = value.trim()
  return /^[A-Z][A-Z0-9_]{1,31}$/.test(v)
}
