import { CheckCircle2, AlertCircle, Clock, ArrowRight, RotateCcw, X, BookOpen } from 'lucide-react'
import type { ChallengeDefinition, ChallengeAttemptResult } from '../../types/challenges'

interface ChallengeResultModalProps {
  challenge: ChallengeDefinition
  result: ChallengeAttemptResult
  onTryAgain: () => void
  onContinue: () => void
  onClose: () => void
}

function formatTime(ms?: number): string {
  if (ms === undefined || ms === null || isNaN(ms)) return '—'
  if (ms < 0.01) return '< 0.01 ms'
  if (ms < 1000) return `${ms.toFixed(2)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export function ChallengeResultModal({
  challenge,
  result,
  onTryAgain,
  onContinue,
  onClose,
}: ChallengeResultModalProps) {
  const { isCorrect, prediction, actualProbabilities, actualResult, explanation } = result
  const numQubits = challenge.circuit.num_qubits
  const numStates = 1 << numQubits

  const basisStates: string[] = []
  for (let i = 0; i < numStates; i++) {
    basisStates.push(i.toString(2).padStart(numQubits, '0'))
  }

  // Format student prediction text for multiple choice
  const getSelectedOptionLabel = () => {
    if (typeof prediction === 'string') {
      const opt = challenge.options?.find((o) => o.id === prediction)
      return opt?.label ?? prediction
    }
    return ''
  }

  // Format expected option label for multiple choice
  const getExpectedOptionLabel = () => {
    if (challenge.expectedAnswer) {
      const opt = challenge.options?.find((o) => o.id === challenge.expectedAnswer)
      return opt?.label ?? challenge.expectedAnswer
    }
    return ''
  }

  return (
    <div className="qlab-modal-backdrop" role="dialog" aria-modal="true">
      <div className={`qlab-challenge-modal ${isCorrect ? 'is-correct' : 'is-incorrect'}`}>
        <button
          type="button"
          className="qlab-modal-close"
          onClick={onClose}
          aria-label="Close result modal"
        >
          <X size={16} />
        </button>

        {/* Modal Status Header */}
        <div className="qlab-cmodal-header">
          <div className="qlab-cmodal-icon-wrap">
            {isCorrect ? (
              <CheckCircle2 size={36} className="qlab-cmodal-icon success" />
            ) : (
              <AlertCircle size={36} className="qlab-cmodal-icon warning" />
            )}
          </div>
          <h2 className="qlab-cmodal-title">
            {isCorrect ? 'Correct! 🎉' : 'Not quite.'}
          </h2>
          <p className="qlab-cmodal-subtitle">
            {isCorrect
              ? 'You predicted the circuit output correctly.'
              : 'Your prediction was different from the simulated result.'}
          </p>
        </div>

        {/* Execution Details & Authoritative Simulator Time */}
        <div className="qlab-cmodal-meta-row">
          <div className="qlab-cmodal-chip">
            <Clock size={12} />
            <span>Simulation Time:</span>
            <strong>{formatTime(result.elapsedTimeMs ?? actualResult.elapsed_time_ms)}</strong>
          </div>
          <div className="qlab-cmodal-chip">
            <span>Backend:</span>
            <strong>{actualResult.backend}</strong>
          </div>
          <div className="qlab-cmodal-chip">
            <span>Shots:</span>
            <strong>{actualResult.shots}</strong>
          </div>
        </div>

        {/* Comparison: Prediction vs Actual */}
        <div className="qlab-cmodal-comparison">
          <h4 className="qlab-cmodal-section-title">Results Comparison</h4>

          {challenge.predictionType === 'multiple_choice' ? (
            <div className="qlab-choice-comparison">
              <div className="qlab-choice-box user-pred">
                <span className="qlab-box-label">Your Prediction:</span>
                <strong className={`qlab-box-val ${isCorrect ? 'match' : 'mismatch'}`}>
                  {getSelectedOptionLabel()}
                </strong>
              </div>
              <div className="qlab-choice-box actual-result">
                <span className="qlab-box-label">Simulated Output:</span>
                <strong className="qlab-box-val match">
                  {getExpectedOptionLabel()}
                </strong>
              </div>
            </div>
          ) : (
            <div className="qlab-table-comparison">
              <table className="qlab-cmodal-table">
                <thead>
                  <tr>
                    <th>State</th>
                    <th>Your Guess</th>
                    <th>Actual Sim</th>
                    <th>Match</th>
                  </tr>
                </thead>
                <tbody>
                  {basisStates.map((bit) => {
                    const studentP =
                      typeof prediction === 'object' ? (prediction[bit] ?? 0) : 0
                    const actualP = actualProbabilities[bit] ?? 0
                    const diff = Math.abs(studentP - actualP)
                    const matches = diff <= result.tolerance

                    // Only show rows that are either predicted or actual non-zero, unless all are zero
                    if (studentP === 0 && actualP === 0 && basisStates.length > 4) {
                      return null
                    }

                    return (
                      <tr key={bit} className={matches ? 'row-match' : 'row-mismatch'}>
                        <td>
                          <code>|{bit}⟩</code>
                        </td>
                        <td>
                          <code>{(studentP * 100).toFixed(1)}%</code>
                        </td>
                        <td>
                          <code>{(actualP * 100).toFixed(1)}%</code>
                        </td>
                        <td>
                          <span className={`qlab-match-indicator ${matches ? 'good' : 'bad'}`}>
                            {matches ? '✓' : `±${(diff * 100).toFixed(0)}%`}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Educational Feedback (Why this happened) */}
        <div className="qlab-cmodal-explanation">
          <div className="qlab-exp-header">
            <BookOpen size={14} className="qlab-exp-icon" />
            <strong>Why does this happen?</strong>
          </div>
          <p className="qlab-exp-text">{explanation}</p>
        </div>

        {/* Action Buttons */}
        <div className="qlab-cmodal-actions">
          {!isCorrect && (
            <button
              type="button"
              className="qlab-cbtn qlab-cbtn-secondary"
              onClick={onTryAgain}
            >
              <RotateCcw size={14} />
              <span>Try Again</span>
            </button>
          )}
          <button
            type="button"
            className="qlab-cbtn qlab-cbtn-primary"
            onClick={onContinue}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
