import { describe, expect, it } from 'vitest'
import type { ComplexAmplitude } from '../../api/quantumApi'
import {
  blochFromStatevector,
  blochVectorToVisualization,
  clean,
  deriveQubitVisualization,
  formatCoord,
  pureStateBloch,
  qubitReducedDensityMatrix,
} from '../blochMath'

const cmplx = (real: number, imag = 0): ComplexAmplitude => ({ real, imag })
const amp = (real: number, imag = 0) => cmplx(real, imag)

const S2 = Math.SQRT1_2

/** Single-qubit statevectors from the two α, β components. */
const single = (alpha: ComplexAmplitude, beta: ComplexAmplitude): ComplexAmplitude[] => [
  alpha,
  beta,
]

const expectVec = (vec: { x: number; y: number; z: number }, x: number, y: number, z: number, tol = 1e-9) => {
  expect(vec.x).toBeCloseTo(x, Math.round(-Math.log10(tol)))
  expect(vec.y).toBeCloseTo(y, Math.round(-Math.log10(tol)))
  expect(vec.z).toBeCloseTo(z, Math.round(-Math.log10(tol)))
}

describe('clean / near-zero precision', () => {
  it('zeroes floating-point noise like 6.123e-17', () => {
    expect(clean(6.1232e-17)).toBe(0)
    expect(clean(-1.5e-13)).toBe(0)
  })
  it('keeps genuinely non-zero values', () => {
    expect(clean(1e-9)).toBe(1e-9)
    expect(clean(-0.7071)).toBe(-0.7071)
  })
  it('formats near-zero values as 0', () => {
    expect(formatCoord(6.123e-17)).toBe('0.000')
    expect(formatCoord(6.123e-17, 2)).toBe('0.00')
  })
})

describe('pureStateBloch (single qubit)', () => {
  it('|0⟩ → (0, 0, +1)', () => {
    expectVec(pureStateBloch(amp(1), amp(0)), 0, 0, 1)
  })
  it('|1⟩ → (0, 0, −1)', () => {
    expectVec(pureStateBloch(amp(0), amp(1)), 0, 0, -1)
  })
  it('|+⟩ → (+1, 0, 0)', () => {
    expectVec(pureStateBloch(amp(S2), amp(S2)), 1, 0, 0)
  })
  it('|−⟩ → (−1, 0, 0)', () => {
    expectVec(pureStateBloch(amp(S2), amp(-S2)), -1, 0, 0)
  })
  it('|+i⟩ → (0, +1, 0)', () => {
    expectVec(pureStateBloch(amp(S2), amp(0, S2)), 0, 1, 0)
  })
  it('|-i⟩ → (0, −1, 0)', () => {
    expectVec(pureStateBloch(amp(S2), amp(0, -S2)), 0, -1, 0)
  })
  it('handles arbitrary complex amplitudes', () => {
    const alpha = amp(0.6, 0.3)
    const beta = amp(-0.2, 0.71)
    const v = pureStateBloch(alpha, beta)
    expect(v.x).toBeCloseTo(2 * (alpha.real * beta.real + alpha.imag * beta.imag), 9)
    expect(v.y).toBeCloseTo(2 * (alpha.real * beta.imag - alpha.imag * beta.real), 9)
    expect(v.z).toBeCloseTo((alpha.real ** 2 + alpha.imag ** 2) - (beta.real ** 2 + beta.imag ** 2), 9)
  })
})

describe('qubitReducedDensityMatrix', () => {
  const rho = (a: ComplexAmplitude, b: ComplexAmplitude) => qubitReducedDensityMatrix(single(a, b), 0, 1)
  it('pure |0⟩ gives ρ = |0⟩⟨0|', () => {
    const r = rho(amp(1), amp(0))
    expect(r[0].real).toBe(1)
    expect(r[3].real).toBe(0)
    expect(r[1].real).toBe(0)
  })
  it('pure |+i⟩ gives off-diagonal i/2 (and y = +1 via 2·Im(α*β))', () => {
    // |+i⟩: α = 1/√2, β = i/√2 → ρ01 = αβ* = −i/2
    const r = rho(amp(S2), amp(0, S2))
    expect(r[1].real).toBeCloseTo(0, 9)
    expect(r[1].imag).toBeCloseTo(-0.5, 9)
  })
  it('partial-traces an entangled Bell state to maximally mixed', () => {
    const bell: ComplexAmplitude[] = [amp(S2), amp(0), amp(0), amp(S2)]
    const r = qubitReducedDensityMatrix(bell, 0, 2)
    expect(r[0].real).toBeCloseTo(0.5, 9)
    expect(r[3].real).toBeCloseTo(0.5, 9)
    expect(r[1].real).toBeCloseTo(0, 9)
    expect(r[1].imag).toBeCloseTo(0, 9)
  })
  it('raises for wrong statevector length', () => {
    expect(() => qubitReducedDensityMatrix(single(amp(1), amp(0)), 0, 2)).toThrow()
  })
})

describe('blochFromStatevector (frontend fallback = backend convention)', () => {
  it('|+i⟩ via statevector → (0, +1, 0)', () => {
    expectVec(blochFromStatevector(single(amp(S2), amp(0, S2)), 0, 1), 0, 1, 0)
  })
  it('|-i⟩ via statevector → (0, −1, 0)', () => {
    expectVec(blochFromStatevector(single(amp(S2), amp(0, -S2)), 0, 1), 0, -1, 0)
  })
  it('Bell state qubit 0 → center (entanglement)', () => {
    const bell: ComplexAmplitude[] = [amp(S2), amp(0), amp(0), amp(S2)]
    expectVec(blochFromStatevector(bell, 0, 2), 0, 0, 0, 1e-6)
  })
  it('3-qubit reduced density matrix is consistent', () => {
    // |0⟩_q0 ⊗ |+⟩_q1 ⊗ |1⟩_q2 = (|0 0 1⟩ + |0 1 1⟩)/√2 (bitstring q0 q1 q2).
    // q0 = MSB (bit 2), q1 = bit 1, q2 = LSB (bit 0).
    const sv: ComplexAmplitude[] = Array.from({ length: 8 }, () => amp(0))
    sv[0b001] = amp(S2) // q0=0, q1=0, q2=1
    sv[0b011] = amp(S2) // q0=0, q1=1, q2=1
    const v = blochFromStatevector(sv, 1, 3)
    expectVec(v, 1, 0, 0, 1e-6)
    // q2 is a computational-basis qubit, so it stays on |1⟩ (south pole).
    expectVec(blochFromStatevector(sv, 2, 3), 0, 0, -1, 1e-6)
    expectVec(blochFromStatevector(sv, 0, 3), 0, 0, 1, 1e-6)
  })
})

describe('blochVectorToVisualization', () => {
  it('labels the six cardinal points', () => {
    expect(blochVectorToVisualization({ x: 0, y: 0, z: 1 }).stateLabel).toBe('|0⟩')
    expect(blochVectorToVisualization({ x: 0, y: 0, z: -1 }).stateLabel).toBe('|1⟩')
    expect(blochVectorToVisualization({ x: 1, y: 0, z: 0 }).stateLabel).toBe('|+⟩')
    expect(blochVectorToVisualization({ x: -1, y: 0, z: 0 }).stateLabel).toBe('|−⟩')
    expect(blochVectorToVisualization({ x: 0, y: 1, z: 0 }).stateLabel).toBe('|+i⟩')
    expect(blochVectorToVisualization({ x: 0, y: -1, z: 0 }).stateLabel).toBe('|-i⟩')
  })
  it('reports purity for pure and maximally mixed states', () => {
    const pure = blochVectorToVisualization({ x: 0.6, y: 0, z: 0.8 })
    expect(pure.purity).toBeCloseTo(1, 3)
    expect(pure.isPure).toBe(true)
    const mixed = blochVectorToVisualization({ x: 0, y: 0, z: 0 })
    expect(mixed.purity).toBeCloseTo(0.5, 3)
    expect(mixed.isMaximallyMixed).toBe(true)
    expect(mixed.isPure).toBe(false)
    expect(blochVectorToVisualization({ x: 0, y: 0, z: 0 }).stateLabel).toBe('ρ = ½I')
  })
  it('computes θ and φ from the vector', () => {
    const top = blochVectorToVisualization({ x: 0, y: 0, z: 1 })
    expect(top.thetaDeg).toBeCloseTo(0, 5)
    expect(top.phiDeg).toBeCloseTo(0, 5)
    const plus = blochVectorToVisualization({ x: 1, y: 0, z: 0 })
    expect(plus.thetaDeg).toBeCloseTo(90, 5)
    expect(plus.phiDeg).toBeCloseTo(0, 5)
    const plusI = blochVectorToVisualization({ x: 0, y: 1, z: 0 })
    expect(plusI.phiDeg).toBeCloseTo(90, 5)
    // A mixed state inside the sphere
    const mixed = blochVectorToVisualization({ x: 0.5, y: 0.5, z: 0.0 })
    expect(mixed.r).toBeCloseTo(Math.SQRT1_2, 3)
    expect(mixed.basis).toBe('mixed')
    expect(mixed.purity).toBeCloseTo(0.75, 3)
  })
  it('normalizes the azimuth to [0, 360)', () => {
    expect(blochVectorToVisualization({ x: 0, y: -1, z: 0 }).phiDeg).toBeCloseTo(270, 5)
    expect(blochVectorToVisualization({ x: -1, y: 0, z: 0 }).phiDeg).toBeCloseTo(180, 5)
  })
})

describe('deriveQubitVisualization', () => {
  it('prefers the authoritative backend bloch vector', () => {
    const info = deriveQubitVisualization({
      vector: { x: 0, y: 1, z: 0 },
      statevector: single(amp(S2), amp(0, S2)),
      qubit: 0,
      numQubits: 1,
    })
    expect(info.stateLabel).toBe('|+i⟩')
    expectVec(info, 0, 1, 0)
  })
  it('derives from the statevector when bloch_vectors is absent', () => {
    const info = deriveQubitVisualization({
      statevector: single(amp(S2), amp(S2)),
      qubit: 0,
      numQubits: 1,
    })
    expect(info.stateLabel).toBe('|+⟩')
    expectVec(info, 1, 0, 0)
  })
  it('falls back to |0⟩ before any run', () => {
    const info = deriveQubitVisualization({ qubit: 0, numQubits: 1 })
    expect(info.stateLabel).toBe('|0⟩')
    expectVec(info, 0, 0, 1)
  })
})