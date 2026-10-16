export type NavItem = {
  title: string
  path?: string
  children?: NavItem[]
}

/**
 * 左侧全量菜单：一级/二级顺序与命名对齐 context/跨境电商ERP/06 §零、§十一。
 */
export const sidebarNavigation: NavItem[] = [
  { title: '首页', path: '/' },
  {
    title: '生产',
    children: [
      { title: 'BOM 管理', path: '/mfg/bom' },
      { title: '生产制单', path: '/mfg/production-order' },
      { title: '替代料审批', path: '/mfg/substitute-approval' },
    ],
  },
  {
    title: '产品',
    children: [
      { title: '产品管理', path: '/product/manage' },
      { title: 'Listing', path: '/product/listing' },
      { title: '批量铺货', path: '/product/bulk-listing' },
    ],
  },
  {
    title: '订单',
    children: [
      { title: '平台订单', path: '/order/platform' },
      { title: '售后单', path: '/order/after-sale' },
    ],
  },
  {
    title: '采购',
    children: [
      { title: '补货建议', path: '/purchase/replenish-suggestion' },
      { title: '采购需求', path: '/purchase/demand' },
      { title: '委外派单', path: '/purchase/dispatch' },
      { title: '成衣采购单', path: '/purchase/garment-po' },
      { title: '采购收货通知单', path: '/purchase/receiving-notice' },
      { title: '成衣采购退货', path: '/purchase/garment-return' },
      { title: '退货发货通知单', path: '/purchase/return-dispatch-notice' },
    ],
  },
  {
    title: '仓储',
    children: [
      { title: '收货', path: '/warehouse/receiving' },
      { title: '拆包清单', path: '/warehouse/unpack-list' },
      { title: '质检', path: '/warehouse/inspection' },
      { title: '压气贴标', path: '/warehouse/press-label' },
      { title: '上架', path: '/warehouse/putaway' },
      { title: '拣货下架', path: '/warehouse/pick-off-shelf' },
      { title: '装箱', path: '/warehouse/packing' },
      { title: '贴箱唛', path: '/warehouse/box-label' },
      { title: '称重', path: '/warehouse/weighing' },
      { title: '出库', path: '/warehouse/outbound' },
      { title: '入库异常', path: '/warehouse/inbound-exception' },
    ],
  },
  {
    title: 'FBA',
    children: [
      { title: 'FBA 发货计划', path: '/fba/shipment-plan' },
      { title: '发货单', path: '/fba/shipment-order' },
      { title: '改仓/改箱审批', path: '/fba/rebox-approval' },
    ],
  },
  {
    title: '库存',
    children: [
      { title: '国内仓库存', path: '/inventory/domestic' },
      { title: '头程在途', path: '/inventory/in-transit' },
      { title: 'FBA 库存', path: '/inventory/fba' },
      { title: '库存流水', path: '/inventory/ledger' },
    ],
  },
  {
    title: '财务',
    children: [
      { title: '委外加工费账单', path: '/finance/garment-processing-bill' },
      { title: '物流费用', path: '/finance/logistics-fee' },
      { title: 'Amazon 回款对账', path: '/finance/amazon-payout' },
      { title: '汇率配置', path: '/finance/exchange-rate' },
    ],
  },
  {
    title: '资料',
    children: [
      { title: '品牌管理', path: '/master/brand' },
      { title: '分类管理', path: '/master/category' },
      { title: '面料管理', path: '/master/fabric' },
      { title: '辅料管理', path: '/master/accessory' },
      { title: '规格管理', path: '/master/spec' },
      { title: '单位管理', path: '/master/unit' },
      { title: '库位管理', path: '/master/location' },
      { title: '成衣供应商', path: '/master/garment-supplier' },
      { title: '原辅料供应商', path: '/master/material-supplier' },
      { title: '物流商', path: '/master/logistics' },
      { title: '仓库管理', path: '/master/warehouse' },
    ],
  },
  {
    title: '设置',
    children: [
      { title: '用户与角色', path: '/settings/users' },
      { title: '质检规则', path: '/settings/inspection-rules' },
      { title: '操作日志', path: '/settings/audit-log' },
      { title: '补货与派单参数', path: '/settings/replenish-dispatch-params' },
      { title: '供应商账号', path: '/settings/supplier-accounts' },
      { title: '店铺与授权', path: '/settings/shops' },
    ],
  },
  {
    title: '供应商协同（外部）',
    children: [
      { title: '成衣厂 · 我的成衣采购单', path: '/portal/garment/po' },
      { title: '成衣厂 · 交期与异常', path: '/portal/garment/exception' },
      { title: '成衣厂 · 收货通知单', path: '/portal/garment/receiving-notice' },
      { title: '成衣厂 · 发货通知单（退货）', path: '/portal/garment/return-dispatch-notice' },
      { title: '成衣厂 · 生产进度', path: '/portal/garment/progress' },
      { title: '成衣厂 · 加工费对账单', path: '/portal/garment/settlement' },
      { title: '面辅料厂 · 用料需求', path: '/portal/fabric/material-demand' },
      { title: '面辅料厂 · 供料确认', path: '/portal/fabric/supply-confirm' },
      { title: '面辅料厂 · 收货通知单', path: '/portal/fabric/receiving-notice' },
      { title: '面辅料厂 · 发货登记', path: '/portal/fabric/shipment' },
      { title: '面辅料厂 · 发货通知单（退货）', path: '/portal/fabric/return-dispatch-notice' },
      { title: '面辅料厂 · 要货/领料协同', path: '/portal/fabric/requisition' },
      { title: '面辅料厂 · 换料与异议', path: '/portal/fabric/substitute' },
    ],
  },
]
