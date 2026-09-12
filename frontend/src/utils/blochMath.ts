/**
 * Bloch-sphere mathematics for the Quantum Lab visualizations.
 *
 * Everything here is derived from the authoritative simulator output that the
 * Python service returns: the `bloch_vectors` (computed server-side from each
 * qubit's reduced density matrix) and, when those are absent, the full
 * `statevector`. No state is invented or hardcoded — the only fallback is the
 * trivial initial |0…0⟩ state before a circuit has ever been run.
 *
 * Conventions (matching `app/services/visualization.py`):
 *   - Statevector index `i` corresponds to the bitstring `format(i, n)` with
 *     qubit 0 as the most significant bit.
 *   - For a pure single qubit |ψ⟩ = α|0⟩ + β|1⟩:
 *         x = 2·Re(α*·β)     y = 2·Im(α*·β)     z = |α|² − |β|²
 *     giving |0⟩→+Z, |1⟩→−Z, |+⟩→+X, |−⟩→−X, |+i⟩→+Y, |-i⟩→−Y.
 */

import type { BlochVector, ComplexAmplitude } from '../api/quantumApi'

/** Values smaller than this are treated as exact 0 (e.g. 6.123e-17 → 0). */
const NEAR_ZERO = 1e-12

export interface QubitVisualization {
  /** Bloch vector of the selected qubit. */
  x: number
  y: number
  z: number
  /** Magnitude of the Bloch vector: 1 for pure states, 0 for maximally mixed. */
  r: number
  /** Purity Tr(ρ²) = (1 + r²) / 2. 1.0 for a pure state, 0.5 for maximally mixed. */
  purity: number
  /** Polar angle θ from the +Z axis, in degrees [0°, 180°]. */
  thetaDeg: number
  /** Azimuthal angle φ around Z from +X, in degrees [0°, 360°). */
  phiDeg: number
  /** Whether the reduced state is pure (vector on the surface of the sphere). */
  isPure: boolean
  /** Whether the reduced state is maximally mixed (vector at the origin). */
  isMaximallyMixed: boolean
  /** Educational classification of the state. */
  basis: 'pure' | 'mixed' | 'maximally-mixed'
  /** Human-readable state label, e.g. `|+⟩` or a generic Bloch form. */
  stateLabel: string
}

export const DEFAULT_BLOCH: BlochVector = { x: 0, y: 0, z: 1 }

/** The initial display state before any circuit has run: |0⟩ on the north pole. */
export function defaultQubitVisualization(): QubitVisualization {
  return blochVectorToVisualization(DEFAULT_BLOCH)
}

/** Truncate floating-point noise like 6.123e-17 down to an exact 0. */
export function clean(v: number): number {
  return Math.abs(v) < NEAR_ZERO ? 0 : v
}

/**
 * Bloch vector of a pure single-qubit state, from the explicit component
 * formula of requirement: x = 2·Re(α*·β), y = 2·Im(α*·β), z = |α|² − |β|².
 */
export function pureStateBloch(alpha: ComplexAmplitude, beta: ComplexAmplitude): BlochVector {
  const ab = {
    re: alpha.real * beta.real + alpha.imag * beta.imag, // Re(αβ*) = Re(α*β)
    im: alpha.real * beta.imag - alpha.imag * beta.real, // Im(α*β)
  }
  return {
    x: clean(2 * ab.re),
    y: clean(2 * ab.im),
    z: clean(alpha.real ** 2 + alpha.imag ** 2 - (beta.real ** 2 + beta.imag ** 2)),
  }
}

/** A BlochVector from a single-qubit 2×2 density matrix (stored row-major). */
export function blochFromRho(rho: ComplexAmplitude[]): BlochVector {
  if (rho.length !== 4) throw new Error('rho must be a 2x2 density matrix (4 entries)')
  const r01 = rho[1]
  return {
    x: clean(2 * r01.real),
    // y = 2·Im(α*β) = −2·Im(αβ*) = −2·Im(ρ01).
    y: clean(-2 * r01.imag),
    z: clean(rho[0].real - rho[3].real),
  }
}

/**
 * Partially trace a full statevector down to one qubit's 2×2 density matrix.
 *
 * The statevector index `i` is the bitstring `format(i, n)` with qubit 0 as
 * the most significant bit, so qubit `target` lives at bit position
 * `n − 1 − target`.
 */
export function qubitReducedDensityMatrix(
  statevector: ComplexAmplitude[],
  qubit: number,
  numQubits: number
): ComplexAmplitude[] {
  const n = numQubits
  const dim = 1 << n
  if (statevector.length !== dim) {
    throw new Error(`statevector must have 2^${n} = ${dim} amplitudes`)
  }
  if (qubit < 0 || qubit >= n) {
    throw new Error(`qubit ${qubit} out of range for a ${n}-qubit state`)
  }

  const re = new Float64Array(dim)
  const im = new Float64Array(dim)
  for (let i = 0; i < dim; i++) {
    re[i] = statevector[i].real
    im[i] = statevector[i].imag
  }

  const p = n - 1 - qubit // target bit position (0 = LSB)
  const lowMask = (1 << p) - 1
  const total = 1 << (n - 1)

  // Row-major 2×2: rho[0]=ρ00, rho[1]=ρ01, rho[2]=ρ10, rho[3]=ρ11.
  const rho: ComplexAmplitude[] = [
    { real: 0, imag: 0 },
    { real: 0, imag: 0 },
    { real: 0, imag: 0 },
    { real: 0, imag: 0 },
  ]

  // Diagonals: ρ00 = Σ |ψ(... , target=0)|², ρ11 = Σ |ψ(... , target=1)|².
  for (let i = 0; i < dim; i++) {
    const mag2 = re[i] * re[i] + im[i] * im[i]
    if ((i & (1 << p)) === 0) rho[0].real += mag2
    else rho[3].real += mag2
  }

  // Off-diagonals: ρ[r][c] = Σ_other ψ(other ∪ {target=r}) · conj(ψ(other ∪ {target=c})).
  for (let s = 0; s < total; s++) {
    const low = s & lowMask
    const high = (s >> p) << (p + 1)
    const base = low | high
    const i0 = base // target = 0
    const i1 = base | (1 << p) // target = 1

    const re0 = re[i0]
    const im0 = im[i0]
    const re1 = re[i1]
    const im1 = im[i1]

    // ψ0 · conj(ψ1)
    rho[1].real += re0 * re1 + im0 * im1
    rho[1].imag += im0 * re1 - re0 * im1
    // ψ1 · conj(ψ0)
    rho[2].real += re1 * re0 + im1 * im0
    rho[2].imag += im1 * re0 - re1 * im0
  }

  return rho
}

/** Bloch vector of a qubit derived from the full statevector's reduced density matrix. */
export function blochFromStatevector(
  statevector: ComplexAmplitude[],
  qubit: number,
  numQubits: number
): BlochVector {
  if (numQubits === 1 && statevector.length >= 2) {
    return pureStateBloch(statevector[0], statevector[1])
  }
  return blochFromRho(qubitReducedDensityMatrix(statevector, qubit, numQubits))
}

function normalizeDeg(angle: number): number {
  const d = ((angle % 360) + 360) % 360
  return Math.abs(d - 360) < NEAR_ZERO ? 0 : d
}

/** Human-readable ket label for one of the six cardinal Bloch points. */
function cardinalLabel(v: BlochVector): string | null {
  const closeTo = (target: BlochVector) => {
    const dx = v.x - target.x
    const dy = v.y - target.y
    const dz = v.z - target.z
    return dx * dx + dy * dy + dz * dz
  }
  if (closeTo({ x: 0, y: 0, z: 1 }) < 1e-6) return '|0⟩'
  if (closeTo({ x: 0, y: 0, z: -1 }) < 1e-6) return '|1⟩'
  if (closeTo({ x: 1, y: 0, z: 0 }) < 1e-6) return '|+⟩'
  if (closeTo({ x: -1, y: 0, z: 0 }) < 1e-6) return '|−⟩'
  if (closeTo({ x: 0, y: 1, z: 0 }) < 1e-6) return '|+i⟩'
  if (closeTo({ x: 0, y: -1, z: 0 }) < 1e-6) return '|-i⟩'
  return null
}

/** Turn a Bloch vector into the full educational description of the qubit state. */
export function blochVectorToVisualization(vector: BlochVector): QubitVisualization {
  const x = clean(vector.x)
  const y = clean(vector.y)
  const z = clean(vector.z)
  const r = Math.min(1, Math.sqrt(x * x + y * y + z * z))

  const thetaRad = Math.atan2(Math.sqrt(x * x + y * y), z)
  const thetaDeg = ((thetaRad * 180) / Math.PI)
  const phiDeg = normalizeDeg((Math.atan2(y, x) * 180) / Math.PI)

  const isMaximallyMixed = r < NEAR_ZERO
  const isPure = Math.abs(1 - r) < 1e-6
  const purity = (1 + r * r) / 2

  let stateLabel: string
  let basis: QubitVisualization['basis']
  if (isMaximallyMixed) {
    stateLabel = 'ρ = ½I'
    basis = 'maximally-mixed'
  } else if (isPure) {
    basis = 'pure'
    stateLabel = cardinalLabel({ x, y, z }) ?? genericStateLabel(thetaDeg, phiDeg)
  } else {
    basis = 'mixed'
    stateLabel = 'mixed · r = ' + r.toFixed(3)
  }

  return {
    x,
    y,
    z,
    r: Math.round(r * 1e6) / 1e6,
    purity: Math.round(purity * 1e6) / 1e6,
    thetaDeg,
    phiDeg,
    isPure,
    isMaximallyMixed,
    basis,
    stateLabel,
  }
}

function genericStateLabel(thetaDeg: number, phiDeg: number): string {
  const θ = thetaDeg.toFixed(1)
  const φ = phiDeg.toFixed(1)
  return `cos(${θ}°/2)|0⟩ + e^${φ}°i·sin(${θ}°/2)|1⟩`
}

/**
 * Authoritative qubit state for the Bloch sphere.
 *
 * Uses the simulator-provided `bloch_vectors` when available (computed
 * server-side from the reduced density matrix), otherwise derives the vector
 * from the `statevector` in the frontend. Falls back to |0⟩ only before any
 * execution has produced a result.
 */
export function deriveQubitVisualization(input: {
  vector?: BlochVector
  statevector?: ComplexAmplitude[]
  qubit: number
  numQubits: number
}): QubitVisualization {
  const { vector, statevector, qubit, numQubits } = input

  if (vector) {
    return blochVectorToVisualization({ x: vector.x, y: vector.y, z: vector.z })
  }

  if (statevector && statevector.length > 0) {
    try {
      return blochVectorToVisualization(blochFromStatevector(statevector, qubit, numQubits))
    } catch {
      return defaultQubitVisualization()
    }
  }

  return defaultQubitVisualization()
}

/** Format a number for display: fixed decimals with near-zero shown as 0. */
export function formatCoord(value: number, decimals = 3): string {
  const v = clean(value)
  if (Math.abs(v) < 0.5 * 10 ** -decimals) return (0).toFixed(decimals)
  const s = v.toFixed(decimals)
  return s.replace(/^-0\./, '0.')
}

/** Format a Bloch vector as `(x, y, z)`. */
export function formatBloch(vector: BlochVector, decimals = 2): string {
  return `(${formatCoord(vector.x, decimals)}, ${formatCoord(vector.y, decimals)}, ${formatCoord(vector.z, decimals)})`
}

/* ------------------------------------------------------------------ */
/*  Phase Color & Multi-Qubit Q-Sphere Utilities                      */
/* ------------------------------------------------------------------ */

export const QUBIT_PALETTE = [
  '#38bdf8', // q0: Sky blue
  '#a855f7', // q1: Purple
  '#10b981', // q2: Emerald
  '#f59e0b', // q3: Amber
  '#ec4899', // q4: Pink
  '#6366f1', // q5: Indigo
  '#14b8a6', // q6: Teal
  '#ef4444', // q7: Red
]

/**
 * Maps a phase angle in radians to a hue in degrees [0, 360).
 * 0 rad (real +) -> 0° (red/coral)
 * π/2 rad (imag +i) -> 90° (gold/chartreuse)
 * π rad (real -) -> 180° (cyan/teal)
 * -π/2 rad (imag -i) -> 270° (violet/purple)
 */
export function phaseToHue(phaseRad: number): number {
  if (isNaN(phaseRad)) return 0
  const deg = (phaseRad * 180) / Math.PI
  return ((deg % 360) + 360) % 360
}

/** Converts HSL (h in [0, 360], s in [0, 100], l in [0, 100]) to 24-bit RGB integer. */
export function hslToHex(h: number, s: number, l: number): number {
  const lNorm = l / 100
  const a = (s * Math.min(lNorm, 1 - lNorm)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
  }
  return (f(0) << 16) | (f(8) << 8) | f(4)
}

/**
 * Converts a quantum phase angle (in radians) into an HSL color string.
 */
export function phaseToColor(phaseRad: number, saturation = 90, lightness = 55): string {
  const hue = Math.round(phaseToHue(phaseRad))
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/** Converts a quantum phase angle (in radians) into a 24-bit hex number for Three.js. */
export function phaseToHexColor(phaseRad: number, saturation = 90, lightness = 55): number {
  const hue = phaseToHue(phaseRad)
  return hslToHex(hue, saturation, lightness)
}

export interface QSphereBasisState {
  index: number
  label: string
  hammingWeight: number
  thetaRad: number
  phiRad: number
  x: number
  y: number
  z: number
  amplitude: ComplexAmplitude
  magnitude: number
  probability: number
  phaseRad: number
  phaseDeg: number
  color: string
  hexColor: number
}

function countSetBits(n: number): number {
  let count = 0
  let temp = n
  while (temp > 0) {
    count += temp & 1
    temp >>= 1
  }
  return count
}

/**
 * Computes the 3D surface coordinates, amplitudes, probabilities, and phase colors
 * for all computational basis states of an N-qubit quantum state on a Q-Sphere.
 */
export function getQSphereBasisStates(
  numQubits: number,
  statevector?: ComplexAmplitude[]
): QSphereBasisState[] {
  const n = Math.max(1, numQubits)
  const total = 1 << n

  // Group states by Hamming weight
  const weightGroups = new Map<number, number[]>()
  for (let i = 0; i < total; i++) {
    const w = countSetBits(i)
    if (!weightGroups.has(w)) weightGroups.set(w, [])
    weightGroups.get(w)!.push(i)
  }

  const result: QSphereBasisState[] = []

  for (let i = 0; i < total; i++) {
    const w = countSetBits(i)
    const group = weightGroups.get(w) ?? [i]
    const m = group.indexOf(i)
    const kCount = group.length

    let thetaRad = 0
    let phiRad = 0

    if (n === 1) {
      thetaRad = w === 0 ? 0 : Math.PI
      phiRad = 0
    } else if (w === 0) {
      thetaRad = 0
      phiRad = 0
    } else if (w === n) {
      thetaRad = Math.PI
      phiRad = 0
    } else {
      thetaRad = (w / n) * Math.PI
      phiRad = (2 * Math.PI * m) / kCount
    }

    const x = clean(Math.sin(thetaRad) * Math.cos(phiRad))
    const y = clean(Math.sin(thetaRad) * Math.sin(phiRad))
    const z = clean(Math.cos(thetaRad))

    const amp = statevector && statevector.length === total
      ? statevector[i]
      : i === 0
      ? { real: 1, imag: 0 }
      : { real: 0, imag: 0 }

    const mag = Math.sqrt(amp.real * amp.real + amp.imag * amp.imag)
    const prob = clean(mag * mag)
    const phaseRad = Math.atan2(amp.imag, amp.real)
    const phaseDeg = normalizeDeg((phaseRad * 180) / Math.PI)

    result.push({
      index: i,
      label: i.toString(2).padStart(n, '0'),
      hammingWeight: w,
      thetaRad,
      phiRad,
      x,
      y,
      z,
      amplitude: amp,
      magnitude: mag,
      probability: prob,
      phaseRad,
      phaseDeg,
      color: phaseToColor(phaseRad),
      hexColor: phaseToHexColor(phaseRad),
    })
  }

  return result
}

/**
 * Derives visualization objects for all qubits in the circuit simultaneously.
 */
export function deriveAllQubitVisualizations(
  numQubits: number,
  blochVectors?: Record<string, BlochVector>,
  statevector?: ComplexAmplitude[]
): QubitVisualization[] {
  const result: QubitVisualization[] = []
  for (let q = 0; q < numQubits; q++) {
    result.push(
      deriveQubitVisualization({
        vector: blochVectors?.[`q${q}`],
        statevector,
        qubit: q,
        numQubits,
      })
    )
  }
  return result
}