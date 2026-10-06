import { ChartArtifact } from '../artifacts/ChartArtifact'
import { HtmlArtifact } from '../artifacts/HtmlArtifact'
import { splitAssistantContent } from '../artifacts/extractBlocks'
import { MarkdownProse } from './MarkdownProse'

type Props = { content: string; isAssistant?: boolean }

export function MessageContent({ content, isAssistant }: Props) {
  if (!isAssistant) {
    return <MarkdownProse variant="user">{content}</MarkdownProse>
  }

  const blocks = splitAssistantContent(content)
  return (
    <div className="home-agent-message-blocks">
      {blocks.map((block, i) => {
        if (block.type === 'chart') {
          return (
            <div key={i} className="ha-artifact-block">
              <ChartArtifact code={block.code} />
            </div>
          )
        }
        if (block.type === 'html') {
          return (
            <div key={i} className="ha-artifact-block">
              <HtmlArtifact code={block.code} />
            </div>
          )
        }
        if (!block.text.trim()) return null
        return (
          <div key={i} className="ha-prose-block">
            <MarkdownProse variant="assistant">{block.text}</MarkdownProse>
          </div>
        )
      })}
    </div>
  )
}
