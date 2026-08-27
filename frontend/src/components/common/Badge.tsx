import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'

export interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  dot?: boolean
}

export function Badge({ children, tone = 'neutral', dot = false }: BadgeProps) {
  return (
    <span className={`q-badge q-badge-${tone}`}>
      {dot && <span className="q-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  )
}
