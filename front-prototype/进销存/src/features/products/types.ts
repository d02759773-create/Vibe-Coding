export type ProductStatus = 'ENABLED' | 'DISABLED'

export type SalesUnit = 'PCS' | 'BOX' | 'SET' | 'PACK'

export type Product = {
  id: string
  productCode: string
  productName: string
  category: string
  specModel: string
  salesUnit: SalesUnit
  barcode: string | null
  defaultRetailPrice: number | null
  defaultWholesalePrice: number
  referencePurchasePrice: number | null
  remark: string | null
  status: ProductStatus
  disableReason: string | null
  isReferenced: boolean
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export type ProductListFilters = {
  keyword: string
  category: string
  status: '' | ProductStatus
}
