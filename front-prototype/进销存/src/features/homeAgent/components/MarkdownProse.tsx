import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const assistantComponents: Components = {
  h1: ({ children }) => <h1 className="ha-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="ha-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="ha-h3">{children}</h3>,
  h4: ({ children }) => <h4 className="ha-h4">{children}</h4>,
  p: ({ children }) => <p className="ha-p">{children}</p>,
  ul: ({ children }) => <ul className="ha-ul">{children}</ul>,
  ol: ({ children }) => <ol className="ha-ol">{children}</ol>,
  li: ({ children }) => <li className="ha-li">{children}</li>,
  blockquote: ({ children }) => <blockquote className="ha-callout">{children}</blockquote>,
  hr: () => <hr className="ha-hr" />,
  table: ({ children }) => (
    <div className="ha-table-wrap">
      <table className="ha-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="ha-thead">{children}</thead>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
  tr: ({ children }) => <tr>{children}</tr>,
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <pre className="ha-pre">
          <code className={className} {...props}>{children}</code>
        </pre>
      )
    }
    return (
      <code className="ha-code-inline" {...props}>
        {children}
      </code>
    )
  },
  a: ({ href, children }) => (
    <a className="ha-link" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="ha-strong">{children}</strong>,
}

type Props = {
  children: string
  variant?: 'user' | 'assistant'
}

export function MarkdownProse({ children, variant = 'assistant' }: Props) {
  const className =
    variant === 'assistant'
      ? 'home-agent-markdown home-agent-markdown--assistant'
      : 'home-agent-markdown home-agent-markdown--user'

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={variant === 'assistant' ? assistantComponents : undefined}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
