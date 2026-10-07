import type { PurchaseReturnOutboundStatus, ReturnOutboundStatusTabKey } from './types'

export const RETURN_OUTBOUND_STATUS_TABS: { key: ReturnOutboundStatusTabKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'STOCKED_OUT', label: '已出库' },
]

export const RETURN_OUTBOUND_STATUS_LABEL: Record<PurchaseReturnOutboundStatus, string> = {
  DRAFT: '草稿',
  STOCKED_OUT: '已出库',
}

export const RETURN_OUTBOUND_STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'STOCKED_OUT', label: '已出库' },
]

export function partnerLabel(code: string, name: string): string {
  return `${code} ${name}`.trim()
}

export function formatYuan(n: number): string {
  return `¥${n.toFixed(2)}`
}

export function tabCountLabel(label: string, count: number): string {
  const n = count > 99 ? '99+' : String(count)
  return `${label} ${n}`
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}
