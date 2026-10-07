import type {
  SalesReturn,
  SalesReturnLine,
  SalesReturnListFilters,
  ReturnStatusTabKey,
} from './types'
import {
  getSalesOutboundById,
  getSalesOutboundByNo,
  listSalesOutbounds,
  upsertSalesOutbound,
} from '@/features/salesOutbound/storage'
import type { SalesOutbound } from '@/features/salesOutbound/types'
import { nowString } from '@/features/salesOrders/storage'
import { lineAmount, recalcReturnTotals } from './validate'
import type { SalesReturnInbound } from '@/features/salesReturnInbound/types'

const STORAGE_KEY = 'inventory-demo-sales-returns-v1'
const INBOUND_STORAGE_KEY = 'inventory-demo-sales-return-inbounds-v1'

function listInboundsForLinks(): SalesReturnInbound[] {
  const raw = localStorage.getItem(INBOUND_STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as SalesReturnInbound[]
  } catch {
    return []
  }
}

function persist(all: SalesReturn[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function reservedReturnQty(
  outboundId: string,
  outboundLineId: string,
  excludeReturnId?: string,
): number {
  return listSalesReturns()
    .filter(
      (r) =>
        r.outboundId === outboundId &&
        r.status !== 'VOIDED' &&
        r.id !== excludeReturnId,
    )
    .flatMap((r) => r.lines)
    .filter((l) => l.outboundLineId === outboundLineId)
    .reduce((s, l) => s + Math.max(0, l.returnQty - l.inboundQty), 0)
}

export function maxReturnableQty(
  outboundId: string,
  outboundLineId: string,
  excludeReturnId?: string,
): number {
  const outbound = getSalesOutboundById(outboundId)
  if (!outbound || outbound.status !== 'SHIPPED') return 0
  const line = outbound.lines.find((l) => l.id === outboundLineId)
  if (!line) return 0
  const reserved = reservedReturnQty(outboundId, outboundLineId, excludeReturnId)
  const returned = line.returnedQty ?? 0
  return Math.max(0, line.shipQty - returned - reserved)
}

function mapLinesFromOutbound(outbound: SalesOutbound, excludeReturnId?: string): SalesReturnLine[] {
  return outbound.lines
    .filter((l) => l.shipQty > 0)
    .map((l) => ({
      id: `rl-${l.id}`,
      outboundLineId: l.id,
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      barcode: l.barcode,
      specModel: l.specModel,
      unit: l.unit,
      refReturnableQty: maxReturnableQty(outbound.id, l.id, excludeReturnId),
      returnQty: 0,
      inboundQty: 0,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineAmount: 0,
      lineRemark: '',
    }))
}

function syncOutboundLinks(doc: SalesReturn): SalesReturn {
  const links = listInboundsForLinks()
    .filter((o) => o.returnId === doc.id)
    .map((o) => ({
      id: o.id,
      inboundNo: o.inboundNo,
      inboundDate: o.inboundDate,
      totalQty: o.totalInboundQty,
      status: o.status,
      operator: o.confirmedBy ?? o.createdBy,
    }))
  return { ...doc, inboundLinks: links }
}

function recomputeReturnStatus(doc: SalesReturn): SalesReturn {
  if (doc.status === 'VOIDED' || doc.status === 'DRAFT' || doc.status === 'PENDING_AUDIT') {
    return doc
  }
  const totalReturn = doc.totalReturnQty
  const totalIn = doc.totalInboundQty
  if (totalIn <= 0) return { ...doc, status: 'PENDING_INBOUND' }
  if (totalIn >= totalReturn) return { ...doc, status: 'COMPLETED' }
  return { ...doc, status: 'PARTIAL_INBOUND' }
}

export function normalizeReturn(doc: SalesReturn): SalesReturn {
  const lines = doc.lines.map((l) => ({
    ...l,
    lineAmount: lineAmount(l.returnQty, l.unitPrice),
  }))
  const withTotals = { ...doc, lines, ...recalcReturnTotals(lines) }
  const linked = syncOutboundLinks(withTotals)
  return recomputeReturnStatus(linked)
}

export function listSalesReturns(): SalesReturn[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    persist([])
    return []
  }
  try {
    return (JSON.parse(raw) as SalesReturn[]).map(normalizeReturn)
  } catch {
    return []
  }
}

export function getSalesReturnById(id: string): SalesReturn | undefined {
  return listSalesReturns().find((d) => d.id === id)
}

export function getSalesReturnByNo(no: string): SalesReturn | undefined {
  return listSalesReturns().find((d) => d.returnNo === no)
}

export function nextReturnId(): string {
  const nums = listSalesReturns()
    .map((d) => Number(d.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `srt-${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextReturnNo(returnDate: string): string {
  const ymd = returnDate.replace(/-/g, '')
  const prefix = `SRT${ymd}-`
  const nums = listSalesReturns()
    .map((d) => {
      if (!d.returnNo.startsWith(prefix)) return 0
      return parseInt(d.returnNo.slice(prefix.length), 10) || 0
    })
    .filter((n) => n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function upsertSalesReturn(doc: SalesReturn): void {
  const normalized = normalizeReturn(doc)
  const all = listSalesReturns()
  const idx = all.findIndex((d) => d.id === normalized.id)
  if (idx >= 0) all[idx] = normalized
  else all.unshift(normalized)
  persist(all.map(normalizeReturn))
}

export function deleteSalesReturn(id: string): boolean {
  const doc = getSalesReturnById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  persist(listSalesReturns().filter((d) => d.id !== id))
  return true
}

export function createDraftFromOutbound(outboundId: string): SalesReturn | null {
  const outbound = getSalesOutboundById(outboundId)
  if (!outbound || outbound.status !== 'SHIPPED') return null
  const lines = mapLinesFromOutbound(outbound)
  if (!lines.some((l) => l.refReturnableQty > 0)) return null
  const returnDate = new Date().toISOString().slice(0, 10)
  const doc: SalesReturn = {
    id: nextReturnId(),
    returnNo: nextReturnNo(returnDate),
    outboundId: outbound.id,
    outboundNo: outbound.outboundNo,
    salesOrderId: outbound.salesOrderId,
    salesOrderNo: outbound.salesOrderNo,
    customerId: outbound.customerId,
    customerCode: outbound.customerCode,
    customerName: outbound.customerName,
    warehouseId: outbound.warehouseId,
    warehouseCode: outbound.warehouseCode,
    warehouseName: outbound.warehouseName,
    returnDate,
    status: 'DRAFT',
    returnReason: '',
    lines,
    totalReturnQty: 0,
    totalInboundQty: 0,
    totalAmount: 0,
    inboundLinks: [],
    createdBy: '老李',
    createdAt: nowString(),
    updatedBy: '老李',
    updatedAt: nowString(),
    auditedBy: null,
    auditedAt: null,
  }
  upsertSalesReturn(doc)
  return getSalesReturnById(doc.id)!
}

export function listEligibleOutboundsForReturn() {
  return listSalesOutbounds().filter((d) => {
    if (d.status !== 'SHIPPED') return false
    return d.lines.some((l) => {
      if (l.shipQty <= 0) return false
      return maxReturnableQty(d.id, l.id) > 0
    })
  })
}

export function submitSalesReturn(id: string): boolean {
  const doc = getSalesReturnById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  const ts = nowString()
  upsertSalesReturn({
    ...doc,
    status: 'PENDING_AUDIT',
    updatedBy: '老李',
    updatedAt: ts,
  })
  return true
}

export function approveSalesReturn(id: string): boolean {
  const doc = getSalesReturnById(id)
  if (!doc || doc.status !== 'PENDING_AUDIT') return false
  const ts = nowString()
  upsertSalesReturn({
    ...doc,
    status: 'PENDING_INBOUND',
    auditedBy: '林强',
    auditedAt: ts,
    updatedBy: '林强',
    updatedAt: ts,
  })
  return true
}

export function rejectSalesReturn(id: string): boolean {
  const doc = getSalesReturnById(id)
  if (!doc || doc.status !== 'PENDING_AUDIT') return false
  const ts = nowString()
  upsertSalesReturn({
    ...doc,
    status: 'DRAFT',
    auditedBy: null,
    auditedAt: null,
    updatedBy: '林强',
    updatedAt: ts,
  })
  return true
}

export function voidSalesReturn(id: string): boolean {
  const doc = getSalesReturnById(id)
  if (!doc) return false
  if (!['PENDING_AUDIT', 'PENDING_INBOUND'].includes(doc.status)) return false
  if (doc.totalInboundQty > 0) return false
  const ts = nowString()
  upsertSalesReturn({
    ...doc,
    status: 'VOIDED',
    updatedBy: '林强',
    updatedAt: ts,
  })
  return true
}

/** Called from return-inbound module after confirm */
export function applyInboundToReturn(
  returnId: string,
  deltas: { returnLineId: string; qty: number }[],
): void {
  const doc = getSalesReturnById(returnId)
  if (!doc) return
  const lines = doc.lines.map((l) => {
    const delta = deltas.find((d) => d.returnLineId === l.id)?.qty ?? 0
    return { ...l, inboundQty: l.inboundQty + delta }
  })
  const ts = nowString()
  upsertSalesReturn({
    ...doc,
    lines,
    ...recalcReturnTotals(lines),
    updatedBy: '老李',
    updatedAt: ts,
  })
}

export function syncOutboundReturnedQty(outboundId: string): void {
  const outbound = getSalesOutboundById(outboundId)
  if (!outbound) return
  const totals = new Map<string, number>()
  for (const r of listSalesReturns()) {
    if (r.outboundId !== outboundId || r.status === 'VOIDED') continue
    for (const l of r.lines) {
      totals.set(l.outboundLineId, (totals.get(l.outboundLineId) ?? 0) + l.inboundQty)
    }
  }
  const lines = outbound.lines.map((l) => ({
    ...l,
    returnedQty: totals.get(l.id) ?? 0,
  }))
  upsertSalesOutbound({ ...outbound, lines })
}

export function resolveOutboundIdFromQuery(outboundNo?: string | null, outboundId?: string | null): string | null {
  if (outboundId) return outboundId
  if (outboundNo) {
    const doc = getSalesOutboundByNo(outboundNo)
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

const TAB_STATUS: Partial<Record<ReturnStatusTabKey, SalesReturn['status']>> = {
  DRAFT: 'DRAFT',
  PENDING_AUDIT: 'PENDING_AUDIT',
  PENDING_INBOUND: 'PENDING_INBOUND',
  PARTIAL_INBOUND: 'PARTIAL_INBOUND',
  COMPLETED: 'COMPLETED',
}

export function filterSalesReturns(
  filters: SalesReturnListFilters,
  tab: ReturnStatusTabKey,
): SalesReturn[] {
  const returnNos = parseNos(filters.returnNos)
  const outboundNos = parseNos(filters.outboundNos)
  const soNos = parseNos(filters.salesOrderNos)
  const tabStatus = TAB_STATUS[tab]
  return listSalesReturns().filter((row) => {
    if (tabStatus && row.status !== tabStatus) return false
    if (tab === 'ALL' && filters.status && row.status !== filters.status) return false
    if (filters.customerId && row.customerId !== filters.customerId) return false
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (returnNos.length && !returnNos.includes(row.returnNo)) return false
    if (outboundNos.length && !outboundNos.includes(row.outboundNo)) return false
    if (soNos.length && !soNos.includes(row.salesOrderNo)) return false
    if (!inDateRange(row.returnDate, filters.returnDateFrom, filters.returnDateTo)) return false
    if (!inDateRange(row.updatedAt.slice(0, 10), filters.updatedFrom, filters.updatedTo)) return false
    return true
  })
}

export function countReturnByTab(filters: SalesReturnListFilters): Record<ReturnStatusTabKey, number> {
  const base = filterSalesReturns({ ...filters, status: '' }, 'ALL')
  const keys: ReturnStatusTabKey[] = [
    'ALL',
    'DRAFT',
    'PENDING_AUDIT',
    'PENDING_INBOUND',
    'PARTIAL_INBOUND',
    'COMPLETED',
  ]
  const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<ReturnStatusTabKey, number>
  counts.ALL = base.length
  for (const row of base) {
    if (row.status === 'DRAFT') counts.DRAFT += 1
    if (row.status === 'PENDING_AUDIT') counts.PENDING_AUDIT += 1
    if (row.status === 'PENDING_INBOUND') counts.PENDING_INBOUND += 1
    if (row.status === 'PARTIAL_INBOUND') counts.PARTIAL_INBOUND += 1
    if (row.status === 'COMPLETED') counts.COMPLETED += 1
  }
  return counts
}

export function listReturnsEligibleForOutbound() {
  return listSalesReturns().filter((r) =>
    ['PENDING_INBOUND', 'PARTIAL_INBOUND'].includes(r.status),
  )
}
