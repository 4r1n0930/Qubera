import type { HTMLAttributes } from 'react'

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  label?: string
}

export function Divider({ label, className, ...props }: DividerProps) {
  if (label) {
    return (
      <div
        className={`q-divider q-divider-label${className ? ` ${className}` : ''}`}
        role="separator"
        aria-label={label}
      >
        <span>{label}</span>
      </div>
    )
  }
  return <hr className={`q-divider${className ? ` ${className}` : ''}`} {...props} />
}
