import type { Product } from './types'

const STORAGE_KEY = 'inventory-demo-products-v1'

const seedProducts: Product[] = [
  {
    id: '1',
    productCode: 'SKU-0001',
    productName: 'Type-C 快充数据线',
    category: '充电器',
    specModel: '1m/白色',
    salesUnit: 'PCS',
    barcode: '6901234567890',
    defaultRetailPrice: 39.9,
    defaultWholesalePrice: 22.5,
    referencePurchasePrice: 15.0,
    remark: '支持 65W PD',
    status: 'ENABLED',
    disableReason: null,
    isReferenced: true,
    createdBy: '张三',
    createdAt: '2026-04-10 09:12:00',
    updatedBy: '李四',
    updatedAt: '2026-04-18 16:40:22',
  },
  {
    id: '2',
    productCode: 'SKU-0002',
    productName: '入耳式蓝牙耳机',
    category: '耳机',
    specModel: '黑色/标准版',
    salesUnit: 'BOX',
    barcode: null,
    defaultRetailPrice: null,
    defaultWholesalePrice: 128.0,
    referencePurchasePrice: 86.5,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    isReferenced: false,
    createdBy: '王五',
    createdAt: '2026-04-12 11:05:33',
    updatedBy: '王五',
    updatedAt: '2026-04-12 11:05:33',
  },
  {
    id: '3',
    productCode: 'SKU-OLD-01',
    productName: '磁吸手机支架（旧款）',
    category: '手机配件',
    specModel: '通用',
    salesUnit: 'PCS',
    barcode: '8800123400001',
    defaultRetailPrice: 0,
    defaultWholesalePrice: 0,
    referencePurchasePrice: 0,
    remark: '内赠商品',
    status: 'DISABLED',
    disableReason: '款式停产，不再采购',
    isReferenced: false,
    createdBy: '张三',
    createdAt: '2025-12-01 08:00:00',
    updatedBy: '李四',
    updatedAt: '2026-03-20 14:22:10',
  },
]

function load(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...seedProducts]
    return JSON.parse(raw) as Product[]
  } catch {
    return [...seedProducts]
  }
}

let cache: Product[] | null = null

export function listProducts(): Product[] {
  if (!cache) cache = load()
  return cache
}

export function persistProducts(products: Product[]): void {
  cache = products
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

export function getProductById(id: string): Product | undefined {
  return listProducts().find((p) => p.id === id)
}

export function getProductByCode(code: string, excludeId?: string): Product | undefined {
  return listProducts().find(
    (p) => p.productCode === code && (!excludeId || p.id !== excludeId),
  )
}

export function getProductByBarcode(barcode: string, excludeId?: string): Product | undefined {
  return listProducts().find(
    (p) => p.barcode === barcode && (!excludeId || p.id !== excludeId),
  )
}

export function upsertProduct(product: Product): void {
  const all = listProducts()
  const idx = all.findIndex((p) => p.id === product.id)
  if (idx >= 0) all[idx] = product
  else all.unshift(product)
  persistProducts(all)
}

export function nextProductId(): string {
  const ids = listProducts().map((p) => Number(p.id)).filter((n) => !Number.isNaN(n))
  const max = ids.length ? Math.max(...ids) : 0
  return String(max + 1)
}
