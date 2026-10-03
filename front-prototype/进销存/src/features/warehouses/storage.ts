import type { Warehouse } from './types'

const STORAGE_KEY = 'inventory-demo-warehouses-v1'

const seedWarehouses: Warehouse[] = [
  {
    id: '1',
    warehouseCode: 'WH-CN-DG',
    warehouseName: '东莞主仓',
    warehouseType: 'MAIN',
    address: '广东省东莞市某物流园 A 栋',
    managerName: '赵仓管',
    contactPhone: '13800138001',
    remark: '默认发货仓',
    status: 'ENABLED',
    disableReason: null,
    isReferenced: true,
    mockInventoryQty: 1280,
    createdBy: '管理员',
    createdAt: '2026-03-01 09:00:00',
    updatedBy: '管理员',
    updatedAt: '2026-04-10 11:20:00',
    disabledBy: null,
    disabledAt: null,
    enabledBy: '管理员',
    enabledAt: '2026-03-01 09:00:00',
  },
  {
    id: '2',
    warehouseCode: 'WH-CN-SZ',
    warehouseName: '深圳分仓',
    warehouseType: 'BRANCH',
    address: '广东省深圳市宝安区某路 88 号',
    managerName: '钱主管',
    contactPhone: '0755-88886666',
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    isReferenced: false,
    mockInventoryQty: 50,
    createdBy: '管理员',
    createdAt: '2026-04-01 14:00:00',
    updatedBy: '管理员',
    updatedAt: '2026-04-01 14:00:00',
    disabledBy: null,
    disabledAt: null,
    enabledBy: '管理员',
    enabledAt: '2026-04-01 14:00:00',
  },
  {
    id: '3',
    warehouseCode: 'WH-STORE-01',
    warehouseName: '南山门店仓',
    warehouseType: 'STORE',
    address: '广东省深圳市南山区某街道 1 号',
    managerName: '孙店长',
    contactPhone: null,
    remark: '已关闭门店',
    status: 'DISABLED',
    disableReason: '门店撤店',
    isReferenced: false,
    mockInventoryQty: 0,
    createdBy: '管理员',
    createdAt: '2025-08-01 10:00:00',
    updatedBy: '管理员',
    updatedAt: '2026-02-15 16:30:00',
    disabledBy: '管理员',
    disabledAt: '2026-02-15 16:30:00',
    enabledBy: '管理员',
    enabledAt: '2025-08-01 10:00:00',
  },
]

function load(): Warehouse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...seedWarehouses]
    return JSON.parse(raw) as Warehouse[]
  } catch {
    return [...seedWarehouses]
  }
}

let cache: Warehouse[] | null = null

export function listWarehouses(): Warehouse[] {
  if (!cache) cache = load()
  return cache
}

export function persistWarehouses(warehouses: Warehouse[]): void {
  cache = warehouses
  localStorage.setItem(STORAGE_KEY, JSON.stringify(warehouses))
}

export function getWarehouseById(id: string): Warehouse | undefined {
  return listWarehouses().find((w) => w.id === id)
}

export function getWarehouseByCode(code: string, excludeId?: string): Warehouse | undefined {
  return listWarehouses().find(
    (w) => w.warehouseCode === code && (!excludeId || w.id !== excludeId),
  )
}

export function getMockInventoryQty(warehouseId: string): number {
  return getWarehouseById(warehouseId)?.mockInventoryQty ?? 0
}

export function upsertWarehouse(warehouse: Warehouse): void {
  const all = listWarehouses()
  const idx = all.findIndex((w) => w.id === warehouse.id)
  if (idx >= 0) all[idx] = warehouse
  else all.unshift(warehouse)
  persistWarehouses(all)
}

export function nextWarehouseId(): string {
  const ids = listWarehouses().map((w) => Number(w.id)).filter((n) => !Number.isNaN(n))
  const max = ids.length ? Math.max(...ids) : 0
  return String(max + 1)
}
