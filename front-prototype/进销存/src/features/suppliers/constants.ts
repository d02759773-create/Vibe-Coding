import type { SettlementMethod } from './types'

export const SUPPLIER_CODE_PATTERN = /^[A-Z0-9-]*$/
export const SUPPLIER_CODE_MIN_LENGTH = 2
export const SUPPLIER_CODE_MAX_LENGTH = 20

export const SETTLEMENT_OPTIONS: { value: SettlementMethod; label: string }[] = [
  { value: 'CASH', label: '现付' },
  { value: 'ACCOUNT', label: '账期结算' },
]

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'ENABLED', label: '启用' },
  { value: 'DISABLED', label: '停用' },
] as const

export const SETTLEMENT_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'CASH', label: '现付' },
  { value: 'ACCOUNT', label: '账期结算' },
] as const

export function settlementLabel(method: SettlementMethod): string {
  return SETTLEMENT_OPTIONS.find((o) => o.value === method)?.label ?? method
}

/** 手机号 11 位，或常见座机（含区号） */
export function isValidContactPhone(phone: string): boolean {
  const trimmed = phone.trim()
  if (/^1\d{10}$/.test(trimmed)) return true
  if (/^0\d{2,3}-?\d{7,8}$/.test(trimmed)) return true
  if (/^\d{7,8}$/.test(trimmed)) return true
  return false
}
