import { Loader2, RefreshCw, Sparkles, Play } from 'lucide-react'
import type { ChallengeDefinition } from '../../types/challenges'

interface PredictionPanelProps {
  challenge: ChallengeDefinition
  prediction: Record<string, number> | string
  onChangePrediction: (p: Record<string, number> | string) => void
  onSubmit: () => void
  isRunning: boolean
  hasResult: boolean
}

export function PredictionPanel({
  challenge,
  prediction,
  onChangePrediction,
  onSubmit,
  isRunning,
  hasResult,
}: PredictionPanelProps) {
  const numQubits = challenge.circuit.num_qubits
  const numStates = 1 << numQubits

  // Generate all bitstrings for this circuit size: 00, 01, etc.
  const basisStates: string[] = []
  for (let i = 0; i < numStates; i++) {
    basisStates.push(i.toString(2).padStart(numQubits, '0'))
  }

  // Current probability map
  const probMap: Record<string, number> =
    typeof prediction === 'object' && prediction !== null ? prediction : {}

  // Current selected option ID for multiple choice
  const selectedOptionId: string =
    typeof prediction === 'string' ? prediction : ''

  // Compute total probability sum
  const currentTotal = basisStates.reduce((sum, bit) => sum + (probMap[bit] ?? 0), 0)
  const isSumValid = Math.abs(currentTotal - 1) < 0.01

  // Handle number input changes
  const handleProbChange = (bit: string, rawVal: string) => {
    let num = parseFloat(rawVal)
    if (isNaN(num)) num = 0
    if (num > 1 && num <= 100) {
      num = num / 100
    }
    num = Math.max(0, Math.min(1, Math.round(num * 1000) / 1000))
    onChangePrediction({
      ...probMap,
      [bit]: num,
    })
  }

  // Quick presets for convenience
  const handleEqualSuperposition = () => {
    const equalVal = Math.round((1 / numStates) * 1000) / 1000
    const newMap: Record<string, number> = {}
    basisStates.forEach((bit) => {
      newMap[bit] = equalVal
    })
    onChangePrediction(newMap)
  }

  const handleClearProbabilities = () => {
    const newMap: Record<string, number> = {}
    basisStates.forEach((bit) => {
      newMap[bit] = 0
    })
    onChangePrediction(newMap)
  }

  const canSubmit =
    challenge.predictionType === 'multiple_choice'
      ? selectedOptionId.length > 0
      : currentTotal > 0.01

  return (
    <div className="qlab-prediction-panel">
      <div className="qlab-pred-header">
        <h3 className="qlab-pred-heading">Predict the Output</h3>
        <p className="qlab-pred-sub">
          {challenge.predictionType === 'multiple_choice'
            ? 'Select what the expected quantum measurement will be before running.'
            : 'Enter the expected probability (0 to 1, or %) for each measurement bitstring.'}
        </p>
      </div>

      {challenge.predictionType === 'multiple_choice' ? (
        /* Multiple Choice Options */
        <div className="qlab-pred-options" role="radiogroup" aria-label="Prediction options">
          {challenge.options?.map((opt) => {
            const isSelected = selectedOptionId === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`qlab-pred-option-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onChangePrediction(opt.id)}
                disabled={isRunning}
              >
                <div className="qlab-pred-radio">
                  <div className="qlab-radio-inner" />
                </div>
                <div className="qlab-pred-option-content">
                  <strong className="qlab-pred-option-label">{opt.label}</strong>
                  {opt.description && (
                    <span className="qlab-pred-option-desc">{opt.description}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* Probability Distribution Input Grid */
        <div className="qlab-pred-distribution">
          <div className="qlab-pred-dist-actions">
            <button
              type="button"
              className="qlab-pred-preset-btn"
              onClick={handleEqualSuperposition}
              disabled={isRunning}
              title="Set equal superposition probability across all states"
            >
              <Sparkles size={12} />
              <span>Equal Superposition</span>
            </button>
            <button
              type="button"
              className="qlab-pred-preset-btn"
              onClick={handleClearProbabilities}
              disabled={isRunning}
              title="Reset all probabilities to 0"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
            <div className="qlab-pred-sum-indicator">
              <span className="qlab-sum-label">Sum:</span>
              <code className={`qlab-sum-val ${isSumValid ? 'is-valid' : 'is-invalid'}`}>
                {(currentTotal * 100).toFixed(0)}%
              </code>
            </div>
          </div>

          <div className="qlab-pred-table-wrap">
            <table className="qlab-pred-table">
              <thead>
                <tr>
                  <th>Basis State</th>
                  <th>Predicted Probability (0–1 or %)</th>
                  <th>Visual</th>
                </tr>
              </thead>
              <tbody>
                {basisStates.map((bit) => {
                  const val = probMap[bit] ?? 0
                  return (
                    <tr key={bit}>
                      <td className="qlab-pred-basis-cell">
                        <code>|{bit}⟩</code>
                      </td>
                      <td className="qlab-pred-input-cell">
                        <div className="qlab-input-group">
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            className="qlab-pred-number-input"
                            value={val === 0 ? '' : val}
                            placeholder="0.0"
                            onChange={(e) => handleProbChange(bit, e.target.value)}
                            disabled={isRunning}
                            aria-label={`Probability for |${bit}⟩`}
                          />
                          <span className="qlab-pct-chip">{(val * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="qlab-pred-bar-cell">
                        <div className="qlab-pred-mini-track">
                          <div
                            className="qlab-pred-mini-fill"
                            style={{ width: `${Math.min(100, val * 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission CTA and notes */}
      <div className="qlab-pred-submit-area">
        <button
          type="button"
          className="qlab-pred-submit-btn"
          onClick={onSubmit}
          disabled={!canSubmit || isRunning}
          aria-label="Submit Prediction and Execute Circuit"
        >
          {isRunning ? (
            <Loader2 size={16} className="qlab-spin" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
          <span>
            {isRunning
              ? 'Executing Quantum Simulation…'
              : hasResult
              ? 'Re-submit & Re-run'
              : 'Submit Prediction & Run'}
          </span>
        </button>

        <p className="qlab-pred-note">
          Simulators execute only <strong>after</strong> you submit. Predict first, observe second!
        </p>
      </div>
    </div>
  )
}
