import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { TutorOpenContext, type TutorMode, type TutorOpenState } from './tutorOpen'

/**
 * Provides the global tutor mode. Mounted once at the root layout so the
 * launcher button, the top-bar launcher and the overlay itself all share a
 * single signal:
 *
 *   closed    → collapsed launcher orb (default until the tutor is first used)
 *   overlay   → full-screen, blurred chat
 *   companion → small side sphere that keeps listening/speaking while the
 *               learner focuses on whatever the tutor just redirected to
 */
export function TutorOpenProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TutorMode>('closed')

  const openOverlay = useCallback(() => setMode('overlay'), [])
  const minimizeToCompanion = useCallback(() => setMode('companion'), [])
  const close = useCallback(() => setMode('closed'), [])

  const value = useMemo<TutorOpenState>(
    () => ({ mode, openOverlay, minimizeToCompanion, close }),
    [mode, openOverlay, minimizeToCompanion, close],
  )
  return <TutorOpenContext.Provider value={value}>{children}</TutorOpenContext.Provider>
}