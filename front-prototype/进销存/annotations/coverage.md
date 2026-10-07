# 页面标注需求映射矩阵

> 仅统计已声明需求 ID 的映射，不证明 PRD 完整性、来源有效性或 DOM 挂载成功。

| 模块 | 来源需求 | 来源位置 | 页面 | 标注Key | 状态 |
| --- | --- | --- | --- | --- | --- |
| purchase-inbound-global | `PI-G-BG` | ../采购入库单主PRD.md#1-业务背景 | #/purchase/inbound | `purchase-inbound-global:g-background` | 已映射 |
| purchase-inbound-global | `PI-G-SC` | ../采购入库单主PRD.md#4-业务场景 | #/purchase/inbound | `purchase-inbound-global:g-scenarios` | 已映射 |
| purchase-inbound-global | `PI-G-ST` | ../采购入库单主PRD.md#5-状态机 | #/purchase/inbound | `purchase-inbound-global:g-state` | 已映射 |
| purchase-inbound-global | `PI-G-AC` | ../采购入库单主PRD.md#6-动作能力矩阵 | #/purchase/inbound | `purchase-inbound-global:g-actions` | 已映射 |
| purchase-inbound-global | `PI-G-RU` | ../采购入库单主PRD.md#7-核心业务规则 | #/purchase/inbound | `purchase-inbound-global:g-rules` | 已映射 |
| purchase-inbound-global | `PI-G-PR` | ../采购入库单主PRD.md#8-权限设计 | #/purchase/inbound | `purchase-inbound-global:g-permission` | 已映射 |
| warehouse-list | `WH-LIST-TOOLBAR` | ../仓库档案_前端Demo版PRD.md#25-权限demo-占位 | #/master/warehouses | `warehouse-list:1` | 已映射 |
| warehouse-list | `WH-LIST-FILTER` | ../仓库档案_前端Demo版PRD.md#21-查询条件区 | #/master/warehouses | `warehouse-list:2` | 已映射 |
| warehouse-list | `WH-LIST-TABLE` | ../仓库档案_前端Demo版PRD.md#22-表格列定义 | #/master/warehouses | `warehouse-list:3` | 已映射 |
| warehouse-list | `WH-LIST-STATUS` | ../仓库档案主PRD.md#73-停用--启用 | #/master/warehouses | `warehouse-list:4` | 已映射 |
| purchase-inbound-list | `PURCHASE_INBOUND-GLOBAL` | ../采购入库单主PRD.md | #/purchase/inbound | `purchase-inbound-list:page-global` | 已映射 |
| purchase-inbound-list | `PURCHASE_INBOUND-LIST` | ../采购入库单_Demo_列表页.md | #/purchase/inbound | `purchase-inbound-list:1`, `purchase-inbound-list:2`, `purchase-inbound-list:3`, `purchase-inbound-list:4` | 已映射 |
| warehouse-detail | `WH-DETAIL-ACTIONS` | ../仓库档案_前端Demo版PRD.md#31-页面操作区 | #/master/warehouses/:id | `warehouse-detail:1` | 已映射 |
| warehouse-detail | `WH-DETAIL-FIELDS` | ../仓库档案_前端Demo版PRD.md#32-信息分组 | #/master/warehouses/:id | `warehouse-detail:2` | 已映射 |
| warehouse-detail | `WH-DETAIL-STATUS` | ../仓库档案主PRD.md#73-停用--启用 | #/master/warehouses/:id | `warehouse-detail:3` | 已映射 |
| purchase-inbound-form | `PURCHASE_INBOUND-FORM` | ../采购入库单_Demo_新增编辑页.md | #/purchase/inbound/new | `purchase-inbound-form:page-global`, `purchase-inbound-form:1`, `purchase-inbound-form:2`, `purchase-inbound-form:3` | 已映射 |
| warehouse-form | `WH-FORM-GLOBAL` | ../仓库档案_前端Demo版PRD.md#42-模式差异说明 | #/master/warehouses/new | `warehouse-form:1` | 已映射 |
| warehouse-form | `WH-FORM-BASIC` | ../仓库档案字段清单.md#一基础识别字段 | #/master/warehouses/new | `warehouse-form:2` | 已映射 |
| warehouse-form | `WH-FORM-CONTACT` | ../仓库档案字段清单.md#二联系与控制字段 | #/master/warehouses/new | `warehouse-form:3` | 已映射 |
| warehouse-form | `WH-FORM-SYSTEM` | ../仓库档案字段清单.md#三系统字段 | #/master/warehouses/:id/edit | `warehouse-form:4` | 已映射 |
| warehouse-form | `WH-FORM-ACTIONS` | ../仓库档案_前端Demo版PRD.md#43-底部操作 | #/master/warehouses/new | `warehouse-form:5` | 已映射 |
| purchase-inbound-detail | `PURCHASE_INBOUND-DETAIL` | ../采购入库单_Demo_详情页.md | #/purchase/inbound/:id | `purchase-inbound-detail:page-global`, `purchase-inbound-detail:1`, `purchase-inbound-detail:2`, `purchase-inbound-detail:3` | 已映射 |
| purchase-return-global | `PRT-G-BG` | ../采购退货单主PRD.md#1-业务背景 | #/purchase/returns | `purchase-return-global:g-background` | 已映射 |
| purchase-return-global | `PRT-G-SC` | ../采购退货单主PRD.md#8-验收要点 | #/purchase/returns | `purchase-return-global:g-scenarios` | 已映射 |
| purchase-return-global | `PRT-G-ST` | ../采购退货单主PRD.md#4-状态机 | #/purchase/returns | `purchase-return-global:g-state` | 已映射 |
| purchase-return-global | `PRT-G-AC` | ../采购退货单主PRD.md#5-动作矩阵摘要 | #/purchase/returns | `purchase-return-global:g-actions` | 已映射 |
| purchase-return-global | `PRT-G-RU` | ../采购退货单主PRD.md#6-核心业务规则 | #/purchase/returns | `purchase-return-global:g-rules` | 已映射 |
| purchase-return-global | `PRT-G-PR` | ../采购退货单主PRD.md#7-权限一期简化 | #/purchase/returns | `purchase-return-global:g-permission` | 已映射 |
| purchase-return-list | `PURCHASE_RETURN-GLOBAL` | ../采购退货单主PRD.md | #/purchase/returns | `purchase-return-list:page-global` | 已映射 |
| purchase-return-list | `PURCHASE_RETURN-LIST` | ../采购退货单_Demo_列表页.md | #/purchase/returns | `purchase-return-list:1`, `purchase-return-list:2`, `purchase-return-list:3`, `purchase-return-list:4` | 已映射 |
| purchase-return-form | `PURCHASE_RETURN-FORM` | ../采购退货单_Demo_新增编辑页.md | #/purchase/returns/new | `purchase-return-form:page-global`, `purchase-return-form:1`, `purchase-return-form:2`, `purchase-return-form:3` | 已映射 |
| purchase-return-detail | `PURCHASE_RETURN-DETAIL` | ../采购退货单_Demo_详情页.md | #/purchase/returns/:id | `purchase-return-detail:page-global`, `purchase-return-detail:1`, `purchase-return-detail:2`, `purchase-return-detail:3` | 已映射 |
| purchase-return-outbound-global | `PRO-G-BG` | ../采购退货出库单主PRD.md#1-业务背景 | #/purchase/return-outbound | `purchase-return-outbound-global:g-background` | 已映射 |
| purchase-return-outbound-global | `PRO-G-SC` | ../采购退货出库单主PRD.md#6-验收 | #/purchase/return-outbound | `purchase-return-outbound-global:g-scenarios` | 已映射 |
| purchase-return-outbound-global | `PRO-G-ST` | ../采购退货出库单主PRD.md#4-状态机 | #/purchase/return-outbound | `purchase-return-outbound-global:g-state` | 已映射 |
| purchase-return-outbound-global | `PRO-G-RU` | ../采购退货出库单主PRD.md#5-规则 | #/purchase/return-outbound | `purchase-return-outbound-global:g-actions`, `purchase-return-outbound-global:g-rules`, `purchase-return-outbound-global:g-permission` | 已映射 |
| purchase-return-outbound-list | `PURCHASE_RETURN_OUTBOUND-GLOBAL` | ../采购退货出库单主PRD.md | #/purchase/return-outbound | `purchase-return-outbound-list:page-global` | 已映射 |
| purchase-return-outbound-list | `PURCHASE_RETURN_OUTBOUND-LIST` | ../采购退货出库单_Demo_列表页.md | #/purchase/return-outbound | `purchase-return-outbound-list:1`, `purchase-return-outbound-list:2`, `purchase-return-outbound-list:3`, `purchase-return-outbound-list:4` | 已映射 |
| purchase-return-outbound-form | `PURCHASE_RETURN_OUTBOUND-FORM` | ../采购退货出库单_Demo_新增编辑页.md | #/purchase/return-outbound/new | `purchase-return-outbound-form:page-global`, `purchase-return-outbound-form:1`, `purchase-return-outbound-form:2`, `purchase-return-outbound-form:3` | 已映射 |
| purchase-order-global | `PO-G-BG` | ../采购订单主PRD.md#1-业务背景 | #/purchase/orders | `purchase-order-global:g-background` | 已映射 |
| purchase-order-global | `PO-G-SC` | ../采购订单主PRD.md#4-业务场景 | #/purchase/orders | `purchase-order-global:g-scenarios` | 已映射 |
| purchase-order-global | `PO-G-ST` | ../采购订单主PRD.md#5-状态机 | #/purchase/orders | `purchase-order-global:g-state` | 已映射 |
| purchase-order-global | `PO-G-AC` | ../采购订单主PRD.md#6-动作能力矩阵 | #/purchase/orders | `purchase-order-global:g-actions` | 已映射 |
| purchase-order-global | `PO-G-RU` | ../采购订单主PRD.md#7-核心业务规则 | #/purchase/orders | `purchase-order-global:g-rules` | 已映射 |
| purchase-order-global | `PO-G-PR` | ../采购订单主PRD.md#8-权限设计 | #/purchase/orders | `purchase-order-global:g-permission` | 已映射 |
| purchase-return-outbound-detail | `PURCHASE_RETURN_OUTBOUND-DETAIL` | ../采购退货出库单_Demo_详情页.md | #/purchase/return-outbound/:id | `purchase-return-outbound-detail:page-global`, `purchase-return-outbound-detail:1`, `purchase-return-outbound-detail:2`, `purchase-return-outbound-detail:3` | 已映射 |
| sales-order-global | `SO-G-BG` | ../销售订单主PRD.md#1-背景 | #/sales/orders | `sales-order-global:g-background` | 已映射 |
| sales-order-global | `SO-G-SC` | ../销售订单主PRD.md#2-范围 | #/sales/orders | `sales-order-global:g-background`, `sales-order-global:g-scenarios` | 已映射 |
| sales-order-global | `SO-G-ST` | ../销售订单主PRD.md#3-状态机 | #/sales/orders | `sales-order-global:g-state` | 已映射 |
| sales-order-global | `SO-G-AC` | ../销售订单主PRD.md#4-动作矩阵 | #/sales/orders | `sales-order-global:g-actions` | 已映射 |
| sales-order-global | `SO-G-RU` | ../销售订单主PRD.md#5-规则 | #/sales/orders | `sales-order-global:g-rules` | 已映射 |
| sales-order-global | `SO-G-PR` | ../销售订单_Demo_.md#八离开与阻断 | #/sales/orders | `sales-order-global:g-permission` | 已映射 |
| purchase-order-list | `PO-LIST-GLOBAL` | ../采购订单主PRD.md#5-状态机 | #/purchase/orders | `purchase-order-list:page-global` | 已映射 |
| purchase-order-list | `PO-LIST-TABS` | ../采购订单_Demo_列表页.md#二状态-tab-栏 | #/purchase/orders | `purchase-order-list:1` | 已映射 |
| purchase-order-list | `PO-LIST-FILTER` | ../采购订单_Demo_列表页.md#三查询区 | #/purchase/orders | `purchase-order-list:2` | 已映射 |
| purchase-order-list | `PO-LIST-TOOLBAR` | ../采购订单_Demo_列表页.md#四工具条 | #/purchase/orders | `purchase-order-list:3` | 已映射 |
| purchase-order-list | `PO-LIST-TABLE` | ../采购订单_Demo_列表页.md#五表格 | #/purchase/orders | `purchase-order-list:4` | 已映射 |
| purchase-order-list | `PO-LIST-ROW-SUBMIT` | ../采购订单_Demo_列表页.md#55-行内提交审核草稿 | #/purchase/orders | `purchase-order-list:4` | 已映射 |
| sales-order-list | `SALES_ORDER-GLOBAL` | ../销售订单主PRD.md | #/sales/orders | `sales-order-list:page-global` | 已映射 |
| sales-order-list | `SALES_ORDER-LIST` | ../销售订单_Demo_.md | #/sales/orders | `sales-order-list:1`, `sales-order-list:2`, `sales-order-list:3`, `sales-order-list:4` | 已映射 |
| purchase-order-form | `PO-FORM-GLOBAL` | ../采购订单_Demo_新增编辑页.md#八模式差异汇总 | #/purchase/orders/new | `purchase-order-form:page-global` | 已映射 |
| purchase-order-form | `PO-FORM-BASIC` | ../采购订单字段清单.md#一头部字段单据级 | #/purchase/orders/new | `purchase-order-form:1` | 已映射 |
| purchase-order-form | `PO-FORM-LINES` | ../采购订单字段清单.md#二商品明细字段行级 | #/purchase/orders/new | `purchase-order-form:2` | 已映射 |
| purchase-order-form | `PO-FORM-ACTIONS` | ../采购订单_Demo_新增编辑页.md#七操作行为说明 | #/purchase/orders/new | `purchase-order-form:3` | 已映射 |
| purchase-order-form | `PO-FORM-VALIDATION` | ../../../全局约束/全局字段校验与反馈规范.md#25-采购订单草稿保存-vs-提交审核分层 | #/purchase/orders/new | `purchase-order-form:page-global`, `purchase-order-form:1`, `purchase-order-form:2`, `purchase-order-form:3` | 已映射 |
| sales-order-form | `SALES_ORDER-FORM` | ../销售订单_Demo_.md | #/sales/orders/new | `sales-order-form:page-global`, `sales-order-form:1`, `sales-order-form:2`, `sales-order-form:3` | 已映射 |
| purchase-order-detail | `PO-DETAIL-GLOBAL` | ../采购订单主PRD.md#7-业务规则 | #/purchase/orders/:id | `purchase-order-detail:page-global` | 已映射 |
| purchase-order-detail | `PO-DETAIL-ACTIONS` | ../采购订单_Demo_详情页.md#21-页头操作按钮矩阵按状态 | #/purchase/orders/:id | `purchase-order-detail:1` | 已映射 |
| purchase-order-detail | `PO-DETAIL-BASIC` | ../采购订单_Demo_详情页.md#三基本信息卡片 | #/purchase/orders/:id | `purchase-order-detail:2` | 已映射 |
| purchase-order-detail | `PO-DETAIL-LINES` | ../采购订单_Demo_详情页.md#四商品明细卡片 | #/purchase/orders/:id | `purchase-order-detail:3` | 已映射 |
| purchase-order-detail | `PO-DETAIL-INBOUND` | ../采购订单_Demo_详情页.md#五关联单据卡片 | #/purchase/orders/:id | `purchase-order-detail:4` | 已映射 |
| purchase-order-detail | `PO-DETAIL-META` | ../采购订单字段清单.md#四系统字段 | #/purchase/orders/:id | `purchase-order-detail:5` | 已映射 |
| sales-order-detail | `SALES_ORDER-DETAIL` | ../销售订单_Demo_.md | #/sales/orders/:id | `sales-order-detail:page-global`, `sales-order-detail:1`, `sales-order-detail:2`, `sales-order-detail:3` | 已映射 |
| sales-outbound-global | `DO-G-BG` | ../销售出库主PRD.md | #/sales/outbound | `sales-outbound-global:g-background` | 已映射 |
| sales-outbound-global | `DO-G-ST` | ../销售出库主PRD.md | #/sales/outbound | `sales-outbound-global:g-state` | 已映射 |
| sales-outbound-global | `DO-G-RU` | ../销售出库主PRD.md | #/sales/outbound | `sales-outbound-global:g-actions`, `sales-outbound-global:g-rules` | 已映射 |
| sales-outbound-global | `DO-G-DEMO` | ../销售出库_Demo_.md | #/sales/outbound | `sales-outbound-global:g-scenarios`, `sales-outbound-global:g-permission` | 已映射 |
| sales-outbound-list | `SALES_OUTBOUND-GLOBAL` | ../销售出库主PRD.md | #/sales/outbound | `sales-outbound-list:page-global` | 已映射 |
| sales-outbound-list | `SALES_OUTBOUND-LIST` | ../销售出库_Demo_.md | #/sales/outbound | `sales-outbound-list:1`, `sales-outbound-list:2`, `sales-outbound-list:3`, `sales-outbound-list:4` | 已映射 |
| sales-outbound-form | `SALES_OUTBOUND-FORM` | ../销售出库_Demo_.md | #/sales/outbound/new | `sales-outbound-form:page-global`, `sales-outbound-form:1`, `sales-outbound-form:2`, `sales-outbound-form:3` | 已映射 |
| sales-outbound-detail | `SALES_OUTBOUND-DETAIL` | ../销售出库_Demo_.md | #/sales/outbound/:id | `sales-outbound-detail:page-global`, `sales-outbound-detail:1`, `sales-outbound-detail:2`, `sales-outbound-detail:3` | 已映射 |
| sales-return-global | `SRT-G-BG` | ../销售退货单主PRD.md | #/sales/returns | `sales-return-global:g-background`, `sales-return-global:g-state`, `sales-return-global:g-actions`, `sales-return-global:g-rules` | 已映射 |
| sales-return-global | `SRT-G-DEMO` | ../销售退货单_Demo_.md | #/sales/returns | `sales-return-global:g-scenarios`, `sales-return-global:g-permission` | 已映射 |
| sales-return-list | `SALES_RETURN-GLOBAL` | ../销售退货单主PRD.md | #/sales/returns | `sales-return-list:page-global` | 已映射 |
| sales-return-list | `SALES_RETURN-LIST` | ../销售退货单_Demo_.md | #/sales/returns | `sales-return-list:1`, `sales-return-list:2`, `sales-return-list:3`, `sales-return-list:4` | 已映射 |
| sales-return-form | `SALES_RETURN-FORM` | ../销售退货单_Demo_.md | #/sales/returns/new | `sales-return-form:page-global`, `sales-return-form:1`, `sales-return-form:2`, `sales-return-form:3` | 已映射 |
| sales-return-detail | `SALES_RETURN-DETAIL` | ../销售退货单_Demo_.md | #/sales/returns/:id | `sales-return-detail:page-global`, `sales-return-detail:1`, `sales-return-detail:2`, `sales-return-detail:3` | 已映射 |
| sales-return-inbound-global | `SRI-G-BG` | ../销售退货入库主PRD.md | #/sales/return-inbound | `sales-return-inbound-global:g-background`, `sales-return-inbound-global:g-state`, `sales-return-inbound-global:g-actions`, `sales-return-inbound-global:g-rules` | 已映射 |
| sales-return-inbound-global | `SRI-G-DEMO` | ../销售退货入库_Demo_.md | #/sales/return-inbound | `sales-return-inbound-global:g-scenarios`, `sales-return-inbound-global:g-permission` | 已映射 |
| sales-return-inbound-list | `SALES_RETURN_INBOUND-GLOBAL` | ../销售退货入库主PRD.md | #/sales/return-inbound | `sales-return-inbound-list:page-global` | 已映射 |
| sales-return-inbound-list | `SALES_RETURN_INBOUND-LIST` | ../销售退货入库_Demo_.md | #/sales/return-inbound | `sales-return-inbound-list:1`, `sales-return-inbound-list:2`, `sales-return-inbound-list:3`, `sales-return-inbound-list:4` | 已映射 |
| sales-return-inbound-form | `SALES_RETURN_INBOUND-FORM` | ../销售退货入库_Demo_.md | #/sales/return-inbound/new | `sales-return-inbound-form:page-global`, `sales-return-inbound-form:1`, `sales-return-inbound-form:2`, `sales-return-inbound-form:3` | 已映射 |
| sales-return-inbound-detail | `SALES_RETURN_INBOUND-DETAIL` | ../销售退货入库_Demo_.md | #/sales/return-inbound/:id | `sales-return-inbound-detail:page-global`, `sales-return-inbound-detail:1`, `sales-return-inbound-detail:2`, `sales-return-inbound-detail:3` | 已映射 |
| other-inbound-global | `OIN-G-BG` | ../其他入库-业务流程推演.md | #/inventory/other-inbound | `other-inbound-global:g-background`, `other-inbound-global:g-permission` | 已映射 |
| other-inbound-global | `OIN-G-ST` | ../其他入库-业务流程推演.md | #/inventory/other-inbound | `other-inbound-global:g-state`, `other-inbound-global:g-actions` | 已映射 |
| other-inbound-global | `OIN-G-FL` | ../其他入库字段清单.md | #/inventory/other-inbound | `other-inbound-global:g-rules` | 已映射 |
| other-inbound-list | `OTHER_INBOUND-GLOBAL` | ../其他入库主PRD.md | #/inventory/other-inbound | `other-inbound-list:page-global` | 已映射 |
| other-inbound-list | `OTHER_INBOUND-LIST` | ../其他入库_Demo_列表页.md | #/inventory/other-inbound | `other-inbound-list:1`, `other-inbound-list:2`, `other-inbound-list:3`, `other-inbound-list:4` | 已映射 |
| other-inbound-form | `OTHER_INBOUND-FORM` | ../其他入库_Demo_新增编辑页.md | #/inventory/other-inbound/new | `other-inbound-form:page-global`, `other-inbound-form:1`, `other-inbound-form:2`, `other-inbound-form:3` | 已映射 |
| other-inbound-detail | `OTHER_INBOUND-DETAIL` | ../其他入库_Demo_详情页.md | #/inventory/other-inbound/:id | `other-inbound-detail:page-global`, `other-inbound-detail:1`, `other-inbound-detail:2`, `other-inbound-detail:3` | 已映射 |
| other-outbound-global | `OOUT-G-BG` | ../其他出库-业务流程推演.md | #/inventory/other-outbound | `other-outbound-global:g-background`, `other-outbound-global:g-permission` | 已映射 |
| other-outbound-global | `OOUT-G-ST` | ../其他出库-业务流程推演.md | #/inventory/other-outbound | `other-outbound-global:g-state`, `other-outbound-global:g-actions` | 已映射 |
| other-outbound-global | `OOUT-G-FL` | ../其他出库字段清单.md | #/inventory/other-outbound | `other-outbound-global:g-rules` | 已映射 |
| other-outbound-list | `OTHER_OUTBOUND-GLOBAL` | ../其他出库主PRD.md | #/inventory/other-outbound | `other-outbound-list:page-global` | 已映射 |
| other-outbound-list | `OTHER_OUTBOUND-LIST` | ../其他出库_Demo_列表页.md | #/inventory/other-outbound | `other-outbound-list:1`, `other-outbound-list:2`, `other-outbound-list:3`, `other-outbound-list:4` | 已映射 |
| other-outbound-form | `OTHER_OUTBOUND-FORM` | ../其他出库_Demo_新增编辑页.md | #/inventory/other-outbound/new | `other-outbound-form:page-global`, `other-outbound-form:1`, `other-outbound-form:2`, `other-outbound-form:3` | 已映射 |
| other-outbound-detail | `OTHER_OUTBOUND-DETAIL` | ../其他出库_Demo_详情页.md | #/inventory/other-outbound/:id | `other-outbound-detail:page-global`, `other-outbound-detail:1`, `other-outbound-detail:2`, `other-outbound-detail:3` | 已映射 |
| product-list | `PRD-LIST-TOOLBAR` | ../商品档案_前端Demo版PRD.md#二列表页规范 | #/master/products | `product-list:page-global`, `product-list:1` | 已映射 |
| product-list | `PRD-LIST-FILTER` | ../商品档案_前端Demo版PRD.md#21-查询条件区 | #/master/products | `product-list:2` | 已映射 |
| product-list | `PRD-LIST-TABLE` | ../商品档案_前端Demo版PRD.md#22-表格列定义 | #/master/products | `product-list:3` | 已映射 |
| product-list | `PRD-LIST-STATUS` | ../商品档案_前端Demo版PRD.md#22-表格列定义 | #/master/products | `product-list:4` | 已映射 |
| customer-list | `CUST-LIST-TOOLBAR` | ../客户档案_前端Demo版PRD.md#二列表页规范 | #/master/customers | `customer-list:page-global`, `customer-list:1` | 已映射 |
| customer-list | `CUST-LIST-FILTER` | ../客户档案_前端Demo版PRD.md#二列表页规范 | #/master/customers | `customer-list:2` | 已映射 |
| customer-list | `CUST-LIST-TABLE` | ../客户档案_前端Demo版PRD.md#二列表页规范 | #/master/customers | `customer-list:3` | 已映射 |
| customer-list | `CUST-LIST-STATUS` | ../客户档案_前端Demo版PRD.md#六校验与保存规则 | #/master/customers | `customer-list:4` | 已映射 |
| supplier-list | `SUP-LIST-TOOLBAR` | ../供应商档案_前端Demo版PRD.md#二列表页规范 | #/master/suppliers | `supplier-list:page-global`, `supplier-list:1` | 已映射 |
| supplier-list | `SUP-LIST-FILTER` | ../供应商档案_前端Demo版PRD.md#二列表页规范 | #/master/suppliers | `supplier-list:2` | 已映射 |
| supplier-list | `SUP-LIST-TABLE` | ../供应商档案_前端Demo版PRD.md#二列表页规范 | #/master/suppliers | `supplier-list:3` | 已映射 |
| supplier-list | `SUP-LIST-STATUS` | ../供应商档案_前端Demo版PRD.md#六校验与保存规则 | #/master/suppliers | `supplier-list:4` | 已映射 |
| logistics-list | `LOG-LIST-TOOLBAR` | ../物流管理_前端Demo版PRD.md#二列表页规范 | #/master/logistics | `logistics-list:page-global`, `logistics-list:1` | 已映射 |
| logistics-list | `LOG-LIST-FILTER` | ../物流管理_前端Demo版PRD.md#二列表页规范 | #/master/logistics | `logistics-list:2` | 已映射 |
| logistics-list | `LOG-LIST-TABLE` | ../物流管理_前端Demo版PRD.md#二列表页规范 | #/master/logistics | `logistics-list:3` | 已映射 |
| logistics-list | `LOG-LIST-STATUS` | ../物流管理_前端Demo版PRD.md#六校验与保存规则 | #/master/logistics | `logistics-list:4` | 已映射 |
| dictionaries-list | `DICTIONARIES_LIST-LIST` | ../数据字典_前端Demo版PRD.md | #/master/dictionaries | `dictionaries-list:page-global`, `dictionaries-list:1` | 已映射 |
| inventory-on-hand | `INVENTORY_ON_HAND-LIST` | ../即时库存查询_Demo_列表页.md | #/inventory/on-hand | `inventory-on-hand:page-global`, `inventory-on-hand:1` | 已映射 |
| inventory-ledger | `INVENTORY_LEDGER-LIST` | ../库存流水查询_Demo_列表页.md | #/inventory/ledger | `inventory-ledger:page-global`, `inventory-ledger:1` | 已映射 |
| product-form | `PRD-FORM-GLOBAL` | ../商品档案_前端Demo版PRD.md#42-模式差异说明 | #/master/products/new | `product-form:1` | 已映射 |
| product-form | `PRD-FORM-BASIC` | ../商品档案_前端Demo版PRD.md#41-字段控件与显隐规则 | #/master/products/new | `product-form:2` | 已映射 |
| product-form | `PRD-FORM-PRICE` | ../商品档案字段清单.md | #/master/products/new | `product-form:3` | 已映射 |
| product-form | `PRD-FORM-SYSTEM` | ../商品档案_前端Demo版PRD.md#42-模式差异说明 | #/master/products/:id/edit | `product-form:4` | 已映射 |
| product-form | `PRD-FORM-ACTIONS` | ../商品档案_前端Demo版PRD.md#四新增--编辑页规范 | #/master/products/new | `product-form:5` | 已映射 |
| product-detail | `PRD-DETAIL-ACTIONS` | ../商品档案_前端Demo版PRD.md#31-页面操作区 | #/master/products/:id | `product-detail:1` | 已映射 |
| product-detail | `PRD-DETAIL-FIELDS` | ../商品档案_前端Demo版PRD.md#32-信息分组 | #/master/products/:id | `product-detail:2` | 已映射 |
| product-detail | `PRD-DETAIL-STATUS` | ../商品档案_前端Demo版PRD.md#22-表格列定义 | #/master/products/:id | `product-detail:3` | 已映射 |
| customer-form | `CUST-FORM-GLOBAL` | ../客户档案_前端Demo版PRD.md#四新增--编辑页规范 | #/master/customers/new | `customer-form:1` | 已映射 |
| customer-form | `CUST-FORM-BASIC` | ../客户档案_前端Demo版PRD.md#四新增--编辑页规范 | #/master/customers/new | `customer-form:2` | 已映射 |
| customer-form | `CUST-FORM-SETTLE` | ../客户档案字段清单.md | #/master/customers/new | `customer-form:3` | 已映射 |
| customer-form | `CUST-FORM-SYSTEM` | ../客户档案_前端Demo版PRD.md#四新增--编辑页规范 | #/master/customers/:id/edit | `customer-form:4` | 已映射 |
| customer-form | `CUST-FORM-ACTIONS` | ../客户档案_前端Demo版PRD.md#七反馈规范 | #/master/customers/new | `customer-form:5` | 已映射 |
| customer-detail | `CUST-DETAIL-ACTIONS` | ../客户档案_前端Demo版PRD.md#三查看页规范 | #/master/customers/:id | `customer-detail:1` | 已映射 |
| customer-detail | `CUST-DETAIL-FIELDS` | ../客户档案_前端Demo版PRD.md#三查看页规范 | #/master/customers/:id | `customer-detail:2` | 已映射 |
| customer-detail | `CUST-DETAIL-STATUS` | ../客户档案_前端Demo版PRD.md#六校验与保存规则 | #/master/customers/:id | `customer-detail:3` | 已映射 |
| supplier-form | `SUP-FORM-GLOBAL` | ../供应商档案_前端Demo版PRD.md#四新增--编辑页规范 | #/master/suppliers/new | `supplier-form:1` | 已映射 |
| supplier-form | `SUP-FORM-BASIC` | ../供应商档案_前端Demo版PRD.md#四新增--编辑页规范 | #/master/suppliers/new | `supplier-form:2` | 已映射 |
| supplier-form | `SUP-FORM-SETTLE` | ../供应商档案字段清单.md | #/master/suppliers/new | `supplier-form:3` | 已映射 |
| supplier-form | `SUP-FORM-SYSTEM` | ../供应商档案_前端Demo版PRD.md#四新增--编辑页规范 | #/master/suppliers/:id/edit | `supplier-form:4` | 已映射 |
| supplier-form | `SUP-FORM-ACTIONS` | ../供应商档案_前端Demo版PRD.md#七反馈规范 | #/master/suppliers/new | `supplier-form:5` | 已映射 |
| supplier-detail | `SUP-DETAIL-ACTIONS` | ../供应商档案_前端Demo版PRD.md#三查看页规范 | #/master/suppliers/:id | `supplier-detail:1` | 已映射 |
| supplier-detail | `SUP-DETAIL-FIELDS` | ../供应商档案_前端Demo版PRD.md#三查看页规范 | #/master/suppliers/:id | `supplier-detail:2` | 已映射 |
| supplier-detail | `SUP-DETAIL-STATUS` | ../供应商档案_前端Demo版PRD.md#六校验与保存规则 | #/master/suppliers/:id | `supplier-detail:3` | 已映射 |
| logistics-form | `LOG-FORM-GLOBAL` | ../物流管理_前端Demo版PRD.md#四新增--编辑页规范 | #/master/logistics/new | `logistics-form:1` | 已映射 |
| logistics-form | `LOG-FORM-BASIC` | ../物流管理_前端Demo版PRD.md#四新增--编辑页规范 | #/master/logistics/new | `logistics-form:2` | 已映射 |
| logistics-form | `LOG-FORM-SYSTEM` | ../物流管理_前端Demo版PRD.md#四新增--编辑页规范 | #/master/logistics/:id/edit | `logistics-form:3` | 已映射 |
| logistics-form | `LOG-FORM-ACTIONS` | ../物流管理_前端Demo版PRD.md#七反馈规范 | #/master/logistics/new | `logistics-form:4` | 已映射 |
| logistics-detail | `LOG-DETAIL-ACTIONS` | ../物流管理_前端Demo版PRD.md#三查看页规范 | #/master/logistics/:id | `logistics-detail:1` | 已映射 |
| logistics-detail | `LOG-DETAIL-FIELDS` | ../物流管理_前端Demo版PRD.md#三查看页规范 | #/master/logistics/:id | `logistics-detail:2` | 已映射 |
| logistics-detail | `LOG-DETAIL-STATUS` | ../物流管理_前端Demo版PRD.md#六校验与保存规则 | #/master/logistics/:id | `logistics-detail:3` | 已映射 |
