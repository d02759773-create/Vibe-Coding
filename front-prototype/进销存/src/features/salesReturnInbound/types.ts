import type { TaxRate } from '@/features/salesOrders/types'

export type SalesReturnInboundStatus = 'DRAFT' | 'STOCKED_IN'

export type SalesReturnInboundLine = {
  id: string
  returnLineId: string
  productId: string
  productCode: string
  productName: string
  barcode: string | null
  specModel: string
  unit: string
  refUninboundQty: number
  inboundQty: number
  unitPrice: number
  taxRate: TaxRate
  lineAmount: number
}

export type SalesReturnInbound = {
  id: string
  inboundNo: string
  returnId: string
  returnNo: string
  outboundId: string
  outboundNo: string
  customerId: string
  customerCode: string
  customerName: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  inboundDate: string
  status: SalesReturnInboundStatus
  logisticsInfo: string
  remark: string
  lines: SalesReturnInboundLine[]
  totalInboundQty: number
  totalAmount: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  confirmedBy: string | null
  confirmedAt: string | null
}

export type SalesReturnInboundListFilters = {
  inboundNos: string
  returnNos: string
  outboundNos: string
  customerId: string
  warehouseId: string
  status: '' | SalesReturnInboundStatus
  inboundDateFrom: string
  inboundDateTo: string
  updatedFrom: string
  updatedTo: string
}

export type ReturnInboundStatusTabKey = 'ALL' | 'DRAFT' | 'STOCKED_IN'
