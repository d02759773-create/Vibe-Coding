# 个人网站主页_前端Demo版PRD

> **文档定位**：AI 生成个人站前端原型（React + Tailwind + shadcn/ui + React Router）的页面级输入，聚焦布局、组件、交互与 Mock。  
> **字段定义**：见《个人网站主页字段清单》《个人网站主页-主PRD》§7～§8；本文不重复必填性与排序规则。  
> **版本**：V1.0 | 2026-10-02

---

## 一、技术栈与全局约定

| 项目 | 规格 |
| :--- | :--- |
| 框架 | React 18+ |
| 样式 | Tailwind CSS |
| 组件库 | shadcn/ui（`Button`、`Card`、`Badge`、`Separator`、`Avatar` 等） |
| 路由 | React Router v6，`BrowserRouter` |
| 内容 | 静态模块 `content/site.ts`、`content/projects.ts`、`content/posts.ts`（或等价路径） |
| 语言 | 界面文案固定简体中文 |

### 1.1 设计令牌（建议）

| 令牌 | 建议值 |
| :--- | :--- |
| 页面最大宽度 | `max-w-5xl` 或 `max-w-6xl`，水平居中 `mx-auto px-4 md:px-6` |
| 区块纵向间距 | 主页区块 `space-y-16` 或 `gap-16` |
| 主色 | shadcn 默认 `primary`（后续可改 theme） |
| 正文字号 | `text-base`，次要信息 `text-muted-foreground` |

### 1.2 日期展示格式

| 场景 | 格式 |
| :--- | :--- |
| 列表卡片 `publishedAt` | `YYYY-MM-DD` |
| 详情页元信息 | `YYYY年M月D日`（可选与列表区分） |

### 1.3 空值展示

| 字段 | 列表/卡片 | 详情 |
| :--- | :--- | :--- |
| `summary` 为空 | **不展示摘要行**（不占位符） | 不展示摘要区块 |
| `body` 为空 | — | 展示占位段落：「内容整理中，敬请期待。」 |
| `coverImage` 为空 | 卡片左侧/顶部**不展示图区**，或展示纯色 `aspect-video` 占位块（`bg-muted`） |
| `tags` 为空 | 不展示 Badge 行 |
| `avatar` 为空 | Hero 区不展示 `Avatar`，或展示 `AvatarFallback` 首字母 `D` |

---

## 二、全局布局（SiteLayout）

所有页面（除 404 可复用同一 Layout）包裹在 `SiteLayout` 内：**Header + main + Footer**。

### 2.1 Header

| 元素 | 组件 / 规格 |
| :--- | :--- |
| 容器 | 顶栏 `sticky top-0 z-50 border-b bg-background/95 backdrop-blur` |
| 左侧品牌 | `Link` → `/`，文案 `PM Daniel`，`font-semibold` |
| 右侧导航 | 桌面端横向 `nav`；移动端 `Sheet` 或折叠菜单（首版可用简单横向 + 小屏换行） |

**导航项与行为（R-Route03）**

| 标签 | 当前路径为 `/` | 当前路径为其他 |
| :--- | :--- | :--- |
| 首页 | `Link` → `/`，或滚至顶部 | `Link` → `/` |
| 项目 | `a` → `#projects` 平滑滚动 | `Link` → `/projects` |
| 文章 | `a` → `#posts` 平滑滚动 | `Link` → `/posts` |

当前路由匹配时，导航项使用 `text-foreground font-medium`；否则 `text-muted-foreground hover:text-foreground`。

### 2.2 Footer

| 元素 | 规格 |
| :--- | :--- |
| 版权 | `© {当前年份} PM Daniel`，`text-sm text-muted-foreground` |
| 备案 | `icpLicense` 有值则展示；首版无则不渲染 |

### 2.3 页面 Title

| 路由 | `document.title` |
| :--- | :--- |
| `/` | `PM Daniel` |
| `/projects` | `项目 · PM Daniel` |
| `/projects/:slug` | `{title} · 项目 · PM Daniel` |
| `/posts` | `文章 · PM Daniel` |
| `/posts/:slug` | `{title} · 文章 · PM Daniel` |
| 404 | `页面未找到 · PM Daniel` |

---

## 三、主页（HomePage）— `/`

### 3.1 页面概述

| 项目 | 内容 |
| :--- | :--- |
| 页面目标 | 介绍作者，预览全部已发布项目/文章，引导进入列表或详情 |
| 骨架结构 | Hero → Projects 预览区 → Posts 预览区（单栏纵向） |

### 3.2 Hero 区（`id` 可不设，首页即顶部）

| 元素 | 控件 | 规格 |
| :--- | :--- | :--- |
| 头像 | `Avatar` | 有 `avatar` 时 `AvatarImage`；无则 `AvatarFallback`：`D` |
| 名称 | 标题 | `h1`，`displayName`：`PM Daniel` |
| 定位 | 副标题 | `p`，`text-xl text-muted-foreground`，`tagline`：`供应链产品经理&AI产品经理` |
| 简介 | 段落 | 有 `bio` 时渲染 Markdown 摘要；无则不展示 |
| 社交 | `Button` variant `outline` 或文字链 | 遍历 `socialLinks`；外链 `target="_blank"` `rel="noopener"` |

### 3.3 项目预览区（`section#projects`）

| 元素 | 规格 |
| :--- | :--- |
| 区标题 | `h2`「项目」；右侧或标题行尾：`Button` variant `link` 或 `ghost`，文案「查看更多」→ `/projects` |
| 列表 | 响应式网格：`grid gap-4 md:grid-cols-2`；条目数 = 全部已发布项目（首版 2） |
| 单卡 | 复用 **§五 ContentCard（Project）**；整卡可点击 → `/projects/:slug` |

**空状态**：无已发布项目时，`Card` 内文案「项目整理中」。

### 3.4 文章预览区（`section#posts`）

| 元素 | 规格 |
| :--- | :--- |
| 区标题 | `h2`「文章」+「查看更多」→ `/posts` |
| 列表 | 有文章时同项目网格；**首版 0 篇** |

**空状态（首版）**

| 元素 | 规格 |
| :--- | :--- |
| 容器 | `Card` 或虚线边框区域，`py-12 text-center` |
| 主文案 | 「文章撰写中，敬请期待」 |
| 次文案 | 可选 `text-sm text-muted-foreground`：「后续会更新产品思考与实践。」 |
| 「查看更多」 | **仍展示**，跳转 `/posts` |

---

## 四、项目列表页（ProjectListPage）— `/projects`

### 4.1 页面概述

| 项目 | 内容 |
| :--- | :--- |
| 页面目标 | 浏览全部已发布项目并按时间查看 |
| 骨架结构 | 页头标题区 + 卡片列表（无查询区、无分页） |

### 4.2 页头

| 元素 | 规格 |
| :--- | :--- |
| 标题 | `h1`「项目」 |
| 描述 | 可选一行 `text-muted-foreground`：「供应链与跨境相关的产品实践。」 |
| 返回 | 可选 `Link`「← 返回首页」→ `/` |

### 4.3 列表

| 行为 | 规格 |
| :--- | :--- |
| 排序 | `publishedAt` 降序（与字段清单一致） |
| 布局 | 单列或 `md:grid-cols-2`，卡片间距 `gap-6` |
| 卡片 | 同 §五 ContentCard（Project） |
| 空状态 | 「项目整理中」 |

---

## 五、内容卡片组件（ContentCard）

### 5.1 Project 卡片

| 区域 | 内容 |
| :--- | :--- |
| 封面 | 有 `coverImage` 时顶部 `aspect-video object-cover`；无则 `bg-muted aspect-video` 可不显示图片 |
| 标题 | `CardTitle`，`title` |
| 元信息 | `publishedAt` 格式化日期 |
| 摘要 | 有 `summary` 时 `CardDescription` 最多 2 行 `line-clamp-2`；**无 summary 则不渲染 Description** |
| 标签 | 有 `tags` 时一行 `Badge` variant `secondary` |
| 交互 | `Card` 包 `Link` 或 `onClick` + `useNavigate`；`hover:shadow-md transition-shadow cursor-pointer` |

### 5.2 Article 卡片

与 Project 卡片结构一致；元信息可增加 `readingTime`（有值时展示「约 N 分钟」）。

---

## 六、项目详情页（ProjectDetailPage）— `/projects/:slug`

### 6.1 页面概述

| 项目 | 内容 |
| :--- | :--- |
| 页面目标 | 阅读单个项目完整说明 |
| 骨架结构 | 面包屑/返回 → 标题区 → 元信息 → 正文 → 可选操作按钮 |

### 6.2 顶部导航

| 元素 | 规格 |
| :--- | :--- |
| 面包屑 | `Link`「项目」→ `/projects` + `/` + 当前 `title`（纯文本） |
| 或简化 | `Button` variant `ghost` size `sm`：「← 返回项目列表」 |

### 6.3 标题区

| 元素 | 规格 |
| :--- | :--- |
| 标题 | `h1`，`title` |
| 日期 | `publishedAt` 长格式 |
| 角色 | 有 `role` 时展示 |
| 标签 | `tags`、`techStack` 用 `Badge` |

### 6.4 正文

| 元素 | 规格 |
| :--- | :--- |
| 渲染 | Markdown → HTML（如 `react-markdown`）；首版 `body` 空则用 §1.3 占位文案 |
| 样式 | `prose prose-neutral dark:prose-invert max-w-none`（若未开 dark 可仅 `prose`） |

### 6.5 次要操作（可选，有 URL 才显示）

| 按钮 | 条件 | 行为 |
| :--- | :--- | :--- |
| 在线演示 | `demoUrl` 有值 | `Button` variant `outline`，外链新标签 |
| 代码仓库 | `repoUrl` 有值 | 同上 |

### 6.6 异常态

| 场景 | 规格 |
| :--- | :--- |
| slug 不存在或非 Published | 渲染 **§十 NotFoundPage** 或内嵌「项目不存在」+ 链回 `/projects` |

---

## 七、文章列表页（PostListPage）— `/posts`

结构对齐 **§四 项目列表页**，文案替换：

| 项 | 文案 |
| :--- | :--- |
| 标题 | 文章 |
| 描述（可选） | 产品思考、AI 实践与随笔。 |
| 空状态 | 与主页文章区一致：「文章撰写中，敬请期待」 |
| 卡片 | §5.2 Article 卡片 |

---

## 八、文章详情页（PostDetailPage）— `/posts/:slug`

对齐 **§六 项目详情页**，差异：

| 项 | 规格 |
| :--- | :--- |
| 面包屑 | 「文章」→ `/posts` |
| 元信息 | 展示 `readingTime`（有值时） |
| 扩展字段 | 不展示 `role` / `techStack` / demo / repo |
| 正文 | 同 Markdown 规则 |

首版无文章数据：路由仍注册；直接访问任意 slug 走 404 或「文章不存在」。

---

## 九、404 页（NotFoundPage）

| 元素 | 规格 |
| :--- | :--- |
| 布局 | 复用 `SiteLayout`，`main` 垂直居中 |
| 状态码 | `text-6xl font-bold text-muted-foreground`：`404` |
| 文案 | 「页面未找到」 |
| 操作 | `Button` → `/`「返回首页」 |

React Router：未匹配路由 `path="*"` 指向本页；详情页 slug 校验失败也可复用同一组件。

---

## 十、Mock 数据要求（Demo / 原型）

### 10.1 作者

```text
displayName: PM Daniel
tagline: 供应链产品经理&AI产品经理
avatar: （空）
bio: （空）
socialLinks: []
```

### 10.2 项目（2 条，summary / body 为空）

| slug | title | summary | body | publishedAt | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| cross-border-erp | 跨境 ERP | 空 | 空 | 2026-09-15 | Published |
| overseas-warehouse-wms | 海外仓 WMS | 空 | 空 | 2026-08-20 | Published |

**验收点**：列表卡仅显示标题 + 日期；详情显示占位正文。

### 10.3 文章

```text
posts: []  // 空数组
```

### 10.4 草稿数据（可选，用于自测过滤）

可增加 1 条 `Draft` 项目，**不应**出现在任何列表与主页。

---

## 十一、响应式断点

| 断点 | 行为 |
| :--- | :--- |
| `< md` | 单列卡片；Header 导航可收缩为汉堡菜单（或两行排布） |
| `≥ md` | 双列项目网格；导航横排 |

---

## 十二、无障碍与交互

| 项 | 规格 |
| :--- | :--- |
| 可点击卡片 | 卡片内标题 `Link` 带 `aria-label`：`查看项目：{title}` |
| 图片 | `coverImage` 存在时 `alt={title}` |
| 焦点 | 键盘可 Tab 导航至 Header、卡片、按钮 |
| 加载 | 首版无异步加载；无 Skeleton |

---

## 十三、Out of Scope（Demo 不实现）

- 搜索、筛选、分页、评论、CMS 后台
- 深色模式切换、i18n
- 真实域名、备案、OG 图
- 项目摘要/正文的正式文案（由内容迭代补充）

---

## 十四、页面清单小结

| 页面 | 路径 | 首版数据状态 |
| :--- | :--- | :--- |
| 主页 | `/` | 2 项目 + 文章空状态 |
| 项目列表 | `/projects` | 2 项目 |
| 项目详情 | `/projects/:slug` | 2 slug 可访问，正文占位 |
| 文章列表 | `/posts` | 空状态 |
| 文章详情 | `/posts/:slug` | 路由存在，无有效 slug |
| 404 | `*` | 全局 |
