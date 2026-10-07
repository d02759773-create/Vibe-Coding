import type { OnHandListFilters, OnHandRow } from './types'
import { buildInventoryLedger } from './ledger'
import { listProducts } from '@/features/products/storage'

export function buildOnHandRows(): OnHandRow[] {
  const map = new Map<string, OnHandRow>()
  for (const e of buildInventoryLedger()) {
    const key = `${e.warehouseId}::${e.productId}`
    const existing = map.get(key)
    if (existing) {
      existing.qtyOnHand += e.qtyDelta
    } else {
      const product = listProducts().find((p) => p.id === e.productId)
      map.set(key, {
        warehouseId: e.warehouseId,
        warehouseCode: e.warehouseCode,
        warehouseName: e.warehouseName,
        productId: e.productId,
        productCode: e.productCode,
        productName: e.productName,
        specModel: product?.specModel ?? '',
        unit: e.unit,
        qtyOnHand: e.qtyDelta,
      })
    }
  }
  return Array.from(map.values())
    .filter((r) => r.qtyOnHand !== 0)
    .sort((a, b) => a.productCode.localeCompare(b.productCode))
}

export function getOnHandQty(warehouseId: string, productId: string): number {
  const row = buildOnHandRows().find((r) => r.warehouseId === warehouseId && r.productId === productId)
  return row?.qtyOnHand ?? 0
}

export function filterOnHand(filters: OnHandListFilters): OnHandRow[] {
  const kw = filters.productKeyword.trim().toLowerCase()
  return buildOnHandRows().filter((row) => {
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (kw) {
      const hay = `${row.productCode} ${row.productName}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
}
