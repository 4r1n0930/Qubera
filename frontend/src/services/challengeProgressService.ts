/**
 * Progress tracking service for Challenges.
 *
 * Integrates with:
 *  - Local storage for immediate student feedback and attempt history
 *  - Backend LearningEvent log (MongoDB) for the AI Tutor (Berry)
 *  - Live tutor context store
 */

import { setTutorContext } from '../tutor/tutorContextStore'
import type { ChallengeDefinition, ChallengeStats } from '../types/challenges'

const STORAGE_KEY = 'qubera_challenge_stats'

export function getLocalChallengeStats(): ChallengeStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as ChallengeStats
    }
  } catch {
    // ignore storage read failure
  }
  return {
    completedIds: [],
    attemptsByChallenge: {},
  }
}

export function saveLocalChallengeAttempt(
  challengeId: string,
  isCorrect: boolean
): ChallengeStats {
  const stats = getLocalChallengeStats()
  stats.attemptsByChallenge[challengeId] = (stats.attemptsByChallenge[challengeId] ?? 0) + 1
  if (isCorrect && !stats.completedIds.includes(challengeId)) {
    stats.completedIds.push(challengeId)
  }
  stats.lastAttemptDate = new Date().toISOString()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // ignore storage write failure
  }
  return stats
}

/**
 * Record a challenge learning event for the AI tutor and user progress.
 */
export async function recordChallengeEvent(params: {
  challenge: ChallengeDefinition
  isCorrect: boolean
  attempts: number
  userId?: string
}): Promise<void> {
  const { challenge, isCorrect, attempts, userId = 'guest' } = params

  // 1. Update local storage
  saveLocalChallengeAttempt(challenge.id, isCorrect)

  // 2. Inform AI Tutor context
  try {
    setTutorContext({
      screen: 'challenges',
      topic: challenge.topic,
    })
  } catch {
    // tutor context sync is best-effort
  }

  // 3. Post to backend LearningEvent API if reachable
  const eventPayload = {
    userId,
    topic: challenge.topic,
    event: isCorrect
      ? `challenge_completed:${challenge.id}`
      : `challenge_failed_prediction:${challenge.id}`,
    difficulty: challenge.difficulty,
    metadata: {
      challengeId: challenge.id,
      predictionType: challenge.predictionType,
      isCorrect,
      attempts,
      timestamp: new Date().toISOString(),
    },
  }

  try {
    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')
    await fetch(`${API_BASE}/progress/learning-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload),
    })
  } catch {
    // Non-blocking: background event logging fails silently if offline
  }
}
