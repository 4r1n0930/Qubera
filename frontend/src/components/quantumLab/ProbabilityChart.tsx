import type { ExecutionResult } from '../../types/quantumLab'

interface ProbabilityChartProps {
  result: ExecutionResult
}

export function ProbabilityChart({ result }: ProbabilityChartProps) {
  const entries = Object.entries(result.probabilities)
  const totalShots = result.shots || 1000

  // Filter or sort basis states
  const sortedEntries = entries.sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="qlab-chart-container">
      <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span className="font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          Probability Distribution
        </span>
        {result.statevector_summary && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[var(--color-text-muted)]">State:</span>
            <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">
              |ψ⟩ = {result.statevector_summary}
            </span>
          </div>
        )}
      </div>

      <div className="qlab-chart-grid">
        {sortedEntries.map(([bitstring, prob]) => {
          const pct = (prob * 100).toFixed(1)
          const count = result.counts[bitstring] ?? Math.round(prob * totalShots)

          return (
            <div key={bitstring} className="qlab-chart-row">
              {/* Basis State Label (e.g. |00>) */}
              <span className="qlab-basis-label">|{bitstring}⟩</span>

              {/* Horizontal Bar Track */}
              <div className="qlab-bar-track" title={`${bitstring}: ${pct}% (${count} shots)`}>
                <div
                  className="qlab-bar-fill"
                  style={{ width: `${Math.max(prob > 0 ? 1 : 0, prob * 100)}%` }}
                />
              </div>

              {/* Percentage & Shot Count */}
              <div className="qlab-pct-label">
                <span>{pct}%</span>
                <span className="qlab-count-sub">({count})</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
