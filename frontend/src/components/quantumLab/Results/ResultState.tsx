import { Activity, Loader2, AlertCircle } from 'lucide-react'
import type { ExecutionState, BackendType } from '../../../types/quantumLab'

interface ResultStateProps {
  state: ExecutionState
  backend: BackendType
  shots: number
  onRunAgain?: () => void
}

const backendNames: Record<BackendType, string> = {
  qiskit: 'Qiskit Simulator',
  cirq: 'Cirq Engine',
  pennylane: 'PennyLane Default',
}

export function ResultState({ state, backend, shots, onRunAgain }: ResultStateProps) {
  switch (state.status) {
    case 'idle':
      return (
        <div className="qlab-results-empty">
          <div className="qlab-results-empty-icon">
            <Activity size={22} />
          </div>
          <p className="qlab-results-empty-title">No results yet</p>
          <p className="qlab-results-empty-desc">
            Build a circuit and run it to see measurement results.
          </p>
        </div>
      )
    case 'loading':
      return (
        <div className="qlab-results-loading">
          <Loader2 size={26} className="qlab-spin" />
          <p className="qlab-results-loading-title">Running circuit...</p>
          <div className="qlab-results-loading-meta">
            <span>{backendNames[backend]}</span>
            <span className="qlab-meta-dot">·</span>
            <span>{shots.toLocaleString()} shots</span>
          </div>
        </div>
      )
    case 'error':
      return (
        <div className="qlab-results-error" role="alert">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="qlab-results-error-title">Execution failed</p>
            <p className="qlab-results-error-desc">{state.error || 'An unexpected error occurred.'}</p>
            {onRunAgain && (
              <button
                type="button"
                className="qlab-results-error-retry"
                onClick={onRunAgain}
              >
                Retry execution
              </button>
            )}
          </div>
        </div>
      )
    case 'success':
      return null
  }
}
