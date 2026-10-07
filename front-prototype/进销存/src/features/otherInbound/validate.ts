import type { OtherInbound } from './types'

export function recalcTotals(lines: OtherInbound['lines']) {
  return { totalQty: lines.reduce((s, l) => s + l.qty, 0) }
}

export function validateDraft(doc: OtherInbound): string | null {
  if (!doc.warehouseId) return '请选择入库仓库'
  if (!doc.inboundDate) return '请填写入库日期'
  if (!doc.reason) return '请选择入库原因'
  const active = doc.lines.filter((l) => l.qty > 0)
  if (!active.length) return '请至少一行入库数量大于 0'
  for (const l of doc.lines) {
    if (l.qty < 0 || !Number.isInteger(l.qty)) return '数量须为非负整数'
  }
  return null
}

export function validateConfirm(doc: OtherInbound): string | null {
  return validateDraft(doc)
}
