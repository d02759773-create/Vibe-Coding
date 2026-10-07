import type { TaxRate } from '@/features/purchaseOrders/types'

export type PurchaseInboundStatus = 'DRAFT' | 'STOCKED_IN' | 'VOIDED'

export type InboundDiffReason = '' | '运输破损' | '质量问题' | '短少待补' | '其他'

export type PurchaseInboundLine = {
  id: string
  purchaseOrderLineId: string
  productId: string
  productCode: string
  productName: string
  barcode: string | null
  specModel: string
  unit: string
  refUnreceivedQty: number
  receivedQty: number
  stockInQty: number
  returnedQty: number
  unitPrice: number
  taxRate: TaxRate
  lineAmount: number
  diffReason: InboundDiffReason
  lineRemark: string
}

export type PurchaseInbound = {
  id: string
  inboundNo: string
  purchaseOrderId: string
  purchaseOrderNo: string
  supplierId: string
  supplierCode: string
  supplierName: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  inboundDate: string
  status: PurchaseInboundStatus
  confirmBlocked: boolean
  remark: string
  lines: PurchaseInboundLine[]
  totalReceivedQty: number
  totalStockInQty: number
  totalRejectQty: number
  totalAmount: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  confirmedBy: string | null
  confirmedAt: string | null
}

export type PurchaseInboundListFilters = {
  inboundNos: string
  purchaseOrderNos: string
  supplierId: string
  warehouseId: string
  status: '' | PurchaseInboundStatus
  inboundDateFrom: string
  inboundDateTo: string
  updatedFrom: string
  updatedTo: string
}

export type InboundStatusTabKey = 'ALL' | 'DRAFT' | 'STOCKED_IN'
