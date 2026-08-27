import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  label: string
  size?: number
  variant?: 'ghost' | 'outline' | 'primary'
}

export function IconButton({
  icon,
  label,
  size = 20,
  variant = 'ghost',
  type = 'button',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={['q-iconbtn', `q-iconbtn-${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}
