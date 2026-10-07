import type { OtherOutbound, OtherOutboundListFilters, OtherOutboundStatusTabKey } from './types'
import { listWarehouses } from '@/features/warehouses/storage'
import { nowString } from '@/features/salesOrders/storage'
import { recalcTotals } from './validate'

const STORAGE_KEY = 'inventory-demo-other-outbounds-v1'

function persist(all: OtherOutbound[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function listOtherOutbounds(): OtherOutbound[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    persist([])
    return []
  }
  try {
    return JSON.parse(raw) as OtherOutbound[]
  } catch {
    return []
  }
}

export function getOtherOutboundById(id: string): OtherOutbound | undefined {
  return listOtherOutbounds().find((d) => d.id === id)
}

export function nextOtherOutboundId(): string {
  const nums = listOtherOutbounds()
    .map((d) => Number(d.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `oout-${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextOtherOutboundNo(date: string): string {
  const ymd = date.replace(/-/g, '')
  const prefix = `OOUT${ymd}-`
  const nums = listOtherOutbounds()
    .map((d) => (d.outboundNo.startsWith(prefix) ? parseInt(d.outboundNo.slice(prefix.length), 10) : 0))
    .filter((n) => n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function upsertOtherOutbound(doc: OtherOutbound): void {
  const normalized = { ...doc, ...recalcTotals(doc.lines) }
  const all = listOtherOutbounds()
  const idx = all.findIndex((d) => d.id === normalized.id)
  if (idx >= 0) all[idx] = normalized
  else all.unshift(normalized)
  persist(all)
}

export function deleteOtherOutbound(id: string): boolean {
  const doc = getOtherOutboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  persist(listOtherOutbounds().filter((d) => d.id !== id))
  return true
}

export function createEmptyDraft(): OtherOutbound {
  const wh = listWarehouses()[0]
  const outboundDate = new Date().toISOString().slice(0, 10)
  const doc: OtherOutbound = {
    id: nextOtherOutboundId(),
    outboundNo: nextOtherOutboundNo(outboundDate),
    warehouseId: wh?.id ?? '',
    warehouseCode: wh?.warehouseCode ?? '',
    warehouseName: wh?.warehouseName ?? '',
    outboundDate,
    reason: '',
    status: 'DRAFT',
    remark: '',
    lines: [],
    totalQty: 0,
    createdBy: '赵仓管',
    createdAt: nowString(),
    updatedBy: '赵仓管',
    updatedAt: nowString(),
    confirmedBy: null,
    confirmedAt: null,
  }
  upsertOtherOutbound(doc)
  return doc
}

export function confirmOtherOutbound(id: string): boolean {
  const doc = getOtherOutboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  const ts = nowString()
  upsertOtherOutbound({
    ...doc,
    status: 'SHIPPED',
    confirmedBy: '赵仓管',
    confirmedAt: ts,
    updatedBy: '赵仓管',
    updatedAt: ts,
  })
  return true
}

export function filterOtherOutbounds(
  filters: OtherOutboundListFilters,
  tab: OtherOutboundStatusTabKey,
): OtherOutbound[] {
  const nos = filters.outboundNos.split(/[\n,，]/).map((s) => s.trim()).filter(Boolean)
  return listOtherOutbounds().filter((row) => {
    if (tab !== 'ALL' && row.status !== tab) return false
    if (tab === 'ALL' && filters.status && row.status !== filters.status) return false
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (nos.length && !nos.includes(row.outboundNo)) return false
    if (filters.outboundDateFrom && row.outboundDate < filters.outboundDateFrom) return false
    if (filters.outboundDateTo && row.outboundDate > filters.outboundDateTo) return false
    return true
  })
}

export function countOtherOutboundByTab(
  filters: OtherOutboundListFilters,
): Record<OtherOutboundStatusTabKey, number> {
  const base = filterOtherOutbounds({ ...filters, status: '' }, 'ALL')
  const counts: Record<OtherOutboundStatusTabKey, number> = { ALL: base.length, DRAFT: 0, SHIPPED: 0 }
  for (const row of base) {
    if (row.status === 'DRAFT') counts.DRAFT += 1
    if (row.status === 'SHIPPED') counts.SHIPPED += 1
  }
  return counts
}
