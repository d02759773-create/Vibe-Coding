import { routeMetaList } from '@/config/routes'
import { listProducts } from '@/features/products/storage'
import type { Product } from '@/features/products/types'
import { searchProjectLogic } from '../knowledge/projectLogic'
import type { AgentToolContext, ClarifyPayload, ConfirmActionPayload } from '../types'
import { ENTITY_KEYS, dataSourceMap } from './dataSources'

function matchKeyword(row: Record<string, unknown>, keyword: string): boolean {
  const k = keyword.toLowerCase()
  return Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(k))
}

function matchProduct(product: Product, keyword: string): boolean {
  const k = keyword.toLowerCase()
  const hay = [
    product.productName,
    product.productCode,
    product.category,
    product.specModel,
    product.remark,
    product.barcode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(k)
}

function productSummary(p: Product): Record<string, unknown> {
  return {
    id: p.id,
    productCode: p.productCode,
    productName: p.productName,
    category: p.category,
    status: p.status,
  }
}

export type ToolExecutionResult =
  | { kind: 'result'; content: string }
  | { kind: 'clarify'; payload: ClarifyPayload; toolCallId: string }
  | { kind: 'confirm'; payload: ConfirmActionPayload; toolCallId: string }

export async function executeTool(
  name: string,
  argsJson: string,
  toolCallId: string,
  ctx: AgentToolContext,
): Promise<ToolExecutionResult> {
  const args = JSON.parse(argsJson || '{}') as Record<string, unknown>

  if (name === 'clarify') {
    return {
      kind: 'clarify',
      toolCallId,
      payload: args as ClarifyPayload,
    }
  }

  if (name === 'confirm_action') {
    return {
      kind: 'confirm',
      toolCallId,
      payload: args as ConfirmActionPayload,
    }
  }

  if (name === 'create_purchase_order') {
    const lines = Array.isArray(args.lines) ? args.lines : []
    return {
      kind: 'confirm',
      toolCallId,
      payload: {
        title: '确认创建采购订单',
        description: `将创建采购单：供应商 id=${args.supplierId}，仓库 id=${args.warehouseId}，${lines.length} 行商品。${
          args.submitForAudit ? '提交后状态：待审核。' : '保存为草稿。'
        }`,
        action: 'create_purchase_order',
        params: args,
      },
    }
  }

  if (name === 'get_route_catalog') {
    return {
      kind: 'result',
      content: JSON.stringify(routeMetaList.map((r) => ({ path: r.path, title: r.title }))),
    }
  }

  if (name === 'navigate') {
    const path = String(args.path ?? '')
    if (!path.startsWith('/')) {
      return { kind: 'result', content: JSON.stringify({ error: 'path 必须以 / 开头' }) }
    }
    const query = (args.query as Record<string, string> | undefined) ?? {}
    ctx.navigate(path, query)
    return { kind: 'result', content: JSON.stringify({ ok: true, path, query }) }
  }

  if (name === 'query_master_list') {
    const entity = String(args.entity ?? '')
    const keyword = args.keyword ? String(args.keyword) : ''
    const limit = Math.min(Number(args.limit) || 20, 50)

    // 商品：仅返回启用商品摘要，并在未命中时回退列出全部启用商品
    if (entity === 'products') {
      const enabled = listProducts().filter((p) => p.status === 'ENABLED')
      if (keyword) {
        const matched = enabled.filter((p) => matchProduct(p, keyword))
        if (matched.length === 0) {
          return {
            kind: 'result',
            content: JSON.stringify({
              entity,
              keyword,
              count: 0,
              items: [],
              hint: `未在启用商品中找到包含「${keyword}」的记录。以下为当前系统内全部启用商品，请用准确名称或编码再查。`,
              enabledProducts: enabled.map(productSummary),
            }),
          }
        }
        return {
          kind: 'result',
          content: JSON.stringify({
            entity,
            count: matched.length,
            items: matched.slice(0, limit).map(productSummary),
          }),
        }
      }
      return {
        kind: 'result',
        content: JSON.stringify({
          entity,
          count: enabled.length,
          items: enabled.slice(0, limit).map(productSummary),
        }),
      }
    }

    const source = dataSourceMap[entity]
    if (!source) {
      return {
        kind: 'result',
        content: JSON.stringify({ error: `未知 entity: ${entity}`, availableEntities: ENTITY_KEYS }),
      }
    }

    let rows = source.list()
    if (keyword) rows = rows.filter((r) => matchKeyword(r, keyword))
    return {
      kind: 'result',
      content: JSON.stringify({ entity, count: rows.length, items: rows.slice(0, limit) }),
    }
  }

  if (name === 'query_project_logic') {
    try {
      const result = await searchProjectLogic({
        keyword: args.keyword ? String(args.keyword) : undefined,
        module: args.module ? String(args.module) : undefined,
        page: args.page ? String(args.page) : undefined,
        limit: args.limit !== undefined ? Number(args.limit) : undefined,
      })
      return { kind: 'result', content: JSON.stringify(result) }
    } catch (e) {
      return {
        kind: 'result',
        content: JSON.stringify({
          error: e instanceof Error ? e.message : '业务逻辑知识库加载失败',
        }),
      }
    }
  }

  return { kind: 'result', content: JSON.stringify({ error: `未知工具: ${name}` }) }
}
