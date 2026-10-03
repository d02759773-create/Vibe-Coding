export type DictionaryStatus = 'ENABLED' | 'DISABLED'
export type StructureType = 'FLAT' | 'TREE'

export type DictionaryType = {
  id: string
  typeCode: string
  typeName: string
  structureType: StructureType
  description: string | null
  isPreset: boolean
  status: DictionaryStatus
  disableReason: string | null
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  disabledBy: string | null
  disabledAt: string | null
  enabledBy: string
  enabledAt: string
}

export type DictionaryItem = {
  id: string
  typeCode: string
  itemCode: string
  itemName: string
  parentItemCode: string | null
  level: 1 | 2
  isLeaf: boolean
  sortOrder: number
  remark: string | null
  status: DictionaryStatus
  disableReason: string | null
  referenced: boolean
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  disabledBy: string | null
  disabledAt: string | null
  enabledBy: string
  enabledAt: string
}

export type DictionaryTypeFilters = {
  typeName: string
  typeCode: string
  structureType: '' | StructureType
  status: '' | DictionaryStatus
}

export type DictionaryItemFilters = {
  itemCode: string
  itemName: string
  status: '' | DictionaryStatus
}

export type DictionaryStore = {
  types: DictionaryType[]
  items: DictionaryItem[]
}
