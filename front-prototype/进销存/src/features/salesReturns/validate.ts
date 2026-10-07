import type { SalesReturn, SalesReturnLine } from './types'

export function lineAmount(returnQty: number, unitPrice: number): number {
  return Math.round(returnQty * unitPrice * 100) / 100
}

export function recalcReturnTotals(lines: SalesReturnLine[]) {
  const totalReturnQty = lines.reduce((s, l) => s + l.returnQty, 0)
  const totalInboundQty = lines.reduce((s, l) => s + l.inboundQty, 0)
  const totalAmount = lines.reduce((s, l) => s + l.lineAmount, 0)
  return { totalReturnQty, totalInboundQty, totalAmount }
}

export function validateDraftSave(
  doc: SalesReturn,
  maxReturnable: (outboundLineId: string) => number,
): string | null {
  if (!doc.outboundId) return '请选择关联出库单'
  if (!doc.returnDate) return '请填写退货日期'
  const activeLines = doc.lines.filter((l) => l.returnQty > 0)
  if (!activeLines.length) return '请至少填写一行退货数量'
  for (const l of doc.lines) {
    if (l.returnQty < 0 || !Number.isInteger(l.returnQty)) return '退货数量须为非负整数'
    const max = maxReturnable(l.outboundLineId)
    if (l.returnQty > max) {
      return `${l.productCode} 退货数量不能超过可退数量 ${max}`
    }
  }
  return null
}

export function validateSubmit(
  doc: SalesReturn,
  maxReturnable: (outboundLineId: string) => number,
): string | null {
  const draftErr = validateDraftSave(doc, maxReturnable)
  if (draftErr) return draftErr
  if (!doc.returnReason.trim()) return '请填写退货原因'
  return null
}

export function submitFailureToast(err: string | null): string {
  return err ?? '提交失败'
}
