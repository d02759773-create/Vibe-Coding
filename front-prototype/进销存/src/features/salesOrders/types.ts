export type SalesOrderStatus =
  | 'DRAFT'
  | 'PENDING_AUDIT'
  | 'PENDING_SHIPMENT'
  | 'PARTIAL_SHIPMENT'
  | 'COMPLETED'
  | 'VOIDED'

export type TaxRate = '' | '0%' | '3%' | '6%' | '9%' | '13%'

export type SalesOrderLine = {
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
  shippedQty: number
  lineRemark: string
}

export type SalesOutboundLink = {
  id: string
  outboundNo: string
  outboundDate: string
  totalQty: number
  operator: string
  status: 'SHIPPED' | 'DRAFT'
}

export type SalesOrder = {
  id: string
  orderNo: string
  customerId: string
  customerCode: string
  customerName: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  orderDate: string
  expectedArrivalDate: string | null
  status: SalesOrderStatus
  remark: string
  lines: SalesOrderLine[]
  skuCount: number
  totalQuantity: number
  totalAmount: number
  outboundLinks: SalesOutboundLink[]
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  auditedBy: string | null
  auditedAt: string | null
}

export type SalesOrderListFilters = {
  orderNos: string
  customerId: string
  warehouseId: string
  status: '' | SalesOrderStatus
  orderDateFrom: string
  orderDateTo: string
  expectedDateFrom: string
  expectedDateTo: string
  updatedFrom: string
  updatedTo: string
}

export type StatusTabKey = 'ALL' | SalesOrderStatus
