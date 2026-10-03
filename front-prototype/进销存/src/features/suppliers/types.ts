export type SupplierStatus = 'ENABLED' | 'DISABLED'

export type SettlementMethod = 'CASH' | 'ACCOUNT'

export type Supplier = {
  id: string
  supplierCode: string
  supplierName: string
  contactName: string
  contactPhone: string
  contactAddress: string | null
  settlementMethod: SettlementMethod
  paymentTermDays: number
  taxRate: string | null
  remark: string | null
  status: SupplierStatus
  disableReason: string | null
  isReferenced: boolean
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export type SupplierListFilters = {
  keyword: string
  settlementMethod: '' | SettlementMethod
  status: '' | SupplierStatus
}
