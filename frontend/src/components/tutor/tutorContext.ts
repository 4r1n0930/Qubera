/**
 * Qubera-aware tutor context.
 *
 * Builds the structured `QuantumTutorContext` that the tutor treats as its
 * "view" of the current application state. It mirrors the authoritative data
 * the pages already publish through the tutor context store — never a second,
 * incompatible representation of the circuit:
 *
 *   - `circuit`    is the same Circuit IR the Quantum Lab executes with.
 *   - `simulation` is derived from the same raw execution result the
 *                  Results panel renders.
 *   - `lesson`     is the lesson the learner currently has open in Learn.
 *
 * The same helpers also derive the panel's context label and the contextual
 * quick actions shown when the panel opens.
 */

import { getTutorContext } from '../../tutor/tutorContextStore'
import type { TutorContextSnapshot } from '../../tutor/types'

export interface QuantumTutorLesson {
  id?: string
  title?: string
  content?: string
  topic?: string
}

export interface QuantumTutorCircuit {
  num_qubits: number
  operations: Array<{ gate: string; targets: number[] }>
}

export interface QuantumTutorSimulation {
  counts?: Record<string, number>
  probabilities?: Record<string, number>
  statevector?: unknown
}

export interface QuantumTutorProgress {
  completedLessons?: number
  currentTopic?: string
  difficulty?: string
}

export interface QuantumTutorContext {
  page: string
  lesson?: QuantumTutorLesson
  circuit?: QuantumTutorCircuit
  simulation?: QuantumTutorSimulation
  userProgress?: QuantumTutorProgress
}

/** Human-readable page labels for the screens the tutor can see. */
const SCREEN_PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  learn: 'Learn',
  quantumLab: 'Quantum Lab',
  codeEditor: 'Code Editor',
  code: 'Code Editor',
  games: 'Games',
  challenges: 'Challenges',
  progress: 'Progress',
  leaderboard: 'Leaderboard',
  profile: 'Profile',
  settings: 'Settings',
  resources: 'Resources',
  playground: 'Playground',
  'ai-tutor': 'Tutor',
}

export function screenPageLabel(screen: string | undefined): string {
  if (!screen) return 'Dashboard'
  return SCREEN_PAGE_LABELS[screen] ?? screen
}

/**
 * Converts the live snapshot into the structured context the tutor receives.
 * The circuit is passed through untouched (it is already canonical Circuit
 * IR); the simulation is projected out of the raw execution result.
 */
export function buildTutorContext(
  snapshot: TutorContextSnapshot = getTutorContext(),
): QuantumTutorContext {
  const circuit = snapshot.circuit as QuantumTutorCircuit | undefined
  const simulation = snapshot.lastExecutionResult
    ? simulationFromExecutionResult(snapshot.lastExecutionResult)
    : snapshot.simulation

  return {
    page: snapshot.page ?? screenPageLabel(snapshot.screen),
    lesson: snapshot.lesson,
    circuit: circuit && isCircuitIr(circuit) ? circuit : undefined,
    simulation,
    userProgress: snapshot.userProgress,
  }
}

function isCircuitIr(value: unknown): value is QuantumTutorCircuit {
  const circuit = value as QuantumTutorCircuit | undefined
  return (
    typeof circuit === 'object' &&
    circuit !== null &&
    typeof circuit.num_qubits === 'number' &&
    Array.isArray(circuit.operations)
  )
}

/** Projects the counts/probabilities/statevector out of an execution result. */
function simulationFromExecutionResult(result: unknown): QuantumTutorSimulation {
  const value = result as {
    counts?: Record<string, number>
    probabilities?: Record<string, number>
    statevector?: unknown
  } | undefined
  if (!value || typeof value !== 'object') return {}
  return {
    counts: value.counts,
    probabilities: value.probabilities,
    statevector: value.statevector,
  }
}

/* ---------------------------------------------------------------------------
 * Context label ("Context: Quantum Lab · Bell State")
 * ------------------------------------------------------------------------- */

/**
 * A short, human-friendly line describing where the learner is and what the
 * tutor can currently see there. E.g. "Quantum Lab · Bell State" or
 * "Learn · Superposition".
 */
export function contextLabelFor(snapshot: TutorContextSnapshot): string {
  const base = snapshot.page ?? screenPageLabel(snapshot.screen)
  if (snapshot.screen === 'quantumLab' && isCircuitIr(snapshot.circuit)) {
    return `${base} · ${describeCircuit(snapshot.circuit)}`
  }
  if (snapshot.screen === 'learn' && snapshot.lesson?.title) {
    return `${base} · ${snapshot.lesson.title}`
  }
  return base
}

/** Detects common named circuits and otherwise summarizes gate counts. */
function describeCircuit(circuit: QuantumTutorCircuit): string {
  const ops = circuit.operations.filter((op) => op.gate !== 'measure' && op.gate !== 'barrier')
  const count = (gate: string) => ops.filter((op) => op.gate === gate).length

  // Bell state: H on q0, then CX(0,1) — the quera lab's signature starter.
  const hasBell =
    count('H') === 1 &&
    ops.some((op) => op.gate === 'CX' || op.gate === 'CNOT')

  if (hasBell) return 'Bell State'

  const counts = new Map<string, number>()
  for (const op of ops) {
    const name = op.gate === 'CX' ? 'CNOT' : op.gate
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  if (counts.size === 0) return 'empty circuit'
  return [...counts.entries()].map(([gate, n]) => `${gate}×${n}`).join(', ')
}

/* ---------------------------------------------------------------------------
 * Contextual quick actions
 * ------------------------------------------------------------------------- */

export function quickActionsFor(context: QuantumTutorContext): string[] {
  switch (context.page) {
    case 'Quantum Lab':
      return [
        'Explain this circuit',
        'Predict the result',
        'Why this output?',
        'Give me a challenge',
        'Explain the Bloch sphere',
      ]
    case 'Learn':
      return [
        'Explain simply',
        'Give me an example',
        'Test my understanding',
        'Relate this to a circuit',
      ]
    case 'Progress':
      return [
        'What should I learn next?',
        'Where am I struggling?',
        'How am I doing overall?',
      ]
    case 'Dashboard':
      return [
        'Teach me a quantum concept',
        'What can I build in the lab?',
        'Suggest a challenge',
      ]
    default:
      return ['Help me understand qubits', 'Explain superposition', 'Run something in the lab']
  }
}