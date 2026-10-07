export type OtherOutboundReason = '盘亏' | '报废' | '领用' | '其他'

export type OtherOutboundStatus = 'DRAFT' | 'SHIPPED'

export type OtherOutboundLine = {
  id: string
  productId: string
  productCode: string
  productName: string
  barcode: string | null
  specModel: string
  unit: string
  qty: number
  lineRemark: string
}

export type OtherOutbound = {
  id: string
  outboundNo: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  outboundDate: string
  reason: OtherOutboundReason | ''
  status: OtherOutboundStatus
  remark: string
  lines: OtherOutboundLine[]
  totalQty: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  confirmedBy: string | null
  confirmedAt: string | null
}

export type OtherOutboundListFilters = {
  outboundNos: string
  warehouseId: string
  status: '' | OtherOutboundStatus
  outboundDateFrom: string
  outboundDateTo: string
}

export type OtherOutboundStatusTabKey = 'ALL' | 'DRAFT' | 'SHIPPED'
