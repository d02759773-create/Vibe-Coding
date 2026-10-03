export type WarehouseStatus = 'ENABLED' | 'DISABLED'

export type WarehouseType = 'MAIN' | 'BRANCH' | 'STORE'

export type Warehouse = {
  id: string
  warehouseCode: string
  warehouseName: string
  warehouseType: WarehouseType
  address: string
  managerName: string
  contactPhone: string | null
  remark: string | null
  status: WarehouseStatus
  disableReason: string | null
  isReferenced: boolean
  /** Demo：模拟实时库存数量合计，用于停用校验 */
  mockInventoryQty: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  disabledBy: string | null
  disabledAt: string | null
  enabledBy: string | null
  enabledAt: string | null
}

export type WarehouseListFilters = {
  keyword: string
  warehouseType: '' | WarehouseType
  status: '' | WarehouseStatus
}
