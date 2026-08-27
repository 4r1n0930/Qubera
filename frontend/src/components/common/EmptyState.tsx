import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export interface EmptyStateProps {
  icon?: IconName
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({
  icon = 'spark',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="q-empty">
      <div className="q-empty-icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="q-empty-title">{title}</h3>
      {description && <p className="q-empty-desc">{description}</p>}
      {action && <div className="q-empty-action">{action}</div>}
    </div>
  )
}
