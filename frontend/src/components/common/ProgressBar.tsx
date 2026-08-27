import type { HTMLAttributes } from 'react'

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  tone?: 'primary' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  label?: string
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'primary',
  showLabel = false,
  label,
  className,
  ...props
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      className={`q-progress${className ? ` ${className}` : ''}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      {...props}
    >
      <div className="q-progress-track">
        <div
          className={`q-progress-fill q-progress-${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="q-progress-label">{Math.round(percent)}%</span>
      )}
    </div>
  )
}
