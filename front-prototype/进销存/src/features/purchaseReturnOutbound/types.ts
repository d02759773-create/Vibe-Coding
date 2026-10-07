import type { TaxRate } from '@/features/purchaseOrders/types'

export type PurchaseReturnOutboundStatus = 'DRAFT' | 'STOCKED_OUT'

export type PurchaseReturnOutboundLine = {
  id: string
  returnLineId: string
  productId: string
  productCode: string
  productName: string
  barcode: string | null
  specModel: string
  unit: string
  refUnoutboundQty: number
  outboundQty: number
  unitPrice: number
  taxRate: TaxRate
  lineAmount: number
}

export type PurchaseReturnOutbound = {
  id: string
  outboundNo: string
  returnId: string
  returnNo: string
  inboundId: string
  inboundNo: string
  supplierId: string
  supplierCode: string
  supplierName: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  outboundDate: string
  status: PurchaseReturnOutboundStatus
  logisticsInfo: string
  remark: string
  lines: PurchaseReturnOutboundLine[]
  totalOutboundQty: number
  totalAmount: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  confirmedBy: string | null
  confirmedAt: string | null
}

export type PurchaseReturnOutboundListFilters = {
  outboundNos: string
  returnNos: string
  inboundNos: string
  supplierId: string
  warehouseId: string
  status: '' | PurchaseReturnOutboundStatus
  outboundDateFrom: string
  outboundDateTo: string
  updatedFrom: string
  updatedTo: string
}

export type ReturnOutboundStatusTabKey = 'ALL' | 'DRAFT' | 'STOCKED_OUT'
