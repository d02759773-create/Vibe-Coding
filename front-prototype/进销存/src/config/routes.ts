export type RouteMeta = {
  path: string
  title: string
  message?: string
}

export const routeMetaList: RouteMeta[] = [
  { path: '/', title: 'AI 工作台' },
  { path: '/sales/orders', title: '销售订单' },
  { path: '/sales/orders/new', title: '新增销售订单' },
  { path: '/sales/outbound', title: '销售出库' },
  { path: '/sales/outbound/new', title: '新增销售出库单' },
  { path: '/sales/returns', title: '销售退货单' },
  { path: '/sales/returns/new', title: '新增销售退货单' },
  { path: '/sales/return-inbound', title: '销售退货入库' },
  { path: '/sales/return-inbound/new', title: '新增销售退货入库单' },
  { path: '/purchase/orders', title: '采购订单' },
  { path: '/purchase/inbound', title: '采购入库' },
  { path: '/purchase/inbound/new', title: '新增采购入库单' },
  { path: '/purchase/inbound/:id', title: '采购入库单详情' },
  { path: '/purchase/inbound/:id/edit', title: '编辑采购入库单' },
  { path: '/purchase/returns', title: '采购退货单' },
  { path: '/purchase/returns/new', title: '新增采购退货单' },
  { path: '/purchase/return-outbound', title: '采购退货出库' },
  { path: '/purchase/return-outbound/new', title: '新增退货出库单' },
  { path: '/inventory/other-inbound', title: '其他入库' },
  { path: '/inventory/other-inbound/new', title: '新增其他入库' },
  { path: '/inventory/other-outbound', title: '其他出库' },
  { path: '/inventory/other-outbound/new', title: '新增其他出库' },
  { path: '/inventory/on-hand', title: '即时库存查询' },
  { path: '/inventory/ledger', title: '库存流水查询' },
  { path: '/master/products', title: '商品管理' },
  { path: '/master/products/new', title: '新增商品' },
  { path: '/master/products/:id', title: '商品详情' },
  { path: '/master/products/:id/edit', title: '编辑商品' },
  { path: '/master/customers', title: '客户管理' },
  { path: '/master/suppliers', title: '供应商管理' },
  { path: '/master/suppliers/new', title: '新增供应商' },
  { path: '/master/suppliers/:id', title: '供应商详情' },
  { path: '/master/suppliers/:id/edit', title: '编辑供应商' },
  { path: '/master/warehouses', title: '仓库管理' },
  { path: '/master/warehouses/new', title: '新增仓库' },
  { path: '/master/warehouses/:id', title: '仓库详情' },
  { path: '/master/warehouses/:id/edit', title: '编辑仓库' },
  { path: '/master/logistics', title: '物流管理' },
  { path: '/master/logistics/new', title: '新增物流' },
  { path: '/master/logistics/:id', title: '物流详情' },
  { path: '/master/logistics/:id/edit', title: '编辑物流' },
  { path: '/master/dictionaries', title: '数据字典' },
]

export function getRouteMeta(pathname: string): RouteMeta {
  const exact = routeMetaList.find((item) => item.path === pathname)
  if (exact) return exact

  if (/^\/sales\/orders\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑销售订单' }
  }
  if (/^\/sales\/orders\/[^/]+$/.test(pathname) && pathname !== '/sales/orders/new') {
    return { path: pathname, title: '销售订单详情' }
  }
  if (pathname === '/sales/outbound/new') {
    return { path: pathname, title: '新增销售出库单' }
  }
  if (/^\/sales\/outbound\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑销售出库单' }
  }
  if (/^\/sales\/outbound\/[^/]+$/.test(pathname) && pathname !== '/sales/outbound/new') {
    return { path: pathname, title: '销售出库单详情' }
  }
  if (pathname === '/sales/returns/new') {
    return { path: pathname, title: '新增销售退货单' }
  }
  if (/^\/sales\/returns\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑销售退货单' }
  }
  if (/^\/sales\/returns\/[^/]+$/.test(pathname) && pathname !== '/sales/returns/new') {
    return { path: pathname, title: '销售退货单详情' }
  }
  if (pathname === '/sales/return-inbound/new') {
    return { path: pathname, title: '新增销售退货入库单' }
  }
  if (/^\/sales\/return-inbound\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑销售退货入库单' }
  }
  if (/^\/sales\/return-inbound\/[^/]+$/.test(pathname) && pathname !== '/sales/return-inbound/new') {
    return { path: pathname, title: '销售退货入库单详情' }
  }

  if (pathname === '/master/products/new') {
    return { path: pathname, title: '新增商品' }
  }
  if (/^\/master\/products\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑商品' }
  }
  if (/^\/master\/products\/[^/]+$/.test(pathname) && pathname !== '/master/products/new') {
    return { path: pathname, title: '商品详情' }
  }

  if (pathname === '/master/suppliers/new') {
    return { path: pathname, title: '新增供应商' }
  }
  if (/^\/master\/suppliers\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑供应商' }
  }
  if (/^\/master\/suppliers\/[^/]+$/.test(pathname) && pathname !== '/master/suppliers/new') {
    return { path: pathname, title: '供应商详情' }
  }

  if (pathname === '/master/warehouses/new') {
    return { path: pathname, title: '新增仓库' }
  }
  if (/^\/master\/warehouses\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑仓库' }
  }
  if (/^\/master\/warehouses\/[^/]+$/.test(pathname) && pathname !== '/master/warehouses/new') {
    return { path: pathname, title: '仓库详情' }
  }

  if (pathname === '/purchase/inbound/new') {
    return { path: pathname, title: '新增采购入库单' }
  }
  if (/^\/purchase\/inbound\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑采购入库单' }
  }
  if (/^\/purchase\/inbound\/[^/]+$/.test(pathname) && pathname !== '/purchase/inbound/new') {
    return { path: pathname, title: '采购入库单详情' }
  }

  if (pathname === '/purchase/returns/new') {
    return { path: pathname, title: '新增采购退货单' }
  }
  if (/^\/purchase\/returns\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑采购退货单' }
  }
  if (/^\/purchase\/returns\/[^/]+$/.test(pathname) && pathname !== '/purchase/returns/new') {
    return { path: pathname, title: '采购退货单详情' }
  }

  if (pathname === '/inventory/other-inbound/new') {
    return { path: pathname, title: '新增其他入库' }
  }
  if (/^\/inventory\/other-inbound\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑其他入库' }
  }
  if (/^\/inventory\/other-inbound\/[^/]+$/.test(pathname) && pathname !== '/inventory/other-inbound/new') {
    return { path: pathname, title: '其他入库详情' }
  }
  if (pathname === '/inventory/other-outbound/new') {
    return { path: pathname, title: '新增其他出库' }
  }
  if (/^\/inventory\/other-outbound\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑其他出库' }
  }
  if (/^\/inventory\/other-outbound\/[^/]+$/.test(pathname) && pathname !== '/inventory/other-outbound/new') {
    return { path: pathname, title: '其他出库详情' }
  }

  if (pathname === '/purchase/return-outbound/new') {
    return { path: pathname, title: '新增退货出库单' }
  }
  if (/^\/purchase\/return-outbound\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑退货出库单' }
  }
  if (/^\/purchase\/return-outbound\/[^/]+$/.test(pathname) && pathname !== '/purchase/return-outbound/new') {
    return { path: pathname, title: '退货出库单详情' }
  }

  if (pathname === '/master/logistics/new') {
    return { path: pathname, title: '新增物流' }
  }
  if (/^\/master\/logistics\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, title: '编辑物流' }
  }
  if (/^\/master\/logistics\/[^/]+$/.test(pathname) && pathname !== '/master/logistics/new') {
    return { path: pathname, title: '物流详情' }
  }

  return { path: pathname, title: '页面建设中' }
}
