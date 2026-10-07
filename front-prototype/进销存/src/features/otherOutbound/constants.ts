import type { OtherOutboundStatus, OtherOutboundStatusTabKey } from './types'

export const OTHER_OUTBOUND_TABS: { key: OtherOutboundStatusTabKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'SHIPPED', label: '已出库' },
]

export const OTHER_OUTBOUND_STATUS_LABEL: Record<OtherOutboundStatus, string> = {
  DRAFT: '草稿',
  SHIPPED: '已出库',
}

export const REASON_OPTIONS = [
  { label: '请选择', value: '' },
  { label: '盘亏', value: '盘亏' },
  { label: '报废', value: '报废' },
  { label: '领用', value: '领用' },
  { label: '其他', value: '其他' },
]

export function partnerLabel(code: string, name: string): string {
  return `${code} ${name}`.trim()
}

export function tabCountLabel(label: string, count: number): string {
  return `${label} ${count > 99 ? '99+' : count}`
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}
