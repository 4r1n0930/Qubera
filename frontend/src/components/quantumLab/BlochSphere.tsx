import { useEffect, useRef, useState, useCallback } from 'react'
import type { BlochVector } from '../../types/quantumLab'

interface BlochSphereProps {
  vector: BlochVector
  probability0?: number
  probability1?: number
  label?: string
}

const R = 100
const ANIM_MS = 480

function rotY(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a), s = Math.sin(a)
  return [c * x + s * z, y, -s * x + c * z]
}

function rotX(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a), s = Math.sin(a)
  return [x, c * y - s * z, s * y + c * z]
}

function project(x: number, y: number, z: number, rx: number, ry: number): [number, number, number] {
  const p = rotY(x, y, z, ry)
  return rotX(p[0], p[1], p[2], rx)
}

function ellipsePoints(rx: number, ry: number, rot: number, step = 0.15): string {
  const pts: string[] = []
  for (let t = 0; t <= Math.PI * 2; t += step) {
    const x = rx * Math.cos(t)
    const y = ry * Math.sin(t)
    const p = project(x, y, 0, rot, 0)
    pts.push(`${p[0].toFixed(2)},${p[1].toFixed(2)}`)
  }
  return pts.join(' ')
}

function sphereArc(rx: number, rz: number, rot: number): string {
  const pts: string[] = []
  for (let t = 0; t <= Math.PI; t += 0.12) {
    const x = rx * Math.cos(t)
    const z = rz * Math.sin(t)
    const p = project(x, 0, z, rot, 0)
    pts.push(`${p[0].toFixed(2)},${p[1].toFixed(2)}`)
  }
  return pts.join(' ')
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Smoothly interpolates toward the target Bloch vector whenever it changes,
 * so the point glides from its previous position to the new quantum state.
 */
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

export function BlochSphere({ vector, probability0, probability1, label = '|ψ⟩' }: BlochSphereProps) {
  const [rotX, setRotX] = useState(0.5)
  const [rotY, setRotY] = useState(0.6)
  const [showInfo, setShowInfo] = useState(false)
  const dragRef = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null)

  const pt = useAnimatedVector(vector)
  const [px, py, pz] = project(pt.x, pt.y, pt.z, rotX, rotY)

  const p0 = probability0 ?? 1
  const p1 = probability1 ?? 0
  const mag = Math.sqrt(pt.x * pt.x + pt.y * pt.y + pt.z * pt.z)

  const handleDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY }
    ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
  }, [rotX, rotY])

  const handleMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d) return
    setRotX(Math.min(1.4, Math.max(-1.4, d.rx + (e.clientY - d.y) * 0.01)))
    setRotY(d.ry - (e.clientX - d.x) * 0.01)
  }, [])

  const handleUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const axes = [0, 1, 2].map((i) => {
    const coord = [0, 0, 0] as [number, number, number]
    coord[i] = 1
    const end = project(coord[0], coord[1], coord[2], rotX, rotY)
    const names = ['X', 'Y', 'Z']
    return { end, name: names[i], front: end[2] >= 0 }
  })

  const equator = ellipsePoints(R, R * 0.42, rotX)
  const meridianX = sphereArc(R, R * 0.4, rotX)

  const fmt = (v: number) => v.toFixed(4).replace(/^-0\./, '0.')

  return (
    <div className="qlab-bloch">
      <div className="qlab-bloch-label">Bloch Sphere · {label}</div>

      <svg
        width="260"
        height="260"
        viewBox="-130 -130 260 260"
        preserveAspectRatio="xMidYMid meet"
        className="qlab-bloch-svg"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        style={{ touchAction: 'none' }}
      >
        {/* transparent sphere outline (depth cue, neutral) */}
        <circle r={R} fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />

        {/* equatorial + meridian guides (depth cues) */}
        <polyline
          points={equator}
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth="1"
          opacity="0.6"
        />
        <polyline
          points={meridianX}
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* axes */}
        {axes.map((ax) => (
          <g key={ax.name}>
            <line
              x1="0"
              y1="0"
              x2={ax.end[0]}
              y2={ax.end[1]}
              stroke={ax.front ? 'var(--color-text-secondary)' : 'var(--color-border-strong)'}
              strokeWidth="1.2"
              opacity={ax.front ? 0.85 : 0.4}
            />
            <circle
              cx={ax.end[0]}
              cy={ax.end[1]}
              r="3.5"
              fill={ax.front ? 'var(--color-text-secondary)' : 'var(--color-surface-muted)'}
              stroke="var(--color-border-strong)"
              strokeWidth="1"
            />
            <text x={ax.end[0] * 1.14} y={ax.end[1] * 1.14} textAnchor="middle" dy="0.35em" className="qlab-bloch-axis">
              {ax.front ? ax.name : ''}
            </text>
          </g>
        ))}

        {/* state vector line from origin to the point */}
        <line
          x1="0"
          y1="0"
          x2={px}
          y2={py}
          stroke="var(--color-secondary)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        />
        <circle
          cx={px}
          cy={py}
          r="9"
          fill={pz > 0 ? 'var(--color-secondary)' : 'var(--color-secondary-hover)'}
          stroke="#fff"
          strokeWidth="2.5"
        />
        {/* equator projection hint (drops a faint reference point) */}
        <circle
          cx={px}
          cy={0}
          r="2.5"
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>

      {/* Coordinates summary (always visible) */}
      <div className="qlab-bloch-coords qlab-bloch-sub">
        P(0) {p0.toFixed(3)} · P(1) {p1.toFixed(3)} · (x, y, z)
      </div>

      {/* Hover / toggle info panel with full debugging readout */}
      <button
        type="button"
        className="qlab-bloch-info-toggle"
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
        onClick={() => setShowInfo((s) => !s)}
        aria-pressed={showInfo}
      >
        {showInfo ? 'Hide state details' : 'Show state details'}
      </button>

      {showInfo && (
        <div className="qlab-bloch-info">
          <div className="qlab-bloch-info-row">
            <span>P(0)</span>
            <code>{fmt(p0)}</code>
          </div>
          <div className="qlab-bloch-info-row">
            <span>P(1)</span>
            <code>{fmt(p1)}</code>
          </div>
          <div className="qlab-bloch-info-divider" />
          <div className="qlab-bloch-info-row">
            <span>X</span>
            <code>{fmt(pt.x)}</code>
          </div>
          <div className="qlab-bloch-info-row">
            <span>Y</span>
            <code>{fmt(pt.y)}</code>
          </div>
          <div className="qlab-bloch-info-row">
            <span>Z</span>
            <code>{fmt(pt.z)}</code>
          </div>
          <div className="qlab-bloch-info-divider" />
          <div className="qlab-bloch-info-row">
            <span>Magnitude</span>
            <code>√(x² + y² + z²) = {mag.toFixed(4)}</code>
          </div>
        </div>
      )}

      <div className="qlab-bloch-sub">drag to rotate · 3D</div>
    </div>
  )
}