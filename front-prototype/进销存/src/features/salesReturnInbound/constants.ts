import type { SalesReturnInboundStatus, ReturnInboundStatusTabKey } from './types'

export const RETURN_OUTBOUND_STATUS_TABS: { key: ReturnInboundStatusTabKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'STOCKED_IN', label: '已入库' },
]

export const RETURN_OUTBOUND_STATUS_LABEL: Record<SalesReturnInboundStatus, string> = {
  DRAFT: '草稿',
  STOCKED_IN: '已入库',
}

export const RETURN_INBOUND_STATUS_LABEL = RETURN_OUTBOUND_STATUS_LABEL

export const RETURN_OUTBOUND_STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'STOCKED_IN', label: '已入库' },
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
