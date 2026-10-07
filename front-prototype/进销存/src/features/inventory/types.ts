export type InventoryBizType =
  | 'PURCHASE_IN'
  | 'PURCHASE_RETURN_OUT'
  | 'SALES_OUT'
  | 'SALES_RETURN_IN'
  | 'OTHER_IN'
  | 'OTHER_OUT'

export type InventoryLedgerEntry = {
  id: string
  occurredAt: string
  bizType: InventoryBizType
  docId: string
  docNo: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  productId: string
  productCode: string
  productName: string
  unit: string
  qtyDelta: number
  operator: string
}

export type OnHandRow = {
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  productId: string
  productCode: string
  productName: string
  specModel: string
  unit: string
  qtyOnHand: number
}

export type LedgerListFilters = {
  bizTypes: string
  docNos: string
  warehouseId: string
  productKeyword: string
  occurredFrom: string
  occurredTo: string
}

export type OnHandListFilters = {
  warehouseId: string
  productKeyword: string
}
