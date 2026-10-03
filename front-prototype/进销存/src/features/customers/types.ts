export type CustomerStatus = 'ENABLED' | 'DISABLED'

export type CustomerType = 'ENTERPRISE' | 'INDIVIDUAL'

export type CustomerGrade = 'A' | 'B' | 'C' | 'D' | 'E'

export type SettlementMethod = 'CASH' | 'ACCOUNT'

export type Customer = {
  id: string
  customerCode: string
  customerName: string
  customerType: CustomerType
  customerGrade: CustomerGrade
  contactName: string
  contactPhone: string
  province: string
  city: string
  district: string
  detailAddress: string | null
  salesperson: string | null
  openingArrears: number
  openingBalance: number
  settlementMethod: SettlementMethod
  paymentTermDays: number
  creditLimit: number
  remark: string | null
  status: CustomerStatus
  disableReason: string | null
  isReferenced: boolean
  /** Demo：模拟往来净额（销售/收款等），参与实时应收计算 */
  mockReceivableAdjust: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export type CustomerListFilters = {
  customerCode: string
  customerName: string
  customerType: '' | CustomerType
  customerGrade: '' | CustomerGrade
  salesperson: string
  settlementMethod: '' | SettlementMethod
}

export type CustomerSortField = 'openingArrears' | 'openingBalance'
