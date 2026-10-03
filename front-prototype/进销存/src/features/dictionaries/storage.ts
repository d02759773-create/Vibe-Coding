import type {
  DictionaryItem,
  DictionaryItemFilters,
  DictionaryStatus,
  DictionaryStore,
  DictionaryType,
  DictionaryTypeFilters,
} from './types'

const STORAGE_KEY = 'inventory-demo-dictionaries-v1'

const ts = {
  created: '2026-03-01 09:00:00',
  updated: '2026-04-10 11:20:00',
}

function sysFields(enabledAt = ts.created) {
  return {
    createdBy: '管理员',
    createdAt: ts.created,
    updatedBy: '管理员',
    updatedAt: ts.updated,
    disabledBy: null as string | null,
    disabledAt: null as string | null,
    enabledBy: '管理员',
    enabledAt,
  }
}

const seedTypes: DictionaryType[] = [
  {
    id: 't1',
    typeCode: 'PRODUCT_CATEGORY',
    typeName: '商品分类',
    structureType: 'TREE',
    description: '商品档案分类，最多二级',
    isPreset: true,
    status: 'ENABLED',
    disableReason: null,
    ...sysFields(),
  },
  {
    id: 't2',
    typeCode: 'UNIT',
    typeName: '计量单位',
    structureType: 'FLAT',
    description: '商品/单据计量单位',
    isPreset: true,
    status: 'ENABLED',
    disableReason: null,
    ...sysFields(),
  },
  {
    id: 't3',
    typeCode: 'CUSTOMER_GRADE',
    typeName: '客户等级',
    structureType: 'FLAT',
    description: '客户档案客户等级',
    isPreset: true,
    status: 'ENABLED',
    disableReason: null,
    ...sysFields(),
  },
  {
    id: 't4',
    typeCode: 'RETURN_REASON',
    typeName: '退货原因',
    structureType: 'FLAT',
    description: '用户自定义类型样例',
    isPreset: false,
    status: 'ENABLED',
    disableReason: null,
    ...sysFields('2026-04-01 10:00:00'),
  },
  {
    id: 't5',
    typeCode: 'LEGACY_TAG',
    typeName: '历史标签（已下线）',
    structureType: 'FLAT',
    description: '禁用类型样例',
    isPreset: false,
    status: 'DISABLED',
    disableReason: '业务口径合并到其他字典',
    ...sysFields('2025-12-01 11:00:00'),
    disabledBy: '管理员',
    disabledAt: '2026-02-01 15:00:00',
    updatedAt: '2026-02-01 15:00:00',
  },
]

const seedItems: DictionaryItem[] = [
  {
    id: 'i1',
    typeCode: 'PRODUCT_CATEGORY',
    itemCode: 'DIGITAL',
    itemName: '数码',
    parentItemCode: null,
    level: 1,
    isLeaf: false,
    sortOrder: 0,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    referenced: false,
    ...sysFields(),
  },
  {
    id: 'i2',
    typeCode: 'PRODUCT_CATEGORY',
    itemCode: 'PHONE',
    itemName: '手机',
    parentItemCode: 'DIGITAL',
    level: 2,
    isLeaf: true,
    sortOrder: 0,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    referenced: false,
    ...sysFields(),
  },
  {
    id: 'i3',
    typeCode: 'UNIT',
    itemCode: 'PCS',
    itemName: '个',
    parentItemCode: null,
    level: 1,
    isLeaf: true,
    sortOrder: 0,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    referenced: false,
    ...sysFields(),
  },
  {
    id: 'i4',
    typeCode: 'UNIT',
    itemCode: 'BOX',
    itemName: '箱',
    parentItemCode: null,
    level: 1,
    isLeaf: true,
    sortOrder: 1,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    referenced: false,
    ...sysFields(),
  },
  {
    id: 'i5',
    typeCode: 'CUSTOMER_GRADE',
    itemCode: 'A',
    itemName: 'A级',
    parentItemCode: null,
    level: 1,
    isLeaf: true,
    sortOrder: 0,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    referenced: true,
    ...sysFields(),
  },
  {
    id: 'i6',
    typeCode: 'CUSTOMER_GRADE',
    itemCode: 'B',
    itemName: 'B级',
    parentItemCode: null,
    level: 1,
    isLeaf: true,
    sortOrder: 1,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    referenced: false,
    ...sysFields(),
  },
  {
    id: 'i7',
    typeCode: 'CUSTOMER_GRADE',
    itemCode: 'E',
    itemName: 'E级',
    parentItemCode: null,
    level: 1,
    isLeaf: true,
    sortOrder: 4,
    remark: null,
    status: 'DISABLED',
    disableReason: '不再对外使用 E 级',
    referenced: false,
    ...sysFields(),
    disabledBy: '管理员',
    disabledAt: '2026-03-15 14:00:00',
    updatedAt: '2026-03-15 14:00:00',
  },
  {
    id: 'i8',
    typeCode: 'RETURN_REASON',
    itemCode: 'QUALITY',
    itemName: '质量问题',
    parentItemCode: null,
    level: 1,
    isLeaf: true,
    sortOrder: 0,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    referenced: false,
    ...sysFields('2026-04-01 10:00:00'),
  },
]

function loadStore(): DictionaryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { types: [...seedTypes], items: [...seedItems] }
    return JSON.parse(raw) as DictionaryStore
  } catch {
    return { types: [...seedTypes], items: [...seedItems] }
  }
}

let cache: DictionaryStore | null = null

function getStore(): DictionaryStore {
  if (!cache) cache = loadStore()
  return cache
}

function persist(store: DictionaryStore): void {
  cache = store
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function contains(hay: string, needle: string): boolean {
  const n = needle.trim().toLowerCase()
  if (!n) return true
  return hay.toLowerCase().includes(n)
}

export function recalculateLeaves(typeCode: string, items: DictionaryItem[]): DictionaryItem[] {
  const type = getStore().types.find((t) => t.typeCode === typeCode)
  const subset = items.filter((i) => i.typeCode === typeCode)
  const others = items.filter((i) => i.typeCode !== typeCode)

  const updated = subset.map((item) => {
    if (type?.structureType === 'FLAT') {
      return { ...item, level: 1 as const, isLeaf: true, parentItemCode: null }
    }
    if (item.level === 2 || item.parentItemCode) {
      return { ...item, level: 2 as const, isLeaf: true }
    }
    const hasChild = subset.some((c) => c.parentItemCode === item.itemCode)
    return { ...item, level: 1 as const, isLeaf: !hasChild, parentItemCode: null }
  })

  return [...others, ...updated]
}

function withRecalc(store: DictionaryStore, typeCode: string): DictionaryStore {
  return { ...store, items: recalculateLeaves(typeCode, store.items) }
}

export function listDictionaryTypes(filters?: DictionaryTypeFilters): DictionaryType[] {
  const types = getStore().types
  if (!filters) return [...types]
  return types.filter((row) => {
    if (filters.structureType && row.structureType !== filters.structureType) return false
    if (filters.status && row.status !== filters.status) return false
    if (!contains(row.typeName, filters.typeName)) return false
    if (!contains(row.typeCode, filters.typeCode)) return false
    return true
  })
}

export function getDictionaryType(typeCode: string): DictionaryType | undefined {
  return getStore().types.find((t) => t.typeCode === typeCode)
}

export function getDictionaryTypeById(id: string): DictionaryType | undefined {
  return getStore().types.find((t) => t.id === id)
}

export function upsertDictionaryType(type: DictionaryType): void {
  const store = getStore()
  const idx = store.types.findIndex((t) => t.id === type.id)
  const types =
    idx >= 0 ? store.types.map((t, i) => (i === idx ? type : t)) : [type, ...store.types]
  persist({ ...store, types })
}

export function setDictionaryTypeStatus(
  id: string,
  status: DictionaryStatus,
  disableReason: string | null,
): void {
  const store = getStore()
  const tsNow = nowString()
  const types = store.types.map((row) => {
    if (row.id !== id) return row
    if (status === 'DISABLED') {
      return {
        ...row,
        status,
        disableReason,
        updatedBy: '管理员',
        updatedAt: tsNow,
        disabledBy: '管理员',
        disabledAt: tsNow,
      }
    }
    return {
      ...row,
      status,
      disableReason: null,
      updatedBy: '管理员',
      updatedAt: tsNow,
      enabledBy: '管理员',
      enabledAt: tsNow,
    }
  })
  persist({ ...store, types })
}

export function listDictionaryItems(
  typeCode: string,
  filters?: DictionaryItemFilters,
): DictionaryItem[] {
  let rows = getStore().items.filter((i) => i.typeCode === typeCode)
  if (!filters) return sortItems(rows)
  rows = rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false
    if (!contains(row.itemCode, filters.itemCode)) return false
    if (!contains(row.itemName, filters.itemName)) return false
    return true
  })
  return sortItems(rows)
}

function sortItems(items: DictionaryItem[]): DictionaryItem[] {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.itemCode.localeCompare(b.itemCode)
  })
}

/** 树形展示顺序：一级后紧跟其子级 */
export function listDictionaryItemsForTree(typeCode: string, filters?: DictionaryItemFilters): DictionaryItem[] {
  const flat = listDictionaryItems(typeCode, filters)
  const type = getDictionaryType(typeCode)
  if (type?.structureType !== 'TREE') return flat

  const roots = flat.filter((i) => i.level === 1)
  const result: DictionaryItem[] = []
  for (const root of roots) {
    result.push(root)
    result.push(...flat.filter((c) => c.parentItemCode === root.itemCode))
  }
  const listed = new Set(result.map((r) => r.id))
  for (const item of flat) {
    if (!listed.has(item.id)) result.push(item)
  }
  return result
}

export function getDictionaryItemById(id: string): DictionaryItem | undefined {
  return getStore().items.find((i) => i.id === id)
}

export function upsertDictionaryItem(item: DictionaryItem): void {
  let store = getStore()
  const idx = store.items.findIndex((i) => i.id === item.id)
  const items =
    idx >= 0 ? store.items.map((i, n) => (n === idx ? item : i)) : [...store.items, item]
  store = { ...store, items }
  store = withRecalc(store, item.typeCode)
  persist(store)
}

export function setDictionaryItemStatus(
  id: string,
  status: DictionaryStatus,
  disableReason: string | null,
): void {
  const store = getStore()
  const target = store.items.find((i) => i.id === id)
  if (!target) return
  const tsNow = nowString()
  const items = store.items.map((row) => {
    if (row.id !== id) return row
    if (status === 'DISABLED') {
      return {
        ...row,
        status,
        disableReason,
        updatedBy: '管理员',
        updatedAt: tsNow,
        disabledBy: '管理员',
        disabledAt: tsNow,
      }
    }
    return {
      ...row,
      status,
      disableReason: null,
      updatedBy: '管理员',
      updatedAt: tsNow,
      enabledBy: '管理员',
      enabledAt: tsNow,
    }
  })
  persist({ ...store, items })
}

export function listEnabledDictionaryItems(typeCode: string, keyword?: string): DictionaryItem[] {
  const type = getDictionaryType(typeCode)
  if (!type || type.status !== 'ENABLED') return []
  const kw = keyword?.trim().toLowerCase() ?? ''
  return sortItems(getStore().items).filter((item) => {
    if (item.typeCode !== typeCode) return false
    if (item.status !== 'ENABLED') return false
    if (!item.isLeaf) return false
    if (!kw) return true
    return (
      item.itemCode.toLowerCase().includes(kw) ||
      item.itemName.toLowerCase().includes(kw)
    )
  })
}

export function nextDictionaryTypeId(): string {
  const nums = getStore().types
    .map((t) => Number(t.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `t${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextDictionaryItemId(): string {
  const nums = getStore().items
    .map((i) => Number(i.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `i${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function typeCodeExists(code: string, excludeId?: string): boolean {
  return getStore().types.some((t) => t.typeCode === code && t.id !== excludeId)
}

export function itemCodeExists(typeCode: string, code: string, excludeId?: string): boolean {
  return getStore().items.some(
    (i) => i.typeCode === typeCode && i.itemCode === code && i.id !== excludeId,
  )
}

export function listLevelOneItems(typeCode: string): DictionaryItem[] {
  return listDictionaryItems(typeCode).filter((i) => i.level === 1)
}

export function hasChildItems(typeCode: string, itemCode: string): boolean {
  return getStore().items.some(
    (i) => i.typeCode === typeCode && i.parentItemCode === itemCode,
  )
}
