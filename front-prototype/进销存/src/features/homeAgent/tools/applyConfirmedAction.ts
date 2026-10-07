import { getCustomerById, listCustomers, persistCustomers } from '@/features/customers/storage'
import { getProductById, upsertProduct } from '@/features/products/storage'
import { getSupplierById, listSuppliers, persistSuppliers } from '@/features/suppliers/storage'
import { getWarehouseById, listWarehouses, persistWarehouses } from '@/features/warehouses/storage'
import {
  createPurchaseOrder,
  type CreatePurchaseOrderInput,
} from '../actions/createPurchaseOrder'
import type { ConfirmActionPayload } from '../types'
import { dataSourceMap } from './dataSources'

export function applyConfirmedAction(payload: ConfirmActionPayload): {
  ok: boolean
  message: string
  orderId?: string
  orderNo?: string
} {
  const { action, params } = payload

  if (action === 'disable_master') {
    const entity = String(params.entity ?? '')
    const id = String(params.id ?? '')
    const reason = String(params.reason ?? 'Agent 操作停用')
    if (!id) return { ok: false, message: '缺少 id' }

    if (entity === 'products') {
      const item = getProductById(id)
      if (!item) return { ok: false, message: '商品不存在' }
      upsertProduct({
        ...item,
        status: 'DISABLED',
        disableReason: reason,
      })
      return { ok: true, message: `已停用商品 ${item.productName}` }
    }
    if (entity === 'customers') {
      const item = getCustomerById(id)
      if (!item) return { ok: false, message: '客户不存在' }
      const all = listCustomers()
      const idx = all.findIndex((c) => c.id === id)
      if (idx < 0) return { ok: false, message: '客户不存在' }
      all[idx] = { ...item, status: 'DISABLED', disableReason: reason }
      persistCustomers(all)
      return { ok: true, message: `已停用客户 ${item.customerName}` }
    }
    if (entity === 'suppliers') {
      const item = getSupplierById(id)
      if (!item) return { ok: false, message: '供应商不存在' }
      const all = listSuppliers()
      const idx = all.findIndex((s) => s.id === id)
      if (idx < 0) return { ok: false, message: '供应商不存在' }
      all[idx] = { ...item, status: 'DISABLED', disableReason: reason }
      persistSuppliers(all)
      return { ok: true, message: `已停用供应商 ${item.supplierName}` }
    }
    if (entity === 'warehouses') {
      const item = getWarehouseById(id)
      if (!item) return { ok: false, message: '仓库不存在' }
      const all = listWarehouses()
      const idx = all.findIndex((w) => w.id === id)
      if (idx < 0) return { ok: false, message: '仓库不存在' }
      all[idx] = { ...item, status: 'DISABLED', disableReason: reason }
      persistWarehouses(all)
      return { ok: true, message: `已停用仓库 ${item.warehouseName}` }
    }
    return { ok: false, message: `不支持的 entity: ${entity}` }
  }

  if (action === 'create_purchase_order') {
    const input = params as CreatePurchaseOrderInput
    if (!input.supplierId || !input.warehouseId || !Array.isArray(input.lines) || input.lines.length === 0) {
      return { ok: false, message: '缺少 supplierId / warehouseId / lines' }
    }
    const result = createPurchaseOrder(input)
    if (!result.ok) return { ok: false, message: result.message }
    return {
      ok: true,
      message: result.message,
      orderId: result.orderId,
      orderNo: result.orderNo,
    }
  }

  if (action === 'export_entity_json') {
    const entity = String(params.entity ?? '')
    const limit = Math.min(Number(params.limit) || 100, 500)
    const source = dataSourceMap[entity]
    if (!source) {
      return { ok: false, message: `不支持的导出 entity: ${entity}` }
    }
    const items = source.list().slice(0, limit)
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entity}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    return { ok: true, message: `已导出 ${items.length} 条 ${entity} 数据` }
  }

  return { ok: false, message: `未知 action: ${action}` }
}
