import type { PurchaseOrderStatus, StatusTabKey, TaxRate } from './types'

export const STATUS_TABS: { key: StatusTabKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'PENDING_AUDIT', label: '待审核' },
  { key: 'PENDING_STOCK_IN', label: '待入库' },
  { key: 'PARTIAL_STOCK_IN', label: '部分入库' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'VOIDED', label: '已作废' },
]

export const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  DRAFT: '草稿',
  PENDING_AUDIT: '待审核',
  PENDING_STOCK_IN: '待入库',
  PARTIAL_STOCK_IN: '部分入库',
  COMPLETED: '已完成',
  VOIDED: '已作废',
}

export const STATUS_TAG_CLASS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-700 ring-zinc-600/20',
  PENDING_AUDIT: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  PENDING_STOCK_IN: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  PARTIAL_STOCK_IN: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  VOIDED: 'bg-red-50 text-red-700 ring-red-600/20',
}

export const STATUS_FILTER_OPTIONS: { label: string; value: '' | PurchaseOrderStatus }[] = [
  { label: '全部', value: '' },
  ...STATUS_TABS.filter((t) => t.key !== 'ALL').map((t) => ({
    label: t.label,
    value: t.key as PurchaseOrderStatus,
  })),
]

export const TAX_RATE_OPTIONS: { label: string; value: TaxRate }[] = [
  { label: '请选择', value: '' },
  { label: '免税', value: '0%' },
  { label: '3%', value: '3%' },
  { label: '6%', value: '6%' },
  { label: '9%', value: '9%' },
  { label: '13%', value: '13%' },
]

export function taxRateLabel(rate: TaxRate): string {
  if (!rate) return '-'
  if (rate === '0%') return '免税'
  return rate
}

export function partnerLabel(code: string, name: string): string {
  return `${code} ${name}`
}

export function formatYuan(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function todayDateString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function tabCountLabel(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}
