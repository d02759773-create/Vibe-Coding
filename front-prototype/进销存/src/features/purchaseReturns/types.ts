import type { TaxRate } from '@/features/purchaseOrders/types'

export type PurchaseReturnStatus =
  | 'DRAFT'
  | 'PENDING_AUDIT'
  | 'PENDING_OUTBOUND'
  | 'PARTIAL_OUTBOUND'
  | 'COMPLETED'
  | 'VOIDED'

export type PurchaseReturnOutboundLink = {
  id: string
  outboundNo: string
  outboundDate: string
  totalQty: number
  status: 'DRAFT' | 'STOCKED_OUT'
  operator: string
}

export type PurchaseReturnLine = {
  id: string
  inboundLineId: string
  productId: string
  productCode: string
  productName: string
  barcode: string | null
  specModel: string
  unit: string
  refReturnableQty: number
  returnQty: number
  outboundQty: number
  unitPrice: number
  taxRate: TaxRate
  lineAmount: number
  lineRemark: string
}

export type PurchaseReturn = {
  id: string
  returnNo: string
  inboundId: string
  inboundNo: string
  purchaseOrderId: string
  purchaseOrderNo: string
  supplierId: string
  supplierCode: string
  supplierName: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  returnDate: string
  status: PurchaseReturnStatus
  returnReason: string
  lines: PurchaseReturnLine[]
  totalReturnQty: number
  totalOutboundQty: number
  totalAmount: number
  outboundLinks: PurchaseReturnOutboundLink[]
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  auditedBy: string | null
  auditedAt: string | null
}

export type PurchaseReturnListFilters = {
  returnNos: string
  inboundNos: string
  purchaseOrderNos: string
  supplierId: string
  warehouseId: string
  status: '' | PurchaseReturnStatus
  returnDateFrom: string
  returnDateTo: string
  updatedFrom: string
  updatedTo: string
}

export type ReturnStatusTabKey =
  | 'ALL'
  | 'DRAFT'
  | 'PENDING_AUDIT'
  | 'PENDING_OUTBOUND'
  | 'PARTIAL_OUTBOUND'
  | 'COMPLETED'
