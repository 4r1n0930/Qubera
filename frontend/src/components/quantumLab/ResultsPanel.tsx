import { useState } from 'react'
import { Activity, Loader2, Minus, Play, Plus, BarChart3 } from 'lucide-react'
import type { BackendType, ExecutionState, BlochVector } from '../../types/quantumLab'
import { BlochSphere } from './BlochSphere'

interface ResultsPanelProps {
  executionState: ExecutionState
  backend: BackendType
  shots: number
  numQubits: number
  onBackendChange: (b: BackendType) => void
  onShotsChange: (s: number) => void
  onRun: () => void
  isRunning: boolean
}

const BACKENDS: { value: BackendType; label: string }[] = [
  { value: 'qiskit', label: 'Qiskit' },
  { value: 'pennylane', label: 'PennyLane' },
  { value: 'cirq', label: 'Cirq' },
  { value: 'openqasm', label: 'OpenQASM' },
]

const SHOT_MIN = 1
const SHOT_MAX = 1000000
const SHOT_STEP = 100

export function ResultsPanel({
  executionState,
  backend,
  shots,
  numQubits,
  onBackendChange,
  onShotsChange,
  onRun,
  isRunning,
}: ResultsPanelProps) {
  const stepShots = (delta: number) => {
    onShotsChange(Math.min(SHOT_MAX, Math.max(SHOT_MIN, shots + delta)))
  }

  const result = executionState.status === 'success' ? executionState.result : undefined
  const qubitStates = result?.qubitStates
  const [selectedQubit, setSelectedQubit] = useState(0)

  // The initial |0...0> state is the inherent starting point of the simulator,
  // so it is a sound fallback until a measurement has been produced.
  const qubit = qubitStates?.[selectedQubit] ?? {
    qubitIndex: selectedQubit,
    blochVector: { x: 0, y: 0, z: 1 } as BlochVector,
    probability0: 1,
    probability1: 0,
  }

  return (
    <div className="qlab-results">
      <div className="qlab-results-main">
        <div className="qlab-results-content">
          <div className="qlab-results-controls">
            <div className="qlab-results-field">
              <label className="qlab-results-label" htmlFor="qlab-backend">
                Backend
              </label>
              <select
                id="qlab-backend"
                className="qlab-select"
                value={backend}
                onChange={(e) => onBackendChange(e.target.value as BackendType)}
              >
                {BACKENDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="qlab-results-field">
              <label className="qlab-results-label" htmlFor="qlab-shots">
                Shots
              </label>
              <div className="qlab-stepper">
                <button
                  type="button"
                  className="qlab-stepper-btn"
                  onClick={() => stepShots(-SHOT_STEP)}
                  disabled={shots <= SHOT_MIN}
                  aria-label="Decrease shots"
                >
                  <Minus size={14} />
                </button>
                <input
                  id="qlab-shots"
                  type="number"
                  className="qlab-stepper-input"
                  min={SHOT_MIN}
                  max={SHOT_MAX}
                  step={SHOT_STEP}
                  value={shots}
                  onChange={(e) => onShotsChange(Number(e.target.value) || SHOT_MIN)}
                />
                <button
                  type="button"
                  className="qlab-stepper-btn"
                  onClick={() => stepShots(SHOT_STEP)}
                  disabled={shots >= SHOT_MAX}
                  aria-label="Increase shots"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <button
              type="button"
              className="qlab-run-btn"
              onClick={onRun}
              disabled={isRunning}
              aria-label="Run circuit"
            >
              {isRunning ? (
                <>
                  <Loader2 size={16} className="qlab-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>Run</span>
                </>
              )}
            </button>
          </div>

          <div className="qlab-results-chart">
            <div className="qlab-results-chart-title">
              <BarChart3 size={16} />
              <span>Probability Distribution</span>
              <span className="qlab-results-chart-meta">
                {backend} · {shots.toLocaleString()} shots · {numQubits} qubit{numQubits > 1 ? 's' : ''}
              </span>
            </div>

            <ResultBody state={executionState} />
          </div>
        </div>

        <div className="qlab-results-bloch">
          {numQubits > 1 && (
            <div className="qlab-bloch-qubit-select" role="tablist" aria-label="Select qubit">
              {Array.from({ length: numQubits }, (_, q) => (
                <button
                  key={q}
                  type="button"
                  role="tab"
                  aria-selected={selectedQubit === q}
                  className={`qlab-bloch-qubit-btn ${selectedQubit === q ? 'is-active' : ''}`}
                  onClick={() => setSelectedQubit(q)}
                >
                  q{q}
                </button>
              ))}
            </div>
          )}
          <BlochSphere
            vector={qubit.blochVector}
            probability0={qubit.probability0}
            probability1={qubit.probability1}
            label={`q${qubit.qubitIndex}`}
          />
        </div>
      </div>
    </div>
  )
}

function ResultBody({ state }: { state: ExecutionState }) {
  switch (state.status) {
    case 'idle':
      return (
        <div className="qlab-results-empty-state">
          <div className="qlab-results-empty-icon">
            <Activity size={22} />
          </div>
          <p className="qlab-results-empty-title">No results yet</p>
          <p className="qlab-results-empty-desc">
            Build a circuit and press <strong>Run</strong> to see measurement probabilities.
          </p>
        </div>
      )
    case 'loading':
      return (
        <div className="qlab-results-loading">
          <Loader2 size={26} className="qlab-spin" />
          <p className="qlab-results-loading-title">Running circuit…</p>
        </div>
      )
    case 'error':
      return (
        <div className="qlab-results-error" role="alert">
          <p className="qlab-results-error-title">Run failed</p>
          <p className="qlab-results-error-desc">{state.error}</p>
        </div>
      )
    case 'success': {
      const result = state.result
      if (!result) return null
      const entries = Object.entries(result.probabilities).sort(([a], [b]) => a.localeCompare(b))
      const max = Math.max(...entries.map(([, p]) => p), 0.0001)
      const pctLabel = (p: number) => {
        if (p === 0) return '0.0%'
        const pct = p * 100
        return pct < 0.1 ? `${pct.toFixed(3)}%` : `${pct.toFixed(1)}%`
      }
      return (
        <div className="qlab-chart-grid">
          {entries.map(([bit, prob]) => {
            const pct = pctLabel(prob)
            const count = result.counts[bit] ?? 0
            const exact = `p = ${prob.toFixed(4)}`
            return (
              <div key={bit} className="qlab-chart-row">
                <span className="qlab-basis-label">|{bit}⟩</span>
                <div className="qlab-bar-track" title={`|${bit}⟩: ${pct} · ${exact} · ${count} shots`}>
                  <div
                    className="qlab-bar-fill"
                    style={{ width: `${Math.max(prob > 0 ? 1 : 0, (prob / max) * 100)}%` }}
                  />
                </div>
                <div className="qlab-pct-label">
                  <span>{pct}</span>
                  <span className="qlab-count-sub">({count})</span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }
  }
}
