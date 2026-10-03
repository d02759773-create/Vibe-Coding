import type {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderListFilters,
  PurchaseOrderStatus,
  StatusTabKey,
  TaxRate,
} from './types'

const STORAGE_KEY = 'inventory-demo-purchase-orders-v1'

function line(
  id: string,
  productId: string,
  code: string,
  name: string,
  barcode: string | null,
  spec: string,
  unit: string,
  qty: number,
  price: number,
  tax: TaxRate,
  received: number,
  remark = '',
): PurchaseOrderLine {
  return {
    id,
    productId,
    productCode: code,
    productName: name,
    barcode,
    specModel: spec,
    unit,
    quantity: qty,
    unitPrice: price,
    taxRate: tax,
    lineAmount: Math.round(qty * price * 100) / 100,
    receivedQty: received,
    lineRemark: remark,
  }
}

function totals(lines: PurchaseOrderLine[]) {
  return {
    skuCount: lines.length,
    totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
    totalAmount: Math.round(lines.reduce((s, l) => s + l.lineAmount, 0) * 100) / 100,
  }
}

const seedOrders: PurchaseOrder[] = (() => {
  const s1 = {
    supplierId: '1',
    supplierCode: 'VEND-0001',
    supplierName: '深圳华强电子有限公司',
    warehouseId: '1',
    warehouseCode: 'WH-CN-DG',
    warehouseName: '东莞主仓',
  }
  const l1 = [
    line('l1', '1', 'SKU-0001', 'Type-C 快充数据线', '6901234567890', '1m/白色', 'PCS', 100, 15, '13%', 0),
  ]
  const l2 = [
    line('l2a', '1', 'SKU-0001', 'Type-C 快充数据线', '6901234567890', '1m/白色', 'PCS', 80, 15, '13%', 40),
    line('l2b', '2', 'SKU-0002', '入耳式蓝牙耳机', null, '黑色/标准版', 'BOX', 20, 86.5, '13%', 10),
  ]
  const t1 = totals(l1)
  const t2 = totals(l2)

  return [
    {
      id: 'po-1',
      orderNo: 'PO20260419-0001',
      ...s1,
      orderDate: '2026-04-19',
      expectedArrivalDate: '2026-04-22',
      status: 'DRAFT',
      remark: '草稿样例 A',
      lines: l1,
      ...t1,
      inboundLinks: [],
      createdBy: '老周',
      createdAt: '2026-04-19 09:00:00',
      updatedBy: '老周',
      updatedAt: '2026-04-19 09:30:00',
      auditedBy: null,
      auditedAt: null,
    },
    {
      id: 'po-2',
      orderNo: 'PO20260419-0002',
      ...s1,
      orderDate: '2026-04-19',
      expectedArrivalDate: null,
      status: 'DRAFT',
      remark: '',
      lines: [line('l2x', '2', 'SKU-0002', '入耳式蓝牙耳机', null, '黑色/标准版', 'BOX', 5, 86.5, '', 0)],
      ...totals([line('l2x', '2', 'SKU-0002', '入耳式蓝牙耳机', null, '黑色/标准版', 'BOX', 5, 86.5, '', 0)]),
      inboundLinks: [],
      createdBy: '老周',
      createdAt: '2026-04-19 10:00:00',
      updatedBy: '老周',
      updatedAt: '2026-04-19 10:00:00',
      auditedBy: null,
      auditedAt: null,
    },
    {
      id: 'po-3',
      orderNo: 'PO20260418-0003',
      ...s1,
      orderDate: '2026-04-18',
      expectedArrivalDate: '2026-04-25',
      status: 'PENDING_AUDIT',
      remark: '待审核',
      lines: l1,
      ...t1,
      inboundLinks: [],
      createdBy: '老周',
      createdAt: '2026-04-18 14:00:00',
      updatedBy: '老周',
      updatedAt: '2026-04-18 15:00:00',
      auditedBy: null,
      auditedAt: null,
    },
    {
      id: 'po-4',
      orderNo: 'PO20260418-0004',
      supplierId: '2',
      supplierCode: 'VEND-0002',
      supplierName: '东莞配件直供站',
      warehouseId: '2',
      warehouseCode: 'WH-CN-SZ',
      warehouseName: '深圳分仓',
      orderDate: '2026-04-18',
      expectedArrivalDate: '2026-04-20',
      status: 'PENDING_AUDIT',
      remark: '',
      lines: l2,
      ...t2,
      inboundLinks: [],
      createdBy: '王五',
      createdAt: '2026-04-18 11:00:00',
      updatedBy: '王五',
      updatedAt: '2026-04-18 11:30:00',
      auditedBy: null,
      auditedAt: null,
    },
    {
      id: 'po-5',
      orderNo: 'PO20260417-0005',
      ...s1,
      orderDate: '2026-04-17',
      expectedArrivalDate: '2026-04-19',
      status: 'PENDING_STOCK_IN',
      remark: '已审核待到货',
      lines: l1,
      ...t1,
      inboundLinks: [],
      createdBy: '老周',
      createdAt: '2026-04-17 09:00:00',
      updatedBy: '林强',
      updatedAt: '2026-04-17 16:00:00',
      auditedBy: '林强',
      auditedAt: '2026-04-17 16:00:00',
    },
    {
      id: 'po-6',
      orderNo: 'PO20260416-0006',
      ...s1,
      orderDate: '2026-04-16',
      expectedArrivalDate: '2026-04-18',
      status: 'PENDING_STOCK_IN',
      remark: '',
      lines: l2,
      ...t2,
      inboundLinks: [],
      createdBy: '老周',
      createdAt: '2026-04-16 10:00:00',
      updatedBy: '林强',
      updatedAt: '2026-04-16 11:00:00',
      auditedBy: '林强',
      auditedAt: '2026-04-16 11:00:00',
    },
    {
      id: 'po-7',
      orderNo: 'PO20260415-0007',
      ...s1,
      orderDate: '2026-04-15',
      expectedArrivalDate: '2026-04-17',
      status: 'PARTIAL_STOCK_IN',
      remark: '分批到货',
      lines: l2,
      ...t2,
      inboundLinks: [
        {
          id: 'in-1',
          inboundNo: 'PI20260416-0001',
          inboundDate: '2026-04-16',
          totalQty: 50,
          operator: '老李',
          status: 'STOCKED_IN',
        },
      ],
      createdBy: '老周',
      createdAt: '2026-04-15 09:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-16 17:00:00',
      auditedBy: '林强',
      auditedAt: '2026-04-15 10:00:00',
    },
    {
      id: 'po-8',
      orderNo: 'PO20260414-0008',
      supplierId: '2',
      supplierCode: 'VEND-0002',
      supplierName: '东莞配件直供站',
      warehouseId: '1',
      warehouseCode: 'WH-CN-DG',
      warehouseName: '东莞主仓',
      orderDate: '2026-04-14',
      expectedArrivalDate: null,
      status: 'PARTIAL_STOCK_IN',
      remark: '',
      lines: [line('l8', '1', 'SKU-0001', 'Type-C 快充数据线', '6901234567890', '1m/白色', 'PCS', 200, 14.5, '13%', 120)],
      ...totals([line('l8', '1', 'SKU-0001', 'Type-C 快充数据线', '6901234567890', '1m/白色', 'PCS', 200, 14.5, '13%', 120)]),
      inboundLinks: [
        {
          id: 'in-2',
          inboundNo: 'PI20260415-0002',
          inboundDate: '2026-04-15',
          totalQty: 120,
          operator: '赵仓管',
          status: 'STOCKED_IN',
        },
      ],
      createdBy: '王五',
      createdAt: '2026-04-14 08:00:00',
      updatedBy: '赵仓管',
      updatedAt: '2026-04-15 18:00:00',
      auditedBy: '林强',
      auditedAt: '2026-04-14 09:00:00',
    },
    {
      id: 'po-9',
      orderNo: 'PO20260410-0009',
      ...s1,
      orderDate: '2026-04-10',
      expectedArrivalDate: '2026-04-12',
      status: 'COMPLETED',
      remark: '全量入库完成',
      lines: [line('l9', '1', 'SKU-0001', 'Type-C 快充数据线', '6901234567890', '1m/白色', 'PCS', 50, 15, '13%', 50)],
      ...totals([line('l9', '1', 'SKU-0001', 'Type-C 快充数据线', '6901234567890', '1m/白色', 'PCS', 50, 15, '13%', 50)]),
      inboundLinks: [
        {
          id: 'in-3',
          inboundNo: 'PI20260411-0003',
          inboundDate: '2026-04-11',
          totalQty: 50,
          operator: '老李',
          status: 'STOCKED_IN',
        },
      ],
      createdBy: '老周',
      createdAt: '2026-04-10 09:00:00',
      updatedBy: '老李',
      updatedAt: '2026-04-11 15:00:00',
      auditedBy: '林强',
      auditedAt: '2026-04-10 10:00:00',
    },
    {
      id: 'po-10',
      orderNo: 'PO20260408-0010',
      ...s1,
      orderDate: '2026-04-08',
      expectedArrivalDate: '2026-04-10',
      status: 'COMPLETED',
      remark: '缺量完结',
      lines: [line('l10', '2', 'SKU-0002', '入耳式蓝牙耳机', null, '黑色/标准版', 'BOX', 30, 86.5, '13%', 25)],
      ...totals([line('l10', '2', 'SKU-0002', '入耳式蓝牙耳机', null, '黑色/标准版', 'BOX', 30, 86.5, '13%', 25)]),
      inboundLinks: [
        {
          id: 'in-4',
          inboundNo: 'PI20260409-0004',
          inboundDate: '2026-04-09',
          totalQty: 25,
          operator: '老李',
          status: 'STOCKED_IN',
        },
      ],
      createdBy: '老周',
      createdAt: '2026-04-08 09:00:00',
      updatedBy: '老周',
      updatedAt: '2026-04-12 10:00:00',
      auditedBy: '林强',
      auditedAt: '2026-04-08 10:00:00',
    },
    {
      id: 'po-11',
      orderNo: 'PO20260405-0011',
      ...s1,
      orderDate: '2026-04-05',
      expectedArrivalDate: null,
      status: 'VOIDED',
      remark: '供应商断货作废',
      lines: l1,
      ...t1,
      inboundLinks: [],
      createdBy: '老周',
      createdAt: '2026-04-05 09:00:00',
      updatedBy: '林强',
      updatedAt: '2026-04-06 11:00:00',
      auditedBy: '林强',
      auditedAt: '2026-04-05 15:00:00',
    },
    {
      id: 'po-12',
      orderNo: 'PO20260420-0012',
      ...s1,
      orderDate: '2026-04-20',
      expectedArrivalDate: '2026-04-23',
      status: 'DRAFT',
      remark: '大额草稿',
      lines: [
        line('l12a', '1', 'SKU-0001', 'Type-C 快充数据线', '6901234567890', '1m/白色', 'PCS', 500, 15, '13%', 0),
        line('l12b', '2', 'SKU-0002', '入耳式蓝牙耳机', null, '黑色/标准版', 'BOX', 100, 86.5, '13%', 0),
      ],
      ...totals([
        line('l12a', '1', 'SKU-0001', 'Type-C 快充数据线', '6901234567890', '1m/白色', 'PCS', 500, 15, '13%', 0),
        line('l12b', '2', 'SKU-0002', '入耳式蓝牙耳机', null, '黑色/标准版', 'BOX', 100, 86.5, '13%', 0),
      ]),
      inboundLinks: [],
      createdBy: '老周',
      createdAt: '2026-04-20 08:00:00',
      updatedBy: '老周',
      updatedAt: '2026-04-20 08:30:00',
      auditedBy: null,
      auditedAt: null,
    },
  ]
})()

function load(): PurchaseOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...seedOrders]
    return JSON.parse(raw) as PurchaseOrder[]
  } catch {
    return [...seedOrders]
  }
}

let cache: PurchaseOrder[] | null = null

export function listPurchaseOrders(): PurchaseOrder[] {
  if (!cache) cache = load()
  return cache
}

export function persistPurchaseOrders(orders: PurchaseOrder[]): void {
  cache = orders
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return listPurchaseOrders().find((o) => o.id === id)
}

export function deletePurchaseOrder(id: string): boolean {
  const order = getPurchaseOrderById(id)
  if (!order || order.status !== 'DRAFT') return false
  persistPurchaseOrders(listPurchaseOrders().filter((o) => o.id !== id))
  return true
}

export function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function nextPurchaseOrderId(): string {
  const nums = listPurchaseOrders()
    .map((o) => Number(o.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `po-${(nums.length ? Math.max(...nums) : 0) + 1}`
}

export function nextPurchaseOrderNo(orderDate: string): string {
  const ymd = orderDate.replace(/-/g, '')
  const prefix = `PO${ymd}-`
  const nums = listPurchaseOrders()
    .map((o) => {
      if (!o.orderNo.startsWith(prefix)) return 0
      return parseInt(o.orderNo.slice(prefix.length), 10) || 0
    })
    .filter((n) => n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function recalcOrder(order: PurchaseOrder): PurchaseOrder {
  const lines = order.lines.map((l) => ({
    ...l,
    lineAmount: Math.round(l.quantity * l.unitPrice * 100) / 100,
  }))
  const skuCount = lines.length
  const totalQuantity = lines.reduce((s, l) => s + l.quantity, 0)
  const totalAmount = Math.round(lines.reduce((s, l) => s + l.lineAmount, 0) * 100) / 100
  return { ...order, lines, skuCount, totalQuantity, totalAmount }
}

export function upsertPurchaseOrder(order: PurchaseOrder): void {
  const normalized = recalcOrder(order)
  const all = listPurchaseOrders()
  const idx = all.findIndex((o) => o.id === normalized.id)
  if (idx >= 0) all[idx] = normalized
  else all.unshift(normalized)
  persistPurchaseOrders(all)
}

export function updateOrderStatus(id: string, status: PurchaseOrderStatus, extra?: Partial<PurchaseOrder>): void {
  const order = getPurchaseOrderById(id)
  if (!order) return
  const ts = nowString()
  upsertPurchaseOrder({
    ...order,
    ...extra,
    status,
    updatedBy: '管理员',
    updatedAt: ts,
  })
}

function parseOrderNos(raw: string): string[] {
  return raw
    .split(/[\n,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function inDateRange(value: string, from: string, to: string): boolean {
  if (from && value < from) return false
  if (to && value > to) return false
  return true
}

function inDateTimeRange(value: string, from: string, to: string): boolean {
  const day = value.slice(0, 10)
  return inDateRange(day, from, to)
}

export function filterPurchaseOrders(
  filters: PurchaseOrderListFilters,
  tab: StatusTabKey,
): PurchaseOrder[] {
  const nos = parseOrderNos(filters.orderNos)
  return listPurchaseOrders().filter((row) => {
    if (tab !== 'ALL' && row.status !== tab) return false
    if (tab === 'ALL' && filters.status && row.status !== filters.status) return false
    if (filters.supplierId && row.supplierId !== filters.supplierId) return false
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false
    if (nos.length && !nos.some((n) => row.orderNo === n)) return false
    if (!inDateRange(row.orderDate, filters.orderDateFrom, filters.orderDateTo)) return false
    if (
      row.expectedArrivalDate &&
      !inDateRange(row.expectedArrivalDate, filters.expectedDateFrom, filters.expectedDateTo)
    ) {
      return false
    }
    if (
      !row.expectedArrivalDate &&
      (filters.expectedDateFrom || filters.expectedDateTo)
    ) {
      return false
    }
    if (!inDateTimeRange(row.updatedAt, filters.updatedFrom, filters.updatedTo)) return false
    return true
  })
}

export function countByTab(filters: PurchaseOrderListFilters): Record<StatusTabKey, number> {
  const base = filterPurchaseOrders({ ...filters, status: '' }, 'ALL')
  const counts: Record<StatusTabKey, number> = {
    ALL: base.length,
    DRAFT: 0,
    PENDING_AUDIT: 0,
    PENDING_STOCK_IN: 0,
    PARTIAL_STOCK_IN: 0,
    COMPLETED: 0,
    VOIDED: 0,
  }
  for (const row of base) {
    counts[row.status] += 1
  }
  return counts
}

export function unreceivedQty(line: PurchaseOrderLine): number {
  return Math.max(0, line.quantity - line.receivedQty)
}
