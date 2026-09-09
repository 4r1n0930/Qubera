import { useMemo, useState } from 'react'
import { Activity, Loader2, Minus, Play, Plus } from 'lucide-react'
import type { ExecutionState } from '../../types/quantumLab'
import type { QuantumBackend, ComplexAmplitude } from '../../api/quantumApi'
import type { QubitVisualization } from '../../utils/blochMath'
import { deriveQubitVisualization, deriveAllQubitVisualizations } from '../../utils/blochMath'
import { BlochSphere } from './BlochSphere'
import { StateVectorVisualization } from './StateVectorVisualization'

type ViewType = 'pd' | 'bs' | 'sv'

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: 'pd', label: 'Probability Distribution' },
  { value: 'bs', label: 'Bloch & Q-Sphere (3D)' },
  { value: 'sv', label: 'State Vector' },
]

interface ResultsPanelProps {
  executionState: ExecutionState
  backend: QuantumBackend
  shots: number
  numQubits: number
  onBackendChange: (b: QuantumBackend) => void
  onShotsChange: (s: number) => void
  onRun: () => void
  isRunning: boolean
}

const BACKENDS: { value: QuantumBackend; label: string }[] = [
  { value: 'qiskit', label: 'Qiskit' },
  { value: 'pennylane', label: 'PennyLane' },
  { value: 'cirq', label: 'Cirq' },
]

const SHOT_MIN = 1
const SHOT_MAX = 100000
const SHOT_STEP = 100

const BACKEND_LABELS: Record<QuantumBackend, string> = {
  qiskit: 'Qiskit',
  pennylane: 'PennyLane',
  cirq: 'Cirq',
}

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
  const [view, setView] = useState<ViewType>('pd')
  const [selectedQubit, setSelectedQubit] = useState<number | 'all'>('all')

  const stepShots = (delta: number) => {
    onShotsChange(Math.min(SHOT_MAX, Math.max(SHOT_MIN, shots + delta)))
  }

  const result = executionState.status === 'success' ? executionState.result : undefined
  const blochVectors = result?.bloch_vectors

  const activeIdx = selectedQubit === 'all' ? 0 : selectedQubit

  // The selected qubit's Bloch state, derived from the authoritative backend output
  const info: QubitVisualization = deriveQubitVisualization({
    vector: blochVectors?.[`q${activeIdx}`],
    statevector: result?.statevector,
    qubit: activeIdx,
    numQubits,
  })

  // Visualizations for all circuit qubits simultaneously
  const allQubits: QubitVisualization[] = useMemo(() => {
    return deriveAllQubitVisualizations(numQubits, blochVectors, result?.statevector)
  }, [numQubits, blochVectors, result?.statevector])

  return (
    <div className="qlab-results">
      {/* Single slim toolbar — controls + view selector in one row */}
      <div className="qlab-results-toolbar">
        <div className="qlab-toolbar-left">
          <div className="qlab-toolbar-group">
            <select
              id="qlab-backend"
              className="qlab-select-compact"
              value={backend}
              onChange={(e) => onBackendChange(e.target.value as QuantumBackend)}
              aria-label="Backend"
            >
              {BACKENDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            <div className="qlab-stepper qlab-stepper-compact">
              <button
                type="button"
                className="qlab-stepper-btn"
                onClick={() => stepShots(-SHOT_STEP)}
                disabled={shots <= SHOT_MIN}
                aria-label="Decrease shots"
              >
                <Minus size={12} />
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
                aria-label="Shots"
              />
              <button
                type="button"
                className="qlab-stepper-btn"
                onClick={() => stepShots(SHOT_STEP)}
                disabled={shots >= SHOT_MAX}
                aria-label="Increase shots"
              >
                <Plus size={12} />
              </button>
            </div>

            <button
              type="button"
              className="qlab-run-btn-compact"
              onClick={onRun}
              disabled={isRunning}
              aria-label="Run circuit"
            >
              {isRunning ? (
                <Loader2 size={14} className="qlab-spin" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
              <span>
                {isRunning
                  ? `Running ${BACKEND_LABELS[backend as QuantumBackend]} simulation…`
                  : 'Run'}
              </span>
            </button>
          </div>

          <div className="qlab-toolbar-divider" />

          <div className="qlab-toolbar-group">
            <select
              id="qlab-view"
              className="qlab-select-compact"
              value={view}
              onChange={(e) => setView(e.target.value as ViewType)}
              aria-label="Visualization"
            >
              {VIEW_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Single visualization stage — fills remaining space */}
      <div className="qlab-results-stage">
        {view === 'pd' && <PDView state={executionState} />}
        {view === 'bs' && (
          <BSView
            numQubits={numQubits}
            selectedQubit={selectedQubit}
            setSelectedQubit={setSelectedQubit}
            info={info}
            allQubits={allQubits}
            statevector={result?.statevector}
          />
        )}
        {view === 'sv' && (
          <StateVectorVisualization
            statevector={result?.statevector}
            counts={result?.counts}
            shots={result?.shots}
          />
        )}
      </div>
    </div>
  )
}

function BSView({
  numQubits,
  selectedQubit,
  setSelectedQubit,
  info,
  allQubits,
  statevector,
}: {
  numQubits: number
  selectedQubit: number | 'all'
  setSelectedQubit: (q: number | 'all') => void
  info: QubitVisualization
  allQubits: QubitVisualization[]
  statevector?: ComplexAmplitude[]
}) {
  return (
    <div className="qlab-results-bloch">
      {numQubits > 1 && (
        <div className="qlab-bloch-qubit-select" role="tablist" aria-label="Select qubit">
          <button
            type="button"
            role="tab"
            aria-selected={selectedQubit === 'all'}
            className={`qlab-bloch-qubit-btn ${selectedQubit === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedQubit('all')}
            title="Visualize all circuit qubits simultaneously on 1 sphere"
          >
            All Qubits (1 Sphere)
          </button>
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
        info={info}
        allQubits={allQubits}
        statevector={statevector}
        selectedQubit={selectedQubit}
        label={selectedQubit === 'all' ? 'All Qubits' : `q${selectedQubit}`}
        numQubits={numQubits}
        onSelectQubit={setSelectedQubit}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PD — Probability Distribution (chart only, no title chrome)       */
/* ------------------------------------------------------------------ */

function PDView({ state }: { state: ExecutionState }) {
  if (state.status === 'idle') {
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
  }

  if (state.status === 'loading') {
    return (
      <div className="qlab-results-loading">
        <Loader2 size={26} className="qlab-spin" />
        <p className="qlab-results-loading-title">
          Running {state.result?.backend ?? 'quantum'} simulation… (this can take a few seconds)
        </p>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="qlab-results-error" role="alert">
        <p className="qlab-results-error-title">Run failed</p>
        <p className="qlab-results-error-desc">{state.error?.message}</p>
      </div>
    )
  }

  const result = state.result
  if (!result?.probabilities) return null

  const entries = Object.entries(result.probabilities).sort(([a], [b]) => a.localeCompare(b))
  const max = Math.max(...entries.map(([, p]) => p), 0.0001)

  const pctLabel = (p: number) => {
    if (p === 0) return '0.0%'
    const pct = p * 100
    return pct < 0.1 ? `${pct.toFixed(3)}%` : `${pct.toFixed(1)}%`
  }

  return (
    <div className="qlab-pd">
      <div className="qlab-pd-chart">
        {entries.map(([bit, prob]) => {
          const pct = pctLabel(prob)
          const count = result.counts?.[bit] ?? 0
          return (
            <div key={bit} className="qlab-chart-col">
              <span className="qlab-chart-val">{pct}</span>
              <div className="qlab-bar-track" title={`|${bit}⟩: ${pct} · ${count} shots`}>
                <div
                  className="qlab-bar-fill"
                  style={{
                    height: `${Math.max(prob > 0 ? 1 : 0, (prob / max) * 100)}%`,
                  }}
                />
              </div>
              <span className="qlab-basis-label">|{bit}⟩</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
