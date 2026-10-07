export type OtherInboundReason = '盘盈' | '赠品' | '其他'

export type OtherInboundStatus = 'DRAFT' | 'STOCKED_IN'

export type OtherInboundLine = {
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

export type OtherInbound = {
  id: string
  inboundNo: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  inboundDate: string
  reason: OtherInboundReason | ''
  status: OtherInboundStatus
  remark: string
  lines: OtherInboundLine[]
  totalQty: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  confirmedBy: string | null
  confirmedAt: string | null
}

export type OtherInboundListFilters = {
  inboundNos: string
  warehouseId: string
  status: '' | OtherInboundStatus
  inboundDateFrom: string
  inboundDateTo: string
}

export type OtherInboundStatusTabKey = 'ALL' | 'DRAFT' | 'STOCKED_IN'
