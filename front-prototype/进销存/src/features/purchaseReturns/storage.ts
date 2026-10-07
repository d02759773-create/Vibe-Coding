import type {
  PurchaseReturn,
  PurchaseReturnLine,
  PurchaseReturnListFilters,
  ReturnStatusTabKey,
} from './types'
import {
  getPurchaseInboundById,
  getPurchaseInboundByNo,
  listPurchaseInbounds,
  upsertPurchaseInbound,
} from '@/features/purchaseInbound/storage'
import type { PurchaseInbound } from '@/features/purchaseInbound/types'
import { nowString } from '@/features/purchaseOrders/storage'
import { lineAmount, recalcReturnTotals } from './validate'
import type { PurchaseReturnOutbound } from '@/features/purchaseReturnOutbound/types'

const STORAGE_KEY = 'inventory-demo-purchase-returns-v1'
const OUTBOUND_STORAGE_KEY = 'inventory-demo-purchase-return-outbounds-v1'

function listOutboundsForLinks(): PurchaseReturnOutbound[] {
  const raw = localStorage.getItem(OUTBOUND_STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as PurchaseReturnOutbound[]
  } catch {
    return []
  }
}

function persist(all: PurchaseReturn[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function reservedReturnQty(
  inboundId: string,
  inboundLineId: string,
  excludeReturnId?: string,
): number {
  return listPurchaseReturns()
    .filter(
      (r) =>
        r.inboundId === inboundId &&
        r.status !== 'VOIDED' &&
        r.id !== excludeReturnId,
    )
    .flatMap((r) => r.lines)
    .filter((l) => l.inboundLineId === inboundLineId)
    .reduce((s, l) => s + Math.max(0, l.returnQty - l.outboundQty), 0)
}

export function maxReturnableQty(
  inboundId: string,
  inboundLineId: string,
  excludeReturnId?: string,
): number {
  const inbound = getPurchaseInboundById(inboundId)
  if (!inbound || inbound.status !== 'STOCKED_IN') return 0
  const line = inbound.lines.find((l) => l.id === inboundLineId)
  if (!line) return 0
  const reserved = reservedReturnQty(inboundId, inboundLineId, excludeReturnId)
  const returned = line.returnedQty ?? 0
  return Math.max(0, line.stockInQty - returned - reserved)
}

function mapLinesFromInbound(inbound: PurchaseInbound, excludeReturnId?: string): PurchaseReturnLine[] {
  return inbound.lines
    .filter((l) => l.stockInQty > 0)
    .map((l) => ({
      id: `rl-${l.id}`,
      inboundLineId: l.id,
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      barcode: l.barcode,
      specModel: l.specModel,
      unit: l.unit,
      refReturnableQty: maxReturnableQty(inbound.id, l.id, excludeReturnId),
      returnQty: 0,
      outboundQty: 0,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineAmount: 0,
      lineRemark: '',
    }))
}

function syncOutboundLinks(doc: PurchaseReturn): PurchaseReturn {
  const links = listOutboundsForLinks()
    .filter((o) => o.returnId === doc.id)
    .map((o) => ({
      id: o.id,
      outboundNo: o.outboundNo,
      outboundDate: o.outboundDate,
      totalQty: o.totalOutboundQty,
      status: o.status,
      operator: o.confirmedBy ?? o.createdBy,
    }))
  return { ...doc, outboundLinks: links }
}

function recomputeReturnStatus(doc: PurchaseReturn): PurchaseReturn {
  if (doc.status === 'VOIDED' || doc.status === 'DRAFT' || doc.status === 'PENDING_AUDIT') {
    return doc
  }
  const totalReturn = doc.totalReturnQty
  const totalOut = doc.totalOutboundQty
  if (totalOut <= 0) return { ...doc, status: 'PENDING_OUTBOUND' }
  if (totalOut >= totalReturn) return { ...doc, status: 'COMPLETED' }
  return { ...doc, status: 'PARTIAL_OUTBOUND' }
}

export function normalizeReturn(doc: PurchaseReturn): PurchaseReturn {
  const lines = doc.lines.map((l) => ({
    ...l,
    lineAmount: lineAmount(l.returnQty, l.unitPrice),
  }))
  const withTotals = { ...doc, lines, ...recalcReturnTotals(lines) }
  const linked = syncOutboundLinks(withTotals)
  return recomputeReturnStatus(linked)
}

export function listPurchaseReturns(): PurchaseReturn[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    persist([])
    return []
  }
  try {
    return (JSON.parse(raw) as PurchaseReturn[]).map(normalizeReturn)
  } catch {
    return []
  }
}

export function getPurchaseReturnById(id: string): PurchaseReturn | undefined {
  return listPurchaseReturns().find((d) => d.id === id)
}

export function getPurchaseReturnByNo(no: string): PurchaseReturn | undefined {
  return listPurchaseReturns().find((d) => d.returnNo === no)
}

export function nextReturnId(): string {
  const nums = listPurchaseReturns()
    .map((d) => Number(d.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `prt-${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextReturnNo(returnDate: string): string {
  const ymd = returnDate.replace(/-/g, '')
  const prefix = `PRT${ymd}-`
  const nums = listPurchaseReturns()
    .map((d) => {
      if (!d.returnNo.startsWith(prefix)) return 0
      return parseInt(d.returnNo.slice(prefix.length), 10) || 0
    })
    .filter((n) => n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function upsertPurchaseReturn(doc: PurchaseReturn): void {
  const normalized = normalizeReturn(doc)
  const all = listPurchaseReturns()
  const idx = all.findIndex((d) => d.id === normalized.id)
  if (idx >= 0) all[idx] = normalized
  else all.unshift(normalized)
  persist(all.map(normalizeReturn))
}

export function deletePurchaseReturn(id: string): boolean {
  const doc = getPurchaseReturnById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  persist(listPurchaseReturns().filter((d) => d.id !== id))
  return true
}

export function createDraftFromInbound(inboundId: string): PurchaseReturn | null {
  const inbound = getPurchaseInboundById(inboundId)
  if (!inbound || inbound.status !== 'STOCKED_IN') return null
  const lines = mapLinesFromInbound(inbound)
  if (!lines.some((l) => l.refReturnableQty > 0)) return null
  const returnDate = new Date().toISOString().slice(0, 10)
  const doc: PurchaseReturn = {
    id: nextReturnId(),
    returnNo: nextReturnNo(returnDate),
    inboundId: inbound.id,
    inboundNo: inbound.inboundNo,
    purchaseOrderId: inbound.purchaseOrderId,
    purchaseOrderNo: inbound.purchaseOrderNo,
    supplierId: inbound.supplierId,
    supplierCode: inbound.supplierCode,
    supplierName: inbound.supplierName,
    warehouseId: inbound.warehouseId,
    warehouseCode: inbound.warehouseCode,
    warehouseName: inbound.warehouseName,
    returnDate,
    status: 'DRAFT',
    returnReason: '',
    lines,
    totalReturnQty: 0,
    totalOutboundQty: 0,
    totalAmount: 0,
    outboundLinks: [],
    createdBy: '老李',
    createdAt: nowString(),
    updatedBy: '老李',
    updatedAt: nowString(),
    auditedBy: null,
    auditedAt: null,
  }
  upsertPurchaseReturn(doc)
  return getPurchaseReturnById(doc.id)!
}

export function listEligibleInboundsForReturn() {
  return listPurchaseInbounds().filter((d) => {
    if (d.status !== 'STOCKED_IN') return false
    return d.lines.some((l) => {
      if (l.stockInQty <= 0) return false
      return maxReturnableQty(d.id, l.id) > 0
    })
  })
}

export function submitPurchaseReturn(id: string): boolean {
  const doc = getPurchaseReturnById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  const ts = nowString()
  upsertPurchaseReturn({
    ...doc,
    status: 'PENDING_AUDIT',
    updatedBy: '老李',
    updatedAt: ts,
  })
  return true
}

export function approvePurchaseReturn(id: string): boolean {
  const doc = getPurchaseReturnById(id)
  if (!doc || doc.status !== 'PENDING_AUDIT') return false
  const ts = nowString()
  upsertPurchaseReturn({
    ...doc,
    status: 'PENDING_OUTBOUND',
    auditedBy: '林强',
    auditedAt: ts,
    updatedBy: '林强',
    updatedAt: ts,
  })
  return true
}

export function rejectPurchaseReturn(id: string): boolean {
  const doc = getPurchaseReturnById(id)
  if (!doc || doc.status !== 'PENDING_AUDIT') return false
  const ts = nowString()
  upsertPurchaseReturn({
    ...doc,
    status: 'DRAFT',
    auditedBy: null,
    auditedAt: null,
    updatedBy: '林强',
    updatedAt: ts,
  })
  return true
}

export function voidPurchaseReturn(id: string): boolean {
  const doc = getPurchaseReturnById(id)
  if (!doc) return false
  if (!['PENDING_AUDIT', 'PENDING_OUTBOUND'].includes(doc.status)) return false
  if (doc.totalOutboundQty > 0) return false
  const ts = nowString()
  upsertPurchaseReturn({
    ...doc,
    status: 'VOIDED',
    updatedBy: '林强',
    updatedAt: ts,
  })
  return true
}

/** Called from return-outbound module after confirm */
export function applyOutboundToReturn(
  returnId: string,
  deltas: { returnLineId: string; qty: number }[],
): void {
  const doc = getPurchaseReturnById(returnId)
  if (!doc) return
  const lines = doc.lines.map((l) => {
    const delta = deltas.find((d) => d.returnLineId === l.id)?.qty ?? 0
    return { ...l, outboundQty: l.outboundQty + delta }
  })
  const ts = nowString()
  upsertPurchaseReturn({
    ...doc,
    lines,
    ...recalcReturnTotals(lines),
    updatedBy: '老李',
    updatedAt: ts,
  })
}

export function syncInboundReturnedQty(inboundId: string): void {
  const inbound = getPurchaseInboundById(inboundId)
  if (!inbound) return
  const totals = new Map<string, number>()
  for (const r of listPurchaseReturns()) {
    if (r.inboundId !== inboundId || r.status === 'VOIDED') continue
    for (const l of r.lines) {
      totals.set(l.inboundLineId, (totals.get(l.inboundLineId) ?? 0) + l.outboundQty)
    }
  }
  const lines = inbound.lines.map((l) => ({
    ...l,
    returnedQty: totals.get(l.id) ?? 0,
  }))
  upsertPurchaseInbound({ ...inbound, lines })
}

export function resolveInboundIdFromQuery(inboundNo?: string | null, inboundId?: string | null): string | null {
  if (inboundId) return inboundId
  if (inboundNo) {
    const doc = getPurchaseInboundByNo(inboundNo)
    return doc?.id ?? null
  }
  return null
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

const TAB_STATUS: Partial<Record<ReturnStatusTabKey, PurchaseReturn['status']>> = {
  DRAFT: 'DRAFT',
  PENDING_AUDIT: 'PENDING_AUDIT',
  PENDING_OUTBOUND: 'PENDING_OUTBOUND',
  PARTIAL_OUTBOUND: 'PARTIAL_OUTBOUND',
  COMPLETED: 'COMPLETED',
}

export function filterPurchaseReturns(
  filters: PurchaseReturnListFilters,
  tab: ReturnStatusTabKey,
): PurchaseReturn[] {
  const returnNos = parseNos(filters.returnNos)
  const inboundNos = parseNos(filters.inboundNos)
  const poNos = parseNos(filters.purchaseOrderNos)
  const tabStatus = TAB_STATUS[tab]
  return listPurchaseReturns().filter((row) => {
    if (tabStatus && row.status !== tabStatus) return false
    if (tab === 'ALL' && filters.status && row.status !== filters.status) return false
    if (filters.supplierId && row.supplierId !== filters.supplierId) return false
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (returnNos.length && !returnNos.includes(row.returnNo)) return false
    if (inboundNos.length && !inboundNos.includes(row.inboundNo)) return false
    if (poNos.length && !poNos.includes(row.purchaseOrderNo)) return false
    if (!inDateRange(row.returnDate, filters.returnDateFrom, filters.returnDateTo)) return false
    if (!inDateRange(row.updatedAt.slice(0, 10), filters.updatedFrom, filters.updatedTo)) return false
    return true
  })
}

export function countReturnByTab(filters: PurchaseReturnListFilters): Record<ReturnStatusTabKey, number> {
  const base = filterPurchaseReturns({ ...filters, status: '' }, 'ALL')
  const keys: ReturnStatusTabKey[] = [
    'ALL',
    'DRAFT',
    'PENDING_AUDIT',
    'PENDING_OUTBOUND',
    'PARTIAL_OUTBOUND',
    'COMPLETED',
  ]
  const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<ReturnStatusTabKey, number>
  counts.ALL = base.length
  for (const row of base) {
    if (row.status === 'DRAFT') counts.DRAFT += 1
    if (row.status === 'PENDING_AUDIT') counts.PENDING_AUDIT += 1
    if (row.status === 'PENDING_OUTBOUND') counts.PENDING_OUTBOUND += 1
    if (row.status === 'PARTIAL_OUTBOUND') counts.PARTIAL_OUTBOUND += 1
    if (row.status === 'COMPLETED') counts.COMPLETED += 1
  }
  return counts
}

export function listReturnsEligibleForOutbound() {
  return listPurchaseReturns().filter((r) =>
    ['PENDING_OUTBOUND', 'PARTIAL_OUTBOUND'].includes(r.status),
  )
}
