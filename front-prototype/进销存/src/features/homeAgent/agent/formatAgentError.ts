export function formatAgentError(e: unknown): string {
  const raw = e instanceof Error ? e.message : '请求失败'
  try {
    const j = JSON.parse(raw) as { error?: { message?: string }; message?: string }
    const msg = j.error?.message ?? j.message
    if (typeof msg === 'string') {
      if (msg.includes('tool_calls') && msg.includes('tool messages')) {
        return '上一次对话在「等待你补充信息」时中断了，记录不完整。请先完成上方确认卡片；若看不到卡片，请点「新建」开一个新会话。'
      }
      return msg
    }
  } catch {
    // 非 JSON
  }
  if (raw.includes('tool_calls') && raw.includes('tool messages')) {
    return '上一次对话在「等待你补充信息」时中断了，记录不完整。请先完成上方确认卡片；若看不到卡片，请点「新建」开一个新会话。'
  }
  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw
}
