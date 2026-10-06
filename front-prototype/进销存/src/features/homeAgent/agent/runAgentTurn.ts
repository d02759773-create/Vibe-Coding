import { summarizeAllDatasets } from '../datasets/summarizeDataset'
import { chatCompletionStream, toLlmMessages } from '../llm/openaiCompatClient'
import { getApiKey } from '../storage/agentConfigStorage'
import type { HomeAgentConfigV1 } from '../types'
import { agentToolDefinitions } from '../tools/toolDefinitions'
import { executeTool, type ToolExecutionResult } from '../tools/executeTool'
import { policyHintsForUserMessage } from './policies'
import { formatAgentError } from './formatAgentError'
import { sanitizeMessagesForLlm } from './sanitizeMessagesForLlm'
import type {
  AgentToolContext,
  ChatMessage,
  ClarifyPayload,
  PendingClarify,
  PendingConfirm,
} from '../types'

function newId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildSystemContent(config: HomeAgentConfigV1, datasets: AgentToolContext['datasets']): string {
  return `${config.systemPrompt}\n\n【当前上传数据摘要】\n${summarizeAllDatasets(datasets)}`
}

export type RunAgentOptions = {
  config: HomeAgentConfigV1
  messages: ChatMessage[]
  userText?: string
  toolContext: AgentToolContext
  signal?: AbortSignal
  onMessagesUpdate: (messages: ChatMessage[]) => void
}

export type RunAgentOutcome =
  | { status: 'done'; messages: ChatMessage[] }
  | { status: 'clarify'; pending: PendingClarify; messages: ChatMessage[] }
  | { status: 'confirm'; pending: PendingConfirm; messages: ChatMessage[] }
  | { status: 'error'; error: string; messages: ChatMessage[] }

const MAX_TOOL_ROUNDS = 12

type LoopParams = {
  config: HomeAgentConfigV1
  messages: ChatMessage[]
  systemContent: string
  toolContext: AgentToolContext
  signal?: AbortSignal
  onMessagesUpdate: (messages: ChatMessage[]) => void
}

function handleToolExec(
  exec: ToolExecutionResult,
  messages: ChatMessage[],
): { messages: ChatMessage[]; stop: RunAgentOutcome | null } {
  if (exec.kind === 'clarify') {
    return {
      messages,
      stop: { status: 'clarify', pending: { toolCallId: exec.toolCallId, payload: exec.payload }, messages },
    }
  }
  if (exec.kind === 'confirm') {
    return {
      messages,
      stop: { status: 'confirm', pending: { toolCallId: exec.toolCallId, payload: exec.payload }, messages },
    }
  }
  return { messages, stop: null }
}

async function runAgentLoop(params: LoopParams): Promise<RunAgentOutcome> {
  const apiKey = getApiKey(params.config)
  let messages = params.messages

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const llmMessages = [
      { role: 'system', content: params.systemContent },
      ...toLlmMessages(sanitizeMessagesForLlm(messages.filter((m) => m.role !== 'system'))),
    ]

    const assistantId = newId()
    let streamMsgIndex = -1

    let result
    try {
      result = await chatCompletionStream({
        baseURL: params.config.baseURL,
        apiKey,
        model: params.config.model,
        messages: llmMessages,
        tools: [...agentToolDefinitions],
        signal: params.signal,
        onDelta: (chunk) => {
          if (streamMsgIndex < 0) {
            messages = [
              ...messages,
              { id: assistantId, role: 'assistant', content: chunk },
            ]
            streamMsgIndex = messages.length - 1
          } else {
            const current = messages[streamMsgIndex]
            messages = messages.map((m, i) =>
              i === streamMsgIndex ? { ...current, content: current.content + chunk } : m,
            )
          }
          params.onMessagesUpdate(messages)
        },
      })
    } catch (e) {
      return { status: 'error', error: formatAgentError(e), messages }
    }

    if (result.tool_calls?.length) {
      if (streamMsgIndex >= 0) {
        messages = messages.map((m, i) =>
          i === streamMsgIndex
            ? { ...m, content: result.content || m.content, tool_calls: result.tool_calls }
            : m,
        )
      } else {
        messages = [
          ...messages,
          {
            id: assistantId,
            role: 'assistant',
            content: result.content || '',
            tool_calls: result.tool_calls,
          },
        ]
      }
      params.onMessagesUpdate(messages)

      for (const call of result.tool_calls) {
        let exec: ToolExecutionResult
        try {
          exec = executeTool(call.function.name, call.function.arguments, call.id, params.toolContext)
        } catch {
          exec = { kind: 'result', content: JSON.stringify({ error: '工具参数 JSON 无效' }) }
        }

        const handled = handleToolExec(exec, messages)
        messages = handled.messages
        if (handled.stop) return handled.stop
        if (exec.kind !== 'result') continue

        messages = [
          ...messages,
          {
            id: newId(),
            role: 'tool',
            tool_call_id: call.id,
            content: exec.content,
          },
        ]
        params.onMessagesUpdate(messages)
      }
      continue
    }

    if (streamMsgIndex < 0) {
      messages = [
        ...messages,
        { id: assistantId, role: 'assistant', content: result.content || '（无回复内容）' },
      ]
      params.onMessagesUpdate(messages)
    } else if (!messages[streamMsgIndex]?.content) {
      messages = messages.map((m, i) =>
        i === streamMsgIndex ? { ...m, content: result.content || '（无回复内容）' } : m,
      )
      params.onMessagesUpdate(messages)
    }

    return { status: 'done', messages }
  }

  return { status: 'error', error: '工具调用轮次过多，请简化问题后重试', messages }
}

export async function runAgentTurn(options: RunAgentOptions): Promise<RunAgentOutcome> {
  const apiKey = getApiKey(options.config)
  if (!apiKey) {
    return { status: 'error', error: '请先配置 API Key', messages: options.messages }
  }
  if (!options.config.model) {
    return { status: 'error', error: '请选择模型', messages: options.messages }
  }
  if (!options.userText?.trim()) {
    return { status: 'error', error: '消息为空', messages: options.messages }
  }

  const hint = policyHintsForUserMessage(options.userText)
  let userContent = options.userText.trim()
  if (hint) userContent = `${userContent}\n\n${hint}`

  let messages: ChatMessage[] = [
    ...options.messages,
    { id: newId(), role: 'user', content: userContent },
  ]
  options.onMessagesUpdate(messages)

  return runAgentLoop({
    config: options.config,
    messages,
    systemContent: buildSystemContent(options.config, options.toolContext.datasets),
    toolContext: options.toolContext,
    signal: options.signal,
    onMessagesUpdate: options.onMessagesUpdate,
  })
}

export async function resumeAfterToolInteraction(params: {
  config: HomeAgentConfigV1
  messages: ChatMessage[]
  toolCallId: string
  toolContent: string
  toolContext: AgentToolContext
  signal?: AbortSignal
  onMessagesUpdate: (messages: ChatMessage[]) => void
}): Promise<RunAgentOutcome> {
  const messages: ChatMessage[] = [
    ...params.messages,
    {
      id: newId(),
      role: 'tool',
      tool_call_id: params.toolCallId,
      content: params.toolContent,
    },
  ]
  params.onMessagesUpdate(messages)

  return runAgentLoop({
    config: params.config,
    messages,
    systemContent: buildSystemContent(params.config, params.toolContext.datasets),
    toolContext: params.toolContext,
    signal: params.signal,
    onMessagesUpdate: params.onMessagesUpdate,
  })
}

export async function resumeAfterClarify(params: {
  config: HomeAgentConfigV1
  messages: ChatMessage[]
  toolCallId: string
  answers: Record<string, unknown>
  timedOut: boolean
  toolContext: AgentToolContext
  signal?: AbortSignal
  onMessagesUpdate: (messages: ChatMessage[]) => void
}): Promise<RunAgentOutcome> {
  return resumeAfterToolInteraction({
    ...params,
    toolContent: JSON.stringify({
      resolved: true,
      answers: params.answers,
      timed_out: params.timedOut,
    }),
  })
}

export function stripRecommendedLabel(choice: string): string {
  return choice.replace(/\s*\(Recommended\)\s*$/i, '').trim()
}

export type { ClarifyPayload }
