import type {
  SalesReturnInbound,
  SalesReturnInboundLine,
  SalesReturnInboundListFilters,
  ReturnInboundStatusTabKey,
} from './types'
import {
  applyInboundToReturn,
  getSalesReturnById,
  syncOutboundReturnedQty,
} from '@/features/salesReturns/storage'
import type { SalesReturn } from '@/features/salesReturns/types'
import { nowString } from '@/features/salesOrders/storage'
import { lineAmount, recalcInboundTotals } from './validate'

const STORAGE_KEY = 'inventory-demo-sales-return-inbounds-v1'

function persist(all: SalesReturnInbound[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function uninboundQty(returnLine: SalesReturn['lines'][0]): number {
  return Math.max(0, returnLine.returnQty - returnLine.inboundQty)
}

function mapLinesFromReturn(ret: SalesReturn): SalesReturnInboundLine[] {
  return ret.lines
    .filter((l) => uninboundQty(l) > 0)
    .map((l) => ({
      id: `rol-${l.id}`,
      returnLineId: l.id,
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      barcode: l.barcode,
      specModel: l.specModel,
      unit: l.unit,
      refUninboundQty: uninboundQty(l),
      inboundQty: 0,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineAmount: 0,
    }))
}

export function normalizeReturnInbound(doc: SalesReturnInbound): SalesReturnInbound {
  const lines = doc.lines.map((l) => ({
    ...l,
    lineAmount: lineAmount(l.inboundQty, l.unitPrice),
  }))
  return { ...doc, lines, ...recalcInboundTotals(lines) }
}

export function listSalesReturnInbounds(): SalesReturnInbound[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    persist([])
    return []
  }
  try {
    return (JSON.parse(raw) as SalesReturnInbound[]).map(normalizeReturnInbound)
  } catch {
    return []
  }
}

export function getSalesReturnInboundById(id: string): SalesReturnInbound | undefined {
  return listSalesReturnInbounds().find((d) => d.id === id)
}

export function nextReturnOutboundId(): string {
  const nums = listSalesReturnInbounds()
    .map((d) => Number(d.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `sri-${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextReturnInboundNo(inboundDate: string): string {
  const ymd = inboundDate.replace(/-/g, '')
  const prefix = `SRI${ymd}-`
  const nums = listSalesReturnInbounds()
    .map((d) => {
      if (!d.inboundNo.startsWith(prefix)) return 0
      return parseInt(d.inboundNo.slice(prefix.length), 10) || 0
    })
    .filter((n) => n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function upsertSalesReturnInbound(doc: SalesReturnInbound): void {
  const normalized = normalizeReturnInbound(doc)
  const all = listSalesReturnInbounds()
  const idx = all.findIndex((d) => d.id === normalized.id)
  if (idx >= 0) all[idx] = normalized
  else all.unshift(normalized)
  persist(all.map(normalizeReturnInbound))
}

export function deleteSalesReturnInbound(id: string): boolean {
  const doc = getSalesReturnInboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  persist(listSalesReturnInbounds().filter((d) => d.id !== id))
  return true
}

export function createDraftFromReturn(returnId: string): SalesReturnInbound | null {
  const ret = getSalesReturnById(returnId)
  if (!ret || !['PENDING_INBOUND', 'PARTIAL_INBOUND'].includes(ret.status)) return null
  const lines = mapLinesFromReturn(ret)
  if (!lines.length) return null
  const inboundDate = new Date().toISOString().slice(0, 10)
  const doc: SalesReturnInbound = {
    id: nextReturnOutboundId(),
    inboundNo: nextReturnInboundNo(inboundDate),
    returnId: ret.id,
    returnNo: ret.returnNo,
    outboundId: ret.outboundId,
    outboundNo: ret.outboundNo,
    customerId: ret.customerId,
    customerCode: ret.customerCode,
    customerName: ret.customerName,
    warehouseId: ret.warehouseId,
    warehouseCode: ret.warehouseCode,
    warehouseName: ret.warehouseName,
    inboundDate,
    status: 'DRAFT',
    logisticsInfo: '',
    remark: '',
    lines,
    totalInboundQty: 0,
    totalAmount: 0,
    createdBy: '老李',
    createdAt: nowString(),
    updatedBy: '老李',
    updatedAt: nowString(),
    confirmedBy: null,
    confirmedAt: null,
  }
  upsertSalesReturnInbound(doc)
  return getSalesReturnInboundById(doc.id)!
}

export function confirmSalesReturnInbound(id: string): boolean {
  const doc = getSalesReturnInboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  const active = doc.lines.filter((l) => l.inboundQty > 0)
  if (!active.length) return false
  for (const l of doc.lines) {
    if (l.inboundQty > l.refUninboundQty) return false
  }
  const ts = nowString()
  upsertSalesReturnInbound({
    ...doc,
    status: 'STOCKED_IN',
    confirmedBy: '老李',
    confirmedAt: ts,
    updatedBy: '老李',
    updatedAt: ts,
  })
  applyInboundToReturn(
    doc.returnId,
    active.map((l) => ({ returnLineId: l.returnLineId, qty: l.inboundQty })),
  )
  syncOutboundReturnedQty(doc.outboundId)
  return true
}

function parseNos(raw: string): string[] {
  return raw
    .split(/[\n,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function inDateRange(value: string, from: string, to: string): boolean {
  if (from && value < from) return false
  if (to && value > to) return false
  return true
}

export function filterSalesReturnInbounds(
  filters: SalesReturnInboundListFilters,
  tab: ReturnInboundStatusTabKey,
): SalesReturnInbound[] {
  const inboundNos = parseNos(filters.inboundNos)
  const returnNos = parseNos(filters.returnNos)
  const outboundNos = parseNos(filters.outboundNos)
  return listSalesReturnInbounds().filter((row) => {
    if (tab !== 'ALL' && row.status !== tab) return false
    if (tab === 'ALL' && filters.status && row.status !== filters.status) return false
    if (filters.customerId && row.customerId !== filters.customerId) return false
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (inboundNos.length && !inboundNos.includes(row.inboundNo)) return false
    if (returnNos.length && !returnNos.includes(row.returnNo)) return false
    if (outboundNos.length && !outboundNos.includes(row.outboundNo)) return false
    if (!inDateRange(row.inboundDate, filters.inboundDateFrom, filters.inboundDateTo)) return false
    if (!inDateRange(row.updatedAt.slice(0, 10), filters.updatedFrom, filters.updatedTo)) return false
    return true
  })
}

export function countReturnInboundByTab(
  filters: SalesReturnInboundListFilters,
): Record<ReturnInboundStatusTabKey, number> {
  const base = filterSalesReturnInbounds({ ...filters, status: '' }, 'ALL')
  const counts: Record<ReturnInboundStatusTabKey, number> = {
    ALL: base.length,
    DRAFT: 0,
    STOCKED_IN: 0,
  }
  for (const row of base) {
    if (row.status === 'DRAFT') counts.DRAFT += 1
    if (row.status === 'STOCKED_IN') counts.STOCKED_IN += 1
  }
  return counts
}
