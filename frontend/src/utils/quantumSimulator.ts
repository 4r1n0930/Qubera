/**
 * Quantum Circuit Simulation Engine
 * High-performance statevector simulator for multi-qubit systems (1-6 qubits).
 * Calculates exact unitary evolution, basis state probabilities, and shot sampling.
 */

import type {
  CircuitState,
  ExecutionResult,
  BackendType,
  QubitState,
} from '../types/quantumLab'

export interface ComplexNumber {
  re: number
  im: number
}

function cAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return { re: a.re + b.re, im: a.im + b.im }
}

function cMul(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }
}

function cAbs2(a: ComplexNumber): number {
  return a.re * a.re + a.im * a.im
}

const SQRT1_2 = 1 / Math.SQRT2

// 2x2 unitary single-qubit matrices
type Matrix2x2 = [[ComplexNumber, ComplexNumber], [ComplexNumber, ComplexNumber]]

const MAT_I: Matrix2x2 = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
]

const MAT_X: Matrix2x2 = [
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
]

const MAT_Y: Matrix2x2 = [
  [{ re: 0, im: 0 }, { re: 0, im: -1 }],
  [{ re: 0, im: 1 }, { re: 0, im: 0 }],
]

const MAT_Z: Matrix2x2 = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: -1, im: 0 }],
]

const MAT_H: Matrix2x2 = [
  [{ re: SQRT1_2, im: 0 }, { re: SQRT1_2, im: 0 }],
  [{ re: SQRT1_2, im: 0 }, { re: -SQRT1_2, im: 0 }],
]

const MAT_S: Matrix2x2 = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: 1 }],
]

const MAT_T: Matrix2x2 = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: SQRT1_2, im: SQRT1_2 }],
]

const MAT_SDG: Matrix2x2 = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: -1 }],
]

const MAT_TDG: Matrix2x2 = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: SQRT1_2, im: -SQRT1_2 }],
]

const MAT_SX: Matrix2x2 = [
  [{ re: 0.5, im: 0.5 }, { re: 0.5, im: -0.5 }],
  [{ re: 0.5, im: -0.5 }, { re: 0.5, im: 0.5 }],
]

function rotationX(theta: number): Matrix2x2 {
  const c = Math.cos(theta / 2)
  const s = Math.sin(theta / 2)
  return [
    [{ re: c, im: 0 }, { re: 0, im: -s }],
    [{ re: 0, im: -s }, { re: c, im: 0 }],
  ]
}

function rotationY(theta: number): Matrix2x2 {
  const c = Math.cos(theta / 2)
  const s = Math.sin(theta / 2)
  return [
    [{ re: c, im: 0 }, { re: -s, im: 0 }],
    [{ re: s, im: 0 }, { re: c, im: 0 }],
  ]
}

function rotationZ(theta: number): Matrix2x2 {
  const eip = { re: Math.cos(theta / 2), im: Math.sin(theta / 2) }
  const ein = { re: Math.cos(theta / 2), im: -Math.sin(theta / 2) }
  return [
    [{ re: eip.re, im: eip.im }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: ein.re, im: ein.im }],
  ]
}

function phaseGate(lam: number): Matrix2x2 {
  const eil = { re: Math.cos(lam), im: Math.sin(lam) }
  return [
    [{ re: 1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: eil.re, im: eil.im }],
  ]
}

/**
 * Applies a 1-qubit gate matrix to an N-qubit statevector.
 * Qubit index 0 is the most significant bit (top wire).
 */
function applySingleQubitGate(
  state: ComplexNumber[],
  numQubits: number,
  targetQubit: number,
  matrix: Matrix2x2
): ComplexNumber[] {
  const dim = 1 << numQubits
  const nextState: ComplexNumber[] = new Array(dim)

  const bit = numQubits - 1 - targetQubit

  for (let i = 0; i < dim; i++) {
    if ((i & (1 << bit)) === 0) {
      const i0 = i
      const i1 = i | (1 << bit)

      const v0 = state[i0]
      const v1 = state[i1]

      // next0 = m00*v0 + m01*v1
      nextState[i0] = cAdd(cMul(matrix[0][0], v0), cMul(matrix[0][1], v1))
      // next1 = m10*v0 + m11*v1
      nextState[i1] = cAdd(cMul(matrix[1][0], v0), cMul(matrix[1][1], v1))
    }
  }

  return nextState
}

/**
 * Applies a Controlled-NOT (CX) gate.
 */
function applyCNOT(
  state: ComplexNumber[],
  numQubits: number,
  controlQubit: number,
  targetQubit: number
): ComplexNumber[] {
  const dim = 1 << numQubits
  const nextState = [...state]

  const ctrlBit = numQubits - 1 - controlQubit
  const trgtBit = numQubits - 1 - targetQubit

  for (let i = 0; i < dim; i++) {
    const isControlSet = (i & (1 << ctrlBit)) !== 0
    const isTargetSet = (i & (1 << trgtBit)) !== 0

    if (isControlSet && !isTargetSet) {
      const i0 = i
      const i1 = i | (1 << trgtBit)
      const tmp = nextState[i0]
      nextState[i0] = nextState[i1]
      nextState[i1] = tmp
    }
  }

  return nextState
}

/**
 * Applies a Controlled-Z (CZ) gate.
 */
function applyCZ(
  state: ComplexNumber[],
  numQubits: number,
  controlQubit: number,
  targetQubit: number
): ComplexNumber[] {
  const dim = 1 << numQubits
  const nextState = [...state]

  const ctrlBit = numQubits - 1 - controlQubit
  const trgtBit = numQubits - 1 - targetQubit

  for (let i = 0; i < dim; i++) {
    const isControlSet = (i & (1 << ctrlBit)) !== 0
    const isTargetSet = (i & (1 << trgtBit)) !== 0

    if (isControlSet && isTargetSet) {
      nextState[i] = { re: -nextState[i].re, im: -nextState[i].im }
    }
  }

  return nextState
}

/**
 * Applies a SWAP gate between two qubits.
 */
function applySWAP(
  state: ComplexNumber[],
  numQubits: number,
  qubitA: number,
  qubitB: number
): ComplexNumber[] {
  const dim = 1 << numQubits
  const nextState = [...state]

  const bitA = numQubits - 1 - qubitA
  const bitB = numQubits - 1 - qubitB

  for (let i = 0; i < dim; i++) {
    const isASet = (i & (1 << bitA)) !== 0
    const isBSet = (i & (1 << bitB)) !== 0

    if (isASet !== isBSet && !isASet && isBSet) {
      const iFlipped = (i | (1 << bitA)) & ~(1 << bitB)
      const tmp = nextState[i]
      nextState[i] = nextState[iFlipped]
      nextState[iFlipped] = tmp
    }
  }

  return nextState
}

/**
 * Applies a Toffoli (CCX) gate: flips target when both controls are |1⟩.
 * targets = [control1, control2, target].
 */
function applyCCX(
  state: ComplexNumber[],
  numQubits: number,
  targets: number[]
): ComplexNumber[] {
  const dim = 1 << numQubits
  const nextState = [...state]

  const [c1, c2, tgt] = targets
  const bitC1 = numQubits - 1 - c1
  const bitC2 = numQubits - 1 - c2
  const bitT = numQubits - 1 - tgt

  for (let i = 0; i < dim; i++) {
    const isC1Set = (i & (1 << bitC1)) !== 0
    const isC2Set = (i & (1 << bitC2)) !== 0
    const isTargetSet = (i & (1 << bitT)) !== 0

    if (isC1Set && isC2Set && !isTargetSet) {
      const iFlipped = i | (1 << bitT)
      const tmp = nextState[i]
      nextState[i] = nextState[iFlipped]
      nextState[iFlipped] = tmp
    }
  }

  return nextState
}

/**
 * Applies a Controlled-Controlled-Z (CCZ) gate: phase flip when all three are |1⟩.
 */
function applyCCZ(
  state: ComplexNumber[],
  numQubits: number,
  targets: number[]
): ComplexNumber[] {
  const dim = 1 << numQubits
  const nextState = [...state]

  const [q0, q1, q2] = targets
  const bit0 = numQubits - 1 - q0
  const bit1 = numQubits - 1 - q1
  const bit2 = numQubits - 1 - q2

  for (let i = 0; i < dim; i++) {
    const is0 = (i & (1 << bit0)) !== 0
    const is1 = (i & (1 << bit1)) !== 0
    const is2 = (i & (1 << bit2)) !== 0

    if (is0 && is1 && is2) {
      nextState[i] = { re: -nextState[i].re, im: -nextState[i].im }
    }
  }

  return nextState
}

/**
 * Applies an arbitrary 2-qubit gate defined by a 4x4 unitary matrix.
 * Qubits are [qA, qB], with qA = control (most significant of the two).
 */
type Matrix4x4 = ComplexNumber[][]

function rxxMatrix(theta: number): Matrix4x4 {
  const c = Math.cos(theta / 2)
  const s = { re: 0, im: -Math.sin(theta / 2) }
  const m: Matrix4x4 = [
    [{ re: c, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: s.re, im: s.im }],
    [{ re: 0, im: 0 }, { re: c, im: 0 }, { re: s.re, im: s.im }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: s.re, im: s.im }, { re: c, im: 0 }, { re: 0, im: 0 }],
    [{ re: s.re, im: s.im }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: c, im: 0 }],
  ]
  return m
}

function rzzMatrix(theta: number): Matrix4x4 {
  const eip = { re: Math.cos(theta / 2), im: Math.sin(theta / 2) }
  const ein = { re: Math.cos(theta / 2), im: -Math.sin(theta / 2) }
  const m: Matrix4x4 = [
    [{ re: eip.re, im: eip.im }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: ein.re, im: ein.im }, { re: 0, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: ein.re, im: ein.im }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: eip.re, im: eip.im }],
  ]
  return m
}

/**
 * Applies a 2-qubit gate from a 4x4 matrix to qubits [qA, qB].
 * qA is treated as the most significant of the pair.
 */
function applyTwoQubitMatrix(
  state: ComplexNumber[],
  numQubits: number,
  qA: number,
  qB: number,
  matrix: Matrix4x4
): ComplexNumber[] {
  const dim = 1 << numQubits
  const nextState: ComplexNumber[] = new Array(dim)

  const bitA = numQubits - 1 - qA
  const bitB = numQubits - 1 - qB
  const pairMask = (1 << bitA) | (1 << bitB)

  for (let i = 0; i < dim; i++) {
    nextState[i] = { re: 0, im: 0 }
  }

  for (let i = 0; i < dim; i++) {
    const outer = i & ~pairMask
    const pairIdx = ((i & (1 << bitA)) !== 0 ? 1 : 0) * 2 +
      ((i & (1 << bitB)) !== 0 ? 1 : 0)
    const basisStart = outer
    const basisIdxs = [
      basisStart,
      basisStart | (1 << bitB),
      basisStart | (1 << bitA),
      basisStart | (1 << bitA) | (1 << bitB),
    ]
    for (let col = 0; col < 4; col++) {
      if (cAbs2(matrix[pairIdx][col]) > 0) {
        nextState[i] = cAdd(nextState[i], cMul(matrix[pairIdx][col], state[basisIdxs[col]]))
      }
    }
  }

  return nextState
}

/**
 * Resets a qubit to |0⟩ by projecting out the |1⟩ component and renormalizing.
 * If the qubit is deterministically |1⟩ (no |0⟩ amplitude), the |1⟩ branch is
 * kept with its target bit cleared and renormalized (an X-flip to |0⟩).
 */
function applyReset(
  state: ComplexNumber[],
  numQubits: number,
  qubit: number
): ComplexNumber[] {
  const dim = 1 << numQubits
  const nextState: ComplexNumber[] = new Array(dim)
  const bit = numQubits - 1 - qubit
  const mask = 1 << bit

  let norm0 = 0
  let norm1 = 0
  for (let i = 0; i < dim; i++) {
    if ((i & mask) === 0) norm0 += cAbs2(state[i])
    else norm1 += cAbs2(state[i])
  }

  const total = norm0 + norm1
  if (total < 1e-12) return state.map(() => ({ re: 0, im: 0 }))

  // Prefer the |0⟩ branch (qubit measured as |0⟩). If it has no amplitude,
  // collapse from the |1⟩ branch and flip it down to |0⟩.
  const scale = 1 / Math.sqrt(Math.max(norm0, norm1))
  if (norm0 > 1e-12) {
    for (let i = 0; i < dim; i++) {
      nextState[i] = (i & mask) === 0
        ? { re: state[i].re * scale, im: state[i].im * scale }
        : { re: 0, im: 0 }
    }
  } else {
    // Deterministically |1⟩: move each |1⟩ component to the same index with
    // the target bit cleared and renormalize, forming a valid |0⟩ state.
    for (let i = 0; i < dim; i++) nextState[i] = { re: 0, im: 0 }
    for (let i = 0; i < dim; i++) {
      if ((i & mask) !== 0) {
        const cleared = i & ~mask
        nextState[cleared] = { re: state[i].re * scale, im: state[i].im * scale }
      }
    }
  }

  return nextState
}

/**
 * Clamps a coordinate to the closed interval [-1, 1] to absorb tiny
 * floating-point overshoot in partial-trace calculations.
 */
function clampUnit(v: number): number {
  return Math.min(1, Math.max(-1, v))
}

/**
 * Computes a single qubit's reduced density matrix via partial trace of the
 * full statevector and returns its Bloch vector together with the marginal
 * probabilities. This handles entangled multi-qubit states correctly.
 *
 *   x = Tr(ρX) =  2·Re(ρ01)
 *   y = Tr(ρY) = −2·Im(ρ01)
 *   z = Tr(ρZ) = ρ00 − ρ11 = P(0) − P(1)
 *
 * Qubit index 0 is the top wire (most significant bit).
 */
function computeQubitState(
  state: ComplexNumber[],
  numQubits: number,
  qubitIndex: number
): Omit<QubitState, 'qubitIndex'> {
  const bit = numQubits - 1 - qubitIndex
  const mask = 1 << bit

  let rho00 = 0
  let rho11 = 0
  let rho01Re = 0
  let rho01Im = 0

  for (let i = 0; i < state.length; i++) {
    const amp = state[i]
    if ((i & mask) === 0) {
      const flip = i | mask
      const flipAmp = state[flip]
      rho00 += cAbs2(amp)
      rho01Re += amp.re * flipAmp.re + amp.im * flipAmp.im
      rho01Im += amp.im * flipAmp.re - amp.re * flipAmp.im
    } else {
      rho11 += cAbs2(amp)
    }
  }

  return {
    blochVector: {
      x: clampUnit(2 * rho01Re),
      y: clampUnit(-2 * rho01Im),
      z: clampUnit(rho00 - rho11),
    },
    probability0: Math.round(rho00 * 1e6) / 1e6,
    probability1: Math.round(rho11 * 1e6) / 1e6,
  }
}

/**
 * Simulates a quantum circuit state and returns exact probabilities and shot samples.
 */
export function simulateCircuit(
  circuit: CircuitState,
  backend: BackendType = 'qiskit',
  shots = 1000
): ExecutionResult {
  const startTime = performance.now()
  const numQubits = Math.max(1, Math.min(6, circuit.num_qubits || 2))
  const dim = 1 << numQubits

  // Initial state |0...0> = 1, all others 0
  let state: ComplexNumber[] = new Array(dim).fill(null).map((_, i) => ({
    re: i === 0 ? 1 : 0,
    im: 0,
  }))

  // Sort operations sequentially by moment
  const sortedOps = [...circuit.operations].sort((a, b) => a.moment - b.moment)

  for (const op of sortedOps) {
    const gate = op.gate
    const targets = op.targets
    const params = op.params || {}
    const p = (name: string, def: number) =>
      typeof params[name] === 'number' && isFinite(params[name]!) ? params[name]! : def

    switch (gate) {
      case 'I':
      case 'X':
      case 'Y':
      case 'Z':
      case 'H':
      case 'S':
      case 'SDG':
      case 'T':
      case 'TDG':
      case 'SX':
      case 'RX':
      case 'RY':
      case 'RZ':
      case 'P': {
        const q = targets[0] ?? 0
        if (q >= numQubits) break
        let matrix: Matrix2x2 = MAT_I
        switch (gate) {
          case 'X': matrix = MAT_X; break
          case 'Y': matrix = MAT_Y; break
          case 'Z': matrix = MAT_Z; break
          case 'H': matrix = MAT_H; break
          case 'S': matrix = MAT_S; break
          case 'SDG': matrix = MAT_SDG; break
          case 'T': matrix = MAT_T; break
          case 'TDG': matrix = MAT_TDG; break
          case 'SX': matrix = MAT_SX; break
          case 'RX': matrix = rotationX(p('theta', Math.PI / 2)); break
          case 'RY': matrix = rotationY(p('theta', Math.PI / 2)); break
          case 'RZ': matrix = rotationZ(p('theta', Math.PI / 2)); break
          case 'P': matrix = phaseGate(p('lambda', Math.PI / 2)); break
        }
        state = applySingleQubitGate(state, numQubits, q, matrix)
        break
      }
      case 'CX': {
        const [ctrl, trgt] = targets
        if (ctrl !== undefined && trgt !== undefined && ctrl < numQubits && trgt < numQubits && ctrl !== trgt) {
          state = applyCNOT(state, numQubits, ctrl, trgt)
        }
        break
      }
      case 'CZ': {
        const [ctrl, trgt] = targets
        if (ctrl !== undefined && trgt !== undefined && ctrl < numQubits && trgt < numQubits && ctrl !== trgt) {
          state = applyCZ(state, numQubits, ctrl, trgt)
        }
        break
      }
      case 'SWAP': {
        const [qA, qB] = targets
        if (qA !== undefined && qB !== undefined && qA < numQubits && qB < numQubits && qA !== qB) {
          state = applySWAP(state, numQubits, qA, qB)
        }
        break
      }
      case 'RXX': {
        const [qA, qB] = targets
        if (qA !== undefined && qB !== undefined && qA < numQubits && qB < numQubits && qA !== qB) {
          state = applyTwoQubitMatrix(state, numQubits, qA, qB, rxxMatrix(p('theta', Math.PI / 2)))
        }
        break
      }
      case 'RZZ': {
        const [qA, qB] = targets
        if (qA !== undefined && qB !== undefined && qA < numQubits && qB < numQubits && qA !== qB) {
          state = applyTwoQubitMatrix(state, numQubits, qA, qB, rzzMatrix(p('theta', Math.PI / 2)))
        }
        break
      }
      case 'CCX': {
        const [c1, c2, tgt] = targets
        if (c1 !== undefined && c2 !== undefined && tgt !== undefined &&
            Math.max(c1, c2, tgt) < numQubits) {
          state = applyCCX(state, numQubits, targets)
        }
        break
      }
      case 'CCZ': {
        const [c1, c2, tgt] = targets
        if (c1 !== undefined && c2 !== undefined && tgt !== undefined &&
            Math.max(c1, c2, tgt) < numQubits) {
          state = applyCCZ(state, numQubits, targets)
        }
        break
      }
      case 'RESET': {
        const q = targets[0] ?? 0
        if (q < numQubits) {
          state = applyReset(state, numQubits, q)
        }
        break
      }
      case 'M':
      case 'BARRIER':
        // Measurement is evaluated at the end; barrier is a no-op for simulation.
        break
    }
  }

  // Calculate exact probabilities
  const probabilities: Record<string, number> = {}
  const rawProbs: number[] = []

  for (let i = 0; i < dim; i++) {
    const bitstring = i.toString(2).padStart(numQubits, '0')
    const prob = cAbs2(state[i])
    probabilities[bitstring] = Math.round(prob * 10000) / 10000
    rawProbs.push(prob)
  }

  // Sample shots using cumulative distribution
  const counts: Record<string, number> = {}
  for (let i = 0; i < dim; i++) {
    const bitstring = i.toString(2).padStart(numQubits, '0')
    counts[bitstring] = 0
  }

  // Cumulative probabilities
  const cumProbs: number[] = []
  let sum = 0
  for (const p of rawProbs) {
    sum += p
    cumProbs.push(sum)
  }

  for (let s = 0; s < shots; s++) {
    const r = Math.random() * (sum || 1)
    let idx = cumProbs.findIndex((cp) => r <= cp)
    if (idx === -1) idx = dim - 1
    const bitstring = idx.toString(2).padStart(numQubits, '0')
    counts[bitstring] = (counts[bitstring] || 0) + 1
  }

  const endTime = performance.now()
  const simulatedBackendDelay = 12.0 + Math.random() * 8.0 // realistic 12-20ms backend response time

  // Shared per-qubit state: reduced density matrix → Bloch vector + marginals.
  const qubitStates: QubitState[] = Array.from({ length: numQubits }, (_, q) => ({
    qubitIndex: q,
    ...computeQubitState(state, numQubits, q),
  }))

  const first = qubitStates[0].blochVector
  const blochAngles = {
    theta: Math.acos(clampUnit(first.z)),
    phi: Math.atan2(first.y, first.x),
  }

  return {
    backend,
    shots,
    num_qubits: numQubits,
    execution_time_ms: Math.round((endTime - startTime + simulatedBackendDelay) * 100) / 100,
    probabilities,
    counts,
    statevector_summary: formatStatevector(state, numQubits),
    statevector: state,
    qubitStates,
    blochAngles,
  }
}

function formatStatevector(state: ComplexNumber[], numQubits: number): string {
  const terms: string[] = []
  for (let i = 0; i < state.length; i++) {
    const prob = cAbs2(state[i])
    if (prob > 1e-4) {
      const bitstring = i.toString(2).padStart(numQubits, '0')
      const amp = state[i]
      const coefStr =
        Math.abs(amp.im) < 1e-4
          ? amp.re >= 0
            ? `${amp.re.toFixed(3)}`
            : `-${Math.abs(amp.re).toFixed(3)}`
          : `(${amp.re.toFixed(2)}${amp.im >= 0 ? '+' : '-'}${Math.abs(amp.im).toFixed(2)}i)`
      terms.push(`${coefStr}|${bitstring}⟩`)
    }
  }
  return terms.join(' + ') || '|0⟩'
}
