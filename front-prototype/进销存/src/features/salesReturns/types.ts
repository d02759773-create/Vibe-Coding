import type { TaxRate } from '@/features/salesOrders/types'

export type SalesReturnStatus =
  | 'DRAFT'
  | 'PENDING_AUDIT'
  | 'PENDING_INBOUND'
  | 'PARTIAL_INBOUND'
  | 'COMPLETED'
  | 'VOIDED'

export type SalesReturnInboundLink = {
  id: string
  inboundNo: string
  inboundDate: string
  totalQty: number
  status: 'DRAFT' | 'STOCKED_IN'
  operator: string
}

export type SalesReturnLine = {
  id: string
  outboundLineId: string
  productId: string
  productCode: string
  productName: string
  barcode: string | null
  specModel: string
  unit: string
  refReturnableQty: number
  returnQty: number
  inboundQty: number
  unitPrice: number
  taxRate: TaxRate
  lineAmount: number
  lineRemark: string
}

export type SalesReturn = {
  id: string
  returnNo: string
  outboundId: string
  outboundNo: string
  salesOrderId: string
  salesOrderNo: string
  customerId: string
  customerCode: string
  customerName: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  returnDate: string
  status: SalesReturnStatus
  returnReason: string
  lines: SalesReturnLine[]
  totalReturnQty: number
  totalInboundQty: number
  totalAmount: number
  inboundLinks: SalesReturnInboundLink[]
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  auditedBy: string | null
  auditedAt: string | null
}

export type SalesReturnListFilters = {
  returnNos: string
  outboundNos: string
  salesOrderNos: string
  customerId: string
  warehouseId: string
  status: '' | SalesReturnStatus
  returnDateFrom: string
  returnDateTo: string
  updatedFrom: string
  updatedTo: string
}

export type ReturnStatusTabKey =
  | 'ALL'
  | 'DRAFT'
  | 'PENDING_AUDIT'
  | 'PENDING_INBOUND'
  | 'PARTIAL_INBOUND'
  | 'COMPLETED'
