import type { SalesUnit } from './types'

export const PRODUCT_CATEGORIES = ['手机配件', '耳机', '充电器'] as const

export const SALES_UNIT_OPTIONS: { value: SalesUnit; label: string }[] = [
  { value: 'PCS', label: '件' },
  { value: 'BOX', label: '盒' },
  { value: 'SET', label: '套' },
  { value: 'PACK', label: '包' },
]

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'ENABLED', label: '启用' },
  { value: 'DISABLED', label: '停用' },
] as const

export const PRODUCT_CODE_PATTERN = /^[A-Z0-9-]*$/
export const PRODUCT_CODE_MIN_LENGTH = 2
export const PRODUCT_CODE_MAX_LENGTH = 30

export function salesUnitLabel(unit: SalesUnit): string {
  return SALES_UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? unit
}
