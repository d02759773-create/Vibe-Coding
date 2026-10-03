import type { LogisticsType } from './types'

export const LOGISTICS_CODE_MIN_LENGTH = 2
export const LOGISTICS_CODE_MAX_LENGTH = 32

export const LOGISTICS_TYPE_OPTIONS: { value: LogisticsType; label: string }[] = [
  { value: 'EXPRESS', label: '快递' },
  { value: 'FREIGHT', label: '物流' },
  { value: 'SELF_PICKUP', label: '自提' },
]

export const TYPE_FILTER_OPTIONS: { value: LogisticsType | ''; label: string }[] = [
  { value: '', label: '全部' },
  ...LOGISTICS_TYPE_OPTIONS,
]

export const STATUS_FILTER_OPTIONS: { value: '' | 'ENABLED' | 'DISABLED'; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'ENABLED', label: '启用' },
  { value: 'DISABLED', label: '禁用' },
]

export function logisticsTypeLabel(type: LogisticsType): string {
  return LOGISTICS_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}

export function displayServiceProvider(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}
