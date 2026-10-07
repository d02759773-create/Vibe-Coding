import { todayDateString } from '@/features/purchaseInbound/constants'
import type { PurchaseInbound } from '@/features/purchaseInbound/types'
import { getPurchaseOrderById, unreceivedQty } from '@/features/purchaseOrders/storage'

export type InboundValidationResult = {
  ok: boolean
  field?: string
  message?: string
  lineId?: string
}

function rejectQty(line: { receivedQty: number; stockInQty: number }): number {
  return Math.max(0, line.receivedQty - line.stockInQty)
}

export function recalcInboundTotals(
  lines: PurchaseInbound['lines'],
): Pick<PurchaseInbound, 'totalReceivedQty' | 'totalStockInQty' | 'totalRejectQty' | 'totalAmount'> {
  let totalReceivedQty = 0
  let totalStockInQty = 0
  let totalRejectQty = 0
  let totalAmount = 0
  for (const line of lines) {
    totalReceivedQty += line.receivedQty
    totalStockInQty += line.stockInQty
    totalRejectQty += rejectQty(line)
    totalAmount += line.lineAmount
  }
  return {
    totalReceivedQty,
    totalStockInQty,
    totalRejectQty,
    totalAmount: Math.round(totalAmount * 100) / 100,
  }
}

export function validateDraftSave(doc: PurchaseInbound): InboundValidationResult {
  if (!doc.purchaseOrderId) {
    return { ok: false, field: '关联采购单号', message: '请选择采购订单' }
  }
  if (doc.inboundDate && doc.inboundDate > todayDateString()) {
    return { ok: false, field: '入库日期', message: '入库日期不能晚于今天' }
  }
  for (const line of doc.lines) {
    if (!Number.isInteger(line.receivedQty) || line.receivedQty < 0) {
      return { ok: false, field: '本次实收数量', message: '请输入有效数量', lineId: line.id }
    }
    if (!Number.isInteger(line.stockInQty) || line.stockInQty < 0) {
      return { ok: false, field: '本次入库数量', message: '请输入有效数量', lineId: line.id }
    }
    if (line.stockInQty > line.receivedQty) {
      return { ok: false, field: '本次入库数量', message: '本次入库数量不能大于本次实收数量', lineId: line.id }
    }
    if (line.stockInQty > line.refUnreceivedQty) {
      return { ok: false, field: '本次入库数量', message: '本次入库数量不能超过未入库数量', lineId: line.id }
    }
  }
  return { ok: true }
}

export function validateConfirm(doc: PurchaseInbound): InboundValidationResult {
  const draft = validateDraftSave(doc)
  if (!draft.ok) return draft
  if (!doc.inboundDate) {
    return { ok: false, field: '入库日期', message: '请选择入库日期' }
  }
  if (doc.confirmBlocked) {
    return { ok: false, field: '关联采购单号', message: '关联采购订单已关闭，无法确认入库' }
  }
  const order = getPurchaseOrderById(doc.purchaseOrderId)
  if (!order) {
    return { ok: false, field: '关联采购单号', message: '采购订单不存在' }
  }
  if (!['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN'].includes(order.status)) {
    return { ok: false, field: '关联采购单号', message: '该采购订单当前不可确认入库' }
  }
  const hasStock = doc.lines.some((l) => l.stockInQty > 0)
  if (!hasStock) {
    return { ok: false, field: '商品明细', message: '请至少填写一行本次入库数量' }
  }
  for (const line of doc.lines) {
    if (line.stockInQty <= 0) continue
    const poLine = order.lines.find((l) => l.id === line.purchaseOrderLineId)
    if (!poLine) continue
    const max = unreceivedQty(poLine)
    if (line.stockInQty > max) {
      return { ok: false, field: '本次入库数量', message: '本次入库数量不能超过未入库数量', lineId: line.id }
    }
  }
  return { ok: true }
}

export function confirmFailureToast(result: InboundValidationResult): string {
  if (result.field) return `确认失败，${result.field}不满足条件`
  return '确认失败，请检查表单'
}
