# 跨境电商 ERP 前端原型

腾达科技一期菜单框架，对齐 `context/跨境电商ERP/06-系统菜单地图（一期）.md` §四、§十一。

## 命令

```bash
npm install
npm run dev
npm run build
```

## 导航配置

| 文件 | 作用 |
|---|---|
| `src/config/sidebarMenu.ts` | 左侧全量一级 + 二级菜单（唯一维护入口） |
| `src/config/navigation.ts` | 路由元数据导出 |

左侧 ProLayout 一次展示全部业务域与子页面，默认展开分组。

## 技术栈

React、TypeScript、Vite、Ant Design v5、ProComponents、HashRouter。
