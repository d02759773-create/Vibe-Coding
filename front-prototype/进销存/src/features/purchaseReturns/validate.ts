import type { PurchaseReturn, PurchaseReturnLine } from './types'

export function lineAmount(returnQty: number, unitPrice: number): number {
  return Math.round(returnQty * unitPrice * 100) / 100
}

export function recalcReturnTotals(lines: PurchaseReturnLine[]) {
  const totalReturnQty = lines.reduce((s, l) => s + l.returnQty, 0)
  const totalOutboundQty = lines.reduce((s, l) => s + l.outboundQty, 0)
  const totalAmount = lines.reduce((s, l) => s + l.lineAmount, 0)
  return { totalReturnQty, totalOutboundQty, totalAmount }
}

export function validateDraftSave(
  doc: PurchaseReturn,
  maxReturnable: (inboundLineId: string) => number,
): string | null {
  if (!doc.inboundId) return '请选择关联入库单'
  if (!doc.returnDate) return '请填写退货日期'
  const activeLines = doc.lines.filter((l) => l.returnQty > 0)
  if (!activeLines.length) return '请至少填写一行退货数量'
  for (const l of doc.lines) {
    if (l.returnQty < 0 || !Number.isInteger(l.returnQty)) return '退货数量须为非负整数'
    const max = maxReturnable(l.inboundLineId)
    if (l.returnQty > max) {
      return `${l.productCode} 退货数量不能超过可退数量 ${max}`
    }
  }
  return null
}

export function validateSubmit(
  doc: PurchaseReturn,
  maxReturnable: (inboundLineId: string) => number,
): string | null {
  const draftErr = validateDraftSave(doc, maxReturnable)
  if (draftErr) return draftErr
  if (!doc.returnReason.trim()) return '请填写退货原因'
  return null
}

export function submitFailureToast(err: string | null): string {
  return err ?? '提交失败'
}
