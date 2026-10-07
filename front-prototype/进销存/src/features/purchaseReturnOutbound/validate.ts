import type { PurchaseReturnOutbound, PurchaseReturnOutboundLine } from './types'

export function lineAmount(outboundQty: number, unitPrice: number): number {
  return Math.round(outboundQty * unitPrice * 100) / 100
}

export function recalcOutboundTotals(lines: PurchaseReturnOutboundLine[]) {
  const totalOutboundQty = lines.reduce((s, l) => s + l.outboundQty, 0)
  const totalAmount = lines.reduce((s, l) => s + l.lineAmount, 0)
  return { totalOutboundQty, totalAmount }
}

export function validateDraftSave(doc: PurchaseReturnOutbound): string | null {
  if (!doc.returnId) return '请选择关联退货单'
  if (!doc.outboundDate) return '请填写出库日期'
  for (const l of doc.lines) {
    if (l.outboundQty < 0 || !Number.isInteger(l.outboundQty)) return '出库数量须为非负整数'
    if (l.outboundQty > l.refUnoutboundQty) {
      return `${l.productCode} 出库数量不能超过未出库数量 ${l.refUnoutboundQty}`
    }
  }
  return null
}

export function validateConfirm(doc: PurchaseReturnOutbound): string | null {
  const draftErr = validateDraftSave(doc)
  if (draftErr) return draftErr
  if (!doc.lines.some((l) => l.outboundQty > 0)) return '请至少填写一行出库数量'
  return null
}

export function confirmFailureToast(err: string | null): string {
  return err ?? '确认出库失败'
}
