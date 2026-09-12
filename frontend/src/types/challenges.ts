/**
 * Guess the Output Challenge Types
 * Defines the data structures for quantum prediction challenges,
 * prediction input formats, answer validation, and attempt results.
 */

import type { CircuitState } from './quantumLab'
import type { QuantumExecutionResponse } from '../api/quantumApi'

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced'

/**
 * Extensible prediction types:
 * Currently supported:
 *  - 'probability_distribution': student inputs probability for each basis state
 *  - 'multiple_choice': student selects one of the pre-computed option states
 * Designed for future extension:
 *  - 'most_likely_state': single highest-probability bitstring
 *  - 'bloch_state': predict Bloch sphere vector or cardinal state
 *  - 'statevector': predict amplitude / phase
 */
export type PredictionType =
  | 'probability_distribution'
  | 'multiple_choice'
  | 'most_likely_state'
  | 'bloch_state'
  | 'statevector'

export interface ChallengeOption {
  id: string
  label: string
  description?: string
  probabilities?: Record<string, number>
}

export interface ChallengeDefinition {
  id: string
  title: string
  description?: string
  difficulty: ChallengeDifficulty
  topic: string
  circuit: CircuitState
  predictionType: PredictionType
  options?: ChallengeOption[]
  expectedAnswer?: string // option id for multiple_choice / most_likely_state
  tolerance?: number // default 0.05
  explanation: string
  hint?: string
}

export interface ChallengeAttemptResult {
  challengeId: string
  isCorrect: boolean
  prediction: Record<string, number> | string
  actualResult: QuantumExecutionResponse
  actualProbabilities: Record<string, number>
  elapsedTimeMs?: number
  attempts: number
  explanation: string
  tolerance: number
}

export interface ChallengeStats {
  completedIds: string[]
  attemptsByChallenge: Record<string, number>
  lastAttemptDate?: string
}
