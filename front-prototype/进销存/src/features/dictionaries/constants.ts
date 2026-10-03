import type { DictionaryStatus, StructureType } from './types'

export const TYPE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,31}$/

export const STRUCTURE_FILTER_OPTIONS: { label: string; value: '' | StructureType }[] = [
  { label: '全部', value: '' },
  { label: '平铺', value: 'FLAT' },
  { label: '树形（最多2级）', value: 'TREE' },
]

export const STATUS_FILTER_OPTIONS: { label: string; value: '' | DictionaryStatus }[] = [
  { label: '全部', value: '' },
  { label: '启用', value: 'ENABLED' },
  { label: '禁用', value: 'DISABLED' },
]

export function structureTypeLabel(t: StructureType): string {
  return t === 'FLAT' ? '平铺' : '树形（最多2级）'
}

export function displayDash(value: string | null | undefined): string {
  if (value == null || value.trim() === '') return '-'
  return value
}
