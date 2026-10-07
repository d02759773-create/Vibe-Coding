import type {
  PurchaseReturnOutbound,
  PurchaseReturnOutboundLine,
  PurchaseReturnOutboundListFilters,
  ReturnOutboundStatusTabKey,
} from './types'
import {
  applyOutboundToReturn,
  getPurchaseReturnById,
  syncInboundReturnedQty,
} from '@/features/purchaseReturns/storage'
import type { PurchaseReturn } from '@/features/purchaseReturns/types'
import { nowString } from '@/features/purchaseOrders/storage'
import { lineAmount, recalcOutboundTotals } from './validate'

const STORAGE_KEY = 'inventory-demo-purchase-return-outbounds-v1'

function persist(all: PurchaseReturnOutbound[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function unoutboundQty(returnLine: PurchaseReturn['lines'][0]): number {
  return Math.max(0, returnLine.returnQty - returnLine.outboundQty)
}

function mapLinesFromReturn(ret: PurchaseReturn): PurchaseReturnOutboundLine[] {
  return ret.lines
    .filter((l) => unoutboundQty(l) > 0)
    .map((l) => ({
      id: `rol-${l.id}`,
      returnLineId: l.id,
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      barcode: l.barcode,
      specModel: l.specModel,
      unit: l.unit,
      refUnoutboundQty: unoutboundQty(l),
      outboundQty: 0,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineAmount: 0,
    }))
}

export function normalizeReturnOutbound(doc: PurchaseReturnOutbound): PurchaseReturnOutbound {
  const lines = doc.lines.map((l) => ({
    ...l,
    lineAmount: lineAmount(l.outboundQty, l.unitPrice),
  }))
  return { ...doc, lines, ...recalcOutboundTotals(lines) }
}

export function listPurchaseReturnOutbounds(): PurchaseReturnOutbound[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    persist([])
    return []
  }
  try {
    return (JSON.parse(raw) as PurchaseReturnOutbound[]).map(normalizeReturnOutbound)
  } catch {
    return []
  }
}

export function getPurchaseReturnOutboundById(id: string): PurchaseReturnOutbound | undefined {
  return listPurchaseReturnOutbounds().find((d) => d.id === id)
}

export function nextReturnOutboundId(): string {
  const nums = listPurchaseReturnOutbounds()
    .map((d) => Number(d.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `pro-${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextReturnOutboundNo(outboundDate: string): string {
  const ymd = outboundDate.replace(/-/g, '')
  const prefix = `PRO${ymd}-`
  const nums = listPurchaseReturnOutbounds()
    .map((d) => {
      if (!d.outboundNo.startsWith(prefix)) return 0
      return parseInt(d.outboundNo.slice(prefix.length), 10) || 0
    })
    .filter((n) => n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function upsertPurchaseReturnOutbound(doc: PurchaseReturnOutbound): void {
  const normalized = normalizeReturnOutbound(doc)
  const all = listPurchaseReturnOutbounds()
  const idx = all.findIndex((d) => d.id === normalized.id)
  if (idx >= 0) all[idx] = normalized
  else all.unshift(normalized)
  persist(all.map(normalizeReturnOutbound))
}

export function deletePurchaseReturnOutbound(id: string): boolean {
  const doc = getPurchaseReturnOutboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  persist(listPurchaseReturnOutbounds().filter((d) => d.id !== id))
  return true
}

export function createDraftFromReturn(returnId: string): PurchaseReturnOutbound | null {
  const ret = getPurchaseReturnById(returnId)
  if (!ret || !['PENDING_OUTBOUND', 'PARTIAL_OUTBOUND'].includes(ret.status)) return null
  const lines = mapLinesFromReturn(ret)
  if (!lines.length) return null
  const outboundDate = new Date().toISOString().slice(0, 10)
  const doc: PurchaseReturnOutbound = {
    id: nextReturnOutboundId(),
    outboundNo: nextReturnOutboundNo(outboundDate),
    returnId: ret.id,
    returnNo: ret.returnNo,
    inboundId: ret.inboundId,
    inboundNo: ret.inboundNo,
    supplierId: ret.supplierId,
    supplierCode: ret.supplierCode,
    supplierName: ret.supplierName,
    warehouseId: ret.warehouseId,
    warehouseCode: ret.warehouseCode,
    warehouseName: ret.warehouseName,
    outboundDate,
    status: 'DRAFT',
    logisticsInfo: '',
    remark: '',
    lines,
    totalOutboundQty: 0,
    totalAmount: 0,
    createdBy: '老李',
    createdAt: nowString(),
    updatedBy: '老李',
    updatedAt: nowString(),
    confirmedBy: null,
    confirmedAt: null,
  }
  upsertPurchaseReturnOutbound(doc)
  return getPurchaseReturnOutboundById(doc.id)!
}

export function confirmPurchaseReturnOutbound(id: string): boolean {
  const doc = getPurchaseReturnOutboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  const active = doc.lines.filter((l) => l.outboundQty > 0)
  if (!active.length) return false
  for (const l of doc.lines) {
    if (l.outboundQty > l.refUnoutboundQty) return false
  }
  const ts = nowString()
  upsertPurchaseReturnOutbound({
    ...doc,
    status: 'STOCKED_OUT',
    confirmedBy: '老李',
    confirmedAt: ts,
    updatedBy: '老李',
    updatedAt: ts,
  })
  applyOutboundToReturn(
    doc.returnId,
    active.map((l) => ({ returnLineId: l.returnLineId, qty: l.outboundQty })),
  )
  syncInboundReturnedQty(doc.inboundId)
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

export function filterPurchaseReturnOutbounds(
  filters: PurchaseReturnOutboundListFilters,
  tab: ReturnOutboundStatusTabKey,
): PurchaseReturnOutbound[] {
  const outboundNos = parseNos(filters.outboundNos)
  const returnNos = parseNos(filters.returnNos)
  const inboundNos = parseNos(filters.inboundNos)
  return listPurchaseReturnOutbounds().filter((row) => {
    if (tab !== 'ALL' && row.status !== tab) return false
    if (tab === 'ALL' && filters.status && row.status !== filters.status) return false
    if (filters.supplierId && row.supplierId !== filters.supplierId) return false
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (outboundNos.length && !outboundNos.includes(row.outboundNo)) return false
    if (returnNos.length && !returnNos.includes(row.returnNo)) return false
    if (inboundNos.length && !inboundNos.includes(row.inboundNo)) return false
    if (!inDateRange(row.outboundDate, filters.outboundDateFrom, filters.outboundDateTo)) return false
    if (!inDateRange(row.updatedAt.slice(0, 10), filters.updatedFrom, filters.updatedTo)) return false
    return true
  })
}

export function countReturnOutboundByTab(
  filters: PurchaseReturnOutboundListFilters,
): Record<ReturnOutboundStatusTabKey, number> {
  const base = filterPurchaseReturnOutbounds({ ...filters, status: '' }, 'ALL')
  const counts: Record<ReturnOutboundStatusTabKey, number> = {
    ALL: base.length,
    DRAFT: 0,
    STOCKED_OUT: 0,
  }
  for (const row of base) {
    if (row.status === 'DRAFT') counts.DRAFT += 1
    if (row.status === 'STOCKED_OUT') counts.STOCKED_OUT += 1
  }
  return counts
}
