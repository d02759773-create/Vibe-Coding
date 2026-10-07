#!/usr/bin/env python3
"""Generate annotation configs + page markdown for ERP prototype modules (idempotent)."""
from __future__ import annotations

import json
import re
from pathlib import Path

PROTOTYPE = Path(__file__).resolve().parents[2]
REPO = PROTOTYPE.parents[1]
PRD_ROOT = REPO / "prd-docs" / "进销存管理系统"
WORKSPACE = PROTOTYPE / "annotations" / "annotation.workspace.json"

SKIP_PREFIXES = {
    "采购管理/采购订单",
    "基础资料/仓库管理",
}


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9-]+", "-", s.lower()).strip("-")


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return
    path.write_text(text, encoding="utf-8")


def md_block(block_id: str, body: str) -> str:
    return f"<!-- anno:start id={block_id} -->\n{body.strip()}\n<!-- anno:end id={block_id} -->\n"


def list_page_md(title: str, route: str, demo_rel: str, main_rel: str) -> str:
    return f"""# {title}列表页业务说明

> 来源：《{main_rel}》、{demo_rel}

{md_block("page-global", f"""## 本页规则

- **路由**：`#{route}`（HashRouter）。
- **职责**：查询、状态 Tab（若有）、行内动作入口；状态变更仅经按钮/行操作，不在表单直接改状态字段。
- **不可用操作**：与主 PRD 动作矩阵一致时，原型采用**不渲染**（非灰色禁用）。
- **待确认**：权限、导出字段范围、批量操作若主 PRD 未写，标注保留待确认。""")}

{md_block("1", f"""## 状态 Tab

来源：{demo_rel} §二（若有）

- 切换 Tab 重置页码；非「全部」时隐藏查询区「单据状态」类字段（与采购订单列表同口径）。
- 计数：`名称 N`，超过 99 为 `99+`。""")}

{md_block("2", f"""## 查询区

来源：{demo_rel} §三、字段清单可筛选列

- 点击搜索应用条件；重置清空。
- 多值单号：换行/逗号精确匹配（若 Demo 声明）。""")}

{md_block("3", f"""## 工具条

来源：{demo_rel} §四

- **新增**：跳转同模块 `/new`。
- **导出**：无勾选导出当前筛选；有勾选导出选中（原型 Toast 模拟）。""")}

{md_block("4", f"""## 列表与行操作

来源：{demo_rel} §五–§六、主 PRD 动作矩阵

- 列定义与排序以 Demo 为准；行操作二次确认见 Demo §六。
- 提交/审核/确认类动作：loading 防重复；失败反馈见全局规范或模块 Demo。""")}
"""


def form_page_md(title: str, route_base: str, demo_rel: str) -> str:
    return f"""# {title}新增/编辑页业务说明

> 来源：{demo_rel}、字段清单

{md_block("page-global", f"""## 本页规则

- **路由**：`#{route_base}/new`、`#{route_base}/:id/edit`。
- **模式**：新增可编辑；编辑仅草稿（或 Demo 声明的可编辑状态）。
- **保存**：草稿宽松/严格以 Demo 与全局规范为准；**提交审核**失败：字段红字 + Toast `提交失败，{{字段名}}不满足条件`（若模块适用）。
- **离开**：未保存变更离开需确认（若 Demo 声明）。""")}

{md_block("1", f"""## 基本信息

来源：字段清单表头区；{demo_rel} 基本信息区

- 主数据下拉仅展示启用档案；编码类字段格式见全局规范 G-*。""")}

{md_block("2", f"""## 商品明细

来源：字段清单明细区

- 数量/单价精度与上限见字段清单；行金额按模块规则计算（只读）。
- 选品弹窗：已选 SKU 不可重复（若模块声明）。""")}

{md_block("3", f"""## 底部操作

来源：{demo_rel} 底部按钮区

- 保存 / 保存并提交（若有）：点击后 loading 至结束。""")}
"""


def detail_page_md(title: str, route_base: str, demo_rel: str) -> str:
    return f"""# {title}详情页业务说明

> 来源：{demo_rel}、主 PRD 动作矩阵

{md_block("page-global", f"""## 本页规则

- **路由**：`#{route_base}/:id`。
- **只读**：非草稿状态字段只读；动作在页头/行内按钮。
- **关联单据**：跳转链接保持 Hash 路由。""")}

{md_block("1", f"""## 页头动作

来源：{demo_rel} 操作区

- 与列表行操作同源规则；删除/作废/确认类需二次确认。""")}

{md_block("2", f"""## 基本信息与明细

来源：{demo_rel} 信息分组

- 展示字段以字段清单「详情可见」为准；空值展示 `-`。""")}

{md_block("3", f"""## 制单信息

来源：字段清单系统字段

- 创建人/时间、最后修改人/时间只读。""")}
"""


def master_list_md(title: str, route: str, demo_file: str) -> str:
    demo_rel = f"../{demo_file}"
    return f"""# {title}列表业务说明

> 来源：{demo_rel}

{md_block("page-global", f"""## 本页规则

- **路由**：`#{route}`。
- **主数据**：不提供删除，仅停用/启用（若适用）。""")}

{md_block("1", f"""## 工具条

来源：{demo_rel} 列表工具区

- 新增跳转 `/new`；导出/导入若 Demo 声明则按 Demo。""")}

{md_block("2", f"""## 查询条件

来源：{demo_rel} 查询区

- 关键字/分类/状态筛选；搜索与重置行为见 Demo。""")}

{md_block("3", f"""## 列表与行操作

来源：{demo_rel} 表格列

- 编码链至详情；启停用二次确认与原因（停用）见 Demo。""")}
"""


def config_list(scope: str, title: str, route: str, prefix: str, demo_list: str, main_pr: str) -> dict:
    rid = scope.upper().replace("-", "_")
    reqs = [
        {"id": f"{rid}-GLOBAL", "source": f"../{main_pr}", "page": f"#{route}"},
        {"id": f"{rid}-LIST", "source": f"../{demo_list}", "page": f"#{route}"},
    ]
    ann = [
        {
            "id": "page-global",
            "type": "page-global",
            "order": 0,
            "page": f"#{route}",
            "moduleName": "本页规则",
            "markdownFile": f"pages/{scope}-list.md",
            "blockId": "page-global",
            "sourceRefs": [f"{rid}-GLOBAL"],
        },
        {
            "id": "1",
            "order": 1,
            "page": f"#{route}",
            "moduleName": "状态 Tab",
            "target": {"selector": f"[data-anno='{prefix}-tabs']", "fallbackSelectors": []},
            "markdownFile": f"pages/{scope}-list.md",
            "blockId": "1",
            "sourceRefs": [f"{rid}-LIST"],
        },
        {
            "id": "2",
            "order": 2,
            "page": f"#{route}",
            "moduleName": "查询区",
            "target": {"selector": f"[data-anno='{prefix}-filters']", "fallbackSelectors": []},
            "markdownFile": f"pages/{scope}-list.md",
            "blockId": "2",
            "sourceRefs": [f"{rid}-LIST"],
        },
        {
            "id": "3",
            "order": 3,
            "page": f"#{route}",
            "moduleName": "工具条",
            "target": {"selector": f"[data-anno='{prefix}-list-toolbar']", "fallbackSelectors": []},
            "markdownFile": f"pages/{scope}-list.md",
            "blockId": "3",
            "sourceRefs": [f"{rid}-LIST"],
        },
        {
            "id": "4",
            "order": 4,
            "page": f"#{route}",
            "moduleName": "列表与行操作",
            "target": {"selector": f"[data-anno='{prefix}-table']", "fallbackSelectors": []},
            "markdownFile": f"pages/{scope}-list.md",
            "blockId": "4",
            "sourceRefs": [f"{rid}-LIST"],
        },
    ]
    return {
        "version": 1,
        "title": f"{title}-列表页",
        "scope": f"{scope}-list",
        "sourceBase": ".",
        "mermaid": {"enabled": True, "src": "", "options": {}},
        "sourceRequirements": reqs,
        "annotations": ann,
    }


def config_form(scope: str, title: str, route_base: str, form_prefix: str, demo_form: str) -> dict:
    rid = scope.upper().replace("-", "_")
    matcher = f"(^#|^/#)/{route_base}(/new|/[^/]+/edit)"
    page = f"#/{route_base}/new"
    reqs = [{"id": f"{rid}-FORM", "source": f"../{demo_form}", "page": page}]
    ann = [
        {
            "id": "page-global",
            "type": "page-global",
            "order": 0,
            "page": page,
            "routeMatcher": matcher,
            "moduleName": "本页规则",
            "markdownFile": f"pages/{scope}-form.md",
            "blockId": "page-global",
            "sourceRefs": [f"{rid}-FORM"],
        },
        {
            "id": "1",
            "order": 1,
            "page": page,
            "routeMatcher": matcher,
            "moduleName": "基本信息",
            "target": {"selector": f"[data-anno='{form_prefix}-basic']", "fallbackSelectors": [f"[data-anno='{form_prefix}']"]},
            "markdownFile": f"pages/{scope}-form.md",
            "blockId": "1",
            "sourceRefs": [f"{rid}-FORM"],
        },
        {
            "id": "2",
            "order": 2,
            "page": page,
            "routeMatcher": matcher,
            "moduleName": "商品明细",
            "target": {"selector": f"[data-anno='{form_prefix}-lines']", "fallbackSelectors": [f"[data-anno='{form_prefix}']"]},
            "markdownFile": f"pages/{scope}-form.md",
            "blockId": "2",
            "sourceRefs": [f"{rid}-FORM"],
        },
        {
            "id": "3",
            "order": 3,
            "page": page,
            "routeMatcher": matcher,
            "moduleName": "底部操作",
            "target": {"selector": f"[data-anno='{form_prefix}-actions']", "fallbackSelectors": [f"[data-anno='{form_prefix}']"]},
            "markdownFile": f"pages/{scope}-form.md",
            "blockId": "3",
            "sourceRefs": [f"{rid}-FORM"],
        },
    ]
    return {
        "version": 1,
        "title": f"{title}-新增编辑页",
        "scope": f"{scope}-form",
        "sourceBase": ".",
        "mermaid": {"enabled": True, "src": "", "options": {}},
        "sourceRequirements": reqs,
        "annotations": ann,
    }


def config_detail(scope: str, title: str, route_base: str, detail_prefix: str, demo_detail: str) -> dict:
    rid = scope.upper().replace("-", "_")
    matcher = f"(^#|^/#)/{route_base}/[^/]+$"
    page = f"#/{route_base}/:id"
    reqs = [{"id": f"{rid}-DETAIL", "source": f"../{demo_detail}", "page": page}]
    ann = [
        {
            "id": "page-global",
            "type": "page-global",
            "order": 0,
            "page": page,
            "routeMatcher": matcher,
            "moduleName": "本页规则",
            "markdownFile": f"pages/{scope}-detail.md",
            "blockId": "page-global",
            "sourceRefs": [f"{rid}-DETAIL"],
        },
        {
            "id": "1",
            "order": 1,
            "page": page,
            "routeMatcher": matcher,
            "moduleName": "页头动作",
            "target": {"selector": f"[data-anno='{detail_prefix}-actions']", "fallbackSelectors": [f"[data-anno='{detail_prefix}']"]},
            "markdownFile": f"pages/{scope}-detail.md",
            "blockId": "1",
            "sourceRefs": [f"{rid}-DETAIL"],
        },
        {
            "id": "2",
            "order": 2,
            "page": page,
            "routeMatcher": matcher,
            "moduleName": "基本信息与明细",
            "target": {"selector": f"[data-anno='{detail_prefix}-basic']", "fallbackSelectors": [f"[data-anno='{detail_prefix}']"]},
            "markdownFile": f"pages/{scope}-detail.md",
            "blockId": "2",
            "sourceRefs": [f"{rid}-DETAIL"],
        },
        {
            "id": "3",
            "order": 3,
            "page": page,
            "routeMatcher": matcher,
            "moduleName": "制单信息",
            "target": {"selector": f"[data-anno='{detail_prefix}-meta']", "fallbackSelectors": [f"[data-anno='{detail_prefix}']"]},
            "markdownFile": f"pages/{scope}-detail.md",
            "blockId": "3",
            "sourceRefs": [f"{rid}-DETAIL"],
        },
    ]
    return {
        "version": 1,
        "title": f"{title}-详情页",
        "scope": f"{scope}-detail",
        "sourceBase": ".",
        "mermaid": {"enabled": True, "src": "", "options": {}},
        "sourceRequirements": reqs,
        "annotations": ann,
    }


def simple_list_config(scope: str, title: str, route: str, page_anno: str, demo_file: str) -> dict:
    rid = scope.upper().replace("-", "_")
    return {
        "version": 1,
        "title": title,
        "scope": scope,
        "sourceBase": ".",
        "mermaid": {"enabled": True, "src": "", "options": {}},
        "sourceRequirements": [{"id": f"{rid}-LIST", "source": f"../{demo_file}", "page": f"#{route}"}],
        "annotations": [
            {
                "id": "page-global",
                "type": "page-global",
                "order": 0,
                "page": f"#{route}",
                "moduleName": "本页规则",
                "markdownFile": f"pages/{scope}.md",
                "blockId": "page-global",
                "sourceRefs": [f"{rid}-LIST"],
            },
            {
                "id": "1",
                "order": 1,
                "page": f"#{route}",
                "moduleName": "查询与列表",
                "target": {"selector": f"[data-anno='{page_anno}']", "fallbackSelectors": []},
                "markdownFile": f"pages/{scope}.md",
                "blockId": "1",
                "sourceRefs": [f"{rid}-LIST"],
            },
        ],
    }


DOC_MODULES = [
    ("采购管理/采购入库单", "purchase-inbound", "采购入库单", "purchase/inbound", "purchase-inbound",
     "采购入库单主PRD.md", "采购入库单_Demo_列表页.md", "采购入库单_Demo_新增编辑页.md", "采购入库单_Demo_详情页.md"),
    ("采购管理/采购退货单", "purchase-return", "采购退货单", "purchase/returns", "purchase-return",
     "采购退货单主PRD.md", "采购退货单_Demo_列表页.md", "采购退货单_Demo_新增编辑页.md", "采购退货单_Demo_详情页.md"),
    ("采购管理/采购退货出库单", "purchase-return-outbound", "采购退货出库单", "purchase/return-outbound", "purchase-return-outbound",
     "采购退货出库单主PRD.md", "采购退货出库单_Demo_列表页.md", "采购退货出库单_Demo_新增编辑页.md", "采购退货出库单_Demo_详情页.md"),
    ("销售管理/销售订单", "sales-order", "销售订单", "sales/orders", "purchase-order",
     "销售订单主PRD.md", "销售订单_Demo_.md", "销售订单_Demo_.md", "销售订单_Demo_.md"),
    ("销售管理/销售出库", "sales-outbound", "销售出库单", "sales/outbound", "purchase-inbound",
     "销售出库主PRD.md", "销售出库_Demo_.md", "销售出库_Demo_.md", "销售出库_Demo_.md"),
    ("销售管理/销售退货单", "sales-return", "销售退货单", "sales/returns", "purchase-return",
     "销售退货单主PRD.md", "销售退货单_Demo_.md", "销售退货单_Demo_.md", "销售退货单_Demo_.md"),
    ("销售管理/销售退货入库", "sales-return-inbound", "销售退货入库单", "sales/return-inbound", "purchase-inbound",
     "销售退货入库主PRD.md", "销售退货入库_Demo_.md", "销售退货入库_Demo_.md", "销售退货入库_Demo_.md"),
    ("库存管理/其他入库", "other-inbound", "其他入库单", "inventory/other-inbound", "other-inbound",
     "其他入库主PRD.md", "其他入库_Demo_列表页.md", "其他入库_Demo_新增编辑页.md", "其他入库_Demo_详情页.md"),
    ("库存管理/其他出库", "other-outbound", "其他出库单", "inventory/other-outbound", "other-outbound",
     "其他出库主PRD.md", "其他出库_Demo_列表页.md", "其他出库_Demo_新增编辑页.md", "其他出库_Demo_详情页.md"),
]

MASTER_MODULES = [
    ("基础资料/商品管理", "product", "商品档案", "master/products", "product-list-page", "商品档案_前端Demo版PRD.md"),
    ("基础资料/客户管理", "customer", "客户档案", "master/customers", "customer-list-page", "客户档案_前端Demo版PRD.md"),
    ("基础资料/供应商管理", "supplier", "供应商档案", "master/suppliers", "supplier-list-page", "供应商档案_前端Demo版PRD.md"),
    ("基础资料/物流管理", "logistics", "物流档案", "master/logistics", "logistics-list-page", "物流管理_前端Demo版PRD.md"),
    ("基础资料/数据字典", "dictionaries", "数据字典", "master/dictionaries", "dictionaries-page", "数据字典_前端Demo版PRD.md"),
]

INVENTORY_QUERY = [
    ("库存管理/即时库存查询", "inventory-on-hand", "即时库存查询", "inventory/on-hand", "inventory-on-hand-list", "即时库存查询_Demo_列表页.md"),
    ("库存管理/库存流水查询", "inventory-ledger", "库存流水查询", "inventory/ledger", "inventory-ledger-list", "库存流水查询_Demo_列表页.md"),
]


def rel_config(prd_sub: str, name: str) -> str:
    return f"../../../prd-docs/进销存管理系统/{prd_sub}/annotations/{name}"


def main() -> None:
    inputs: list[dict] = []
    order = 0

    def add_input(scope: str, prd_sub: str, cfg_name: str) -> None:
        nonlocal order
        order += 1
        inputs.append(
            {
                "scope": scope,
                "config": rel_config(prd_sub, cfg_name),
                "order": order,
            }
        )

    # keep existing first entries from workspace
    existing = json.loads(WORKSPACE.read_text(encoding="utf-8"))
    for item in existing.get("inputs", []):
        if item["order"] <= 12:
            inputs.append(item)

    for prd_sub, scope, title, route_base, prefix, main_pr, demo_l, demo_f, demo_d in DOC_MODULES:
        if prd_sub in SKIP_PREFIXES:
            continue
        ann_dir = PRD_ROOT / prd_sub / "annotations"
        pages = ann_dir / "pages"
        pages.mkdir(parents=True, exist_ok=True)
        route = f"/{route_base}"
        (pages / f"{scope}-list.md").write_text(
            list_page_md(title, route, demo_l, main_pr), encoding="utf-8"
        )
        (pages / f"{scope}-form.md").write_text(form_page_md(title, route, demo_f), encoding="utf-8")
        (pages / f"{scope}-detail.md").write_text(detail_page_md(title, route, demo_d), encoding="utf-8")
        write_json(ann_dir / f"{scope}-list.annotation.config.json", config_list(scope, title, route, prefix, demo_l, main_pr))
        form_prefix_map = {
            "sales-order": "purchase-order-form",
            "sales-outbound": "purchase-inbound-form",
            "sales-return": "purchase-inbound-form",
            "sales-return-inbound": "purchase-inbound-form",
            "purchase-inbound": "purchase-inbound-form",
            "purchase-return": "purchase-inbound-form",
            "purchase-return-outbound": "purchase-inbound-form",
            "other-inbound": "purchase-inbound-form",
            "other-outbound": "purchase-inbound-form",
        }
        detail_prefix_map = {
            "sales-order": "purchase-order-detail",
            "sales-outbound": "purchase-inbound-detail",
            "sales-return": "purchase-inbound-detail",
            "sales-return-inbound": "purchase-inbound-detail",
        }
        form_prefix = form_prefix_map.get(scope, f"{prefix}-form")
        detail_prefix = detail_prefix_map.get(scope, f"{prefix}-detail")
        write_json(ann_dir / f"{scope}-form.annotation.config.json", config_form(scope, title, route_base, form_prefix, demo_f))
        write_json(ann_dir / f"{scope}-detail.annotation.config.json", config_detail(scope, title, route_base, detail_prefix, demo_d))
        add_input(f"{scope}-list", prd_sub, f"{scope}-list.annotation.config.json")
        add_input(f"{scope}-form", prd_sub, f"{scope}-form.annotation.config.json")
        add_input(f"{scope}-detail", prd_sub, f"{scope}-detail.annotation.config.json")

    for prd_sub, scope, title, route, page_anno, demo_file in MASTER_MODULES:
        ann_dir = PRD_ROOT / prd_sub / "annotations"
        pages = ann_dir / "pages"
        pages.mkdir(parents=True, exist_ok=True)
        body = master_list_md(title, f"/{route}", demo_file)
        (pages / f"{scope}-list.md").write_text(body, encoding="utf-8")
        write_json(
            ann_dir / f"{scope}-list.annotation.config.json",
            simple_list_config(f"{scope}-list", f"{title}-列表", f"/{route}", page_anno, demo_file),
        )
        add_input(f"{scope}-list", prd_sub, f"{scope}-list.annotation.config.json")

    for prd_sub, scope, title, route, page_anno, demo_file in INVENTORY_QUERY:
        ann_dir = PRD_ROOT / prd_sub / "annotations"
        pages = ann_dir / "pages"
        pages.mkdir(parents=True, exist_ok=True)
        simple_md = f"""# {title}业务说明

> 来源：../{demo_file}

{md_block("page-global", f"""## 本页规则

- **路由**：#/{route}。
- **只读查询**：不写单据状态；数据来自库存汇总（原型 localStorage）。""")}

{md_block("1", """## 查询与列表

- 筛选条件见 Demo；刷新重算汇总且保留筛选（待确认见走查 D-06）。""")}
"""
        (pages / f"{scope}.md").write_text(simple_md, encoding="utf-8")
        write_json(
            ann_dir / f"{scope}.annotation.config.json",
            simple_list_config(scope, title, f"/{route}", page_anno, demo_file),
        )
        add_input(scope, prd_sub, f"{scope}.annotation.config.json")

    workspace = {
        "version": 1,
        "title": existing.get("title", "进销存原型-业务标注"),
        "inputs": inputs,
        "runtime": existing.get("runtime", {"zIndexBase": 2147480000, "initialMode": "preview"}),
        "output": existing.get("output", "../public/annotation-kit/annotation.bundle.json"),
        "coverage": existing.get("coverage", "./coverage.md"),
        "htmlOutput": existing.get("htmlOutput", "./annotations-export.html"),
    }
    write_json(WORKSPACE, workspace)
    print(f"Wrote {len(inputs)} workspace inputs")


if __name__ == "__main__":
    main()
