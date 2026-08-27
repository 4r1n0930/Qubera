import type { QubitState } from '../../utils/quantum'
import { analyze, measure, ketBasis } from '../../utils/quantum'

export interface QubitPanelProps {
  state: QubitState
  showBasis?: boolean
}

/**
 * Renders a single-qubit state: a ket label, a short educational caption,
 * and probability bars. Used by the hero and the interactive preview.
 */
export function QubitPanel({ state, showBasis = false }: QubitPanelProps) {
  const analysis = analyze(state)
  const { p0, p1 } = measure(state)

  const p0Label = `${Math.round(p0 * 100)}%`
  const p1Label = `${Math.round(p1 * 100)}%`

  return (
    <div className="q-qpanel" role="group" aria-label={`Qubit state: ${analysis.ket}`}>
      <div className="q-qpanel-top">
        <span className="q-qpanel-ket" aria-hidden="true">
          {analysis.ket}
        </span>
        <span className="q-qpanel-kind">
          <span className={`q-qpanel-dot q-qpanel-dot-${analysis.kind === 'zero' || analysis.kind === 'one' ? 'basis' : 'sup'}`} aria-hidden="true" />
          {analysis.label}
        </span>
      </div>

      {showBasis && (
        <code className="q-qpanel-basis" aria-label="State vector">
          {ketBasis(state)}
        </code>
      )}

      <p className="q-qpanel-desc">{analysis.description}</p>

      <div className="q-qpanel-measure" aria-label={`Measurement: ${p0Label} zero, ${p1Label} one`}>
        <div className="q-qpanel-row">
          <span className="q-qpanel-label" aria-hidden="true">
            |0⟩
          </span>
          <div className="q-qpanel-bar" aria-hidden="true">
            <div className="q-qpanel-fill" style={{ width: `${p0 * 100}%` }} />
          </div>
          <span className="q-qpanel-pct">{p0Label}</span>
        </div>
        <div className="q-qpanel-row">
          <span className="q-qpanel-label" aria-hidden="true">
            |1⟩
          </span>
          <div className="q-qpanel-bar" aria-hidden="true">
            <div className="q-qpanel-fill q-qpanel-fill-alt" style={{ width: `${p1 * 100}%` }} />
          </div>
          <span className="q-qpanel-pct">{p1Label}</span>
        </div>
      </div>
    </div>
  )
}
