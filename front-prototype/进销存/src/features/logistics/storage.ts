import type { Logistics } from './types'

const STORAGE_KEY = 'inventory-demo-logistics-v2'

const seedLogistics: Logistics[] = [
  {
    id: '1',
    logisticsCode: 'LOG-0001',
    logisticsName: '顺丰特快',
    logisticsType: 'EXPRESS',
    serviceProvider: '顺丰',
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    isReferenced: true,
    mockOpenOutboundCount: 1,
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
    logisticsCode: 'LOG-0002',
    logisticsName: '圆通速递',
    logisticsType: 'EXPRESS',
    serviceProvider: '圆通',
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    isReferenced: false,
    mockOpenOutboundCount: 0,
    createdBy: '管理员',
    createdAt: '2026-03-05 10:00:00',
    updatedBy: '管理员',
    updatedAt: '2026-03-05 10:00:00',
    disabledBy: null,
    disabledAt: null,
    enabledBy: '管理员',
    enabledAt: '2026-03-05 10:00:00',
  },
  {
    id: '3',
    logisticsCode: 'LOG-0003',
    logisticsName: '德邦干线',
    logisticsType: 'FREIGHT',
    serviceProvider: '德邦定制仓配',
    remark: '大件走干线',
    status: 'ENABLED',
    disableReason: null,
    isReferenced: false,
    mockOpenOutboundCount: 0,
    createdBy: '管理员',
    createdAt: '2026-03-08 14:30:00',
    updatedBy: '管理员',
    updatedAt: '2026-03-20 16:00:00',
    disabledBy: null,
    disabledAt: null,
    enabledBy: '管理员',
    enabledAt: '2026-03-08 14:30:00',
  },
  {
    id: '4',
    logisticsCode: 'LOG-0004',
    logisticsName: '门店自提',
    logisticsType: 'SELF_PICKUP',
    serviceProvider: null,
    remark: '南山门店自取',
    status: 'ENABLED',
    disableReason: null,
    isReferenced: false,
    mockOpenOutboundCount: 0,
    createdBy: '管理员',
    createdAt: '2026-04-01 09:00:00',
    updatedBy: '管理员',
    updatedAt: '2026-04-01 09:00:00',
    disabledBy: null,
    disabledAt: null,
    enabledBy: '管理员',
    enabledAt: '2026-04-01 09:00:00',
  },
  {
    id: '5',
    logisticsCode: 'LOG-0099',
    logisticsName: '西南专线联盟',
    logisticsType: 'FREIGHT',
    serviceProvider: '西南专线联盟',
    remark: '已停用渠道',
    status: 'DISABLED',
    disableReason: '承运商合同到期',
    isReferenced: false,
    mockOpenOutboundCount: 0,
    createdBy: '管理员',
    createdAt: '2025-12-01 11:00:00',
    updatedBy: '管理员',
    updatedAt: '2026-02-01 15:00:00',
    disabledBy: '管理员',
    disabledAt: '2026-02-01 15:00:00',
    enabledBy: '管理员',
    enabledAt: '2025-12-01 11:00:00',
  },
]

function load(): Logistics[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...seedLogistics]
    const parsed = JSON.parse(raw) as Logistics[]
    return parsed.map((row) => ({
      ...row,
      mockOpenOutboundCount: row.mockOpenOutboundCount ?? 0,
    }))
  } catch {
    return [...seedLogistics]
  }
}

let cache: Logistics[] | null = null

export function listLogistics(): Logistics[] {
  if (!cache) cache = load()
  return cache
}

export function listEnabledLogistics(): Logistics[] {
  return listLogistics().filter((item) => item.status === 'ENABLED')
}

export function persistLogistics(items: Logistics[]): void {
  cache = items
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getLogisticsById(id: string): Logistics | undefined {
  return listLogistics().find((item) => item.id === id)
}

export function getLogisticsByCode(code: string, excludeId?: string): Logistics | undefined {
  return listLogistics().find(
    (item) => item.logisticsCode === code && (!excludeId || item.id !== excludeId),
  )
}

export function upsertLogistics(item: Logistics): void {
  const all = listLogistics()
  const idx = all.findIndex((row) => row.id === item.id)
  if (idx >= 0) all[idx] = item
  else all.unshift(item)
  persistLogistics(all)
}

export function nextLogisticsId(): string {
  const ids = listLogistics()
    .map((row) => Number(row.id))
    .filter((n) => !Number.isNaN(n))
  const max = ids.length ? Math.max(...ids) : 0
  return String(max + 1)
}

export function nextLogisticsCode(): string {
  const nums = listLogistics().map((row) => {
    const m = /^LOG-(\d+)$/.exec(row.logisticsCode)
    return m ? parseInt(m[1], 10) : 0
  })
  const max = nums.length ? Math.max(...nums) : 0
  return `LOG-${String(max + 1).padStart(4, '0')}`
}

export function getMockOpenOutboundCount(logisticsId: string): number {
  return getLogisticsById(logisticsId)?.mockOpenOutboundCount ?? 0
}
