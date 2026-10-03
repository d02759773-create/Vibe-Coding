export type LogisticsType = 'EXPRESS' | 'FREIGHT' | 'SELF_PICKUP'

export type LogisticsStatus = 'ENABLED' | 'DISABLED'

export type Logistics = {
  id: string
  logisticsCode: string
  logisticsName: string
  logisticsType: LogisticsType
  serviceProvider: string | null
  remark: string | null
  status: LogisticsStatus
  disableReason: string | null
  isReferenced: boolean
  /** Demo：引用该物流方式的未完结销售出库单数，与出库模块查询同源占位 */
  mockOpenOutboundCount: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  disabledBy: string | null
  disabledAt: string | null
  enabledBy: string | null
  enabledAt: string | null
}

export type LogisticsListFilters = {
  logisticsCode: string
  logisticsName: string
  logisticsType: LogisticsType | ''
  serviceProvider: string
  status: LogisticsStatus | ''
}
