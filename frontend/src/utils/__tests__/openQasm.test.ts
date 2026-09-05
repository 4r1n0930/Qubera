import { describe, expect, it } from 'vitest'
import type { CircuitIR } from '../../types/quantumLab'
import { generateOpenQasm2, generateOpenQasm3 } from '../openQasm'

const CIRCUIT: CircuitIR = {
  num_qubits: 3,
  operations: [
    { id: 'a', gate: 'H', targets: [0], moment: 0 },
    { id: 'b', gate: 'CX', targets: [0, 1], moment: 1 },
    { id: 'c', gate: 'RZZ', targets: [1, 2], moment: 2, params: { theta: Math.PI / 2 } },
    { id: 'd', gate: 'RXX', targets: [0, 1], moment: 3, params: { theta: Math.PI / 2 } },
    { id: 'e', gate: 'CCX', targets: [0, 1, 2], moment: 4 },
    { id: 'f', gate: 'CCZ', targets: [0, 1, 2], moment: 5 },
    { id: 'g', gate: 'SX', targets: [2], moment: 6 },
    { id: 'h', gate: 'P', targets: [2], moment: 7, params: { lambda: Math.PI / 2 } },
    { id: 'i', gate: 'M', targets: [0], moment: 8 },
  ],
}

describe('generateOpenQasm2', () => {
  it('emits the OQ2 header and register declarations', () => {
    const { code } = generateOpenQasm2(CIRCUIT)
    expect(code).toContain('OPENQASM 2.0;')
    expect(code).toContain('include "qelib1.inc";')
    expect(code).toContain('qreg q[3];')
    expect(code).toContain('creg c[3];')
  })

  it('defines rzz/rxx/ccz via qelib1 primitives', () => {
    const { code } = generateOpenQasm2(CIRCUIT)
    expect(code).toContain('gate rzz(theta) a, b {')
    expect(code).toContain('gate rxx(theta) a, b {')
    expect(code).toContain('gate ccz a, b, c {')
  })

  it('expresses SX as u2(-pi/2, pi/2) and P as u1(lambda)', () => {
    const { code } = generateOpenQasm2(CIRCUIT)
    expect(code).toContain('u2(-pi/2, pi/2) q[2];')
    expect(code).toContain('u1(1.5708) q[2];')
  })

  it('does not define rzz when unused', () => {
    const { code } = generateOpenQasm2({
      num_qubits: 1,
      operations: [{ id: 'x', gate: 'X', targets: [0], moment: 0 }],
    })
    expect(code).not.toContain('gate rzz')
  })
})

describe('generateOpenQasm3', () => {
  it('emits the OQ3 header and native gate spellings', () => {
    const { code } = generateOpenQasm3(CIRCUIT)
    expect(code).toContain('OPENQASM 3.0;')
    expect(code).toContain('qubit[3] q;')
    expect(code).toContain('bit[3] c;')
    expect(code).toContain('rzz(1.5708) q[1], q[2];')
    expect(code).toContain('rxx(1.5708) q[0], q[1];')
    expect(code).toContain('ccz q[0], q[1], q[2];')
    expect(code).toContain('sx q[2];')
    expect(code).toContain('p(1.5708) q[2];')
  })

  it('does not emit qasm2 gate definitions', () => {
    const { code } = generateOpenQasm3(CIRCUIT)
    expect(code).not.toContain('gate rzz')
  })
})