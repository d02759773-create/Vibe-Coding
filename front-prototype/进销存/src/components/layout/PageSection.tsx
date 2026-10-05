import { Card } from 'antd'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type PageSectionProps = ComponentPropsWithoutRef<'div'> & {
  variant?: 'plain' | 'filter' | 'table' | 'form'
  title?: ReactNode
}

export function PageSection({
  variant = 'plain',
  title,
  className,
  children,
  ...props
}: PageSectionProps) {
  const bordered = variant !== 'plain'
  const bodyStyle = variant === 'table' ? { padding: 0 } : undefined

  return (
    <Card
      title={variant === 'form' || variant === 'filter' ? title : undefined}
      bordered={bordered}
      size={variant === 'form' || variant === 'filter' ? 'small' : undefined}
      className={className}
      styles={{ body: bodyStyle }}
      {...props}
    >
      {variant === 'table' ? children : children}
    </Card>
  )
}
