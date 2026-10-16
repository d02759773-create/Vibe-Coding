import { Button, Divider, Space } from 'antd'
import type { ReactNode } from 'react'

/** 表格行内操作：统一 link 按钮与分隔线 */
export function TableRowActions({ items }: { items: ReactNode[] }) {
  const visible = items.filter(Boolean)
  if (visible.length === 0) return null
  return (
    <Space size={0} split={<Divider type="vertical" style={{ margin: 0 }} />}>
      {visible.map((item, i) => (
        <span key={i}>{item}</span>
      ))}
    </Space>
  )
}

export function tableActionLink(label: string, onClick: () => void) {
  return (
    <Button type="link" size="small" style={{ padding: '0 4px' }} onClick={onClick}>
      {label}
    </Button>
  )
}
