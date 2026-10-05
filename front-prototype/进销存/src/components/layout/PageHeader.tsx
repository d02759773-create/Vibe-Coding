import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: ReactNode
  breadcrumb?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  anno?: string
  className?: string
}

export function PageHeader({
  title,
  breadcrumb,
  description,
  actions,
  anno,
  className,
}: PageHeaderProps) {
  const hasActions = Boolean(actions)

  return (
    <div
      className={
        className ??
        (hasActions
          ? 'flex flex-wrap items-center justify-between gap-3'
          : undefined)
      }
      {...(anno ? { 'data-anno': anno } : {})}
    >
      <div>
        {breadcrumb ? <p className="text-sm text-muted-foreground">{breadcrumb}</p> : null}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
