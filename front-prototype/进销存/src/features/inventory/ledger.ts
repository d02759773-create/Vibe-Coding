import { listPurchaseInbounds } from '@/features/purchaseInbound/storage'
import { listPurchaseReturnOutbounds } from '@/features/purchaseReturnOutbound/storage'
import { listSalesOutbounds } from '@/features/salesOutbound/storage'
import { listSalesReturnInbounds } from '@/features/salesReturnInbound/storage'
import { listOtherInbounds } from '@/features/otherInbound/storage'
import { listOtherOutbounds } from '@/features/otherOutbound/storage'
import type { InventoryLedgerEntry } from './types'

function push(
  list: InventoryLedgerEntry[],
  base: Omit<InventoryLedgerEntry, 'id' | 'qtyDelta'> & { qty: number; sign: 1 | -1 },
): void {
  if (base.qty <= 0) return
  list.push({
    id: `${base.docId}-${base.productId}-${list.length}`,
    occurredAt: base.occurredAt,
    bizType: base.bizType,
    docId: base.docId,
    docNo: base.docNo,
    warehouseId: base.warehouseId,
    warehouseCode: base.warehouseCode,
    warehouseName: base.warehouseName,
    productId: base.productId,
    productCode: base.productCode,
    productName: base.productName,
    unit: base.unit,
    qtyDelta: base.sign * base.qty,
    operator: base.operator,
  })
}

export function buildInventoryLedger(): InventoryLedgerEntry[] {
  const entries: InventoryLedgerEntry[] = []

  for (const doc of listPurchaseInbounds()) {
    if (doc.status !== 'STOCKED_IN') continue
    const at = doc.confirmedAt ?? doc.updatedAt
    const op = doc.confirmedBy ?? doc.updatedBy
    for (const line of doc.lines) {
      push(entries, {
        occurredAt: at,
        bizType: 'PURCHASE_IN',
        docId: doc.id,
        docNo: doc.inboundNo,
        warehouseId: doc.warehouseId,
        warehouseCode: doc.warehouseCode,
        warehouseName: doc.warehouseName,
        productId: line.productId,
        productCode: line.productCode,
        productName: line.productName,
        unit: line.unit,
        qty: line.stockInQty,
        sign: 1,
        operator: op,
      })
    }
  }

  for (const doc of listPurchaseReturnOutbounds()) {
    if (doc.status !== 'STOCKED_OUT') continue
    const at = doc.confirmedAt ?? doc.updatedAt
    const op = doc.confirmedBy ?? doc.createdBy
    for (const line of doc.lines) {
      push(entries, {
        occurredAt: at,
        bizType: 'PURCHASE_RETURN_OUT',
        docId: doc.id,
        docNo: doc.outboundNo,
        warehouseId: doc.warehouseId,
        warehouseCode: doc.warehouseCode,
        warehouseName: doc.warehouseName,
        productId: line.productId,
        productCode: line.productCode,
        productName: line.productName,
        unit: line.unit,
        qty: line.outboundQty,
        sign: -1,
        operator: op,
      })
    }
  }

  for (const doc of listSalesOutbounds()) {
    if (doc.status !== 'SHIPPED') continue
    const at = doc.confirmedAt ?? doc.updatedAt
    const op = doc.confirmedBy ?? doc.updatedBy
    for (const line of doc.lines) {
      push(entries, {
        occurredAt: at,
        bizType: 'SALES_OUT',
        docId: doc.id,
        docNo: doc.outboundNo,
        warehouseId: doc.warehouseId,
        warehouseCode: doc.warehouseCode,
        warehouseName: doc.warehouseName,
        productId: line.productId,
        productCode: line.productCode,
        productName: line.productName,
        unit: line.unit,
        qty: line.shipQty,
        sign: -1,
        operator: op,
      })
    }
  }

  for (const doc of listSalesReturnInbounds()) {
    if (doc.status !== 'STOCKED_IN') continue
    const at = doc.confirmedAt ?? doc.updatedAt
    const op = doc.confirmedBy ?? doc.createdBy
    for (const line of doc.lines) {
      push(entries, {
        occurredAt: at,
        bizType: 'SALES_RETURN_IN',
        docId: doc.id,
        docNo: doc.inboundNo,
        warehouseId: doc.warehouseId,
        warehouseCode: doc.warehouseCode,
        warehouseName: doc.warehouseName,
        productId: line.productId,
        productCode: line.productCode,
        productName: line.productName,
        unit: line.unit,
        qty: line.inboundQty,
        sign: 1,
        operator: op,
      })
    }
  }

  for (const doc of listOtherInbounds()) {
    if (doc.status !== 'STOCKED_IN') continue
    const at = doc.confirmedAt ?? doc.updatedAt
    const op = doc.confirmedBy ?? doc.updatedBy
    for (const line of doc.lines) {
      push(entries, {
        occurredAt: at,
        bizType: 'OTHER_IN',
        docId: doc.id,
        docNo: doc.inboundNo,
        warehouseId: doc.warehouseId,
        warehouseCode: doc.warehouseCode,
        warehouseName: doc.warehouseName,
        productId: line.productId,
        productCode: line.productCode,
        productName: line.productName,
        unit: line.unit,
        qty: line.qty,
        sign: 1,
        operator: op,
      })
    }
  }

  for (const doc of listOtherOutbounds()) {
    if (doc.status !== 'SHIPPED') continue
    const at = doc.confirmedAt ?? doc.updatedAt
    const op = doc.confirmedBy ?? doc.updatedBy
    for (const line of doc.lines) {
      push(entries, {
        occurredAt: at,
        bizType: 'OTHER_OUT',
        docId: doc.id,
        docNo: doc.outboundNo,
        warehouseId: doc.warehouseId,
        warehouseCode: doc.warehouseCode,
        warehouseName: doc.warehouseName,
        productId: line.productId,
        productCode: line.productCode,
        productName: line.productName,
        unit: line.unit,
        qty: line.qty,
        sign: -1,
        operator: op,
      })
    }
  }

  return entries.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export function filterLedger(
  filters: import('./types').LedgerListFilters,
): InventoryLedgerEntry[] {
  const docNos = filters.docNos
    .split(/[\n,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
  const kw = filters.productKeyword.trim().toLowerCase()
  const types = filters.bizTypes
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return buildInventoryLedger().filter((row) => {
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (types.length && !types.includes(row.bizType)) return false
    if (docNos.length && !docNos.includes(row.docNo)) return false
    if (kw) {
      const hay = `${row.productCode} ${row.productName}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    const day = row.occurredAt.slice(0, 10)
    if (filters.occurredFrom && day < filters.occurredFrom) return false
    if (filters.occurredTo && day > filters.occurredTo) return false
    return true
  })
}
