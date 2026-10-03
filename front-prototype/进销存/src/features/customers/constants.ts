import type {
  CustomerGrade,
  CustomerType,
  SettlementMethod,
} from './types'

export const CUSTOMER_CODE_MIN_LENGTH = 2
export const CUSTOMER_CODE_MAX_LENGTH = 30

export const CUSTOMER_TYPE_OPTIONS: { value: CustomerType; label: string }[] = [
  { value: 'ENTERPRISE', label: '企业' },
  { value: 'INDIVIDUAL', label: '个人' },
]

export const CUSTOMER_GRADE_OPTIONS: { value: CustomerGrade; label: string }[] = [
  { value: 'A', label: 'A级' },
  { value: 'B', label: 'B级' },
  { value: 'C', label: 'C级' },
  { value: 'D', label: 'D级' },
  { value: 'E', label: 'E级' },
]

export const SETTLEMENT_OPTIONS: { value: SettlementMethod; label: string }[] = [
  { value: 'CASH', label: '现结' },
  { value: 'ACCOUNT', label: '账期结算' },
]

export const TYPE_FILTER_OPTIONS = [{ value: '', label: '全部' }, ...CUSTOMER_TYPE_OPTIONS] as const

export const GRADE_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  ...CUSTOMER_GRADE_OPTIONS,
] as const

export const SETTLEMENT_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  ...SETTLEMENT_OPTIONS,
] as const

export function customerTypeLabel(type: CustomerType): string {
  return CUSTOMER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}

export function customerGradeLabel(grade: CustomerGrade): string {
  return CUSTOMER_GRADE_OPTIONS.find((o) => o.value === grade)?.label ?? grade
}

export function settlementLabel(method: SettlementMethod): string {
  return SETTLEMENT_OPTIONS.find((o) => o.value === method)?.label ?? method
}

export { isValidContactPhone } from '@/features/suppliers/constants'

export function parseBatchCustomerCodes(raw: string): string[] {
  return raw
    .split(/[,，\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50)
}
