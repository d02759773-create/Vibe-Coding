import type { SalesOutbound, SalesOutboundLine, SalesOutboundListFilters, OutboundStatusTabKey } from './types'
import type { SalesOrder, SalesOutboundLink } from '@/features/salesOrders/types'
import {
  getSalesOrderById,
  listSalesOrders,
  nowString,
  recalcOrder,
  unpickedQty,
  upsertSalesOrder,
} from '@/features/salesOrders/storage'
import { recalcOutboundTotals } from '@/features/salesOutbound/validate'

const STORAGE_KEY = 'inventory-demo-sales-outbounds-v1'

function lineAmount(shipQty: number, unitPrice: number): number {
  return Math.round(shipQty * unitPrice * 100) / 100
}

function mapLinesFromOrder(order: SalesOrder, fill?: (lineId: string) => Partial<SalesOutboundLine>): SalesOutboundLine[] {
  return order.lines.map((l) => {
    const ref = unpickedQty(l)
    const extra = fill?.(l.id) ?? {}
    const pickedQty = extra.pickedQty ?? 0
    const shipQty = extra.shipQty ?? 0
    return {
      id: extra.id ?? `il-${l.id}-${Date.now()}`,
      salesOrderLineId: l.id,
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      barcode: l.barcode,
      specModel: l.specModel,
      unit: l.unit,
      refUnshippedQty: ref,
      pickedQty,
      shipQty,
      returnedQty: extra.returnedQty ?? 0,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineAmount: lineAmount(shipQty, l.unitPrice),
      diffReason: extra.diffReason ?? '',
      lineRemark: extra.lineRemark ?? '',
    }
  })
}

function buildSeed(): SalesOutbound[] {
  const po7 = listSalesOrders().find((o) => o.id === 'so-7')
  const po8 = listSalesOrders().find((o) => o.id === 'so-8')
  const po9 = listSalesOrders().find((o) => o.id === 'so-9')
  const po10 = listSalesOrders().find((o) => o.id === 'so-10')
  const po5 = listSalesOrders().find((o) => o.id === 'so-5')

  const seeds: SalesOutbound[] = []

  if (po7) {
    const stockedLines = mapLinesFromOrder(po7, (lid) => {
      if (lid === 'l2a') return { pickedQty: 40, shipQty: 40 }
      if (lid === 'l2b') return { pickedQty: 10, shipQty: 10 }
      return { pickedQty: 0, shipQty: 0 }
    })
    stockedLines.forEach((l) => {
      l.id = l.salesOrderLineId === 'l2a' ? 'il7a' : l.salesOrderLineId === 'l2b' ? 'il7b' : l.id
    })
    const stocked: SalesOutbound = {
      id: 'dout-1',
      outboundNo: 'DO20260416-0001',
      salesOrderId: po7.id,
      salesOrderNo: po7.orderNo,
      customerId: po7.customerId,
      customerCode: po7.customerCode,
      customerName: po7.customerName,
      warehouseId: po7.warehouseId,
      warehouseCode: po7.warehouseCode,
      warehouseName: po7.warehouseName,
      outboundDate: '2026-04-16',
      status: 'SHIPPED',
      confirmBlocked: false,
      remark: '',
      lines: stockedLines,
      ...recalcOutboundTotals(stockedLines),
      createdBy: '老李',
      createdAt: '2026-04-16 09:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-16 17:00:00',
      confirmedBy: '老李',
      confirmedAt: '2026-04-16 17:00:00',
    }
    seeds.push(stocked)

    const draftLines = mapLinesFromOrder(po7, () => ({ pickedQty: 30, shipQty: 30 }))
    draftLines.forEach((l) => {
      l.id = `il7d-${l.salesOrderLineId}`
      l.refUnshippedQty = unpickedQty(po7.lines.find((x) => x.id === l.salesOrderLineId)!)
    })
    seeds.push({
      id: 'dout-1-draft',
      outboundNo: 'DO20260417-0002',
      salesOrderId: po7.id,
      salesOrderNo: po7.orderNo,
      customerId: po7.customerId,
      customerCode: po7.customerCode,
      customerName: po7.customerName,
      warehouseId: po7.warehouseId,
      warehouseCode: po7.warehouseCode,
      warehouseName: po7.warehouseName,
      outboundDate: '2026-04-17',
      status: 'DRAFT',
      confirmBlocked: false,
      remark: '草稿样例',
      lines: draftLines,
      ...recalcOutboundTotals(draftLines),
      createdBy: '老李',
      createdAt: '2026-04-17 10:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-17 10:30:00',
      confirmedBy: null,
      confirmedAt: null,
    })
  }

  if (po8) {
    const lines = mapLinesFromOrder(po8, () => ({ pickedQty: 120, shipQty: 120 }))
    lines[0].id = 'il8'
    seeds.push({
      id: 'dout-2',
      outboundNo: 'DO20260415-0002',
      salesOrderId: po8.id,
      salesOrderNo: po8.orderNo,
      customerId: po8.customerId,
      customerCode: po8.customerCode,
      customerName: po8.customerName,
      warehouseId: po8.warehouseId,
      warehouseCode: po8.warehouseCode,
      warehouseName: po8.warehouseName,
      outboundDate: '2026-04-15',
      status: 'SHIPPED',
      confirmBlocked: false,
      remark: '',
      lines,
      ...recalcOutboundTotals(lines),
      createdBy: '赵仓管',
      createdAt: '2026-04-15 14:00:00',
      updatedBy: '赵仓管',
      updatedAt: '2026-04-15 18:00:00',
      confirmedBy: '赵仓管',
      confirmedAt: '2026-04-15 18:00:00',
    })
  }

  if (po9) {
    const lines = mapLinesFromOrder(po9, () => ({ pickedQty: 50, shipQty: 50 }))
    lines[0].id = 'il9'
    seeds.push({
      id: 'dout-3',
      outboundNo: 'DO20260411-0003',
      salesOrderId: po9.id,
      salesOrderNo: po9.orderNo,
      customerId: po9.customerId,
      customerCode: po9.customerCode,
      customerName: po9.customerName,
      warehouseId: po9.warehouseId,
      warehouseCode: po9.warehouseCode,
      warehouseName: po9.warehouseName,
      outboundDate: '2026-04-11',
      status: 'SHIPPED',
      confirmBlocked: false,
      remark: '',
      lines,
      ...recalcOutboundTotals(lines),
      createdBy: '老李',
      createdAt: '2026-04-11 11:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-11 15:00:00',
      confirmedBy: '老李',
      confirmedAt: '2026-04-11 15:00:00',
    })
  }

  if (po10) {
    const lines = mapLinesFromOrder(po10, () => ({ pickedQty: 25, shipQty: 25 }))
    lines[0].id = 'il10s'
    seeds.push({
      id: 'dout-4',
      outboundNo: 'DO20260409-0004',
      salesOrderId: po10.id,
      salesOrderNo: po10.orderNo,
      customerId: po10.customerId,
      customerCode: po10.customerCode,
      customerName: po10.customerName,
      warehouseId: po10.warehouseId,
      warehouseCode: po10.warehouseCode,
      warehouseName: po10.warehouseName,
      outboundDate: '2026-04-09',
      status: 'SHIPPED',
      confirmBlocked: false,
      remark: '',
      lines,
      ...recalcOutboundTotals(lines),
      createdBy: '老李',
      createdAt: '2026-04-09 09:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-09 16:00:00',
      confirmedBy: '老李',
      confirmedAt: '2026-04-09 16:00:00',
    })
    const draftLines = mapLinesFromOrder(po10, () => ({ pickedQty: 5, shipQty: 5 }))
    draftLines[0].id = 'il10d'
    seeds.push({
      id: 'dout-blocked-draft',
      outboundNo: 'DO20260412-0099',
      salesOrderId: po10.id,
      salesOrderNo: po10.orderNo,
      customerId: po10.customerId,
      customerCode: po10.customerCode,
      customerName: po10.customerName,
      warehouseId: po10.warehouseId,
      warehouseCode: po10.warehouseCode,
      warehouseName: po10.warehouseName,
      outboundDate: '2026-04-12',
      status: 'DRAFT',
      confirmBlocked: true,
      remark: 'PO 已关闭，确认阻断样例',
      lines: draftLines,
      ...recalcOutboundTotals(draftLines),
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
      id: 'dout-draft-5',
      outboundNo: 'DO20260420-0005',
      salesOrderId: po5.id,
      salesOrderNo: po5.orderNo,
      customerId: po5.customerId,
      customerCode: po5.customerCode,
      customerName: po5.customerName,
      warehouseId: po5.warehouseId,
      warehouseCode: po5.warehouseCode,
      warehouseName: po5.warehouseName,
      outboundDate: '2026-04-20',
      status: 'DRAFT',
      confirmBlocked: false,
      remark: '',
      lines,
      ...recalcOutboundTotals(lines),
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

function seedAndPersist(): SalesOutbound[] {
  const seed = buildSeed().map(normalizeOutbound)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  syncAllSalesOrdersFromInbounds(seed)
  return seed
}

function load(): SalesOutbound[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedAndPersist()
    const parsed = JSON.parse(raw) as SalesOutbound[]
    if (!Array.isArray(parsed) || parsed.length === 0) return seedAndPersist()
    const normalized = parsed.map(normalizeOutbound)
    const migrated = JSON.stringify(normalized)
    if (migrated !== raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      syncAllSalesOrdersFromInbounds(normalized)
    }
    return normalized
  } catch {
    return seedAndPersist()
  }
}

let cache: SalesOutbound[] | null = null

export function listSalesOutbounds(): SalesOutbound[] {
  if (!cache) cache = load()
  return cache
}

export function persistSalesOutbounds(docs: SalesOutbound[]): void {
  cache = docs
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  syncAllSalesOrdersFromInbounds(docs)
}

function toOutboundLink(doc: SalesOutbound): SalesOutboundLink {
  return {
    id: doc.id,
    outboundNo: doc.outboundNo,
    outboundDate: doc.outboundDate,
    totalQty: doc.totalShipQty,
    operator: doc.confirmedBy ?? doc.createdBy,
    status: doc.status === 'SHIPPED' ? 'SHIPPED' : 'DRAFT',
  }
}

export function syncSalesOrderFromInbounds(salesOrderId: string, allInbounds: SalesOutbound[]): void {
  const order = getSalesOrderById(salesOrderId)
  if (!order) return

  const related = allInbounds.filter((d) => d.salesOrderId === salesOrderId && d.status !== 'VOIDED')
  const stocked = related.filter((d) => d.status === 'SHIPPED')

  const lines = order.lines.map((line) => {
    let received = 0
    for (const doc of stocked) {
      for (const il of doc.lines) {
        if (il.salesOrderLineId === line.id) received += il.shipQty
      }
    }
    return { ...line, pickedQty: Math.min(line.quantity, received) }
  })

  const outboundLinks = related.map(toOutboundLink).sort((a, b) => b.outboundDate.localeCompare(a.outboundDate))

  let status = order.status
  if (order.status !== 'COMPLETED' && ['PENDING_SHIPMENT', 'PARTIAL_SHIPMENT'].includes(order.status)) {
    const allReceived = lines.every((l) => l.pickedQty >= l.quantity)
    const anyReceived = lines.some((l) => l.pickedQty > 0)
    if (allReceived) status = 'COMPLETED'
    else if (anyReceived) status = 'PARTIAL_SHIPMENT'
    else status = 'PENDING_SHIPMENT'
  }

  upsertSalesOrder(
    recalcOrder({
      ...order,
      lines,
      outboundLinks,
      status,
    }),
  )
}

function syncAllSalesOrdersFromInbounds(all: SalesOutbound[]): void {
  const ids = new Set(all.map((d) => d.salesOrderId))
  for (const id of ids) syncSalesOrderFromInbounds(id, all)
}

export function getSalesOutboundById(id: string): SalesOutbound | undefined {
  return listSalesOutbounds().find((d) => d.id === id)
}

export function getSalesOutboundByNo(no: string): SalesOutbound | undefined {
  return listSalesOutbounds().find((d) => d.outboundNo === no)
}

export function nextOutboundId(): string {
  const nums = listSalesOutbounds()
    .map((d) => Number(d.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `dout-${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextOutboundNo(outboundDate: string): string {
  const ymd = outboundDate.replace(/-/g, '')
  const prefix = `GR${ymd}-`
  const nums = listSalesOutbounds()
    .map((d) => {
      if (!d.outboundNo.startsWith(prefix)) return 0
      return parseInt(d.outboundNo.slice(prefix.length), 10) || 0
    })
    .filter((n) => n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function normalizeOutbound(doc: SalesOutbound): SalesOutbound {
  const lines = doc.lines.map((l) => ({
    ...l,
    returnedQty: l.returnedQty ?? 0,
    lineAmount: lineAmount(l.shipQty, l.unitPrice),
  }))
  return { ...doc, lines, ...recalcOutboundTotals(lines) }
}

export function upsertSalesOutbound(doc: SalesOutbound): void {
  const normalized = normalizeOutbound(doc)
  const all = listSalesOutbounds()
  const idx = all.findIndex((d) => d.id === normalized.id)
  if (idx >= 0) all[idx] = normalized
  else all.unshift(normalized)
  persistSalesOutbounds(all)
}

export function deleteSalesOutbound(id: string): boolean {
  const doc = getSalesOutboundById(id)
  if (!doc || doc.status !== 'DRAFT') return false
  persistSalesOutbounds(listSalesOutbounds().filter((d) => d.id !== id))
  return true
}

export function createDraftFromSalesOrder(salesOrderId: string): SalesOutbound | null {
  const order = getSalesOrderById(salesOrderId)
  if (!order || !['PENDING_SHIPMENT', 'PARTIAL_SHIPMENT'].includes(order.status)) return null
  const lines = mapLinesFromOrder(order)
  const outboundDate = new Date().toISOString().slice(0, 10)
  const doc: SalesOutbound = {
    id: nextOutboundId(),
    outboundNo: nextOutboundNo(outboundDate),
    salesOrderId: order.id,
    salesOrderNo: order.orderNo,
    customerId: order.customerId,
    customerCode: order.customerCode,
    customerName: order.customerName,
    warehouseId: order.warehouseId,
    warehouseCode: order.warehouseCode,
    warehouseName: order.warehouseName,
    outboundDate,
    status: 'DRAFT',
    confirmBlocked: order.status === 'COMPLETED',
    remark: '',
    lines,
    ...recalcOutboundTotals(lines),
    createdBy: '老李',
    createdAt: nowString(),
    updatedBy: '老李',
    updatedAt: nowString(),
    confirmedBy: null,
    confirmedAt: null,
  }
  upsertSalesOutbound(doc)
  return doc
}

export function confirmSalesOutbound(id: string): boolean {
  const doc = getSalesOutboundById(id)
  if (!doc || doc.status !== 'DRAFT' || doc.confirmBlocked) return false
  const ts = nowString()
  upsertSalesOutbound({
    ...doc,
    status: 'SHIPPED',
    confirmedBy: '老李',
    confirmedAt: ts,
    updatedBy: '老李',
    updatedAt: ts,
  })
  return true
}

export function blockDraftOutboundsForSalesOrder(salesOrderId: string): void {
  const all = listSalesOutbounds().map((d) =>
    d.salesOrderId === salesOrderId && d.status === 'DRAFT'
      ? { ...d, confirmBlocked: true, updatedAt: nowString() }
      : d,
  )
  persistSalesOutbounds(all)
}

export function listEligibleSalesOrders() {
  return listSalesOrders().filter((o) =>
    ['PENDING_SHIPMENT', 'PARTIAL_SHIPMENT'].includes(o.status),
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

export function filterSalesOutbounds(
  filters: SalesOutboundListFilters,
  tab: OutboundStatusTabKey,
): SalesOutbound[] {
  const outboundNos = parseNos(filters.outboundNos)
  const poNos = parseNos(filters.salesOrderNos)
  return listSalesOutbounds().filter((row) => {
    if (tab !== 'ALL' && row.status !== tab) return false
    if (tab === 'ALL' && filters.status && row.status !== filters.status) return false
    if (filters.customerId && row.customerId !== filters.customerId) return false
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (outboundNos.length && !outboundNos.includes(row.outboundNo)) return false
    if (poNos.length && !poNos.includes(row.salesOrderNo)) return false
    if (!inDateRange(row.outboundDate, filters.outboundDateFrom, filters.outboundDateTo)) return false
    if (!inDateRange(row.updatedAt.slice(0, 10), filters.updatedFrom, filters.updatedTo)) return false
    return true
  })
}

export function countOutboundByTab(filters: SalesOutboundListFilters): Record<OutboundStatusTabKey, number> {
  const base = filterSalesOutbounds({ ...filters, status: '' }, 'ALL')
  const counts: Record<OutboundStatusTabKey, number> = {
    ALL: base.length,
    DRAFT: 0,
    SHIPPED: 0,
  }
  for (const row of base) {
    if (row.status === 'DRAFT') counts.DRAFT += 1
    if (row.status === 'SHIPPED') counts.SHIPPED += 1
  }
  return counts
}
