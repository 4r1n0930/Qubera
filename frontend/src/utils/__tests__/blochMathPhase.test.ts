import { describe, expect, it } from 'vitest'
import {
  phaseToHue,
  phaseToColor,
  phaseToHexColor,
  getQSphereBasisStates,
  deriveAllQubitVisualizations,
  QUBIT_PALETTE,
} from '../blochMath'
import type { ComplexAmplitude } from '../../api/quantumApi'

const amp = (real: number, imag = 0): ComplexAmplitude => ({ real, imag })
const S2 = Math.SQRT1_2

describe('phaseToHue and phaseToColor', () => {
  it('maps 0 radians to 0° (red/coral)', () => {
    expect(phaseToHue(0)).toBe(0)
    expect(phaseToColor(0)).toBe('hsl(0, 90%, 55%)')
  })

  it('maps π/2 radians to 90° (gold/yellow)', () => {
    expect(phaseToHue(Math.PI / 2)).toBeCloseTo(90, 5)
    expect(phaseToColor(Math.PI / 2)).toBe('hsl(90, 90%, 55%)')
  })

  it('maps π radians to 180° (cyan/teal)', () => {
    expect(phaseToHue(Math.PI)).toBeCloseTo(180, 5)
    expect(phaseToColor(Math.PI)).toBe('hsl(180, 90%, 55%)')
  })

  it('maps -π/2 radians to 270° (purple/violet)', () => {
    expect(phaseToHue(-Math.PI / 2)).toBeCloseTo(270, 5)
    expect(phaseToColor(-Math.PI / 2)).toBe('hsl(270, 90%, 55%)')
  })

  it('returns valid 24-bit integer hex color', () => {
    const hex = phaseToHexColor(0)
    expect(typeof hex).toBe('number')
    expect(hex).toBeGreaterThanOrEqual(0)
    expect(hex).toBeLessThanOrEqual(0xffffff)
  })
})

describe('getQSphereBasisStates', () => {
  it('generates 2 states for 1 qubit (|0⟩ and |1⟩)', () => {
    const states = getQSphereBasisStates(1)
    expect(states).toHaveLength(2)

    // |0⟩ at North pole (0, 0, 1)
    expect(states[0].label).toBe('0')
    expect(states[0].hammingWeight).toBe(0)
    expect(states[0].z).toBe(1)
    expect(states[0].probability).toBe(1)

    // |1⟩ at South pole (0, 0, -1)
    expect(states[1].label).toBe('1')
    expect(states[1].hammingWeight).toBe(1)
    expect(states[1].z).toBe(-1)
    expect(states[1].probability).toBe(0)
  })

  it('generates 4 states for 2 qubits (North pole, Equator, South pole)', () => {
    // Entangled Bell state (|00⟩ + |11⟩) / √2
    const bell: ComplexAmplitude[] = [amp(S2), amp(0), amp(0), amp(S2)]
    const states = getQSphereBasisStates(2, bell)
    expect(states).toHaveLength(4)

    // |00⟩ at North pole
    expect(states[0].label).toBe('00')
    expect(states[0].z).toBe(1)
    expect(states[0].probability).toBeCloseTo(0.5, 5)
    expect(states[0].phaseDeg).toBe(0)

    // |01⟩ and |10⟩ on equator (z = 0)
    expect(states[1].label).toBe('01')
    expect(states[1].z).toBe(0)
    expect(states[1].probability).toBe(0)

    expect(states[2].label).toBe('10')
    expect(states[2].z).toBe(0)
    expect(states[2].probability).toBe(0)

    // |11⟩ at South pole
    expect(states[3].label).toBe('11')
    expect(states[3].z).toBe(-1)
    expect(states[3].probability).toBeCloseTo(0.5, 5)
    expect(states[3].phaseDeg).toBe(0)
  })

  it('correctly maps phase for state with phase shift', () => {
    // (|00⟩ - |11⟩) / √2 -> |11⟩ has phase π (180°)
    const state: ComplexAmplitude[] = [amp(S2), amp(0), amp(0), amp(-S2)]
    const states = getQSphereBasisStates(2, state)

    expect(states[0].phaseDeg).toBe(0)
    expect(states[3].phaseDeg).toBeCloseTo(180, 5)
    expect(states[3].color).toBe('hsl(180, 90%, 55%)')
  })
})

describe('deriveAllQubitVisualizations', () => {
  it('derives visualizations for all qubits', () => {
    const res = deriveAllQubitVisualizations(2)
    expect(res).toHaveLength(2)
    expect(res[0].z).toBe(1)
    expect(res[1].z).toBe(1)
  })

  it('provides a palette of distinct colors', () => {
    expect(QUBIT_PALETTE.length).toBeGreaterThanOrEqual(8)
  })
})
