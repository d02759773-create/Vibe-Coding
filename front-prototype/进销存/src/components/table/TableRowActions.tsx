import { Divider, Space } from 'antd'
import type { ReactNode } from 'react'

/** ProTable 操作列：统一间距与分隔，避免 Link/Button 混排换行错位 */
export function TableRowActions({ items }: { items: ReactNode[] }) {
  if (items.length === 0) return null
  return (
    <Space
      size={0}
      align="center"
      wrap
      split={
        <Divider type="vertical" style={{ margin: 0, height: 14, top: 0 }} />
      }
      style={{ rowGap: 4 }}
    >
      {items}
    </Space>
  )
}

export const tableActionLinkStyle = { paddingInline: 4, height: 'auto' as const }
