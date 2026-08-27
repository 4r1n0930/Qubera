import type { ReactNode } from 'react'

export type StatusTone = 'neutral' | 'success' | 'warning' | 'error' | 'primary'

export interface StatusIndicatorProps {
  tone?: StatusTone
  label: ReactNode
  pulse?: boolean
}

export function StatusIndicator({
  tone = 'neutral',
  label,
  pulse = false,
}: StatusIndicatorProps) {
  return (
    <span className={`q-status q-status-${tone}`}>
      <span
        className={`q-status-dot${pulse ? ' q-status-dot-pulse' : ''}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  )
}
