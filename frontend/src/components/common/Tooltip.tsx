import {
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({
  content,
  children,
  side = 'top',
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)

  const style: CSSProperties = { '--tip-side': side } as CSSProperties

  return (
    <span
      ref={triggerRef}
      className="q-tooltip-wrap"
      style={style}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          className={`q-tooltip q-tooltip-${side}`}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </span>
  )
}
