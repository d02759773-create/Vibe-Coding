import type { Supplier } from './types'

const STORAGE_KEY = 'inventory-demo-suppliers-v1'

const seedSuppliers: Supplier[] = [
  {
    id: '1',
    supplierCode: 'VEND-0001',
    supplierName: '深圳华强电子有限公司',
    contactName: '陈采购',
    contactPhone: '13800138000',
    contactAddress: '广东省深圳市福田区华强北路 100 号',
    settlementMethod: 'ACCOUNT',
    paymentTermDays: 30,
    taxRate: '13%',
    remark: '月结对账',
    status: 'ENABLED',
    disableReason: null,
    isReferenced: true,
    createdBy: '张三',
    createdAt: '2026-03-01 10:00:00',
    updatedBy: '李四',
    updatedAt: '2026-04-15 09:30:00',
  },
  {
    id: '2',
    supplierCode: 'VEND-0002',
    supplierName: '东莞配件直供站',
    contactName: '刘经理',
    contactPhone: '0769-88886666',
    contactAddress: null,
    settlementMethod: 'CASH',
    paymentTermDays: 0,
    taxRate: '未税',
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    isReferenced: false,
    createdBy: '王五',
    createdAt: '2026-04-10 14:20:00',
    updatedBy: '王五',
    updatedAt: '2026-04-10 14:20:00',
  },
  {
    id: '3',
    supplierCode: 'VEND-OLD',
    supplierName: '停用测试供应商',
    contactName: '测试',
    contactPhone: '13900139000',
    contactAddress: '测试地址',
    settlementMethod: 'ACCOUNT',
    paymentTermDays: 15,
    taxRate: '3%',
    remark: null,
    status: 'DISABLED',
    disableReason: '合作终止',
    isReferenced: false,
    createdBy: '张三',
    createdAt: '2025-06-01 08:00:00',
    updatedBy: '李四',
    updatedAt: '2026-02-01 16:00:00',
  },
]

function load(): Supplier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...seedSuppliers]
    return JSON.parse(raw) as Supplier[]
  } catch {
    return [...seedSuppliers]
  }
}

let cache: Supplier[] | null = null

export function listSuppliers(): Supplier[] {
  if (!cache) cache = load()
  return cache
}

export function persistSuppliers(suppliers: Supplier[]): void {
  cache = suppliers
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers))
}

export function getSupplierById(id: string): Supplier | undefined {
  return listSuppliers().find((s) => s.id === id)
}

export function getSupplierByCode(code: string, excludeId?: string): Supplier | undefined {
  return listSuppliers().find(
    (s) => s.supplierCode === code && (!excludeId || s.id !== excludeId),
  )
}

export function upsertSupplier(supplier: Supplier): void {
  const all = listSuppliers()
  const idx = all.findIndex((s) => s.id === supplier.id)
  if (idx >= 0) all[idx] = supplier
  else all.unshift(supplier)
  persistSuppliers(all)
}

export function nextSupplierId(): string {
  const ids = listSuppliers().map((s) => Number(s.id)).filter((n) => !Number.isNaN(n))
  const max = ids.length ? Math.max(...ids) : 0
  return String(max + 1)
}
