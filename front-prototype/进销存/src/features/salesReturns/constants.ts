import type { SalesReturnStatus, ReturnStatusTabKey } from './types'

export const RETURN_STATUS_TABS: { key: ReturnStatusTabKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'PENDING_AUDIT', label: '待审核' },
  { key: 'PENDING_INBOUND', label: '待入库' },
  { key: 'PARTIAL_INBOUND', label: '部分入库' },
  { key: 'COMPLETED', label: '已完成' },
]

export const RETURN_STATUS_LABEL: Record<SalesReturnStatus, string> = {
  DRAFT: '草稿',
  PENDING_AUDIT: '待审核',
  PENDING_INBOUND: '待入库',
  PARTIAL_INBOUND: '部分入库',
  COMPLETED: '已完成',
  VOIDED: '已作废',
}

export const RETURN_STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  ...Object.entries(RETURN_STATUS_LABEL).map(([value, label]) => ({ value, label })),
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
