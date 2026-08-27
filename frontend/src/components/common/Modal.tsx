import { useEffect, useRef, type ReactNode } from 'react'
import { IconButton } from './IconButton'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  labelledBy?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  labelledBy,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement
    panelRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="q-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="q-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        <div className="q-modal-header">
          {title && (
            <h2 className="q-modal-title" id={labelledBy}>
              {title}
            </h2>
          )}
          <IconButton icon="close" label="Close dialog" onClick={onClose} />
        </div>
        <div className="q-modal-body">{children}</div>
      </div>
    </div>
  )
}
