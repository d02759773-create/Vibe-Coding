import { Button, Divider, Space } from '@arco-design/web-react'
import type { ReactNode } from 'react'

/** 表格行内操作：统一 link 按钮与分隔线 */
export function TableRowActions({ items }: { items: ReactNode[] }) {
  const visible = items.filter(Boolean)
  if (visible.length === 0) return null
  return (
    <Space size={0} split={<Divider type="vertical" style={{ margin: '0 4px' }} />}>
      {visible.map((item, i) => (
        <span key={i}>{item}</span>
      ))}
    </Space>
  )
}

export function tableActionLink(label: string, onClick: () => void) {
  return (
    <Button type="text" size="mini" onClick={onClick}>
      {label}
    </Button>
  )
}
