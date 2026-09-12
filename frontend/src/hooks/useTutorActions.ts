/**
 * Tutor action dispatcher.
 *
 * The agent returns deterministic actions; this hook executes them against
 * the real UI:
 *   - navigate   → React Router (targeted accounts from the backend whitelist)
 *   - highlight  → temporary ring around the element with data-tutor-id
 *   - highlight_code → puckered line marker in the Quantum Lab editor gutter
 *   - clear_highlights → removes every tutor highlight
 *
 * highlight_* targets are always treated as opaque element ids — never URLs
 * or code — so a hostile target cannot inject behavior.
 */

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TutorAction } from '../tutor/types'
import { tryRevealLine } from '../tutor/editorBridge'

/** Downgrades an arbitrary string into a safe CSS query for data-tutor-id. */
function safeTarget(target: string): string {
  return target.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96)
}

export const TUTOR_HIGHLIGHT_CLASS = 'tutor-highlight'
export const TUTOR_HIGHLIGHT_CODE_CLASS = 'tutor-highlight-code'

function applyHighlight(target: string): string | null {
  const id = safeTarget(target)
  if (!id) return null
  const node = document.querySelector<HTMLElement>(`[data-tutor-id="${id}"]`)
  if (!node) return null

  node.classList.add(TUTOR_HIGHLIGHT_CLASS)
  return id
}

export function clearTutorHighlights(): void {
  for (const node of document.querySelectorAll(`.${TUTOR_HIGHLIGHT_CLASS}`)) {
    node.classList.remove(TUTOR_HIGHLIGHT_CLASS)
  }
  for (const node of document.querySelectorAll(`.${TUTOR_HIGHLIGHT_CODE_CLASS}`)) {
    node.classList.remove(TUTOR_HIGHLIGHT_CODE_CLASS)
  }
}

export interface TutorDispatchResult {
  handled: boolean
  detail: string
}

export function useTutorActions() {
  const navigate = useNavigate()

  return useCallback(
    async (actions: TutorAction[]): Promise<TutorDispatchResult[]> => {
      const results: TutorDispatchResult[] = []

      for (const action of actions) {
        switch (action.type) {
          case 'navigate': {
            // Mirrors the backend ROUTES map — navigate is only allowed to
            // land on these known screens. A `lesson` deep-links into the
            // Learn page (auto-selected there via the ?q= param).
            const routes: Record<string, string> = {
              dashboard: '/dashboard',
              learn: '/dashboard/learn',
              quantumLab: '/dashboard/quantum-lab',
              progress: '/dashboard/progress',
              leaderboard: '/dashboard/leaderboard',
              profile: '/dashboard/profile',
              settings: '/dashboard/settings',
              resources: '/dashboard/resources',
            }
            const base = routes[action.target]
            if (!base) {
              results.push({ handled: false, detail: `unknown page: ${action.target}` })
              break
            }
            const query =
              action.target === 'learn' && action.lesson
                ? `?q=${encodeURIComponent(action.lesson.slice(0, 256))}`
                : ''
            navigate(base + query)
            results.push({
              handled: true,
              detail: `redirect to ${base}${query || ''}`,
            })
            break
          }
          case 'highlight':
          case 'highlight_text': {
            const id = applyHighlight(action.target)
            if (id) {
              results.push({ handled: true, detail: `highlighted #${id}` })
            } else {
              results.push({ handled: false, detail: `no element #${action.target}` })
            }
            break
          }
          case 'highlight_code': {
            const revealed = tryRevealLine(action.line)
            const drawer = document.querySelector<HTMLElement>('[data-tutor-id="code-editor"]')
            if (revealed && drawer) {
              drawer.classList.add(TUTOR_HIGHLIGHT_CLASS)
              window.setTimeout(() => drawer.classList.remove(TUTOR_HIGHLIGHT_CLASS), 2500)
              results.push({ handled: true, detail: `code line ${action.line}` })
            } else if (revealed) {
              results.push({ handled: true, detail: `code line ${action.line}` })
            } else {
              results.push({ handled: false, detail: `code editor unavailable` })
            }
            break
          }
          case 'clear_highlights': {
            clearTutorHighlights()
            results.push({ handled: true, detail: 'highlights cleared' })
            break
          }
          default: {
            results.push({ handled: false, detail: 'unknown action type' })
          }
        }
      }
      return results
    },
    [navigate],
  )
}