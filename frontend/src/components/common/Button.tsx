import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  const sizeClass =
    size === 'sm' ? 'q-btn-sm' : size === 'lg' ? 'q-btn-lg' : 'q-btn-md'
  return (
    <button
      type={type}
      className={['q-btn', `q-btn-${variant}`, sizeClass, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
