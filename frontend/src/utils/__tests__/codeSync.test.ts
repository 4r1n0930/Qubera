import { describe, expect, it } from 'vitest'
import type { CircuitIR } from '../../types/quantumLab'
import { generateCircuitCode, generatePythonCode, parsePythonCode } from '../codeSync'
import { simulateCircuit } from '../quantumSimulator'

const BELL: CircuitIR = {
  num_qubits: 2,
  operations: [
    { id: 'g_had', gate: 'H', targets: [0], moment: 0 },
    { id: 'g_cx', gate: 'CX', targets: [0, 1], moment: 1 },
    { id: 'g_meas', gate: 'M', targets: [0], moment: 2 },
  ],
}

const PARAM: CircuitIR = {
  num_qubits: 2,
  operations: [
    { id: 'g_rx', gate: 'RX', targets: [0], moment: 0, params: { theta: Math.PI / 2 } },
    { id: 'g_rxx', gate: 'RXX', targets: [0, 1], moment: 1, params: { theta: Math.PI / 2 } },
    { id: 'g_m0', gate: 'M', targets: [0], moment: 2 },
    { id: 'g_m1', gate: 'M', targets: [1], moment: 2 },
  ],
}

describe('generateCircuitCode (all frameworks)', () => {
  it('emits Qiskit instructions with a measure_all fallback', () => {
    const { code } = generateCircuitCode(BELL, 'qiskit')
    expect(code).toContain('from qiskit import QuantumCircuit')
    expect(code).toContain('qc.h(0)')
    expect(code).toContain('qc.cx(0, 1)')
    expect(code).toContain('qc.measure(0, 0)')
  })

  it('emits Cirq instructions', () => {
    const { code } = generateCircuitCode(BELL, 'cirq')
    expect(code).toContain('q0, q1 = cirq.LineQubit.range(2)')
    expect(code).toContain('circuit.append(cirq.H(q0))')
    expect(code).toContain('circuit.append(cirq.CNOT(q0, q1))')
    expect(code).toContain('circuit.append(cirq.measure(q0, key=\'m0\'))')
  })

  it('emits PennyLane instructions', () => {
    const { code } = generateCircuitCode(BELL, 'pennylane')
    expect(code).toContain('qml.Hadamard(wires=0)')
    expect(code).toContain('qml.CNOT(wires=[0, 1])')
    expect(code).toContain('return qml.sample()')
  })

  it('emits OpenQASM 2.0', () => {
    const { code } = generateCircuitCode(BELL, 'openqasm2')
    expect(code).toContain('OPENQASM 2.0;')
    expect(code).toContain('include "qelib1.inc";')
    expect(code).toContain('qreg q[2];')
    expect(code).toContain('h q[0];')
    expect(code).toContain('cx q[0], q[1];')
    expect(code).toContain('measure q[0] -> c[0];')
  })

  it('emits OpenQASM 3.0', () => {
    const { code } = generateCircuitCode(BELL, 'openqasm3')
    expect(code).toContain('OPENQASM 3.0;')
    expect(code).toContain('qubit[2] q;')
    expect(code).toContain('cx q[0], q[1];')
  })

  it('maps every gate line to its operation id', () => {
    const { code, lineToGateId, gateIdToLine } = generateCircuitCode(BELL, 'qiskit')
    expect(gateIdToLine['g_had']).toBeDefined()
    expect(gateIdToLine['g_cx']).toBeDefined()
    expect(gateIdToLine['g_meas']).toBeDefined()
    const line = gateIdToLine['g_cx']
    expect(code.split('\n')[line - 1]).toContain('qc.cx(')
    expect(Object.keys(lineToGateId).length).toBeGreaterThanOrEqual(3)
  })
})

describe('parsePythonCode (offline fallback)', () => {
  it('parses a qiskit bell state back into the same IR', () => {
    const code = generatePythonCode(BELL, 'qiskit').code
    const parsed = parsePythonCode(code, 'qiskit', BELL)
    expect(parsed.error).toBeUndefined()
    expect(parsed.circuit.num_qubits).toBe(2)
    expect(parsed.circuit.operations.map((o) => o.gate)).toEqual(['H', 'CX', 'M'])
  })
})

describe('loop prevention fixed point', () => {
  it.each(['qiskit', 'cirq', 'pennylane'] as const)(
    'generate → parse → generate is stable for %s',
    (framework) => {
      const code1 = generateCircuitCode(PARAM, framework).code
      const parsed = parsePythonCode(code1, framework, PARAM)
      expect(parsed.error).toBeUndefined()
      const code2 = generateCircuitCode(parsed.circuit, framework).code
      expect(code2).toBe(code1)
    }
  )

  it('measure_all is parsed back into per-qubit M ops', () => {
    const code = generateCircuitCode(PARAM, 'qiskit').code
    const withMeasureAll = code.replace(
      /qc\.measure\(0, 0\)\nqc\.measure\(1, 1\)/,
      'qc.measure_all()'
    )
    const parsed = parsePythonCode(withMeasureAll, 'qiskit', PARAM)
    expect(parsed.error).toBeUndefined()
    const mOps = parsed.circuit.operations.filter((o) => o.gate === 'M')
    expect(mOps.length).toBe(2)
    expect(mOps.map((o) => o.targets[0]).sort()).toEqual([0, 1])
  })

  it('RXX decomposition matches the direct two-qubit rotation', () => {
    // RXX(θ) = (H⊗H) · RZZ(θ) · (H⊗H), and the qasm2 generator expands RZZ
    // as CX(a,b)·Rz(θ)[b]·CX(a,b). Build the expanded qiskit circuit and
    // confirm the probability distribution matches the direct RXX gate.
    const direct: CircuitIR = {
      num_qubits: 2,
      operations: [
        { id: 'a', gate: 'H', targets: [0], moment: 0 },
        { id: 'b', gate: 'RXX', targets: [0, 1], moment: 1, params: { theta: Math.PI } },
        { id: 'c', gate: 'M', targets: [0], moment: 2 },
        { id: 'd', gate: 'M', targets: [1], moment: 2 },
      ],
    }
    const expanded: CircuitIR = {
      num_qubits: 2,
      operations: [
        { id: 'a', gate: 'H', targets: [0], moment: 0 },
        { id: 'b', gate: 'H', targets: [0], moment: 1 },
        { id: 'c', gate: 'H', targets: [1], moment: 1 },
        { id: 'd', gate: 'CX', targets: [0, 1], moment: 2 },
        { id: 'e', gate: 'RZ', targets: [1], moment: 3, params: { theta: Math.PI } },
        { id: 'f', gate: 'CX', targets: [0, 1], moment: 4 },
        { id: 'g', gate: 'H', targets: [0], moment: 5 },
        { id: 'h', gate: 'H', targets: [1], moment: 5 },
        { id: 'i', gate: 'M', targets: [0], moment: 6 },
        { id: 'j', gate: 'M', targets: [1], moment: 6 },
      ],
    }
    const directRes = simulateCircuit(direct, 'qiskit', 1).probabilities
    const expandedRes = simulateCircuit(expanded, 'qiskit', 1).probabilities
    const keys = new Set([...Object.keys(directRes), ...Object.keys(expandedRes)])
    for (const key of keys) {
      expect(Math.abs((directRes[key] ?? 0) - (expandedRes[key] ?? 0))).toBeLessThan(1e-9)
    }
  })
})