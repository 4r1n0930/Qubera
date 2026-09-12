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
const DEFAULT_AZIM = 0.6 // ~34° azimuth around vertical Z axis
const DEFAULT_ELEV = 0.35 // ~20° elevation tilt above equator
const LATITUDES = [-60, -30, 30, 60]
const LONGITUDES = [-90, -45, 0, 45, 90, 135, 180]
const D2R = Math.PI / 180

type Vec3 = [number, number, number]

/**
 * Standard orthographic projection with vertical Z polar axis:
 *  - Z is vertical (+Z is north pole |0⟩ pointing upwards)
 *  - Azimuth `azim` rotates around vertical Z axis (yaw)
 *  - Elevation `elev` tilts viewing plane down from above equator (pitch)
 */
function viewOf(x: number, y: number, z: number, azim: number, elev: number): Vec3 {
  // Step 1: Azimuth rotation around vertical Z axis
  const ca = Math.cos(azim)
  const sa = Math.sin(azim)
  const x1 = ca * x - sa * y
  const y1 = sa * x + ca * y
  const z1 = z

  // Step 2: Elevation tilt around horizontal screen axis
  const ce = Math.cos(elev)
  const se = Math.sin(elev)
  const sx = x1
  // In SVG, screen Y is positive downwards, so +Z (north pole) points upwards (negative sy)
  const sy = -ce * z1 + se * y1
  const sz = se * z1 + ce * y1

  return [sx * R, sy * R, sz]
}

interface PathD {
  front: string
  back: string
}

function circlePath(pointOf: (t: number) => Vec3, azim: number, elev: number, step = 0.1): PathD {
  let front = ''
  let back = ''
  let frontOn = false
  let backOn = false
  for (let t = 0; t <= Math.PI * 2 + step; t += step) {
    const [x, y, z] = pointOf(t)
    const [sx, sy, sz] = viewOf(x, y, z, azim, elev)
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
  const rad = Math.cos(lat)
  return [rad * Math.cos(t), rad * Math.sin(t), Math.sin(lat)]
}

const lonCircle = (azDeg: number) => (t: number): Vec3 => {
  const az = azDeg * D2R
  return [Math.cos(az) * Math.cos(t), Math.sin(az) * Math.cos(t), Math.sin(t)]
}

const equatCircle = (t: number): Vec3 => [Math.cos(t), Math.sin(t), 0]

function equatorPolygon(azim: number, elev: number, step = 0.15): string {
  const pts: string[] = []
  for (let t = 0; t <= Math.PI * 2; t += step) {
    const [x, y, z] = equatCircle(t)
    const [sx, sy] = viewOf(x, y, z, azim, elev)
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

  // 2D SVG camera orientation state (azim = horizontal spin around Z, elev = tilt)
  const [azim, setAzim] = useState(DEFAULT_AZIM)
  const [elev, setElev] = useState(DEFAULT_ELEV)
  const dragRef = useRef<{ x: number; y: number; azim: number; elev: number } | null>(null)

  // Animated vector for 2D mode
  const pt = useAnimatedVector({ x: info.x, y: info.y, z: info.z })
  const pointScreen = useMemo<Vec3>(() => viewOf(pt.x, pt.y, pt.z, azim, elev), [pt, azim, elev])
  const pointOnFront = pointScreen[2] >= 0
  const r = Math.sqrt(pt.x * pt.x + pt.y * pt.y + pt.z * pt.z)
  const atCenter = r < 1e-6
  const [ea, eb] = viewOf(clean(pt.x), clean(pt.y), 0, azim, elev)

  // 2D Axes & Grids
  const axes: Axis[] = useMemo(() => {
    const names = ['X', 'Y', 'Z']
    return names.map((name, i) => {
      const vec: Vec3 = [0, 0, 0]
      vec[i] = 1
      const screen = viewOf(vec[0], vec[1], vec[2], azim, elev)
      return { name, vec, screen, front: screen[2] >= 0 }
    })
  }, [azim, elev])

  const cardinalMarkers = useMemo(
    () =>
      CARDINAL_POINTS.map((c) => {
        const screen = viewOf(c.vec[0], c.vec[1], c.vec[2], azim, elev)
        return { ...c, screen, front: screen[2] >= 0 }
      }),
    [azim, elev]
  )

  const grids = useMemo(
    () => ({
      parallels: LATITUDES.map((lat) => circlePath(latCircle(lat), azim, elev)),
      meridians: LONGITUDES.map((az) => circlePath(lonCircle(az), azim, elev)),
      equator: circlePath(equatCircle, azim, elev),
      plane: equatorPolygon(azim, elev),
    }),
    [azim, elev]
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
      dragRef.current = { x: e.clientX, y: e.clientY, azim, elev }
      ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
    },
    [azim, elev]
  )

  const handleMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d) return
    setAzim(d.azim - (e.clientX - d.x) * 0.01)
    setElev(Math.min(1.4, Math.max(-1.4, d.elev + (e.clientY - d.y) * 0.01)))
  }, [])

  const handleUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const resetView = useCallback(() => {
    setAzim(DEFAULT_AZIM)
    setElev(DEFAULT_ELEV)
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

            {/* Equator projection guide (for single selected qubit) */}
            {(selectedQubit !== 'all' || allQubits.length <= 1) && !atCenter && (
              <g opacity={0.5}>
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
            )}

            {/* State vector arrows (All qubits or single selected qubit) */}
            {selectedQubit === 'all' && allQubits.length > 1 ? (
              allQubits.map((q, idx) => {
                const qCol = QUBIT_PALETTE[idx % QUBIT_PALETTE.length]
                const [sx, sy, sz] = viewOf(q.x, q.y, q.z, azim, elev)
                const qLen = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z)
                const qAtCenter = qLen < 1e-6
                const qAngle = Math.atan2(sy, sx)
                const onFront = sz >= 0

                if (qAtCenter) {
                  return (
                    <g key={idx} onClick={() => onSelectQubit?.(idx)} style={{ cursor: 'pointer' }}>
                      <circle cx={0} cy={(idx - (allQubits.length - 1) / 2) * 8} r={3.5} fill={qCol} opacity={0.85} />
                      <text x={8} y={(idx - (allQubits.length - 1) / 2) * 8} dy="0.35em" fill={qCol} fontSize="9">
                        q{idx}: mixed
                      </text>
                    </g>
                  )
                }

                return (
                  <g key={idx} className="qlab-bloch-vector" onClick={() => onSelectQubit?.(idx)} style={{ cursor: 'pointer' }}>
                    <line
                      x1={0}
                      y1={0}
                      x2={sx}
                      y2={sy}
                      stroke={qCol}
                      strokeWidth={3}
                      strokeLinecap="round"
                      opacity={onFront ? 0.95 : 0.55}
                    />
                    <polygon
                      transform={`translate(${sx + Math.cos(qAngle) * 2}, ${sy + Math.sin(qAngle) * 2}) rotate(${(qAngle * 180) / Math.PI})`}
                      points={`0,0 ${-headSize},${-headSize * 0.55} ${-headSize * 0.4},0 ${-headSize},${headSize * 0.55}`}
                      fill={qCol}
                      opacity={onFront ? 0.95 : 0.55}
                    />
                    <circle
                      cx={sx}
                      cy={sy}
                      r={onFront ? 6 : 4.5}
                      fill={qCol}
                      stroke="#fff"
                      strokeWidth={1.5}
                      opacity={onFront ? 1 : 0.6}
                    />
                    <text
                      x={sx + Math.cos(qAngle) * 14}
                      y={sy + Math.sin(qAngle) * 14}
                      textAnchor="middle"
                      dy="0.35em"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      q{idx}
                    </text>
                  </g>
                )
              })
            ) : (
              <>
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
                {atCenter ? (
                  <circle cx="0" cy="0" r="4.5" fill="var(--color-text-muted)" stroke="var(--color-border-strong)" strokeWidth="1.5" />
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
              </>
            )}
          </svg>
        )}

        {/* Floating State Badge Overlay (PART 2) */}
        {sphereMode === 'bloch' && (
          <div className="qlab-bloch-state-overlay" aria-label="Qubit Bloch vector details">
            <div className="qlab-bloch-state-overlay-title">
              {selectedQubit === 'all' ? (allQubits.length > 1 ? 'All Qubits' : 'Qubit 0') : `Qubit ${selectedQubit}`}
            </div>
            <div className="qlab-bloch-state-overlay-sub">Bloch Vector</div>
            <div className="qlab-bloch-state-overlay-coords">
              <span>x: {formatCoord(info.x, 2)}</span>
              <span>y: {formatCoord(info.y, 2)}</span>
              <span>z: {formatCoord(info.z, 2)}</span>
            </div>
          </div>
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