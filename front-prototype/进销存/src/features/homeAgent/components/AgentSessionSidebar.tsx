import { Button, Typography } from 'antd'
import { DeleteOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons'
import type { AgentSession } from '../storage/sessionStorage'

type Props = {
  sessions: AgentSession[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = 60_000
  const hour = 60 * min
  const day = 24 * hour
  if (diff < hour) return `${Math.max(1, Math.floor(diff / min))} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  return `${Math.floor(diff / day)} 天前`
}

export function AgentSessionSidebar({ sessions, activeId, onSelect, onNew, onDelete }: Props) {
  return (
    <aside className="hermes-sessions">
      <div className="hermes-sessions-head">
        <Typography.Text className="hermes-sessions-label">
          <MessageOutlined /> 会话
        </Typography.Text>
        <Button type="text" size="small" icon={<PlusOutlined />} onClick={onNew}>
          新建
        </Button>
      </div>
      <div className="hermes-sessions-list">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`hermes-session-item${s.id === activeId ? ' hermes-session-item--active' : ''}`}
          >
            <button type="button" className="hermes-session-main" onClick={() => onSelect(s.id)}>
              <span className="hermes-session-title">{s.title}</span>
              <span className="hermes-session-time">{formatRelativeTime(s.updatedAt)}</span>
            </button>
            {sessions.length > 1 && (
              <Button
                type="text"
                size="small"
                className="hermes-session-delete"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(s.id)
                }}
              />
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
