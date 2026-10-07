/**
 * 项目业务逻辑知识库。
 * 数据源：已编译业务标注包 public/annotation-kit/annotation.bundle.json（由 PRD 摘出的页面/跨页规则）。
 * 不包含完整主 PRD、字段清单、流程推演原文。
 */

type RawAnnotation = {
  id: string
  type?: string
  page?: string
  moduleName?: string
  scope?: string
  sourceRefs?: string[]
  markdown?: string
}

type AnnotationBundle = {
  title?: string
  annotations?: RawAnnotation[]
}

export type ProjectLogicEntry = {
  id: string
  type: string
  moduleName: string
  moduleLabel: string
  page: string
  scope: string
  sourceRefs: string[]
  markdown: string
}

export type ProjectLogicModule = {
  module: string
  label: string
}

/** 单条返回的正文最大字符数，避免单条超长占满上下文 */
const MAX_MARKDOWN_CHARS = 4000

/** 最长前缀优先：scope → 中文模块名 */
const SCOPE_PREFIX_LABELS: [string, string][] = [
  ['purchase-return-outbound', '采购退货出库单'],
  ['sales-return-inbound', '销售退货入库单'],
  ['purchase-inbound', '采购入库单'],
  ['purchase-return', '采购退货单'],
  ['purchase-order', '采购订单'],
  ['sales-outbound', '销售出库单'],
  ['sales-return', '销售退货单'],
  ['sales-order', '销售订单'],
  ['other-inbound', '其他入库单'],
  ['other-outbound', '其他出库单'],
  ['inventory-on-hand', '即时库存查询'],
  ['inventory-ledger', '库存流水查询'],
  ['warehouse', '仓库'],
  ['product', '商品'],
  ['customer', '客户'],
  ['supplier', '供应商'],
  ['logistics', '物流方式'],
  ['dictionaries', '数据字典'],
]

function moduleKeyFromScope(scope: string): string {
  const s = scope.toLowerCase()
  const hit = SCOPE_PREFIX_LABELS.find(([prefix]) => s.startsWith(prefix))
  return hit ? hit[0] : s.replace(/-(global|list|form|detail)$/i, '')
}

export function labelFromScope(scope: string): string {
  const s = scope.toLowerCase()
  const hit = SCOPE_PREFIX_LABELS.find(([prefix]) => s.startsWith(prefix))
  return hit ? hit[1] : scope
}

let cache: ProjectLogicEntry[] | null = null
let loadPromise: Promise<ProjectLogicEntry[]> | null = null

function bundleUrl(): string {
  try {
    return new URL('annotation-kit/annotation.bundle.json', document.baseURI).href
  } catch {
    return 'annotation-kit/annotation.bundle.json'
  }
}

async function loadEntries(): Promise<ProjectLogicEntry[]> {
  if (cache) return cache
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    const res = await fetch(bundleUrl())
    if (!res.ok) throw new Error(`加载业务标注包失败：HTTP ${res.status}`)
    const bundle = (await res.json()) as AnnotationBundle
    const list = Array.isArray(bundle.annotations) ? bundle.annotations : []
    cache = list.map((a) => {
      const scope = a.scope ?? ''
      return {
        id: a.id,
        type: a.type ?? 'element',
        moduleName: a.moduleName ?? '',
        moduleLabel: labelFromScope(scope),
        page: a.page ?? '',
        scope,
        sourceRefs: Array.isArray(a.sourceRefs) ? a.sourceRefs : [],
        markdown: a.markdown ?? '',
      }
    })
    return cache
  })()
  try {
    return await loadPromise
  } finally {
    loadPromise = null
  }
}

function haystack(e: ProjectLogicEntry): string {
  return [e.moduleLabel, e.moduleName, e.scope, e.page, e.sourceRefs.join(' '), e.markdown]
    .join('\n')
    .toLowerCase()
}

function countOccurrences(text: string, term: string): number {
  if (!term) return 0
  let count = 0
  let idx = text.indexOf(term)
  while (idx !== -1) {
    count += 1
    idx = text.indexOf(term, idx + term.length)
  }
  return count
}

function truncate(md: string): string {
  if (md.length <= MAX_MARKDOWN_CHARS) return md
  return `${md.slice(0, MAX_MARKDOWN_CHARS)}\n\n……（内容过长已截断，可用更具体的关键词再查）`
}

function typeBoost(type: string): number {
  if (type === 'global') return 80
  if (type === 'page-global') return 30
  return 0
}

export type ProjectLogicQuery = {
  keyword?: string
  module?: string
  page?: string
  limit?: number
}

export type ProjectLogicResult = {
  count: number
  items: ProjectLogicEntry[]
  availableModules?: ProjectLogicModule[]
  hint?: string
}

function distinctModules(entries: ProjectLogicEntry[]): ProjectLogicModule[] {
  const map = new Map<string, string>()
  for (const e of entries) {
    const key = moduleKeyFromScope(e.scope)
    if (!map.has(key)) map.set(key, e.moduleLabel || key)
  }
  return [...map.entries()].map(([module, label]) => ({ module, label }))
}

function sortForLogic(a: ProjectLogicEntry, b: ProjectLogicEntry): number {
  return typeBoost(b.type) - typeBoost(a.type)
}

export async function searchProjectLogic(query: ProjectLogicQuery): Promise<ProjectLogicResult> {
  const entries = await loadEntries()
  const limit = Math.min(Math.max(Number(query.limit) || 5, 1), 10)
  const modules = distinctModules(entries)

  let pool = entries
  if (query.module) {
    const m = query.module.toLowerCase()
    pool = pool.filter(
      (e) =>
        e.moduleLabel.toLowerCase().includes(m) ||
        e.moduleName.toLowerCase().includes(m) ||
        e.scope.toLowerCase().includes(m) ||
        moduleKeyFromScope(e.scope).includes(m) ||
        e.page.toLowerCase().includes(m),
    )
  }
  if (query.page) {
    const p = query.page.toLowerCase()
    pool = pool.filter((e) => e.page.toLowerCase().includes(p) || e.scope.toLowerCase().includes(p))
  }

  const keyword = (query.keyword ?? '').trim().toLowerCase()
  if (!keyword) {
    if (!query.module && !query.page) {
      return {
        count: 0,
        items: [],
        availableModules: modules,
        hint: '未指定关键词。请用 keyword 检索规则，或用 module 指定模块（如 sales-order / 销售订单）。以下为可用模块。',
      }
    }
    const ranked = [...pool].sort(sortForLogic)
    const items = ranked.slice(0, limit)
    return {
      count: pool.length,
      items: items.map((e) => ({ ...e, markdown: truncate(e.markdown) })),
      ...(items.length === 0
        ? { availableModules: modules, hint: '未匹配到内容，可参考可用模块列表换个关键词或模块再查。' }
        : {}),
    }
  }

  const terms = keyword.split(/\s+/).filter(Boolean)
  const scored = pool
    .map((e) => {
      const hay = haystack(e)
      const titleHay = `${e.moduleLabel}\n${e.moduleName}\n${e.scope}\n${e.sourceRefs.join(' ')}`.toLowerCase()
      let score = typeBoost(e.type)
      let matchedTerms = 0
      for (const t of terms) {
        const inBody = countOccurrences(hay, t)
        if (inBody > 0) matchedTerms += 1
        score += inBody
        score += countOccurrences(titleHay, t) * 5
      }
      return { e, score, matchedTerms }
    })
    .filter((s) => s.matchedTerms > 0)
    .sort((a, b) => b.matchedTerms - a.matchedTerms || b.score - a.score)

  if (scored.length === 0) {
    return {
      count: 0,
      items: [],
      availableModules: modules,
      hint: `未找到与「${query.keyword}」相关的业务逻辑。请换用模块名或更准确的业务术语，或参考 availableModules。知识库仅为已编译业务标注，不含完整主 PRD。`,
    }
  }

  const items = scored.slice(0, limit).map(({ e }) => ({ ...e, markdown: truncate(e.markdown) }))
  return { count: scored.length, items }
}
