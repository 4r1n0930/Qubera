/*
 * Lightweight single-qubit state model for interactive demos.
 * This is an educational frontend model — not a full quantum simulator.
 */

export interface Complex {
  re: number
  im: number
}

export interface QubitState {
  // a|0> + b|1>
  a: Complex
  b: Complex
}

type Gate = [[Complex, Complex], [Complex, Complex]]

export const zeroState: QubitState = { a: { re: 1, im: 0 }, b: { re: 0, im: 0 } }
export const oneState: QubitState = { a: { re: 0, im: 0 }, b: { re: 1, im: 0 } }

const one = { re: 1, im: 0 }
const zero = { re: 0, im: 0 }
const sqrt2 = Math.SQRT2

export const GATES: Record<'H' | 'X' | 'Z', { name: string; matrix: Gate }> = {
  H: {
    name: 'Hadamard',
    matrix: [
      [{ re: 1 / sqrt2, im: 0 }, { re: 1 / sqrt2, im: 0 }],
      [{ re: 1 / sqrt2, im: 0 }, { re: -1 / sqrt2, im: 0 }],
    ],
  },
  X: {
    name: 'Pauli-X',
    matrix: [
      [zero, one],
      [one, zero],
    ],
  },
  Z: {
    name: 'Pauli-Z',
    matrix: [
      [one, zero],
      [zero, { re: -1, im: 0 }],
    ],
  },
}

function add(u: Complex, v: Complex): Complex {
  return { re: u.re + v.re, im: u.im + v.im }
}

function mul(u: Complex, v: Complex): Complex {
  return { re: u.re * v.re - u.im * v.im, im: u.re * v.im + u.im * v.re }
}

export function norm2(c: Complex): number {
  return c.re * c.re + c.im * c.im
}

export function applyGate(state: QubitState, gate: Gate): QubitState {
  const a = add(mul(gate[0][0], state.a), mul(gate[0][1], state.b))
  const b = add(mul(gate[1][0], state.a), mul(gate[1][1], state.b))
  return { a, b }
}

export interface Probabilities {
  p0: number // 0..1
  p1: number // 0..1
}

export function measure(state: QubitState): Probabilities {
  const total = norm2(state.a) + norm2(state.b)
  if (total === 0) return { p0: 0, p1: 0 }
  return { p0: norm2(state.a) / total, p1: norm2(state.b) / total }
}

export type StateKind = 'zero' | 'one' | 'plus' | 'minus' | 'superposition'

export interface StateAnalysis {
  kind: StateKind
  ket: string
  label: string
  description: string
}

const close = (x: number, y: number, eps = 1e-6) => Math.abs(x - y) < eps

/**
 * Classifies a state for an educational label and a human-readable ket.
 * `phase` includes Z-style phase flips, which measurement cannot detect,
 * so probabilities are shown separately to reinforce that idea.
 */
export function analyze(state: QubitState): StateAnalysis {
  const { p0, p1 } = measure(state)

  if (close(p0, 0) && close(p1, 1)) {
    return { kind: 'one', ket: '|1⟩', label: 'Basis state', description: 'A definite 1 — measurement always returns 1.' }
  }
  if (close(p0, 1) && close(p1, 0)) {
    // still could be |+> minus -1? no, that's only if p0=1 too. Basis |0>.
    return { kind: 'zero', ket: '|0⟩', label: 'Basis state', description: 'A definite 0 — measurement always returns 0.' }
  }
  if (close(p0, 0.5) && close(p1, 0.5)) {
    if (close(state.a.re, 1 / sqrt2) && close(state.b.re, 1 / sqrt2)) {
      return { kind: 'plus', ket: '|+⟩', label: 'Superposition', description: 'Equal chance of 0 or 1 when measured.' }
    }
    if (close(state.a.re, 1 / sqrt2) && close(state.b.re, -1 / sqrt2)) {
      return { kind: 'minus', ket: '|-⟩', label: 'Superposition (phase)', description: 'Same 50/50 outcome as |+⟩, with a different phase.' }
    }
    return { kind: 'superposition', ket: 'superposition', label: 'Superposition', description: 'A balanced combination of 0 and 1.' }
  }
  return { kind: 'superposition', ket: '|ψ⟩', label: 'Superposition', description: 'A probability mixture of 0 and 1.' }
}

/** Compact display string such as "1/√2 |0⟩ + 1/√2 |1⟩". */
export function ketBasis(state: QubitState): string {
  const parts: string[] = []
  if (norm2(state.a) > 1e-9) parts.push(`${coef(state.a)} |0⟩`)
  if (norm2(state.b) > 1e-9) parts.push(`${coef(state.b)} |1⟩`)
  return parts.join(' + ')
}

function coef(c: Complex): string {
  if (close(c.im, 0)) {
    if (close(Math.abs(c.re), 1, 1e-3)) return c.re < 0 ? '−1' : '1'
    if (close(Math.abs(c.re), 1 / sqrt2, 1e-3)) return c.re < 0 ? '−1/√2' : '1/√2'
    return c.re.toFixed(3)
  }
  return `${c.re.toFixed(2)} ${c.im >= 0 ? '+' : '−'} ${Math.abs(c.im).toFixed(2)}i`
}
