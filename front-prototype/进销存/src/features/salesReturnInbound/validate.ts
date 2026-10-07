import type { SalesReturnInbound, SalesReturnInboundLine } from './types'

export function lineAmount(inboundQty: number, unitPrice: number): number {
  return Math.round(inboundQty * unitPrice * 100) / 100
}

export function recalcInboundTotals(lines: SalesReturnInboundLine[]) {
  const totalInboundQty = lines.reduce((s, l) => s + l.inboundQty, 0)
  const totalAmount = lines.reduce((s, l) => s + l.lineAmount, 0)
  return { totalInboundQty, totalAmount }
}

export function validateDraftSave(doc: SalesReturnInbound): string | null {
  if (!doc.returnId) return '请选择关联退货单'
  if (!doc.inboundDate) return '请填写入库日期'
  for (const l of doc.lines) {
    if (l.inboundQty < 0 || !Number.isInteger(l.inboundQty)) return '入库数量须为非负整数'
    if (l.inboundQty > l.refUninboundQty) {
      return `${l.productCode} 入库数量不能超过未入库数量 ${l.refUninboundQty}`
    }
  }
  return null
}

export function validateConfirm(doc: SalesReturnInbound): string | null {
  const draftErr = validateDraftSave(doc)
  if (draftErr) return draftErr
  if (!doc.lines.some((l) => l.inboundQty > 0)) return '请至少填写一行入库数量'
  return null
}

export function confirmFailureToast(err: string | null): string {
  return err ?? '确认入库失败'
}
