import { createContext, useContext } from 'react'

export interface TutorOpenState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const TutorOpenContext = createContext<TutorOpenState | null>(null)

/** Consume the global "is the tutor overlay open?" state. */
export function useTutorOpen(): TutorOpenState {
  const ctx = useContext(TutorOpenContext)
  if (!ctx) throw new Error('useTutorOpen must be used within TutorOpenProvider')
  return ctx
}