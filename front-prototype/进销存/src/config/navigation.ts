export type NavItem = {
  title: string
  path?: string
  children?: NavItem[]
}

export const navigation: NavItem[] = [
  { title: 'AI 工作台', path: '/' },
  {
    title: '销售管理',
    children: [
      { title: '销售订单', path: '/sales/orders' },
      { title: '销售出库', path: '/sales/outbound' },
      { title: '销售退货单', path: '/sales/returns' },
      { title: '销售退货入库', path: '/sales/return-inbound' },
    ],
  },
  {
    title: '采购管理',
    children: [
      { title: '采购订单', path: '/purchase/orders' },
      { title: '采购入库', path: '/purchase/inbound' },
      { title: '采购退货单', path: '/purchase/returns' },
      { title: '采购退货出库', path: '/purchase/return-outbound' },
    ],
  },
  {
    title: '库存管理',
    children: [
      { title: '其他入库', path: '/inventory/other-inbound' },
      { title: '其他出库', path: '/inventory/other-outbound' },
      { title: '即时库存查询', path: '/inventory/on-hand' },
      { title: '库存流水查询', path: '/inventory/ledger' },
    ],
  },
  {
    title: '基础资料',
    children: [
      { title: '商品管理', path: '/master/products' },
      { title: '客户管理', path: '/master/customers' },
      { title: '供应商管理', path: '/master/suppliers' },
      { title: '仓库管理', path: '/master/warehouses' },
      { title: '物流管理', path: '/master/logistics' },
      { title: '数据字典', path: '/master/dictionaries' },
    ],
  },
]
