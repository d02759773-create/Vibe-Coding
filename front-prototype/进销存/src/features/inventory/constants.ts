import type { InventoryBizType } from './types'

export const BIZ_TYPE_LABEL: Record<InventoryBizType, string> = {
  PURCHASE_IN: '采购入库',
  PURCHASE_RETURN_OUT: '采购退货出库',
  SALES_OUT: '销售出库',
  SALES_RETURN_IN: '销售退货入库',
  OTHER_IN: '其他入库',
  OTHER_OUT: '其他出库',
}

export const BIZ_TYPE_OPTIONS = Object.entries(BIZ_TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}))

export function partnerLabel(code: string, name: string): string {
  return `${code} ${name}`.trim()
}
