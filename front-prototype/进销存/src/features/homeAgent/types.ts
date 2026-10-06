export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export type ToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export type ClarifyQuestion = {
  id: string
  question: string
  choices?: string[]
  allowMultiple?: boolean
}

export type ClarifyPayload = {
  question?: string
  choices?: string[]
  questions?: ClarifyQuestion[]
  recommendedChoiceIndex?: number
}

export type PendingClarify = {
  toolCallId: string
  payload: ClarifyPayload
}

export type ConfirmActionPayload = {
  title: string
  description: string
  action: 'disable_master' | 'export_entity_json' | 'create_purchase_order'
  params: Record<string, unknown>
}

export type PendingConfirm = {
  toolCallId: string
  payload: ConfirmActionPayload
}

export type DatasetRef = {
  id: string
  name: string
  columns: { name: string; inferredType: string }[]
  rowCount: number
  rows: Record<string, unknown>[]
}

export type HomeAgentConfigV1 = {
  configVersion: 1
  provider: string
  baseURL: string
  model: string
  apiKeys: Record<string, string>
  systemPrompt: string
  clarifyTimeoutMs: number
  ui: { settingsCollapsed?: boolean }
}

export type AgentToolContext = {
  navigate: (path: string, search?: Record<string, string>) => void
  datasets: DatasetRef[]
}
