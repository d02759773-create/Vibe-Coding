import { Card } from 'antd'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { MasterDetailGrid } from '@/lib/masterFormLayout'

export function DetailFieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 4,
        padding: '12px 0',
        borderBottom: '1px dashed var(--ant-color-border-secondary)',
        minWidth: 0,
      }}
    >
      <dt style={{ color: 'var(--ant-color-text-secondary)', fontSize: 14 }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 14, wordBreak: 'break-word' }}>{value}</dd>
    </div>
  )
}

type DetailSectionProps = ComponentPropsWithoutRef<'div'> & {
  title: string
}

export function DetailSection({ title, className, children, ...props }: DetailSectionProps) {
  return (
    <Card title={title} size="small" className={className} {...props}>
      <MasterDetailGrid>{children}</MasterDetailGrid>
    </Card>
  )
}
