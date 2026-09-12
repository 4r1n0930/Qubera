import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { Tooltip } from '../common/Tooltip'
import type { ComplexAmplitude } from '../../api/quantumApi'

/* ------------------------------------------------------------------ */
/*  Derived display row (authoritative data only)                      */
/* ------------------------------------------------------------------ */

interface BasisState {
  label: string
  real: number
  imag: number
  magnitude: number
  phase: number
  /** Ideal probability P = |α|² for this basis state. */
  probability: number
  /** Measurement count from the simulator's shot-based execution. */
  count: number | undefined
  /** Whether the backend actually produced counts for this run. */
  hasCounts: boolean
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
  const cleaned = Math.abs(v) < 1e-12 ? 0 : v
  return cleaned.toFixed(4).replace(/^-0\./, '0.')
}

function fmtCount(value: number | undefined): string {
  return value === undefined ? '—' : value.toLocaleString('en-US')
}

function complexString(real: number, imag: number): string {
  const r = fmt(real)
  const i = fmt(Math.abs(imag))
  return `${r} ${imag < 0 ? '−' : '+'} ${i}i`
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
  statevector?: ComplexAmplitude[]
  /** Bitstring-keyed measurement counts from the simulator. */
  counts?: Record<string, number>
  /** Bitstring-keyed probabilities from the simulator (authoritative when present). */
  probabilities?: Record<string, number>
  /** Number of shots used for the (optional) counts. */
  shots?: number
}

export function StateVectorVisualization({ statevector, counts, probabilities, shots }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('table')

  const numQubits = statevector && statevector.length > 0
    ? Math.max(1, Math.round(Math.log2(statevector.length)))
    : 0

  const hasCounts = Boolean(counts)

  const data = useMemo<BasisState[]>(() => {
    if (!statevector) return []
    return statevector.map((amp, i) => {
      const label = i.toString(2).padStart(numQubits, '0')
      const magnitude = Math.sqrt(amp.real ** 2 + amp.imag ** 2)
      const probability = probabilities?.[label] ?? magnitude ** 2
      const phaseRad = Math.atan2(amp.imag, amp.real)
      const phase = Math.round((phaseRad * 180) / Math.PI)
      return {
        label,
        real: amp.real,
        imag: amp.imag,
        magnitude,
        phase,
        probability,
        count: counts?.[label],
        hasCounts,
      }
    })
  }, [statevector, counts, probabilities, numQubits, hasCounts])

  // Selection clamps to the current data length.
  const safeIdx = data.length === 0 ? 0 : Math.min(selectedIdx, data.length - 1)
  const selected = data[safeIdx]
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.real)), 0.0001)

  if (data.length === 0) {
    return (
      <div className="q-sv q-sv-empty">
        <p className="q-sv-empty-title">No statevector yet</p>
        <p className="q-sv-empty-desc">
          Run a circuit and request the <strong>statevector</strong> output to see exact complex
          amplitudes and measurement counts for every computational-basis state.
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
                <span className="q-sv-selected-value q-sv-mono">{complexString(selected.real, selected.imag)}</span>
              </div>
              <div className="q-sv-selected-item">
                <span className="q-sv-selected-label">
                  Probability |α|² <InfoTip text="Probability of measuring this basis state: |α|² = (Re α)² + (Im α)². Distinct from the amplitude itself." />
                </span>
                <span className="q-sv-selected-value q-sv-mono q-sv-count">
                  {(selected.probability * 100).toFixed(2)}%
                </span>
              </div>
              <div className="q-sv-selected-item">
                <span className="q-sv-selected-label">
                  Real part <InfoTip text="Re(α): the real component of the complex amplitude." />
                </span>
                <span className="q-sv-selected-value q-sv-mono">{fmt(selected.real)}</span>
              </div>
              <div className="q-sv-selected-item">
                <span className="q-sv-selected-label">
                  Imaginary part <InfoTip text="Im(α): the imaginary component of the complex amplitude." />
                </span>
                <span className="q-sv-selected-value q-sv-mono">{fmt(selected.imag)}</span>
              </div>
              {selected.hasCounts ? (
                <div className="q-sv-selected-item">
                  <span className="q-sv-selected-label">
                    Measurement Count <InfoTip text={`Number of shots that measured this basis state out of ${shots ?? '—'} total.`} />
                  </span>
                  <span className="q-sv-selected-value q-sv-mono q-sv-count">{fmtCount(selected.count)}</span>
                </div>
              ) : (
                <div className="q-sv-selected-item">
                  <span className="q-sv-selected-label">
                    Measurement Count <InfoTip text="The simulator did not return counts for this run." />
                  </span>
                  <span className="q-sv-selected-value q-sv-mono q-sv-count-na">unavailable</span>
                </div>
              )}
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
                  <th>
                    Amplitude <InfoTip text="Complex amplitude a + bi (α) of this basis state." />
                  </th>
                  <th>
                    Real <InfoTip text="Re(α)" />
                  </th>
                  <th>
                    Imaginary <InfoTip text="Im(α)" />
                  </th>
                  <th>
                    Prob (|α|²) <InfoTip text="Probability of measuring this basis state, P = |α|² = (Re α)² + (Im α)². Reported separately from the complex amplitude." />
                  </th>
                  <th>
                    Counts{' '}
                    <InfoTip
                      text={
                        hasCounts
                          ? `Measurement counts from ${shots?.toLocaleString('en-US') ?? '—'} simulator shots.`
                          : 'Counts are unavailable — shot-based execution was not requested for this run.'
                      }
                    />
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
                    <td className="q-sv-mono q-sv-amp">{complexString(s.real, s.imag)}</td>
                    <td className="q-sv-mono">{fmt(s.real)}</td>
                    <td className="q-sv-mono">{fmt(s.imag)}</td>
                    <td className="q-sv-mono q-sv-count">{(s.probability * 100).toFixed(2)}%</td>
                    <td className="q-sv-mono q-sv-count">{fmtCount(s.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="q-sv-footer-edu">
            <span>
              <InfoTip text="Computational basis states are the standard |0⟩, |1⟩ … basis for qubits; click a row to inspect its amplitude." />{' '}
              Click a row to inspect its basis state.
            </span>
            {hasCounts ? (
              <span>
                <InfoTip text="Counts are the raw measurement outcomes of shot-based execution; each row's count comes straight from the simulator, never estimated." />{' '}
                Counts from {shots?.toLocaleString('en-US') ?? 'the simulator'} shots.
              </span>
            ) : (
              <span>
                <InfoTip text="Only the exact statevector was requested, so no measurement counts are available for this run." />{' '}
                Counts unavailable for this run.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}