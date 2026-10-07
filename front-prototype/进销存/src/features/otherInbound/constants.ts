import type { OtherInboundStatus, OtherInboundStatusTabKey } from './types'

export const OTHER_INBOUND_TABS: { key: OtherInboundStatusTabKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'STOCKED_IN', label: '已入库' },
]

export const OTHER_INBOUND_STATUS_LABEL: Record<OtherInboundStatus, string> = {
  DRAFT: '草稿',
  STOCKED_IN: '已入库',
}

export const REASON_OPTIONS = [
  { label: '请选择', value: '' },
  { label: '盘盈', value: '盘盈' },
  { label: '赠品', value: '赠品' },
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
