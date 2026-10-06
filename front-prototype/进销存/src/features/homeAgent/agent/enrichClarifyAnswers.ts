import { listProducts } from '@/features/products/storage'
import type { Product } from '@/features/products/types'

function normalize(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase()
}

function productSummary(p: Product) {
  return { id: p.id, productCode: p.productCode, productName: p.productName, category: p.category }
}

/** 从澄清答案全文里自动匹配启用商品（例如用户写了 Type-C 快充数据线 10件） */
export function findProductsInText(text: string): Product[] {
  const enabled = listProducts().filter((p) => p.status === 'ENABLED')
  const blob = normalize(text)
  const rawLower = text.toLowerCase()
  if (!blob) return []

  const hits = enabled.filter((p) => {
    const name = normalize(p.productName)
    const code = p.productCode.toLowerCase()
    if (name && blob.includes(name)) return true
    if (code && rawLower.includes(code)) return true
    if (/type-?c|快充|数据线/.test(rawLower) && /type-?c|快充|数据线/i.test(p.productName)) return true
    if (name.length >= 4 && blob.includes(name.slice(0, Math.min(6, name.length)))) return true
    return false
  })

  return hits.sort((a, b) => {
    const aName = normalize(a.productName)
    const bName = normalize(b.productName)
    const aScore = blob.includes(aName) ? 2 : 1
    const bScore = blob.includes(bName) ? 2 : 1
    return bScore - aScore
  })
}

function parseQuantity(text: string): { amount: number; unit: string } | null {
  const m = text.match(/(\d+)\s*(件|个|条|盒|pcs|PCS|台|套)/i)
  if (!m) return null
  return { amount: Number(m[1]), unit: m[2] }
}

function wantsProductCatalog(answers: Record<string, unknown>): boolean {
  return Object.values(answers).some((v) => {
    const s = String(v)
    return /列出|已有商品|帮我列|选择商品/.test(s)
  })
}

const STALE_PRODUCT_MARKERS = ['维他命', '维生素', 'vitamin']

export function enrichClarifyAnswers(answers: Record<string, unknown>): Record<string, unknown> {
  const combined = Object.values(answers).map((v) => String(v)).join('\n')
  const products = findProductsInText(combined)
  const qty = parseQuantity(combined)
  const enabled = listProducts().filter((p) => p.status === 'ENABLED')

  const enriched: Record<string, unknown> = { ...answers }

  if (wantsProductCatalog(answers)) {
    enriched._enabledProducts = enabled.map(productSummary)
  }

  if (qty) {
    enriched._parsedQuantity = qty
  }

  if (products.length > 0) {
    const primary = products[0]
    enriched._resolvedProduct = productSummary(primary)
    enriched._productAutoMatch = products.map(productSummary)

    const userMentionedStale = STALE_PRODUCT_MARKERS.some((m) => combined.includes(m))
    if (!userMentionedStale) {
      enriched._abandonStaleProductNames = STALE_PRODUCT_MARKERS
      enriched._instructionForModel = [
        `用户已在澄清表单中明确商品为「${primary.productName}」（${primary.productCode}，id=${primary.id}）。`,
        '禁止继续追问或提示「维他命/维生素」未找到；该名称并非用户最终意图。',
        qty
          ? `采购数量参考：${qty.amount} ${qty.unit}。`
          : '数量见用户在各题中的填写。',
        '下一步：结合已选供应商/仓库，说明将跳转采购订单新建页或给出明细摘要；勿重复 clarify 同一商品名问题。',
      ].join(' ')
    }
  }

  return enriched
}

/** 供澄清卡片实时展示 */
export function previewProductMatchFromAnswers(answers: Record<string, unknown>): Product | null {
  const combined = Object.values(answers).map((v) => String(v)).join('\n')
  const products = findProductsInText(combined)
  return products[0] ?? null
}
