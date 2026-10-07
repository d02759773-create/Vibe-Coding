import type { OtherOutbound } from './types'
import { getOnHandQty } from '@/features/inventory/onHand'

export function recalcTotals(lines: OtherOutbound['lines']) {
  return { totalQty: lines.reduce((s, l) => s + l.qty, 0) }
}

export function validateDraft(doc: OtherOutbound): string | null {
  if (!doc.warehouseId) return '请选择出库仓库'
  if (!doc.outboundDate) return '请填写出库日期'
  if (!doc.reason) return '请选择出库原因'
  const active = doc.lines.filter((l) => l.qty > 0)
  if (!active.length) return '请至少一行出库数量大于 0'
  for (const l of doc.lines) {
    if (l.qty < 0 || !Number.isInteger(l.qty)) return '数量须为非负整数'
  }
  return null
}

export function validateConfirm(doc: OtherOutbound): string | null {
  const base = validateDraft(doc)
  if (base) return base
  for (const l of doc.lines) {
    if (l.qty <= 0) continue
    const onHand = getOnHandQty(doc.warehouseId, l.productId)
    if (l.qty > onHand) {
      return `${l.productCode} 出库数量不能超过即时库存 ${onHand}`
    }
  }
  return null
}
