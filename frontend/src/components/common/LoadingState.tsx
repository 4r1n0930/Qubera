import type { ReactNode } from 'react'

export interface LoadingStateProps {
  label?: ReactNode
}

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="q-loading" role="status" aria-live="polite">
      <span className="q-loading-spinner" aria-hidden="true" />
      <span className="q-loading-label">{label}</span>
    </div>
  )
}
