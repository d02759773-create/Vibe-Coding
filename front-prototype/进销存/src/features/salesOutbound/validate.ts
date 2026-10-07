import { todayDateString } from '@/features/salesOutbound/constants'
import type { SalesOutbound } from '@/features/salesOutbound/types'
import { getSalesOrderById, unshippedQty } from '@/features/salesOrders/storage'

export type OutboundValidationResult = {
  ok: boolean
  field?: string
  message?: string
  lineId?: string
}

function rejectQty(line: { pickedQty: number; shipQty: number }): number {
  return Math.max(0, line.pickedQty - line.shipQty)
}

export function recalcOutboundTotals(
  lines: SalesOutbound['lines'],
): Pick<SalesOutbound, 'totalReceivedQty' | 'totalShipQty' | 'totalRejectQty' | 'totalAmount'> {
  let totalReceivedQty = 0
  let totalShipQty = 0
  let totalRejectQty = 0
  let totalAmount = 0
  for (const line of lines) {
    totalReceivedQty += line.pickedQty
    totalShipQty += line.shipQty
    totalRejectQty += rejectQty(line)
    totalAmount += line.lineAmount
  }
  return {
    totalReceivedQty,
    totalShipQty,
    totalRejectQty,
    totalAmount: Math.round(totalAmount * 100) / 100,
  }
}

export function validateDraftSave(doc: SalesOutbound): OutboundValidationResult {
  if (!doc.salesOrderId) {
    return { ok: false, field: '关联销售订单号', message: '请选择销售订单' }
  }
  if (doc.outboundDate && doc.outboundDate > todayDateString()) {
    return { ok: false, field: '出库日期', message: '出库日期不能晚于今天' }
  }
  for (const line of doc.lines) {
    if (!Number.isInteger(line.pickedQty) || line.pickedQty < 0) {
      return { ok: false, field: '本次拣货数量', message: '请输入有效数量', lineId: line.id }
    }
    if (!Number.isInteger(line.shipQty) || line.shipQty < 0) {
      return { ok: false, field: '本次出库数量', message: '请输入有效数量', lineId: line.id }
    }
    if (line.shipQty > line.pickedQty) {
      return { ok: false, field: '本次出库数量', message: '本次出库数量不能大于本次拣货数量', lineId: line.id }
    }
    if (line.shipQty > line.refUnshippedQty) {
      return { ok: false, field: '本次出库数量', message: '本次出库数量不能超过未出库数量', lineId: line.id }
    }
  }
  return { ok: true }
}

export function validateConfirm(doc: SalesOutbound): OutboundValidationResult {
  const draft = validateDraftSave(doc)
  if (!draft.ok) return draft
  if (!doc.outboundDate) {
    return { ok: false, field: '出库日期', message: '请选择出库日期' }
  }
  if (doc.confirmBlocked) {
    return { ok: false, field: '关联销售订单号', message: '关联销售订单已关闭，无法确认出库' }
  }
  const order = getSalesOrderById(doc.salesOrderId)
  if (!order) {
    return { ok: false, field: '关联销售订单号', message: '销售订单不存在' }
  }
  if (!['PENDING_SHIPMENT', 'PARTIAL_SHIPMENT'].includes(order.status)) {
    return { ok: false, field: '关联销售订单号', message: '该销售订单当前不可确认出库' }
  }
  const hasStock = doc.lines.some((l) => l.shipQty > 0)
  if (!hasStock) {
    return { ok: false, field: '商品明细', message: '请至少填写一行本次出库数量' }
  }
  for (const line of doc.lines) {
    if (line.shipQty <= 0) continue
    const soLine = order.lines.find((l) => l.id === line.salesOrderLineId)
    if (!soLine) continue
    const max = unshippedQty(soLine)
    if (line.shipQty > max) {
      return { ok: false, field: '本次出库数量', message: '本次出库数量不能超过未出库数量', lineId: line.id }
    }
  }
  return { ok: true }
}

export function confirmFailureToast(result: OutboundValidationResult): string {
  if (result.field) return `确认失败，${result.field}不满足条件`
  return '确认失败，请检查表单'
}
