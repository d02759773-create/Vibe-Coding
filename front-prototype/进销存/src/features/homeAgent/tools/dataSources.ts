import { listCustomers } from '@/features/customers/storage'
import { listDictionaryTypes } from '@/features/dictionaries/storage'
import { listLogistics } from '@/features/logistics/storage'
import { listOtherInbounds } from '@/features/otherInbound/storage'
import { listOtherOutbounds } from '@/features/otherOutbound/storage'
import { listProducts } from '@/features/products/storage'
import { listPurchaseInbounds } from '@/features/purchaseInbound/storage'
import { listPurchaseOrders } from '@/features/purchaseOrders/storage'
import { listPurchaseReturnOutbounds } from '@/features/purchaseReturnOutbound/storage'
import { listPurchaseReturns } from '@/features/purchaseReturns/storage'
import { listSalesOrders } from '@/features/salesOrders/storage'
import { listSalesOutbounds } from '@/features/salesOutbound/storage'
import { listSalesReturnInbounds } from '@/features/salesReturnInbound/storage'
import { listSalesReturns } from '@/features/salesReturns/storage'
import { listSuppliers } from '@/features/suppliers/storage'
import { listWarehouses } from '@/features/warehouses/storage'

/** Agent 只读数据源：一处登记，query_master_list 与 export_entity_json 共用。 */
export type DataSourceCategory = 'master' | 'document'

export type DataSource = {
  /** 工具入参 entity 的取值 */
  key: string
  /** 中文名称，用于提示词与导出说明 */
  label: string
  category: DataSourceCategory
  list: () => Record<string, unknown>[]
}

function asRows<T>(fn: () => T[]): () => Record<string, unknown>[] {
  return () => fn() as unknown as Record<string, unknown>[]
}

export const dataSources: DataSource[] = [
  // —— 主数据 ——
  { key: 'products', label: '商品', category: 'master', list: asRows(listProducts) },
  { key: 'customers', label: '客户', category: 'master', list: asRows(listCustomers) },
  { key: 'suppliers', label: '供应商', category: 'master', list: asRows(listSuppliers) },
  { key: 'warehouses', label: '仓库', category: 'master', list: asRows(listWarehouses) },
  { key: 'logistics', label: '物流方式', category: 'master', list: asRows(listLogistics) },
  {
    key: 'dictionary_types',
    label: '数据字典类型',
    category: 'master',
    list: asRows(() => listDictionaryTypes()),
  },
  // —— 采购单据 ——
  { key: 'purchase_orders', label: '采购订单', category: 'document', list: asRows(listPurchaseOrders) },
  { key: 'purchase_inbound', label: '采购入库单', category: 'document', list: asRows(listPurchaseInbounds) },
  { key: 'purchase_returns', label: '采购退货单', category: 'document', list: asRows(listPurchaseReturns) },
  {
    key: 'purchase_return_outbound',
    label: '采购退货出库单',
    category: 'document',
    list: asRows(listPurchaseReturnOutbounds),
  },
  // —— 销售单据 ——
  { key: 'sales_orders', label: '销售订单', category: 'document', list: asRows(listSalesOrders) },
  { key: 'sales_outbound', label: '销售出库单', category: 'document', list: asRows(listSalesOutbounds) },
  { key: 'sales_returns', label: '销售退货单', category: 'document', list: asRows(listSalesReturns) },
  {
    key: 'sales_return_inbound',
    label: '销售退货入库单',
    category: 'document',
    list: asRows(listSalesReturnInbounds),
  },
  // —— 其他出入库 ——
  { key: 'other_inbound', label: '其他入库单', category: 'document', list: asRows(listOtherInbounds) },
  { key: 'other_outbound', label: '其他出库单', category: 'document', list: asRows(listOtherOutbounds) },
]

export const dataSourceMap: Record<string, DataSource> = Object.fromEntries(
  dataSources.map((d) => [d.key, d]),
)

/** 全部 entity key，用于工具 enum */
export const ENTITY_KEYS: string[] = dataSources.map((d) => d.key)

/** 生成「key(中文名)」清单文案，用于系统提示词与错误提示 */
export function describeDataSources(category?: DataSourceCategory): string {
  return dataSources
    .filter((d) => !category || d.category === category)
    .map((d) => `${d.key}(${d.label})`)
    .join('、')
}
