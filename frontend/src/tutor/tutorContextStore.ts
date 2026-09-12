/**
 * Module-level tutor context store.
 *
 * Pages (currently the Quantum Lab) publish rich state (circuit, code,
 * framework) here; the dashboard layout subscribes and throttles it to the
 * backend tutor context endpoint. This keeps the sync loop out of the React
 * tree so any component can contribute without new provider plumbing.
 */

import type { TutorContextSnapshot } from './types'
import { TUTOR_DEFAULT_ROUTE, TUTOR_DEFAULT_SCREEN } from './types'

export type TutorContextListener = (snapshot: TutorContextSnapshot) => void

const listeners = new Set<TutorContextListener>()

const initial: TutorContextSnapshot = {
  screen: TUTOR_DEFAULT_SCREEN,
  route: TUTOR_DEFAULT_ROUTE,
}

let current: TutorContextSnapshot = { ...initial }

export function getTutorContext(): Readonly<TutorContextSnapshot> {
  return current
}

export function setTutorContext(fields: Partial<TutorContextSnapshot>): void {
  current = { ...current, ...fields }
  for (const listener of listeners) listener(current)
}

/**
 * Removes specific optional fields from the snapshot. Pages call this when
 * they unmount so stale domain state (a previous circuit or lesson) does not
 * leak into the tutor's view of the *current* screen.
 */
export function clearTutorContext(
  fields: Partial<Record<keyof TutorContextSnapshot, true>>,
): void {
  const next = { ...current } as Record<string, unknown>
  for (const field of Object.keys(fields) as Array<keyof TutorContextSnapshot>) {
    delete next[field]
  }
  current = next as unknown as TutorContextSnapshot
  for (const listener of listeners) listener(current)
}

export function subscribeTutorContext(listener: TutorContextListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Reset the store (useful at module boundaries/tests). */
export function resetTutorContext(): void {
  current = { ...initial }
}