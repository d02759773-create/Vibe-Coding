# 销售订单详情页业务说明

> 来源：销售订单_Demo_.md、主 PRD 动作矩阵

<!-- anno:start id=page-global -->
## 本页规则

- **路由**：`#/sales/orders/:id`。
- **只读**：非草稿状态字段只读；动作在页头/行内按钮。
- **关联单据**：跳转链接保持 Hash 路由。
<!-- anno:end id=page-global -->


<!-- anno:start id=1 -->
## 页头动作

来源：销售订单_Demo_.md 操作区

- 与列表行操作同源规则；删除/作废/确认类需二次确认。
<!-- anno:end id=1 -->


<!-- anno:start id=2 -->
## 基本信息与明细

来源：销售订单_Demo_.md 信息分组

- 展示字段以字段清单「详情可见」为准；空值展示 `-`。
<!-- anno:end id=2 -->


<!-- anno:start id=3 -->
## 制单信息

来源：字段清单系统字段

- 创建人/时间、最后修改人/时间只读。
<!-- anno:end id=3 -->

