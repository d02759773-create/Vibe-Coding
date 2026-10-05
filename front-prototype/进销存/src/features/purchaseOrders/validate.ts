import { todayDateString } from '@/features/purchaseOrders/constants'
import type { PurchaseOrder, PurchaseOrderLine } from '@/features/purchaseOrders/types'

export const MAX_LINE_QTY = 9_999_999

export type LineFieldErrors = { quantity?: string; unitPrice?: string }

export type PurchaseOrderValidationResult = {
  ok: boolean
  fieldErrors: Record<string, string>
  lineErrors: Record<string, LineFieldErrors>
  linesAreaError?: string
  /** 首个失败项展示名，用于 Toast「提交失败，{字段名}不满足条件」 */
  firstErrorLabel?: string
}

type LineInput = Pick<PurchaseOrderLine, 'id' | 'productId' | 'productCode' | 'quantity' | 'unitPrice'>

function validLines(lines: LineInput[]): LineInput[] {
  return lines.filter((l) => l.productId)
}

function validateLineDraftRules(line: LineInput): LineFieldErrors {
  const err: LineFieldErrors = {}
  if (line.quantity <= 0 || !Number.isInteger(line.quantity)) {
    err.quantity = '数量必须大于0'
  } else if (line.quantity > MAX_LINE_QTY) {
    err.quantity = '采购数量不能超过 9,999,999'
  }
  if (line.unitPrice < 0) {
    err.unitPrice = '单价不能为负数'
  }
  return err
}

/** 草稿「保存」：头部可空；已选商品行须通过数量/单价规则 */
export function validateDraftSave(input: {
  lines: LineInput[]
}): PurchaseOrderValidationResult {
  const lineErrors: Record<string, LineFieldErrors> = {}
  let firstErrorLabel: string | undefined

  for (const line of validLines(input.lines)) {
    const le = validateLineDraftRules(line)
    if (le.quantity || le.unitPrice) {
      lineErrors[line.id] = le
      if (!firstErrorLabel) firstErrorLabel = le.quantity ? '采购数量' : '单价（含税）'
    }
  }

  return {
    ok: Object.keys(lineErrors).length === 0,
    fieldErrors: {},
    lineErrors,
    firstErrorLabel,
  }
}

/** 「保存并提交」/ 列表·详情「提交审核」 */
export function validateSubmit(input: {
  supplierId: string
  warehouseId: string
  orderDate: string
  lines: LineInput[]
}): PurchaseOrderValidationResult {
  const fieldErrors: Record<string, string> = {}
  const lineErrors: Record<string, LineFieldErrors> = {}
  let linesAreaError: string | undefined
  let firstErrorLabel: string | undefined

  const setFirst = (label: string) => {
    if (!firstErrorLabel) firstErrorLabel = label
  }

  if (!input.supplierId) {
    fieldErrors.supplierId = '请选择供应商'
    setFirst('供应商')
  }
  if (!input.warehouseId) {
    fieldErrors.warehouseId = '请选择入库仓库'
    setFirst('入库仓库')
  }
  if (input.orderDate > todayDateString()) {
    fieldErrors.orderDate = '下单日期不能晚于今天'
    setFirst('下单日期')
  }

  const rows = validLines(input.lines)
  if (rows.length === 0) {
    linesAreaError = '请至少添加一行有效商品'
    setFirst('商品明细')
  }

  const codes = rows.map((l) => l.productCode).filter(Boolean)
  if (codes.length > new Set(codes).size) {
    linesAreaError = '存在重复的商品编码，请合并或删除重复行'
    setFirst('商品明细')
  }

  for (const line of rows) {
    const le: LineFieldErrors = {}
    if (line.quantity <= 0 || !Number.isInteger(line.quantity)) {
      le.quantity = line.quantity <= 0 ? '采购数量不可为 0' : '数量必须大于0'
      setFirst('采购数量')
    } else if (line.quantity > MAX_LINE_QTY) {
      le.quantity = '采购数量不能超过 9,999,999'
      setFirst('采购数量')
    }
    if (line.unitPrice < 0) {
      le.unitPrice = '单价不能为负数'
      setFirst('单价（含税）')
    } else if (Number.isNaN(line.unitPrice)) {
      le.unitPrice = '请填写单价'
      setFirst('单价（含税）')
    }
    if (Object.keys(le).length) lineErrors[line.id] = le
  }

  const ok =
    Object.keys(fieldErrors).length === 0 &&
    !linesAreaError &&
    Object.keys(lineErrors).length === 0

  return { ok, fieldErrors, lineErrors, linesAreaError, firstErrorLabel }
}

export function validateOrderForSubmit(order: PurchaseOrder): PurchaseOrderValidationResult {
  return validateSubmit({
    supplierId: order.supplierId,
    warehouseId: order.warehouseId,
    orderDate: order.orderDate,
    lines: order.lines,
  })
}

export function submitFailureToast(result: PurchaseOrderValidationResult): string {
  const name = result.firstErrorLabel ?? '单据信息'
  return `提交失败，${name}不满足条件`
}
