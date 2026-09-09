import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { RotateCcw, Box, CircleDot, Layers, Orbit } from 'lucide-react'
import type { BlochVector, ComplexAmplitude } from '../../api/quantumApi'
import type { QubitVisualization, QSphereBasisState } from '../../utils/blochMath'
import {
  formatCoord,
  clean,
  phaseToColor,
  getQSphereBasisStates,
  QUBIT_PALETTE,
} from '../../utils/blochMath'
import { BlochSphere3D } from './BlochSphere3D'

interface BlochSphereProps {
  /** Derived state of the selected qubit. */
  info: QubitVisualization
  /** All qubits' states when multi-qubit circuit exists. */
  allQubits?: QubitVisualization[]
  /** Statevector for full circuit composite Q-Sphere mode. */
  statevector?: ComplexAmplitude[]
  /** Which qubit this is, e.g. `0`, `1`, or `'all'`. */
  selectedQubit?: number | 'all'
  /** Label, e.g. `q0` or `All Qubits`. */
  label?: string
  /** Number of circuit qubits. */
  numQubits?: number
  /** Callback to select a specific qubit. */
  onSelectQubit?: (q: number | 'all') => void
}

const R = 100
const ANIM_MS = 480
const DEFAULT_RX = 0.5
const DEFAULT_RY = 0.6
const LATITUDES = [-60, -30, 30, 60]
const LONGITUDES = [-90, -45, 0, 45, 90, 135, 180]
const D2R = Math.PI / 180

type Vec3 = [number, number, number]

function viewOf(x: number, y: number, z: number, rx: number, ry: number): Vec3 {
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  const x1 = cy * x + sy * z
  const y1 = y
  const z1 = -sy * x + cy * z
  const cx = Math.cos(rx)
  const sx = Math.sin(rx)
  const px = x1
  const py = cx * y1 - sx * z1
  const pz = sx * y1 + cx * z1
  return [px * R, py * R, pz]
}

interface PathD {
  front: string
  back: string
}

function circlePath(pointOf: (t: number) => Vec3, rx: number, ry: number, step = 0.1): PathD {
  let front = ''
  let back = ''
  let frontOn = false
  let backOn = false
  for (let t = 0; t <= Math.PI * 2 + step; t += step) {
    const [x, y, z] = pointOf(t)
    const [sx, sy, sz] = viewOf(x, y, z, rx, ry)
    const p = `${sx.toFixed(2)},${sy.toFixed(2)}`
    if (sz >= 0) {
      front += (frontOn ? ' L' : 'M') + p
      frontOn = true
      backOn = false
    } else {
      back += (backOn ? ' L' : 'M') + p
      backOn = true
      frontOn = false
    }
  }
  return { front, back }
}

const latCircle = (latDeg: number) => (t: number): Vec3 => {
  const lat = latDeg * D2R
  const rad = R * Math.cos(lat)
  return [rad * Math.cos(t), rad * Math.sin(t), R * Math.sin(lat)]
}

const lonCircle = (azDeg: number) => (t: number): Vec3 => {
  const az = azDeg * D2R
  return [R * Math.cos(az) * Math.cos(t), R * Math.sin(az) * Math.cos(t), R * Math.sin(t)]
}

const equatCircle = (t: number): Vec3 => [R * Math.cos(t), R * Math.sin(t), 0]

function equatorPolygon(rx: number, ry: number, step = 0.15): string {
  const pts: string[] = []
  for (let t = 0; t <= Math.PI * 2; t += step) {
    const [x, y, z] = equatCircle(t)
    const [sx, sy] = viewOf(x, y, z, rx, ry)
    pts.push(`${sx.toFixed(2)},${sy.toFixed(2)}`)
  }
  return pts.join(' ')
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function useAnimatedVector({ x, y, z }: BlochVector): BlochVector {
  const cur = useRef<BlochVector>({ x, y, z })
  const [value, setValue] = useState<BlochVector>({ x, y, z })
  const raf = useRef<number>(0)

  useEffect(() => {
    const from = { ...cur.current }
    const to = { x, y, z }
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ANIM_MS)
      const eased = easeOutCubic(t)
      const next: BlochVector = {
        x: from.x + (to.x - from.x) * eased,
        y: from.y + (to.y - from.y) * eased,
        z: from.z + (to.z - from.z) * eased,
      }
      cur.current = next
      setValue(next)
      if (t < 1) {
        raf.current = requestAnimationFrame(step)
      } else {
        cur.current = to
        setValue({ ...to })
      }
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [x, y, z])

  return value
}

interface Axis {
  name: string
  vec: Vec3
  screen: Vec3
  front: boolean
}

const CARDINAL_POINTS: { label: string; vec: Vec3 }[] = [
  { label: '|0⟩', vec: [0, 0, 1] },
  { label: '|1⟩', vec: [0, 0, -1] },
  { label: '|+⟩', vec: [1, 0, 0] },
  { label: '|−⟩', vec: [-1, 0, 0] },
  { label: '|+i⟩', vec: [0, 1, 0] },
  { label: '|-i⟩', vec: [0, -1, 0] },
]

export function BlochSphere({
  info,
  allQubits = [info],
  statevector,
  selectedQubit = 0,
  label = '|ψ⟩',
  numQubits = 1,
  onSelectQubit,
}: BlochSphereProps) {
  // Mode toggles
  const [viewEngine, setViewEngine] = useState<'3d' | '2d'>('3d')
  const [sphereMode, setSphereMode] = useState<'bloch' | 'qsphere'>('bloch')

  // 2D SVG camera orientation state
  const [rotX, setRotX] = useState(DEFAULT_RX)
  const [rotY, setRotY] = useState(DEFAULT_RY)
  const dragRef = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null)

  // Animated vector for 2D mode
  const pt = useAnimatedVector({ x: info.x, y: info.y, z: info.z })
  const pointScreen = useMemo<Vec3>(() => viewOf(pt.x, pt.y, pt.z, rotX, rotY), [pt, rotX, rotY])
  const pointOnFront = pointScreen[2] >= 0
  const r = Math.sqrt(pt.x * pt.x + pt.y * pt.y + pt.z * pt.z)
  const atCenter = r < 1e-6
  const [ea, eb] = viewOf(clean(pt.x), clean(pt.y), 0, rotX, rotY)

  // 2D Axes & Grids
  const axes: Axis[] = useMemo(() => {
    const names = ['X', 'Y', 'Z']
    return names.map((name, i) => {
      const vec: Vec3 = [0, 0, 0]
      vec[i] = 1
      const screen = viewOf(vec[0], vec[1], vec[2], rotX, rotY)
      return { name, vec, screen, front: screen[2] >= 0 }
    })
  }, [rotX, rotY])

  const cardinalMarkers = useMemo(
    () =>
      CARDINAL_POINTS.map((c) => {
        const screen = viewOf(c.vec[0], c.vec[1], c.vec[2], rotX, rotY)
        return { ...c, screen, front: screen[2] >= 0 }
      }),
    [rotX, rotY]
  )

  const grids = useMemo(
    () => ({
      parallels: LATITUDES.map((lat) => circlePath(latCircle(lat), rotX, rotY)),
      meridians: LONGITUDES.map((az) => circlePath(lonCircle(az), rotX, rotY)),
      equator: circlePath(equatCircle, rotX, rotY),
      plane: equatorPolygon(rotX, rotY),
    }),
    [rotX, rotY]
  )

  // Q-Sphere basis states derived from statevector
  const qSphereBasisStates = useMemo<QSphereBasisState[]>(() => {
    return getQSphereBasisStates(numQubits, statevector)
  }, [numQubits, statevector])

  // Non-zero states for Q-Sphere overview summary
  const activeBasisStates = useMemo(() => {
    return qSphereBasisStates
      .filter((s) => s.probability > 0.001)
      .sort((a, b) => b.probability - a.probability)
  }, [qSphereBasisStates])

  const handleDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      dragRef.current = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY }
      ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
    },
    [rotX, rotY]
  )

  const handleMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d) return
    setRotX(Math.min(1.4, Math.max(-1.4, d.rx + (e.clientY - d.y) * 0.01)))
    setRotY(d.ry - (e.clientX - d.x) * 0.01)
  }, [])

  const handleUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const resetView = useCallback(() => {
    setRotX(DEFAULT_RX)
    setRotY(DEFAULT_RY)
  }, [])

  const tipX = pointScreen[0]
  const tipY = pointScreen[1]
  const arrowAngle = Math.atan2(tipY, tipX)
  const arrowTipX = atCenter ? 0 : tipX
  const arrowTipY = atCenter ? 0 : tipY
  const headSize = 9

  // Active phase color
  const phaseColor = phaseToColor(info.phiDeg * D2R)

  return (
    <div className="qlab-bloch">
      {/* ── Header Toolbar: Mode switchers and 3D/2D toggle ── */}
      <div className="qlab-bloch-header">
        <div className="qlab-bloch-header-left">
          <span className="qlab-bloch-label">
            {sphereMode === 'bloch' ? `Bloch Sphere · ${label}` : `Circuit Q-Sphere (${numQubits}Q)`}
          </span>
          {sphereMode === 'bloch' && (
            <span
              className="qlab-bloch-phase-badge"
              style={{ backgroundColor: phaseColor }}
              title={`Phase φ = ${info.phiDeg.toFixed(1)}°`}
            >
              φ = {info.phiDeg.toFixed(1)}°
            </span>
          )}
        </div>

        <div className="qlab-bloch-controls-row">
          {/* Sphere Mode Toggle: Multi-Bloch vs Q-Sphere */}
          <div className="qlab-bloch-toggle-group" role="radiogroup" aria-label="Sphere Mode">
            <button
              type="button"
              className={`qlab-bloch-toggle-btn ${sphereMode === 'bloch' ? 'is-active' : ''}`}
              onClick={() => setSphereMode('bloch')}
              title="Multi-Qubit Bloch Sphere vectors"
              aria-label="Bloch vectors mode"
            >
              <Orbit size={13} />
              <span>Bloch</span>
            </button>
            <button
              type="button"
              className={`qlab-bloch-toggle-btn ${sphereMode === 'qsphere' ? 'is-active' : ''}`}
              onClick={() => setSphereMode('qsphere')}
              title="Quantum Circuit Q-Sphere (Full Statevector)"
              aria-label="Q-Sphere composite state mode"
            >
              <CircleDot size={13} />
              <span>Q-Sphere</span>
            </button>
          </div>

          {/* Engine Toggle: 3D Model vs 2D Projection */}
          <div className="qlab-bloch-toggle-group" role="radiogroup" aria-label="Renderer Engine">
            <button
              type="button"
              className={`qlab-bloch-toggle-btn ${viewEngine === '3d' ? 'is-active' : ''}`}
              onClick={() => setViewEngine('3d')}
              title="Interactive 3D WebGL model with orbit controls"
              aria-label="3D WebGL mode"
            >
              <Box size={13} />
              <span>3D</span>
            </button>
            <button
              type="button"
              className={`qlab-bloch-toggle-btn ${viewEngine === '2d' ? 'is-active' : ''}`}
              onClick={() => setViewEngine('2d')}
              title="Classic 2D SVG orthographic projection"
              aria-label="2D SVG mode"
            >
              <Layers size={13} />
              <span>2D</span>
            </button>
          </div>

          {viewEngine === '2d' && (
            <button
              type="button"
              className="qlab-bloch-reset"
              onClick={resetView}
              aria-label="Reset view"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Sphere Viewport (3D WebGL or 2D SVG) ── */}
      <div className="qlab-bloch-stage">
        {viewEngine === '3d' ? (
          <BlochSphere3D
            mode={sphereMode}
            qubits={allQubits}
            selectedQubit={selectedQubit}
            basisStates={qSphereBasisStates}
            numQubits={numQubits}
            onSelectQubit={onSelectQubit}
          />
        ) : (
          <svg
            width="100%"
            height="100%"
            viewBox="-150 -150 300 300"
            preserveAspectRatio="xMidYMid meet"
            className="qlab-bloch-svg"
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
            style={{ touchAction: 'none' }}
            aria-label={`Interactive 2D Bloch sphere projection for ${label}. Drag to rotate.`}
          >
            <defs>
              <radialGradient id="qlab-bloch-shade" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="var(--color-surface-muted)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-surface-muted)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Sphere silhouette */}
            <circle r={R} fill="url(#qlab-bloch-shade)" />
            <circle r={R} fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />

            {/* Subtle equatorial plane */}
            <polygon points={grids.plane} fill="var(--color-surface-muted)" opacity="0.4" />

            {/* Meridian + parallel grid */}
            {grids.meridians.map((g, i) => (
              <path key={`mb${i}`} d={g.back} fill="none" stroke="var(--color-border-strong)" strokeWidth="1" opacity="0.16" />
            ))}
            {grids.parallels.map((g, i) => (
              <path key={`pb${i}`} d={g.back} fill="none" stroke="var(--color-border-strong)" strokeWidth="1" opacity="0.16" />
            ))}
            {grids.meridians.map((g, i) => (
              <path key={`mf${i}`} d={g.front} fill="none" stroke="var(--color-border-strong)" strokeWidth="1" opacity="0.42" />
            ))}
            {grids.parallels.map((g, i) => (
              <path key={`pf${i}`} d={g.front} fill="none" stroke="var(--color-border-strong)" strokeWidth="1" opacity="0.42" />
            ))}

            {/* Equator ring */}
            <path d={grids.equator.back} fill="none" stroke="var(--color-border-strong)" strokeWidth="1" opacity="0.12" />
            <path d={grids.equator.front} fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.4" opacity="0.5" />

            {/* Axes */}
            {axes.map((ax) => (
              <g key={ax.name}>
                <line
                  x1="0"
                  y1="0"
                  x2={ax.screen[0]}
                  y2={ax.screen[1]}
                  stroke={ax.front ? 'var(--color-text-secondary)' : 'var(--color-border-strong)'}
                  strokeWidth="1.3"
                  opacity={ax.front ? 0.85 : 0.35}
                />
                <polygon
                  transform={`translate(${ax.screen[0]}, ${ax.screen[1]}) rotate(${(Math.atan2(ax.screen[1], ax.screen[0]) * 180) / Math.PI})`}
                  points="0,-3.2 8.5,0 0,3.2"
                  fill={ax.front ? 'var(--color-text-secondary)' : 'var(--color-border-strong)'}
                  opacity={ax.front ? 0.9 : 0.3}
                />
                <text
                  x={ax.screen[0] + (ax.front ? 10 : 0)}
                  y={ax.screen[1] + (ax.front ? 10 : 0)}
                  textAnchor={ax.screen[0] > 0 ? 'start' : 'end'}
                  dy="0.35em"
                  className={`qlab-bloch-axis ${ax.front ? 'is-front' : 'is-back'}`}
                >
                  {ax.name}
                </text>
              </g>
            ))}

            {/* Cardinal-state labels */}
            {cardinalMarkers.map((m) => (
              <g key={m.label}>
                <circle cx={m.screen[0]} cy={m.screen[1]} r="1.8" fill={m.front ? 'var(--color-text-muted)' : 'var(--color-border-strong)'} opacity={m.front ? 0.8 : 0.3} />
                <text
                  x={m.screen[0] * 1.26}
                  y={m.screen[1] * 1.26}
                  textAnchor="middle"
                  dy="0.35em"
                  className={`qlab-bloch-state-label ${m.front ? 'is-front' : 'is-back'}`}
                >
                  {m.label}
                </text>
              </g>
            ))}

            {/* Equator projection guide */}
            <g opacity={atCenter ? 0 : 0.5}>
              <line
                x1={ea}
                y1={eb}
                x2={tipX}
                y2={tipY}
                stroke="var(--color-text-muted)"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
              <circle cx={ea} cy={eb} r="2.2" fill="none" stroke="var(--color-text-muted)" strokeWidth="1" />
            </g>

            {/* State vector arrow with phase-colored tip */}
            {!atCenter && (
              <g className="qlab-bloch-vector">
                <line
                  x1="0"
                  y1="0"
                  x2={arrowTipX}
                  y2={arrowTipY}
                  stroke={phaseColor}
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  opacity={pointOnFront ? 0.95 : 0.55}
                />
                <polygon
                  transform={`translate(${arrowTipX + Math.cos(arrowAngle) * 3}, ${arrowTipY + Math.sin(arrowAngle) * 3}) rotate(${(arrowAngle * 180) / Math.PI})`}
                  points={`0,0 ${-headSize},${-headSize * 0.55} ${-headSize * 0.4},0 ${-headSize},${headSize * 0.55}`}
                  fill={phaseColor}
                  opacity={pointOnFront ? 0.95 : 0.55}
                />
              </g>
            )}

            {/* State point */}
            {atCenter ? (
              <g>
                <circle cx="0" cy="0" r="4.5" fill="var(--color-text-muted)" stroke="var(--color-border-strong)" strokeWidth="1.5" />
              </g>
            ) : (
              <circle
                cx={tipX}
                cy={tipY}
                r={pointOnFront ? 7 : 5.5}
                fill={phaseColor}
                stroke="#fff"
                strokeWidth="2"
                opacity={pointOnFront ? 1 : 0.55}
              />
            )}
          </svg>
        )}
      </div>

      {/* ── Educational Quantum State Panel ── */}
      {sphereMode === 'bloch' ? (
        selectedQubit === 'all' && allQubits.length > 1 ? (
          /* Multi-Qubit Overview Panel */
          <div className="qlab-bloch-multi-panel">
            <div className="qlab-bloch-multi-head">
              <span className="qlab-bloch-panel-key">Circuit State (All Qubits in 1 Sphere)</span>
              <span className="qlab-bloch-badge pure">{numQubits} Qubits</span>
            </div>
            <div className="qlab-bloch-multi-grid">
              {allQubits.map((q, idx) => {
                const qCol = QUBIT_PALETTE[idx % QUBIT_PALETTE.length]
                const qPhaseCol = phaseToColor(q.phiDeg * D2R)
                return (
                  <button
                    key={idx}
                    type="button"
                    className="qlab-bloch-qubit-card"
                    onClick={() => onSelectQubit?.(idx)}
                    title={`Click to inspect q${idx}`}
                  >
                    <div className="qlab-qubit-card-head">
                      <span className="qlab-qubit-card-dot" style={{ backgroundColor: qCol }} />
                      <strong>q{idx}</strong>
                      <span className={`qlab-bloch-badge ${q.basis}`}>{q.basis}</span>
                    </div>
                    <div className="qlab-qubit-card-stats">
                      <span>Coords:</span>
                      <code>({formatCoord(q.x, 2)}, {formatCoord(q.y, 2)}, {formatCoord(q.z, 2)})</code>
                    </div>
                    <div className="qlab-qubit-card-stats">
                      <span>Phase φ:</span>
                      <span className="qlab-phase-chip" style={{ color: qPhaseCol }}>
                        {q.phiDeg.toFixed(1)}°
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Single Selected Qubit Detailed Panel */
          <div className="qlab-bloch-panel">
            <div className="qlab-bloch-panel-row">
              <span className="qlab-bloch-panel-key">Qubit</span>
              <span className="qlab-bloch-panel-val qlab-bloch-panel-main">{label}</span>
              <span className={`qlab-bloch-badge ${info.basis}`}>{info.basis}</span>
            </div>
            <div className="qlab-bloch-panel-row">
              <span className="qlab-bloch-panel-key">Bloch Vector</span>
              <code className="qlab-bloch-panel-val qlab-sv-mono">
                ({formatCoord(info.x)}, {formatCoord(info.y)}, {formatCoord(info.z)})
              </code>
            </div>
            <div className="qlab-bloch-panel-row">
              <span className="qlab-bloch-panel-key">State</span>
              <code className="qlab-bloch-panel-val qlab-sv-mono">{info.stateLabel}</code>
            </div>
            <div className="qlab-bloch-panel-row">
              <span className="qlab-bloch-panel-key">Purity</span>
              <code className="qlab-bloch-panel-val qlab-sv-mono">{info.purity.toFixed(3)}</code>
            </div>
            <div className="qlab-bloch-panel-row">
              <span className="qlab-bloch-panel-key">θ</span>
              <code className="qlab-bloch-panel-val qlab-sv-mono">{info.thetaDeg.toFixed(1)}°</code>
              <span className="qlab-bloch-panel-key">φ (Phase)</span>
              <span className="qlab-bloch-panel-phase" style={{ color: phaseColor }}>
                <span className="qlab-phase-dot" style={{ backgroundColor: phaseColor }} />
                <code className="qlab-sv-mono">{info.phiDeg.toFixed(1)}°</code>
              </span>
            </div>
          </div>
        )
      ) : (
        /* Q-Sphere Circuit State Panel */
        <div className="qlab-bloch-qsphere-panel">
          <div className="qlab-bloch-panel-row">
            <span className="qlab-bloch-panel-key">Representation</span>
            <span className="qlab-bloch-panel-val qlab-bloch-panel-main">
              Circuit Statevector Q-Sphere
            </span>
            <span className="qlab-bloch-badge pure">{1 << numQubits} Basis States</span>
          </div>
          <div className="qlab-bloch-panel-row">
            <span className="qlab-bloch-panel-key">Superpositions</span>
            <span className="qlab-bloch-panel-val">
              {activeBasisStates.length} non-zero amplitude state(s)
            </span>
          </div>
          <div className="qlab-qsphere-states-preview">
            {activeBasisStates.slice(0, 6).map((st) => (
              <div key={st.label} className="qlab-qsphere-chip">
                <span className="qlab-phase-dot" style={{ backgroundColor: st.color }} />
                <span className="qlab-qsphere-chip-ket">|{st.label}⟩</span>
                <span className="qlab-qsphere-chip-prob">{(st.probability * 100).toFixed(1)}%</span>
                <span className="qlab-qsphere-chip-phase" style={{ color: st.color }}>
                  {st.phaseDeg.toFixed(0)}°
                </span>
              </div>
            ))}
            {activeBasisStates.length > 6 && (
              <span className="qlab-qsphere-more">+{activeBasisStates.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      <div className="qlab-bloch-sub">
        {sphereMode === 'bloch'
          ? '3D orbit drag to rotate · scroll to zoom · phase φ mapped to spectrum colors'
          : 'Q-Sphere: Node size = |amplitude| · Node color = Quantum Phase φ'}
      </div>
    </div>
  )
}