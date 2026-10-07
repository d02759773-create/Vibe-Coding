import type { OtherInbound, OtherInboundListFilters, OtherInboundStatusTabKey } from './types'
import { listWarehouses } from '@/features/warehouses/storage'
import { nowString } from '@/features/salesOrders/storage'
import { recalcTotals } from './validate'

const STORAGE_KEY = 'inventory-demo-other-inbounds-v1'

function persist(all: OtherInbound[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function seed(): OtherInbound[] {
  const wh = listWarehouses()[0]
  if (!wh) return []
  return [
    {
      id: 'oin-1',
      inboundNo: 'OIN20260401-0001',
      warehouseId: wh.id,
      warehouseCode: wh.warehouseCode,
      warehouseName: wh.warehouseName,
      inboundDate: '2026-04-01',
      reason: '盘盈',
      status: 'STOCKED_IN',
      remark: '期初盘盈样例',
      lines: [
        {
          id: 'oil1',
          productId: '1',
          productCode: 'SKU-0001',
          productName: 'Type-C 快充数据线',
          barcode: '6901234567890',
          specModel: '1m/白色',
          unit: 'PCS',
          qty: 50,
          lineRemark: '',
        },
      ],
      totalQty: 50,
      createdBy: '赵仓管',
      createdAt: '2026-04-01 10:00:00',
      updatedBy: '赵仓管',
      updatedAt: '2026-04-01 11:00:00',
      confirmedBy: '赵仓管',
      confirmedAt: '2026-04-01 11:00:00',
    },
  ]
}

export function listOtherInbounds(): OtherInbound[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const s = seed()
    persist(s)
    return s
  }
  try {
    return JSON.parse(raw) as OtherInbound[]
  } catch {
    return []
  }
}

export function getOtherInboundById(id: string): OtherInbound | undefined {
  return listOtherInbounds().find((d) => d.id === id)
}

export function nextOtherInboundId(): string {
  const nums = listOtherInbounds()
    .map((d) => Number(d.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `oin-${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextOtherInboundNo(date: string): string {
  const ymd = date.replace(/-/g, '')
  const prefix = `OIN${ymd}-`
  const nums = listOtherInbounds()
    .map((d) => (d.inboundNo.startsWith(prefix) ? parseInt(d.inboundNo.slice(prefix.length), 10) : 0))
    .filter((n) => n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function upsertOtherInbound(doc: OtherInbound): void {
  const normalized = { ...doc, ...recalcTotals(doc.lines) }
  const all = listOtherInbounds()
  const idx = all.findIndex((d) => d.id === normalized.id)
  if (idx >= 0) all[idx] = normalized
  else all.unshift(normalized)
  persist(all)
}

export function deleteOtherInbound(id: string): boolean {
  const doc = getOtherInboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  persist(listOtherInbounds().filter((d) => d.id !== id))
  return true
}

export function createEmptyDraft(): OtherInbound {
  const wh = listWarehouses()[0]
  const inboundDate = new Date().toISOString().slice(0, 10)
  const doc: OtherInbound = {
    id: nextOtherInboundId(),
    inboundNo: nextOtherInboundNo(inboundDate),
    warehouseId: wh?.id ?? '',
    warehouseCode: wh?.warehouseCode ?? '',
    warehouseName: wh?.warehouseName ?? '',
    inboundDate,
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
  upsertOtherInbound(doc)
  return doc
}

export function confirmOtherInbound(id: string): boolean {
  const doc = getOtherInboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  const ts = nowString()
  upsertOtherInbound({
    ...doc,
    status: 'STOCKED_IN',
    confirmedBy: '赵仓管',
    confirmedAt: ts,
    updatedBy: '赵仓管',
    updatedAt: ts,
  })
  return true
}

export function filterOtherInbounds(
  filters: OtherInboundListFilters,
  tab: OtherInboundStatusTabKey,
): OtherInbound[] {
  const nos = filters.inboundNos.split(/[\n,，]/).map((s) => s.trim()).filter(Boolean)
  return listOtherInbounds().filter((row) => {
    if (tab !== 'ALL' && row.status !== tab) return false
    if (tab === 'ALL' && filters.status && row.status !== filters.status) return false
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (nos.length && !nos.includes(row.inboundNo)) return false
    if (filters.inboundDateFrom && row.inboundDate < filters.inboundDateFrom) return false
    if (filters.inboundDateTo && row.inboundDate > filters.inboundDateTo) return false
    return true
  })
}

export function countOtherInboundByTab(
  filters: OtherInboundListFilters,
): Record<OtherInboundStatusTabKey, number> {
  const base = filterOtherInbounds({ ...filters, status: '' }, 'ALL')
  const counts: Record<OtherInboundStatusTabKey, number> = { ALL: base.length, DRAFT: 0, STOCKED_IN: 0 }
  for (const row of base) {
    if (row.status === 'DRAFT') counts.DRAFT += 1
    if (row.status === 'STOCKED_IN') counts.STOCKED_IN += 1
  }
  return counts
}
