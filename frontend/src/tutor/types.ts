/**
 * Shared types for the Qubera AI Tutor ("Berry") frontend integration.
 *
 * These mirror the contracts produced by the Node tutor agent
 * (backend/tutor) and the MCP capability server.
 */

/** Lesson the learner is currently reading (published by the Learn page). */
export interface TutorLessonSnapshot {
  id?: string
  title?: string
  content?: string
  topic?: string
}

/** Structured view of the most recent simulation run (if any). */
export interface TutorSimulationSnapshot {
  counts?: Record<string, number>
  probabilities?: Record<string, number>
  statevector?: unknown
}

/** Lightweight learner progress summary. */
export interface TutorProgressSnapshot {
  completedLessons?: number
  currentTopic?: string
  difficulty?: string
}

export interface TutorContextSnapshot {
  screen: string
  route: string
  topic?: string
  code?: string
  framework?: string
  circuit?: unknown
  selectedGate?: string
  /** Authoritative result of the most recent quantum execution (if any). */
  lastExecutionResult?: unknown
  /** Human-readable page label (e.g. "Quantum Lab"). */
  page?: string
  lesson?: TutorLessonSnapshot
  simulation?: TutorSimulationSnapshot
  userProgress?: TutorProgressSnapshot
}

/** Deterministic UI actions the tutor may produce (never free-form prose). */
export type TutorAction =
  | { type: 'navigate'; target: string; lesson?: string }
  | { type: 'highlight'; target: string } // data-tutor-id
  | { type: 'highlight_text'; target: string } // data-tutor-id
  | { type: 'highlight_code'; line: number }
  | { type: 'clear_highlights' }

export interface TutorReply {
  message: string
  actions: TutorAction[]
  activity?: string | string[] | null
  grounded?: boolean
  sources?: { source: string; filename: string }[]
}

export interface TutorChatRequest {
  message: string
  studentId: string
  context: Omit<TutorContextSnapshot, 'route'> & { route?: string }
}

export const TUTOR_DEFAULT_SCREEN = 'dashboard'
export const TUTOR_DEFAULT_ROUTE = '/dashboard'