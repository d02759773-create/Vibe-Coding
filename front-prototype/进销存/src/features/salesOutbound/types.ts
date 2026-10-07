import type { TaxRate } from '@/features/salesOrders/types'

export type SalesOutboundStatus = 'DRAFT' | 'SHIPPED' | 'VOIDED'

export type InboundDiffReason = '' | '运输破损' | '质量问题' | '短少待补' | '其他'

export type SalesOutboundLine = {
  id: string
  salesOrderLineId: string
  productId: string
  productCode: string
  productName: string
  barcode: string | null
  specModel: string
  unit: string
  refUnshippedQty: number
  pickedQty: number
  shipQty: number
  returnedQty: number
  unitPrice: number
  taxRate: TaxRate
  lineAmount: number
  diffReason: InboundDiffReason
  lineRemark: string
}

export type SalesOutbound = {
  id: string
  outboundNo: string
  salesOrderId: string
  salesOrderNo: string
  customerId: string
  customerCode: string
  customerName: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  outboundDate: string
  status: SalesOutboundStatus
  confirmBlocked: boolean
  remark: string
  lines: SalesOutboundLine[]
  totalReceivedQty: number
  totalShipQty: number
  totalRejectQty: number
  totalAmount: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  confirmedBy: string | null
  confirmedAt: string | null
}

export type SalesOutboundListFilters = {
  outboundNos: string
  salesOrderNos: string
  customerId: string
  warehouseId: string
  status: '' | SalesOutboundStatus
  outboundDateFrom: string
  outboundDateTo: string
  updatedFrom: string
  updatedTo: string
}

export type OutboundStatusTabKey = 'ALL' | 'DRAFT' | 'SHIPPED'
