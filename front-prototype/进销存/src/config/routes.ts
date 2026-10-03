export type RouteMeta = {
  path: string
  title: string
  message?: string
}

const salesOrderMessage = '销售订单页面将在下一步生成'

export const routeMetaList: RouteMeta[] = [
  { path: '/', title: '首页' },
  {
    path: '/sales/orders',
    title: '销售订单',
    message: salesOrderMessage,
  },
  {
    path: '/sales/orders/new',
    title: '新增销售订单',
    message: salesOrderMessage,
  },
  {
    path: '/sales/orders/:id',
    title: '销售订单详情',
    message: salesOrderMessage,
  },
  {
    path: '/sales/orders/:id/edit',
    title: '编辑销售订单',
    message: salesOrderMessage,
  },
  { path: '/sales/outbound', title: '销售出库' },
  { path: '/sales/returns', title: '销售退货单' },
  { path: '/sales/return-inbound', title: '销售退货入库' },
  { path: '/purchase/orders', title: '采购订单' },
  { path: '/purchase/inbound', title: '采购入库' },
  { path: '/purchase/returns', title: '采购退货单' },
  { path: '/purchase/return-outbound', title: '采购退货出库' },
  { path: '/inventory/other-inbound', title: '其他入库' },
  { path: '/inventory/other-outbound', title: '其他出库' },
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
    return {
      path: pathname,
      title: '编辑销售订单',
      message: salesOrderMessage,
    }
  }
  if (/^\/sales\/orders\/[^/]+$/.test(pathname) && pathname !== '/sales/orders/new') {
    return {
      path: pathname,
      title: '销售订单详情',
      message: salesOrderMessage,
    }
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
