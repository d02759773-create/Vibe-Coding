import type { ChatMessage, ToolCall } from '../types'

export type LlmMessage = {
  role: string
  content: string | null
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export type ChatCompletionResult = {
  content: string
  tool_calls?: ToolCall[]
}

function normalizeBaseURL(baseURL: string): string {
  return baseURL.replace(/\/$/, '')
}

function mergeToolCallDeltas(
  acc: Record<number, { id: string; name: string; arguments: string }>,
  deltaToolCalls: {
    index?: number
    id?: string
    function?: { name?: string; arguments?: string }
  }[],
) {
  for (const part of deltaToolCalls) {
    const index = part.index ?? 0
    if (!acc[index]) {
      acc[index] = { id: part.id ?? '', name: '', arguments: '' }
    }
    if (part.id) acc[index].id = part.id
    if (part.function?.name) acc[index].name += part.function.name
    if (part.function?.arguments) acc[index].arguments += part.function.arguments
  }
}

function toolCallsFromAcc(acc: Record<number, { id: string; name: string; arguments: string }>): ToolCall[] {
  return Object.keys(acc)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => {
      const t = acc[Number(key)]
      return {
        id: t.id || `call_${key}`,
        type: 'function' as const,
        function: { name: t.name, arguments: t.arguments },
      }
    })
    .filter((t) => t.function.name)
}

export async function chatCompletion(params: {
  baseURL: string
  apiKey: string
  model: string
  messages: LlmMessage[]
  tools?: object[]
  signal?: AbortSignal
}): Promise<ChatCompletionResult> {
  const url = `${normalizeBaseURL(params.baseURL)}/chat/completions`
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    stream: false,
  }
  if (params.tools?.length) {
    body.tools = params.tools
    body.tool_choice = 'auto'
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: params.signal,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[]
  }
  const message = json.choices?.[0]?.message
  return {
    content: message?.content ?? '',
    tool_calls: message?.tool_calls,
  }
}

/** 流式请求；最终回复边生成边回调 onDelta。支持流式 tool_calls 累积。 */
export async function chatCompletionStream(params: {
  baseURL: string
  apiKey: string
  model: string
  messages: LlmMessage[]
  tools?: object[]
  signal?: AbortSignal
  onDelta: (text: string) => void
}): Promise<ChatCompletionResult> {
  const url = `${normalizeBaseURL(params.baseURL)}/chat/completions`
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    stream: true,
  }
  if (params.tools?.length) {
    body.tools = params.tools
    body.tool_choice = 'auto'
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: params.signal,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无响应流')

  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''
  const toolAcc: Record<number, { id: string; name: string; arguments: string }> = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data) as {
          choices?: {
            delta?: {
              content?: string
              tool_calls?: {
                index?: number
                id?: string
                function?: { name?: string; arguments?: string }
              }[]
            }
          }[]
        }
        const delta = json.choices?.[0]?.delta
        if (delta?.content) {
          content += delta.content
          params.onDelta(delta.content)
        }
        if (delta?.tool_calls) mergeToolCallDeltas(toolAcc, delta.tool_calls)
      } catch {
        // 忽略单行解析失败
      }
    }
  }

  const tool_calls = toolCallsFromAcc(toolAcc)
  return {
    content,
    tool_calls: tool_calls.length > 0 ? tool_calls : undefined,
  }
}

export async function testConnection(params: {
  baseURL: string
  apiKey: string
  model: string
}): Promise<void> {
  await chatCompletion({
    ...params,
    messages: [{ role: 'user', content: 'ping' }],
  })
}

export function toLlmMessages(messages: ChatMessage[]): LlmMessage[] {
  return messages
    .filter((m) => m.role !== 'system' || m.content)
    .map((m) => ({
      role: m.role,
      content: m.content,
      tool_call_id: m.tool_call_id,
      tool_calls: m.tool_calls,
    }))
}
