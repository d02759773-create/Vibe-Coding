import { todayDateString } from '@/features/purchaseOrders/constants'
import {
  nextPurchaseOrderId,
  nextPurchaseOrderNo,
  nowString,
  upsertPurchaseOrder,
} from '@/features/purchaseOrders/storage'
import type { PurchaseOrder, PurchaseOrderLine, TaxRate } from '@/features/purchaseOrders/types'
import { validateDraftSave, validateSubmit } from '@/features/purchaseOrders/validate'
import { getProductById } from '@/features/products/storage'
import { getSupplierById } from '@/features/suppliers/storage'
import { getWarehouseById } from '@/features/warehouses/storage'

export type CreatePurchaseOrderLineInput = {
  productId: string
  quantity: number
  unitPrice?: number
  taxRate?: TaxRate | string
  lineRemark?: string
}

export type CreatePurchaseOrderInput = {
  supplierId: string
  warehouseId: string
  orderDate?: string
  expectedArrivalDate?: string | null
  remark?: string
  submitForAudit?: boolean
  lines: CreatePurchaseOrderLineInput[]
}

export type CreatePurchaseOrderResult =
  | { ok: true; orderId: string; orderNo: string; status: PurchaseOrder['status']; message: string }
  | { ok: false; message: string }

function lineAmount(qty: number, price: number): number {
  return Math.round(qty * price * 100) / 100
}

export function createPurchaseOrder(input: CreatePurchaseOrderInput): CreatePurchaseOrderResult {
  const orderDate = input.orderDate?.trim() || todayDateString()
  const submit = Boolean(input.submitForAudit)

  const lineInputs = input.lines.map((l, i) => {
    const product = getProductById(l.productId)
    if (!product) {
      return null
    }
    const unitPrice = l.unitPrice ?? product.referencePurchasePrice ?? 0
    return {
      id: `agent-line-${Date.now()}-${i}`,
      productId: product.id,
      productCode: product.productCode,
      quantity: l.quantity,
      unitPrice,
      taxRate: (l.taxRate as TaxRate) || '13%',
      lineRemark: l.lineRemark ?? '',
      product,
      unitPriceResolved: unitPrice,
    }
  })

  if (lineInputs.some((x) => x === null)) {
    return { ok: false, message: '存在无效 productId，请先 query_master_list 核对商品 id' }
  }

  const rows = lineInputs.filter((x): x is NonNullable<typeof x> => x !== null)

  const validatePayload = {
    supplierId: input.supplierId,
    warehouseId: input.warehouseId,
    orderDate,
    lines: rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      productCode: r.productCode,
      quantity: r.quantity,
      unitPrice: r.unitPriceResolved,
    })),
  }

  const validation = submit ? validateSubmit(validatePayload) : validateDraftSave(validatePayload)
  if (!validation.ok) {
    const hint = validation.firstErrorLabel ?? validation.linesAreaError ?? '校验未通过'
    return { ok: false, message: `采购单校验失败：${hint}` }
  }

  const supplier = getSupplierById(input.supplierId)
  const warehouse = getWarehouseById(input.warehouseId)
  if (!supplier) return { ok: false, message: '供应商不存在' }
  if (!warehouse) return { ok: false, message: '仓库不存在' }

  const orderId = nextPurchaseOrderId()
  const orderNo = nextPurchaseOrderNo(orderDate)
  const ts = nowString()
  const status: PurchaseOrder['status'] = submit ? 'PENDING_AUDIT' : 'DRAFT'

  const orderLines: PurchaseOrderLine[] = rows.map((r) => ({
    id: r.id,
    productId: r.product.id,
    productCode: r.product.productCode,
    productName: r.product.productName,
    barcode: r.product.barcode,
    specModel: r.product.specModel,
    unit: r.product.salesUnit,
    quantity: r.quantity,
    unitPrice: r.unitPriceResolved,
    taxRate: (r.taxRate as TaxRate) || '13%',
    lineAmount: lineAmount(r.quantity, r.unitPriceResolved),
    receivedQty: 0,
    lineRemark: r.lineRemark,
  }))

  const order: PurchaseOrder = {
    id: orderId,
    orderNo,
    supplierId: supplier.id,
    supplierCode: supplier.supplierCode,
    supplierName: supplier.supplierName,
    warehouseId: warehouse.id,
    warehouseCode: warehouse.warehouseCode,
    warehouseName: warehouse.warehouseName,
    orderDate,
    expectedArrivalDate: input.expectedArrivalDate?.trim() || null,
    status,
    remark: input.remark ?? '',
    lines: orderLines,
    skuCount: orderLines.length,
    totalQuantity: orderLines.reduce((s, l) => s + l.quantity, 0),
    totalAmount: Math.round(orderLines.reduce((s, l) => s + l.lineAmount, 0) * 100) / 100,
    inboundLinks: [],
    createdBy: 'AI 工作台',
    createdAt: ts,
    updatedBy: 'AI 工作台',
    updatedAt: ts,
    auditedBy: null,
    auditedAt: null,
  }

  upsertPurchaseOrder(order)

  const statusLabel = submit ? '已提交审核' : '草稿'
  return {
    ok: true,
    orderId,
    orderNo,
    status,
    message: `采购订单 ${orderNo} 已${statusLabel}创建（${orderLines.length} 行，合计 ¥${order.totalAmount}）`,
  }
}
