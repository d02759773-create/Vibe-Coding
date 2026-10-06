import type { ChatMessage, ClarifyPayload, ConfirmActionPayload, PendingClarify, PendingConfirm } from '../types'

/** OpenAI 要求：含 tool_calls 的 assistant 后必须紧跟对应的 tool 消息 */
export function isValidToolMessageChain(messages: ChatMessage[]): boolean {
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role !== 'assistant' || !msg.tool_calls?.length) continue

    const pending = new Set(msg.tool_calls.map((t) => t.id))
    let j = i + 1
    while (pending.size > 0 && j < messages.length && messages[j].role === 'tool') {
      const tid = messages[j].tool_call_id
      if (tid) pending.delete(tid)
      j++
    }
    if (pending.size > 0) return false
    i = j - 1
  }
  return true
}

/** 发给模型前去掉末尾未完成的 tool 轮次（如 clarify 中途切页） */
export function sanitizeMessagesForLlm(messages: ChatMessage[]): ChatMessage[] {
  const relevant = messages.filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'tool')
  let copy = [...relevant]
  while (copy.length > 0 && !isValidToolMessageChain(copy)) {
    copy = copy.slice(0, -1)
  }
  return copy
}

export function recoverPendingClarify(messages: ChatMessage[]): PendingClarify | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== 'assistant' || !m.tool_calls?.length) continue

    const clarifyCall = m.tool_calls.find((c) => c.function.name === 'clarify')
    if (!clarifyCall) return null

    const answered = messages
      .slice(i + 1)
      .some((t) => t.role === 'tool' && t.tool_call_id === clarifyCall.id)
    if (answered) return null

    try {
      const payload = JSON.parse(clarifyCall.function.arguments || '{}') as ClarifyPayload
      return { toolCallId: clarifyCall.id, payload }
    } catch {
      return null
    }
  }
  return null
}

export function recoverPendingConfirm(messages: ChatMessage[]): PendingConfirm | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== 'assistant' || !m.tool_calls?.length) continue

    const confirmCall = m.tool_calls.find((c) => c.function.name === 'confirm_action')
    if (!confirmCall) return null

    const answered = messages
      .slice(i + 1)
      .some((t) => t.role === 'tool' && t.tool_call_id === confirmCall.id)
    if (answered) return null

    try {
      const payload = JSON.parse(confirmCall.function.arguments || '{}') as ConfirmActionPayload
      return { toolCallId: confirmCall.id, payload }
    } catch {
      return null
    }
  }
  return null
}
