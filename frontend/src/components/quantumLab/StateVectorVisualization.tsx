import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { Tooltip } from '../common/Tooltip'

/* ------------------------------------------------------------------ */
/*  Derived display row (authoritative data only)                      */
/* ------------------------------------------------------------------ */

interface BasisState {
  label: string
  real: number
  imag: number
  magnitude: number
  phase: number
  probability: number
}

type Tab = 'chart' | 'table'

const TABS: { id: Tab; label: string }[] = [
  { id: 'chart', label: 'Chart' },
  { id: 'table', label: 'Table' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function fmt(v: number): string {
  return v.toFixed(4).replace(/^-0\./, '0.')
}

function fmtPct(v: number): string {
  if (v === 0) return '0%'
  const pct = v * 100
  return pct % 1 === 0 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1)}%`
}

/* ------------------------------------------------------------------ */
/*  Info icon with Tooltip                                             */
/* ------------------------------------------------------------------ */

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip content={<span className="q-sv-tip-text">{text}</span>} side="top">
      <span className="q-sv-info-icon" tabIndex={0} aria-label="More info">
        <Info size={13} />
      </span>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/*  Props & main component                                            */
/* ------------------------------------------------------------------ */

interface Props {
  statevector?: { real: number; imag: number }[]
}

export function StateVectorVisualization({ statevector }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('chart')

  const numQubits = statevector && statevector.length > 0
    ? Math.max(1, Math.round(Math.log2(statevector.length)))
    : 0

  const data = useMemo<BasisState[]>(() => {
    if (!statevector) return []
    return statevector.map((amp, i) => {
      const label = i.toString(2).padStart(numQubits, '0')
      const magnitude = Math.sqrt(amp.real ** 2 + amp.imag ** 2)
      const phaseRad = Math.atan2(amp.imag, amp.real)
      const phase = Math.round((phaseRad * 180) / Math.PI)
      return {
        label,
        real: amp.real,
        imag: amp.imag,
        magnitude,
        phase,
        probability: magnitude ** 2,
      }
    })
  }, [statevector, numQubits])

  // Selection clamps to the current data length; no reset-side-effect needed.
  const safeIdx = data.length === 0 ? 0 : Math.min(selectedIdx, data.length - 1)
  const selected = data[safeIdx]
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.real)), 0.0001)

  if (data.length === 0) {
    return (
      <div className="q-sv q-sv-empty">
        <p className="q-sv-empty-title">No statevector yet</p>
        <p className="q-sv-empty-desc">
          Run a circuit and request the <strong>statevector</strong> output to see exact complex
          amplitudes for every computational-basis state.
        </p>
      </div>
    )
  }

  return (
    <div className="q-sv">
      {/* ── Tab bar ────────────────────────────────────────── */}
      <div className="q-sv-tabs" role="tablist" aria-label="State vector views">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`q-sv-tab ${activeTab === t.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Chart tab ──────────────────────────────────────── */}
      {activeTab === 'chart' && (
        <div className="q-sv-tab-body">
          <div className="q-sv-chart">
            <div className="q-sv-y-axis">
              <span>1.0</span>
              <span>0.5</span>
              <span>0</span>
              <span>-0.5</span>
              <span>-1.0</span>
            </div>
            <div className="q-sv-bar-grid">
              {data.map((s, i) => {
                const isSelected = i === safeIdx
                const normalised = s.real / maxAbs
                const barHeight = Math.abs(normalised) * 100
                return (
                  <div key={s.label} className="q-sv-bar-col">
                    <div
                      className={`q-sv-bar-track ${isSelected ? 'is-selected' : ''} ${s.magnitude === 0 ? 'is-zero' : ''}`}
                      onClick={() => setSelectedIdx(i)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedIdx(i)
                        }
                      }}
                      aria-label={`Select basis state |${s.label}⟩`}
                    >
                      <div
                        className="q-sv-bar-fill"
                        style={{ height: `${barHeight}%` }}
                      />
                      {isSelected && <div className="q-sv-bar-selection-ring" />}
                    </div>
                    <span className={`q-sv-x-label ${isSelected ? 'is-selected' : ''}`}>|{s.label}⟩</span>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="q-sv-edu-note">
            Each bar represents the amplitude (real part) of one computational-basis state.
          </p>

          <div className="q-sv-selected-panel">
            <div className="q-sv-selected-head">
              <span className="q-sv-selected-title">Selected State</span>
            </div>
            <div className="q-sv-selected-grid">
              <div className="q-sv-selected-item">
                <span className="q-sv-selected-label">Basis State</span>
                <span className="q-sv-selected-value q-sv-mono">|{selected.label}⟩</span>
              </div>
              <div className="q-sv-selected-item">
                <span className="q-sv-selected-label">
                  Amplitude <InfoTip text="Complex amplitude α = a + bi describes both magnitude and phase of a basis state." />
                </span>
                <span className="q-sv-selected-value q-sv-mono">
                  {fmt(selected.real)} {selected.imag >= 0 ? '+' : ''} {fmt(selected.imag)}i
                </span>
              </div>
              <div className="q-sv-selected-item">
                <span className="q-sv-selected-label">
                  Magnitude <InfoTip text="The absolute value of the complex amplitude: |α| = √(a² + b²)." />
                </span>
                <span className="q-sv-selected-value q-sv-mono">{fmt(selected.magnitude)}</span>
              </div>
              <div className="q-sv-selected-item">
                <span className="q-sv-selected-label">
                  Phase <InfoTip text="The argument of the complex amplitude in degrees: φ = atan2(b, a)." />
                </span>
                <span className="q-sv-selected-value q-sv-mono">{selected.phase}°</span>
              </div>
              <div className="q-sv-selected-item">
                <span className="q-sv-selected-label">
                  Probability <InfoTip text="Measurement probability: P = |α|². The likelihood of measuring this basis state." />
                </span>
                <span className="q-sv-selected-value q-sv-mono q-sv-prob">{fmtPct(selected.probability)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Table tab ──────────────────────────────────────── */}
      {activeTab === 'table' && (
        <div className="q-sv-tab-body">
          <div className="q-sv-table-wrap">
            <table className="q-sv-table">
              <thead>
                <tr>
                  <th>Basis State</th>
                  <th>Real</th>
                  <th>Imaginary</th>
                  <th>
                    Magnitude <InfoTip text="|α| = √(Re² + Im²)" />
                  </th>
                  <th>
                    Probability <InfoTip text="P = |α|²" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr
                    key={s.label}
                    className={s.label === selected.label ? 'is-selected' : ''}
                    onClick={() => setSelectedIdx(data.indexOf(s))}
                  >
                    <td className="q-sv-mono">|{s.label}⟩</td>
                    <td className="q-sv-mono">{fmt(s.real)}</td>
                    <td className="q-sv-mono">{fmt(s.imag)}</td>
                    <td className="q-sv-mono">{fmt(s.magnitude)}</td>
                    <td className="q-sv-mono">{fmtPct(s.probability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="q-sv-footer-edu">
            <span>
              <InfoTip text="Computational basis states are the standard |0⟩, |1⟩ … basis for qubits." />{' '}
              Click a row to inspect its computational-basis state.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}