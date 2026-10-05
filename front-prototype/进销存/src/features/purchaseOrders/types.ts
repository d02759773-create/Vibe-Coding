export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_AUDIT'
  | 'PENDING_STOCK_IN'
  | 'PARTIAL_STOCK_IN'
  | 'COMPLETED'
  | 'VOIDED'

export type TaxRate = '' | '0%' | '3%' | '6%' | '9%' | '13%'

export type PurchaseOrderLine = {
  id: string
  productId: string
  productCode: string
  productName: string
  barcode: string | null
  specModel: string
  unit: string
  quantity: number
  unitPrice: number
  taxRate: TaxRate
  lineAmount: number
  receivedQty: number
  lineRemark: string
}

export type PurchaseInboundLink = {
  id: string
  inboundNo: string
  inboundDate: string
  totalQty: number
  operator: string
  status: 'STOCKED_IN' | 'DRAFT'
}

export type PurchaseOrder = {
  id: string
  orderNo: string
  supplierId: string
  supplierCode: string
  supplierName: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  orderDate: string
  expectedArrivalDate: string | null
  status: PurchaseOrderStatus
  remark: string
  lines: PurchaseOrderLine[]
  skuCount: number
  totalQuantity: number
  totalAmount: number
  inboundLinks: PurchaseInboundLink[]
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  auditedBy: string | null
  auditedAt: string | null
}

export type PurchaseOrderListFilters = {
  orderNos: string
  supplierId: string
  warehouseId: string
  status: '' | PurchaseOrderStatus
  orderDateFrom: string
  orderDateTo: string
  expectedDateFrom: string
  expectedDateTo: string
  updatedFrom: string
  updatedTo: string
}

export type StatusTabKey = 'ALL' | PurchaseOrderStatus
