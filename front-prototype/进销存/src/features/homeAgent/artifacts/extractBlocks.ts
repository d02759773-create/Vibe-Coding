export type ContentBlock =
  | { type: 'markdown'; text: string }
  | { type: 'chart'; code: string }
  | { type: 'html'; code: string }

const FENCE = /^```(chart|html)\s*\n?([\s\S]*?)```/gm

export function splitAssistantContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const re = new RegExp(FENCE.source, 'gm')
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'markdown', text: content.slice(lastIndex, match.index) })
    }
    const lang = match[1] as 'chart' | 'html'
    blocks.push({ type: lang, code: match[2].trim() })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    blocks.push({ type: 'markdown', text: content.slice(lastIndex) })
  }
  if (blocks.length === 0) blocks.push({ type: 'markdown', text: content })
  return blocks
}
