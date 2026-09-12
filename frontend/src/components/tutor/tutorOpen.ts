import { createContext, useContext } from 'react'

export type TutorMode = 'closed' | 'overlay' | 'companion'

export interface TutorOpenState {
  mode: TutorMode
  /** Open the full-screen, blurred chat overlay. */
  openOverlay: () => void
  /** Collapse into the small side sphere (companion) — voice keeps working. */
  minimizeToCompanion: () => void
  /** Fully dismiss the tutor (back to the launcher orb). */
  close: () => void
}

export const TutorOpenContext = createContext<TutorOpenState | null>(null)

/** Consume the global "what state is the tutor overlay in?" signal. */
export function useTutorOpen(): TutorOpenState {
  const ctx = useContext(TutorOpenContext)
  if (!ctx) throw new Error('useTutorOpen must be used within TutorOpenProvider')
  return ctx
}