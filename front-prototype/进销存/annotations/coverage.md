# 页面标注需求映射矩阵

> 仅统计已声明需求 ID 的映射，不证明 PRD 完整性、来源有效性或 DOM 挂载成功。

| 模块 | 来源需求 | 来源位置 | 页面 | 标注Key | 状态 |
| --- | --- | --- | --- | --- | --- |
| warehouse-list | `WH-LIST-TOOLBAR` | ../仓库档案_前端Demo版PRD.md#25-权限demo-占位 | #/master/warehouses | `warehouse-list:1` | 已映射 |
| warehouse-list | `WH-LIST-FILTER` | ../仓库档案_前端Demo版PRD.md#21-查询条件区 | #/master/warehouses | `warehouse-list:2` | 已映射 |
| warehouse-list | `WH-LIST-TABLE` | ../仓库档案_前端Demo版PRD.md#22-表格列定义 | #/master/warehouses | `warehouse-list:3` | 已映射 |
| warehouse-list | `WH-LIST-STATUS` | ../仓库档案主PRD.md#73-停用--启用 | #/master/warehouses | `warehouse-list:4` | 已映射 |
| warehouse-detail | `WH-DETAIL-ACTIONS` | ../仓库档案_前端Demo版PRD.md#31-页面操作区 | #/master/warehouses/:id | `warehouse-detail:1` | 已映射 |
| warehouse-detail | `WH-DETAIL-FIELDS` | ../仓库档案_前端Demo版PRD.md#32-信息分组 | #/master/warehouses/:id | `warehouse-detail:2` | 已映射 |
| warehouse-detail | `WH-DETAIL-STATUS` | ../仓库档案主PRD.md#73-停用--启用 | #/master/warehouses/:id | `warehouse-detail:3` | 已映射 |
| warehouse-form | `WH-FORM-GLOBAL` | ../仓库档案_前端Demo版PRD.md#42-模式差异说明 | #/master/warehouses/new | `warehouse-form:1` | 已映射 |
| warehouse-form | `WH-FORM-BASIC` | ../仓库档案字段清单.md#一基础识别字段 | #/master/warehouses/new | `warehouse-form:2` | 已映射 |
| warehouse-form | `WH-FORM-CONTACT` | ../仓库档案字段清单.md#二联系与控制字段 | #/master/warehouses/new | `warehouse-form:3` | 已映射 |
| warehouse-form | `WH-FORM-SYSTEM` | ../仓库档案字段清单.md#三系统字段 | #/master/warehouses/:id/edit | `warehouse-form:4` | 已映射 |
| warehouse-form | `WH-FORM-ACTIONS` | ../仓库档案_前端Demo版PRD.md#43-底部操作 | #/master/warehouses/new | `warehouse-form:5` | 已映射 |
| purchase-order-global | `PO-G-BG` | ../采购订单主PRD.md#1-业务背景 | #/purchase/orders | `purchase-order-global:g-background` | 已映射 |
| purchase-order-global | `PO-G-SC` | ../采购订单主PRD.md#4-业务场景 | #/purchase/orders | `purchase-order-global:g-scenarios` | 已映射 |
| purchase-order-global | `PO-G-ST` | ../采购订单主PRD.md#5-状态机 | #/purchase/orders | `purchase-order-global:g-state` | 已映射 |
| purchase-order-global | `PO-G-AC` | ../采购订单主PRD.md#6-动作能力矩阵 | #/purchase/orders | `purchase-order-global:g-actions` | 已映射 |
| purchase-order-global | `PO-G-RU` | ../采购订单主PRD.md#7-核心业务规则 | #/purchase/orders | `purchase-order-global:g-rules` | 已映射 |
| purchase-order-global | `PO-G-PR` | ../采购订单主PRD.md#8-权限设计 | #/purchase/orders | `purchase-order-global:g-permission` | 已映射 |
| purchase-order-list | `PO-LIST-GLOBAL` | ../采购订单主PRD.md#5-状态机 | #/purchase/orders | `purchase-order-list:page-global` | 已映射 |
| purchase-order-list | `PO-LIST-TABS` | ../采购订单_Demo_列表页.md#二状态-tab-栏 | #/purchase/orders | `purchase-order-list:1` | 已映射 |
| purchase-order-list | `PO-LIST-FILTER` | ../采购订单_Demo_列表页.md#三查询区 | #/purchase/orders | `purchase-order-list:2` | 已映射 |
| purchase-order-list | `PO-LIST-TOOLBAR` | ../采购订单_Demo_列表页.md#四工具条 | #/purchase/orders | `purchase-order-list:3` | 已映射 |
| purchase-order-list | `PO-LIST-TABLE` | ../采购订单_Demo_列表页.md#五表格 | #/purchase/orders | `purchase-order-list:4` | 已映射 |
| purchase-order-list | `PO-LIST-ROW-SUBMIT` | ../采购订单_Demo_列表页.md#55-行内提交审核草稿 | #/purchase/orders | `purchase-order-list:4` | 已映射 |
| purchase-order-form | `PO-FORM-GLOBAL` | ../采购订单_Demo_新增编辑页.md#八模式差异汇总 | #/purchase/orders/new | `purchase-order-form:page-global` | 已映射 |
| purchase-order-form | `PO-FORM-BASIC` | ../采购订单字段清单.md#一头部字段单据级 | #/purchase/orders/new | `purchase-order-form:1` | 已映射 |
| purchase-order-form | `PO-FORM-LINES` | ../采购订单字段清单.md#二商品明细字段行级 | #/purchase/orders/new | `purchase-order-form:2` | 已映射 |
| purchase-order-form | `PO-FORM-ACTIONS` | ../采购订单_Demo_新增编辑页.md#七操作行为说明 | #/purchase/orders/new | `purchase-order-form:3` | 已映射 |
| purchase-order-form | `PO-FORM-VALIDATION` | ../../../全局约束/全局字段校验与反馈规范.md#25-采购订单草稿保存-vs-提交审核分层 | #/purchase/orders/new | `purchase-order-form:page-global`, `purchase-order-form:1`, `purchase-order-form:2`, `purchase-order-form:3` | 已映射 |
| purchase-order-detail | `PO-DETAIL-GLOBAL` | ../采购订单主PRD.md#7-业务规则 | #/purchase/orders/:id | `purchase-order-detail:page-global` | 已映射 |
| purchase-order-detail | `PO-DETAIL-ACTIONS` | ../采购订单_Demo_详情页.md#21-页头操作按钮矩阵按状态 | #/purchase/orders/:id | `purchase-order-detail:1` | 已映射 |
| purchase-order-detail | `PO-DETAIL-BASIC` | ../采购订单_Demo_详情页.md#三基本信息卡片 | #/purchase/orders/:id | `purchase-order-detail:2` | 已映射 |
| purchase-order-detail | `PO-DETAIL-LINES` | ../采购订单_Demo_详情页.md#四商品明细卡片 | #/purchase/orders/:id | `purchase-order-detail:3` | 已映射 |
| purchase-order-detail | `PO-DETAIL-INBOUND` | ../采购订单_Demo_详情页.md#五关联单据卡片 | #/purchase/orders/:id | `purchase-order-detail:4` | 已映射 |
| purchase-order-detail | `PO-DETAIL-META` | ../采购订单字段清单.md#四系统字段 | #/purchase/orders/:id | `purchase-order-detail:5` | 已映射 |
