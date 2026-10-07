import type { PurchaseInbound, PurchaseInboundLine, PurchaseInboundListFilters, InboundStatusTabKey } from './types'
import type { PurchaseOrder, PurchaseInboundLink } from '@/features/purchaseOrders/types'
import {
  getPurchaseOrderById,
  listPurchaseOrders,
  nowString,
  recalcOrder,
  unreceivedQty,
  upsertPurchaseOrder,
} from '@/features/purchaseOrders/storage'
import { recalcInboundTotals } from '@/features/purchaseInbound/validate'

const STORAGE_KEY = 'inventory-demo-purchase-inbounds-v1'

function lineAmount(stockInQty: number, unitPrice: number): number {
  return Math.round(stockInQty * unitPrice * 100) / 100
}

function mapLinesFromOrder(order: PurchaseOrder, fill?: (lineId: string) => Partial<PurchaseInboundLine>): PurchaseInboundLine[] {
  return order.lines.map((l) => {
    const ref = unreceivedQty(l)
    const extra = fill?.(l.id) ?? {}
    const receivedQty = extra.receivedQty ?? 0
    const stockInQty = extra.stockInQty ?? 0
    return {
      id: extra.id ?? `il-${l.id}-${Date.now()}`,
      purchaseOrderLineId: l.id,
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      barcode: l.barcode,
      specModel: l.specModel,
      unit: l.unit,
      refUnreceivedQty: ref,
      receivedQty,
      stockInQty,
      returnedQty: extra.returnedQty ?? 0,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineAmount: lineAmount(stockInQty, l.unitPrice),
      diffReason: extra.diffReason ?? '',
      lineRemark: extra.lineRemark ?? '',
    }
  })
}

function buildSeed(): PurchaseInbound[] {
  const po7 = listPurchaseOrders().find((o) => o.id === 'po-7')
  const po8 = listPurchaseOrders().find((o) => o.id === 'po-8')
  const po9 = listPurchaseOrders().find((o) => o.id === 'po-9')
  const po10 = listPurchaseOrders().find((o) => o.id === 'po-10')
  const po5 = listPurchaseOrders().find((o) => o.id === 'po-5')

  const seeds: PurchaseInbound[] = []

  if (po7) {
    const stockedLines = mapLinesFromOrder(po7, (lid) => {
      if (lid === 'l2a') return { receivedQty: 40, stockInQty: 40 }
      if (lid === 'l2b') return { receivedQty: 10, stockInQty: 10 }
      return { receivedQty: 0, stockInQty: 0 }
    })
    stockedLines.forEach((l) => {
      l.id = l.purchaseOrderLineId === 'l2a' ? 'il7a' : l.purchaseOrderLineId === 'l2b' ? 'il7b' : l.id
    })
    const stocked: PurchaseInbound = {
      id: 'in-1',
      inboundNo: 'GR20260416-0001',
      purchaseOrderId: po7.id,
      purchaseOrderNo: po7.orderNo,
      supplierId: po7.supplierId,
      supplierCode: po7.supplierCode,
      supplierName: po7.supplierName,
      warehouseId: po7.warehouseId,
      warehouseCode: po7.warehouseCode,
      warehouseName: po7.warehouseName,
      inboundDate: '2026-04-16',
      status: 'STOCKED_IN',
      confirmBlocked: false,
      remark: '',
      lines: stockedLines,
      ...recalcInboundTotals(stockedLines),
      createdBy: '老李',
      createdAt: '2026-04-16 09:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-16 17:00:00',
      confirmedBy: '老李',
      confirmedAt: '2026-04-16 17:00:00',
    }
    seeds.push(stocked)

    const draftLines = mapLinesFromOrder(po7, () => ({ receivedQty: 30, stockInQty: 30 }))
    draftLines.forEach((l) => {
      l.id = `il7d-${l.purchaseOrderLineId}`
      l.refUnreceivedQty = unreceivedQty(po7.lines.find((x) => x.id === l.purchaseOrderLineId)!)
    })
    seeds.push({
      id: 'in-1-draft',
      inboundNo: 'GR20260417-0002',
      purchaseOrderId: po7.id,
      purchaseOrderNo: po7.orderNo,
      supplierId: po7.supplierId,
      supplierCode: po7.supplierCode,
      supplierName: po7.supplierName,
      warehouseId: po7.warehouseId,
      warehouseCode: po7.warehouseCode,
      warehouseName: po7.warehouseName,
      inboundDate: '2026-04-17',
      status: 'DRAFT',
      confirmBlocked: false,
      remark: '草稿样例',
      lines: draftLines,
      ...recalcInboundTotals(draftLines),
      createdBy: '老李',
      createdAt: '2026-04-17 10:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-17 10:30:00',
      confirmedBy: null,
      confirmedAt: null,
    })
  }

  if (po8) {
    const lines = mapLinesFromOrder(po8, () => ({ receivedQty: 120, stockInQty: 120 }))
    lines[0].id = 'il8'
    seeds.push({
      id: 'in-2',
      inboundNo: 'GR20260415-0002',
      purchaseOrderId: po8.id,
      purchaseOrderNo: po8.orderNo,
      supplierId: po8.supplierId,
      supplierCode: po8.supplierCode,
      supplierName: po8.supplierName,
      warehouseId: po8.warehouseId,
      warehouseCode: po8.warehouseCode,
      warehouseName: po8.warehouseName,
      inboundDate: '2026-04-15',
      status: 'STOCKED_IN',
      confirmBlocked: false,
      remark: '',
      lines,
      ...recalcInboundTotals(lines),
      createdBy: '赵仓管',
      createdAt: '2026-04-15 14:00:00',
      updatedBy: '赵仓管',
      updatedAt: '2026-04-15 18:00:00',
      confirmedBy: '赵仓管',
      confirmedAt: '2026-04-15 18:00:00',
    })
  }

  if (po9) {
    const lines = mapLinesFromOrder(po9, () => ({ receivedQty: 50, stockInQty: 50 }))
    lines[0].id = 'il9'
    seeds.push({
      id: 'in-3',
      inboundNo: 'GR20260411-0003',
      purchaseOrderId: po9.id,
      purchaseOrderNo: po9.orderNo,
      supplierId: po9.supplierId,
      supplierCode: po9.supplierCode,
      supplierName: po9.supplierName,
      warehouseId: po9.warehouseId,
      warehouseCode: po9.warehouseCode,
      warehouseName: po9.warehouseName,
      inboundDate: '2026-04-11',
      status: 'STOCKED_IN',
      confirmBlocked: false,
      remark: '',
      lines,
      ...recalcInboundTotals(lines),
      createdBy: '老李',
      createdAt: '2026-04-11 11:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-11 15:00:00',
      confirmedBy: '老李',
      confirmedAt: '2026-04-11 15:00:00',
    })
  }

  if (po10) {
    const lines = mapLinesFromOrder(po10, () => ({ receivedQty: 25, stockInQty: 25 }))
    lines[0].id = 'il10s'
    seeds.push({
      id: 'in-4',
      inboundNo: 'GR20260409-0004',
      purchaseOrderId: po10.id,
      purchaseOrderNo: po10.orderNo,
      supplierId: po10.supplierId,
      supplierCode: po10.supplierCode,
      supplierName: po10.supplierName,
      warehouseId: po10.warehouseId,
      warehouseCode: po10.warehouseCode,
      warehouseName: po10.warehouseName,
      inboundDate: '2026-04-09',
      status: 'STOCKED_IN',
      confirmBlocked: false,
      remark: '',
      lines,
      ...recalcInboundTotals(lines),
      createdBy: '老李',
      createdAt: '2026-04-09 09:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-09 16:00:00',
      confirmedBy: '老李',
      confirmedAt: '2026-04-09 16:00:00',
    })
    const draftLines = mapLinesFromOrder(po10, () => ({ receivedQty: 5, stockInQty: 5 }))
    draftLines[0].id = 'il10d'
    seeds.push({
      id: 'in-blocked-draft',
      inboundNo: 'GR20260412-0099',
      purchaseOrderId: po10.id,
      purchaseOrderNo: po10.orderNo,
      supplierId: po10.supplierId,
      supplierCode: po10.supplierCode,
      supplierName: po10.supplierName,
      warehouseId: po10.warehouseId,
      warehouseCode: po10.warehouseCode,
      warehouseName: po10.warehouseName,
      inboundDate: '2026-04-12',
      status: 'DRAFT',
      confirmBlocked: true,
      remark: 'PO 已关闭，确认阻断样例',
      lines: draftLines,
      ...recalcInboundTotals(draftLines),
      createdBy: '老李',
      createdAt: '2026-04-12 08:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-12 10:00:00',
      confirmedBy: null,
      confirmedAt: null,
    })
  }

  if (po5) {
    const lines = mapLinesFromOrder(po5)
    lines[0].id = 'il5d'
    seeds.push({
      id: 'in-draft-5',
      inboundNo: 'GR20260420-0005',
      purchaseOrderId: po5.id,
      purchaseOrderNo: po5.orderNo,
      supplierId: po5.supplierId,
      supplierCode: po5.supplierCode,
      supplierName: po5.supplierName,
      warehouseId: po5.warehouseId,
      warehouseCode: po5.warehouseCode,
      warehouseName: po5.warehouseName,
      inboundDate: '2026-04-20',
      status: 'DRAFT',
      confirmBlocked: false,
      remark: '',
      lines,
      ...recalcInboundTotals(lines),
      createdBy: '老李',
      createdAt: '2026-04-20 09:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-20 09:00:00',
      confirmedBy: null,
      confirmedAt: null,
    })
  }

  return seeds
}

function seedAndPersist(): PurchaseInbound[] {
  const seed = buildSeed().map(normalizeInbound)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  syncAllPurchaseOrdersFromInbounds(seed)
  return seed
}

function load(): PurchaseInbound[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedAndPersist()
    const parsed = JSON.parse(raw) as PurchaseInbound[]
    if (!Array.isArray(parsed) || parsed.length === 0) return seedAndPersist()
    const normalized = parsed.map(normalizeInbound)
    const migrated = JSON.stringify(normalized)
    if (migrated !== raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      syncAllPurchaseOrdersFromInbounds(normalized)
    }
    return normalized
  } catch {
    return seedAndPersist()
  }
}

let cache: PurchaseInbound[] | null = null

export function listPurchaseInbounds(): PurchaseInbound[] {
  if (!cache) cache = load()
  return cache
}

export function persistPurchaseInbounds(docs: PurchaseInbound[]): void {
  cache = docs
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  syncAllPurchaseOrdersFromInbounds(docs)
}

function toInboundLink(doc: PurchaseInbound): PurchaseInboundLink {
  return {
    id: doc.id,
    inboundNo: doc.inboundNo,
    inboundDate: doc.inboundDate,
    totalQty: doc.totalStockInQty,
    operator: doc.confirmedBy ?? doc.createdBy,
    status: doc.status === 'STOCKED_IN' ? 'STOCKED_IN' : 'DRAFT',
  }
}

export function syncPurchaseOrderFromInbounds(purchaseOrderId: string, allInbounds: PurchaseInbound[]): void {
  const order = getPurchaseOrderById(purchaseOrderId)
  if (!order) return

  const related = allInbounds.filter((d) => d.purchaseOrderId === purchaseOrderId && d.status !== 'VOIDED')
  const stocked = related.filter((d) => d.status === 'STOCKED_IN')

  const lines = order.lines.map((line) => {
    let received = 0
    for (const doc of stocked) {
      for (const il of doc.lines) {
        if (il.purchaseOrderLineId === line.id) received += il.stockInQty
      }
    }
    return { ...line, receivedQty: Math.min(line.quantity, received) }
  })

  const inboundLinks = related.map(toInboundLink).sort((a, b) => b.inboundDate.localeCompare(a.inboundDate))

  let status = order.status
  if (order.status !== 'COMPLETED' && ['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN'].includes(order.status)) {
    const allReceived = lines.every((l) => l.receivedQty >= l.quantity)
    const anyReceived = lines.some((l) => l.receivedQty > 0)
    if (allReceived) status = 'COMPLETED'
    else if (anyReceived) status = 'PARTIAL_STOCK_IN'
    else status = 'PENDING_STOCK_IN'
  }

  upsertPurchaseOrder(
    recalcOrder({
      ...order,
      lines,
      inboundLinks,
      status,
    }),
  )
}

function syncAllPurchaseOrdersFromInbounds(all: PurchaseInbound[]): void {
  const ids = new Set(all.map((d) => d.purchaseOrderId))
  for (const id of ids) syncPurchaseOrderFromInbounds(id, all)
}

export function getPurchaseInboundById(id: string): PurchaseInbound | undefined {
  return listPurchaseInbounds().find((d) => d.id === id)
}

export function getPurchaseInboundByNo(no: string): PurchaseInbound | undefined {
  return listPurchaseInbounds().find((d) => d.inboundNo === no)
}

export function nextInboundId(): string {
  const nums = listPurchaseInbounds()
    .map((d) => Number(d.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `in-${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextInboundNo(inboundDate: string): string {
  const ymd = inboundDate.replace(/-/g, '')
  const prefix = `GR${ymd}-`
  const nums = listPurchaseInbounds()
    .map((d) => {
      if (!d.inboundNo.startsWith(prefix)) return 0
      return parseInt(d.inboundNo.slice(prefix.length), 10) || 0
    })
    .filter((n) => n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function normalizeInbound(doc: PurchaseInbound): PurchaseInbound {
  const lines = doc.lines.map((l) => ({
    ...l,
    returnedQty: l.returnedQty ?? 0,
    lineAmount: lineAmount(l.stockInQty, l.unitPrice),
  }))
  return { ...doc, lines, ...recalcInboundTotals(lines) }
}

export function upsertPurchaseInbound(doc: PurchaseInbound): void {
  const normalized = normalizeInbound(doc)
  const all = listPurchaseInbounds()
  const idx = all.findIndex((d) => d.id === normalized.id)
  if (idx >= 0) all[idx] = normalized
  else all.unshift(normalized)
  persistPurchaseInbounds(all)
}

export function deletePurchaseInbound(id: string): boolean {
  const doc = getPurchaseInboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  persistPurchaseInbounds(listPurchaseInbounds().filter((d) => d.id !== id))
  return true
}

export function createDraftFromPurchaseOrder(purchaseOrderId: string): PurchaseInbound | null {
  const order = getPurchaseOrderById(purchaseOrderId)
  if (!order || !['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN'].includes(order.status)) return null
  const lines = mapLinesFromOrder(order)
  const inboundDate = new Date().toISOString().slice(0, 10)
  const doc: PurchaseInbound = {
    id: nextInboundId(),
    inboundNo: nextInboundNo(inboundDate),
    purchaseOrderId: order.id,
    purchaseOrderNo: order.orderNo,
    supplierId: order.supplierId,
    supplierCode: order.supplierCode,
    supplierName: order.supplierName,
    warehouseId: order.warehouseId,
    warehouseCode: order.warehouseCode,
    warehouseName: order.warehouseName,
    inboundDate,
    status: 'DRAFT',
    confirmBlocked: order.status === 'COMPLETED',
    remark: '',
    lines,
    ...recalcInboundTotals(lines),
    createdBy: '老李',
    createdAt: nowString(),
    updatedBy: '老李',
    updatedAt: nowString(),
    confirmedBy: null,
    confirmedAt: null,
  }
  upsertPurchaseInbound(doc)
  return doc
}

export function confirmPurchaseInbound(id: string): boolean {
  const doc = getPurchaseInboundById(id)
  if (!doc || doc.status !== 'DRAFT' || doc.confirmBlocked) return false
  const ts = nowString()
  upsertPurchaseInbound({
    ...doc,
    status: 'STOCKED_IN',
    confirmedBy: '老李',
    confirmedAt: ts,
    updatedBy: '老李',
    updatedAt: ts,
  })
  return true
}

export function blockDraftInboundsForPurchaseOrder(purchaseOrderId: string): void {
  const all = listPurchaseInbounds().map((d) =>
    d.purchaseOrderId === purchaseOrderId && d.status === 'DRAFT'
      ? { ...d, confirmBlocked: true, updatedAt: nowString() }
      : d,
  )
  persistPurchaseInbounds(all)
}

export function listEligiblePurchaseOrders() {
  return listPurchaseOrders().filter((o) =>
    ['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN'].includes(o.status),
  )
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

export function filterPurchaseInbounds(
  filters: PurchaseInboundListFilters,
  tab: InboundStatusTabKey,
): PurchaseInbound[] {
  const inboundNos = parseNos(filters.inboundNos)
  const poNos = parseNos(filters.purchaseOrderNos)
  return listPurchaseInbounds().filter((row) => {
    if (tab !== 'ALL' && row.status !== tab) return false
    if (tab === 'ALL' && filters.status && row.status !== filters.status) return false
    if (filters.supplierId && row.supplierId !== filters.supplierId) return false
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (inboundNos.length && !inboundNos.includes(row.inboundNo)) return false
    if (poNos.length && !poNos.includes(row.purchaseOrderNo)) return false
    if (!inDateRange(row.inboundDate, filters.inboundDateFrom, filters.inboundDateTo)) return false
    if (!inDateRange(row.updatedAt.slice(0, 10), filters.updatedFrom, filters.updatedTo)) return false
    return true
  })
}

export function countInboundByTab(filters: PurchaseInboundListFilters): Record<InboundStatusTabKey, number> {
  const base = filterPurchaseInbounds({ ...filters, status: '' }, 'ALL')
  const counts: Record<InboundStatusTabKey, number> = {
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
