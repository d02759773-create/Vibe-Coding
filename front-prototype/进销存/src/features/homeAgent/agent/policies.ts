const ANALYSIS_HINT =
  '【系统提示】用户请求可能缺少时间范围、统计口径或数据源。若仍不明确，请调用 clarify 工具向用户提问，不要猜测。'

const NAV_HINT =
  '【系统提示】跳转或查询前若缺少目标模块、单号或筛选条件，请调用 clarify 工具。'

const LOGIC_HINT =
  '【系统提示】这是项目业务逻辑/规则答疑。请先调用 query_project_logic 检索已编译业务标注再作答，禁止编造；不要当成销售/采购数据分析去 clarify 时间范围。'

function isLogicQuestion(text: string): boolean {
  return /状态机|状态流转|业务规则|单据定位|动作矩阵|能不能改|是否允许|可否编辑|可以改|审核通过|作废条件|缺量完结|字段口径|校验规则|上下游|项目逻辑|怎么流转|何时锁定|为什么不能|为何没有删除|确认入库|动账|开发.*(规则|逻辑)|逻辑不清楚/.test(
    text,
  )
}

export function policyHintsForUserMessage(text: string): string | null {
  const t = text.trim()
  if (!t) return null

  if (isLogicQuestion(t)) return LOGIC_HINT

  const vagueAnalysis = /分析|统计|看看|趋势|对比|毛利|销售|采购|库存/.test(t)
  const hasRange = /近\d|本月|本季|今年|\d{4}|上周|昨天|今天/.test(t)
  if (vagueAnalysis && !hasRange && t.length < 80) return ANALYSIS_HINT

  const vagueNav = /打开|跳转|去|进入|查一下|帮我找/.test(t)
  const hasTarget = /商品|客户|供应商|仓库|采购|销售|订单|SKU|PO|SO/.test(t)
  if (vagueNav && !hasTarget) return NAV_HINT

  return null
}
