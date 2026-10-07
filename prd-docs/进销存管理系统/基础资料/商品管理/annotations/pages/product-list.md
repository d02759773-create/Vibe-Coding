# 商品列表页业务说明

> 来源：《商品档案_前端Demo版PRD》

<!-- anno:start id=page-global -->
## 本页规则

- **路由**：`#/master/products`
- 主数据 **不提供删除**；停用替代。
- 启停用经行操作或详情，不在列表直接改状态字段。

<!-- anno:end id=page-global -->

<!-- anno:start id=1 -->
## 列表工具栏

- **新增商品**：进入 `/master/products/new`。

<!-- anno:end id=1 -->

<!-- anno:start id=2 -->
## 查询条件区

综合搜索（编码/名称/条码）、商品分类、状态（全部/启用/停用）；搜索应用条件，重置清空。

<!-- anno:end id=2 -->

<!-- anno:start id=3 -->
## 列表与分页

列见 Demo §2.2；行操作：查看 / 编辑 / 停用或启用。默认分页 10 条。

<!-- anno:end id=3 -->

<!-- anno:start id=4 -->
## 启停用弹窗

停用时弹窗内原因必填（最多 100 字）；启用为确认弹窗。

<!-- anno:end id=4 -->
