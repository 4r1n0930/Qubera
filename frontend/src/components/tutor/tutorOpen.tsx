import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { TutorOpenContext, type TutorOpenState } from './tutorOpen'

/**
 * Provides the global "is the tutor overlay open?" state. Mounted once at the
 * root layout so the floating button, the top-bar launcher and the overlay
 * itself all share a single open/close signal.
 */
export function TutorOpenProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((value) => !value), [])
  const value = useMemo<TutorOpenState>(() => ({ isOpen, open, close, toggle }), [
    isOpen,
    open,
    close,
    toggle,
  ])
  return <TutorOpenContext.Provider value={value}>{children}</TutorOpenContext.Provider>
}