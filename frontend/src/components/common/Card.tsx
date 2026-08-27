import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  elevated?: boolean
  interactive?: boolean
}

export function Card({
  children,
  elevated = false,
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'q-card',
        elevated ? 'q-card-elevated' : '',
        interactive ? 'q-card-interactive' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
