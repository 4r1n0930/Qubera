import type { ReactNode } from 'react'

export interface PageHeaderProps {
  overline?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function PageHeader({
  overline,
  title,
  description,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <header className="q-page-header">
      <div className="q-page-header-main">
        {overline && <span className="q-overline">{overline}</span>}
        <h1 className="q-page-title">{title}</h1>
        {description && <p className="q-page-description">{description}</p>}
      </div>
      {actions && <div className="q-page-actions">{actions}</div>}
      {children}
    </header>
  )
}
