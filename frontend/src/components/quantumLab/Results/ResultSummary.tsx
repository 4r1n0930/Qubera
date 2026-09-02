import type { ExecutionResult } from '../../../types/quantumLab'

interface ResultSummaryProps {
  result: ExecutionResult
}

export function ResultSummary({ result }: ResultSummaryProps) {
  const backendNames: Record<string, string> = {
    qiskit: 'Qiskit Simulator',
    cirq: 'Cirq Engine',
    pennylane: 'PennyLane Default',
  }

  const stats: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Backend', value: backendNames[result.backend] ?? result.backend },
    { label: 'Shots', value: result.shots.toLocaleString() },
    { label: 'Qubits', value: String(result.num_qubits) },
    { label: 'Execution time', value: `${result.execution_time_ms?.toFixed(2) ?? '—'} ms` },
    { label: 'Total measured states', value: String(Object.keys(result.counts ?? {}).length) },
  ]

  const mostProbable = Object.entries(result.probabilities).reduce<string | null>(
    (acc, [k, v]) => (acc === null || v > (result.probabilities[acc] ?? 0) ? k : acc),
    null
  )

  if (mostProbable && result.probabilities[mostProbable] > 0) {
    stats.push({ label: 'Most probable state', value: `|${mostProbable}⟩`, highlight: true })
  }

  return (
    <div className="qlab-results-summary">
      {stats.map((s) => (
        <div key={s.label} className={`qlab-result-stat ${s.highlight ? 'is-highlight' : ''}`}>
          <span className="qlab-result-stat-label">{s.label}</span>
          <span className="qlab-result-stat-value">{s.value}</span>
        </div>
      ))}
    </div>
  )
}
