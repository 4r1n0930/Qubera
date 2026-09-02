import { BarChart3 } from 'lucide-react'
import type { ExecutionState, BackendType } from '../../types/quantumLab'
import { ResultSummary } from './Results/ResultSummary'
import { ResultState } from './Results/ResultState'
import { ProbabilityChart } from './ProbabilityChart'

interface ResultsPanelProps {
  executionState: ExecutionState
  currentBackend: BackendType
  currentShots: number
  numQubits: number
  onRunAgain: () => void
}

const backendNames: Record<BackendType, string> = {
  qiskit: 'Qiskit Simulator',
  cirq: 'Cirq Engine',
  pennylane: 'PennyLane Default',
}

export function ResultsPanel({
  executionState,
  currentBackend,
  currentShots,
  numQubits,
  onRunAgain,
}: ResultsPanelProps) {
  const { status, result } = executionState

  return (
    <div className="qlab-results-card" role="region" aria-label="Circuit Execution Results">
      <div className="qlab-results-header">
        <div className="qlab-results-title">
          <BarChart3 size={16} className="text-[var(--color-primary)]" />
          <span>Results</span>
        </div>

        <div className="qlab-meta-group">
          <div className="qlab-meta-item">
            <span className="qlab-meta-label">Backend:</span>
            <span className="qlab-meta-val">
              {result ? backendNames[result.backend] : backendNames[currentBackend]}
            </span>
          </div>

          <div className="qlab-meta-item">
            <span className="qlab-meta-label">Shots:</span>
            <span className="qlab-meta-val">{result ? result.shots : currentShots}</span>
          </div>

          <div className="qlab-meta-item">
            <span className="qlab-meta-label">Qubits:</span>
            <span className="qlab-meta-val">{result ? result.num_qubits : numQubits}</span>
          </div>

          {result && (
            <div className="qlab-meta-item">
              <span className="qlab-meta-label">Execution:</span>
              <span className="qlab-meta-val">
                {result.execution_time_ms?.toFixed(2) ?? '—'} ms
              </span>
            </div>
          )}
        </div>
      </div>

      <ResultState
        state={executionState}
        backend={currentBackend}
        shots={currentShots}
        onRunAgain={onRunAgain}
      />

      {status === 'success' && result && <ResultSummary result={result} />}
      {status === 'success' && result && <ProbabilityChart result={result} />}
    </div>
  )
}