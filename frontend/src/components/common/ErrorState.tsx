import type { ReactNode } from 'react'
import { Icon } from './Icon'

export interface ErrorStateProps {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
}: ErrorStateProps) {
  return (
    <div className="q-error" role="alert">
      <div className="q-error-icon" aria-hidden="true">
        <Icon name="close" size={24} />
      </div>
      <h3 className="q-error-title">{title}</h3>
      {description && <p className="q-error-desc">{description}</p>}
      {action && <div className="q-error-action">{action}</div>}
    </div>
  )
}
