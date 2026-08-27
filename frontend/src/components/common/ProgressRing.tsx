import type { HTMLAttributes } from 'react'

export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: number
  stroke?: number
  tone?: 'primary' | 'success' | 'warning' | 'error'
  label?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 64,
  stroke = 6,
  tone = 'primary',
  label,
  className,
  children,
  ...props
}: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const offset = circumference * (1 - ratio)

  return (
    <div
      className={`q-ring${className ? ` ${className}` : ''}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="q-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className={`q-ring-fill q-ring-${tone}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="q-ring-content">{children}</div>}
    </div>
  )
}
