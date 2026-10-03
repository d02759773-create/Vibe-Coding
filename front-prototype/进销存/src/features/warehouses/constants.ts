import type { WarehouseType } from './types'

export const WAREHOUSE_CODE_MIN_LENGTH = 2
export const WAREHOUSE_CODE_MAX_LENGTH = 32

export const WAREHOUSE_TYPE_OPTIONS: { value: WarehouseType; label: string }[] = [
  { value: 'MAIN', label: '主仓' },
  { value: 'BRANCH', label: '分仓' },
  { value: 'STORE', label: '门店仓' },
]

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'ENABLED', label: '启用' },
  { value: 'DISABLED', label: '停用' },
] as const

export const TYPE_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'MAIN', label: '主仓' },
  { value: 'BRANCH', label: '分仓' },
  { value: 'STORE', label: '门店仓' },
] as const

export function warehouseTypeLabel(type: WarehouseType): string {
  return WAREHOUSE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}
