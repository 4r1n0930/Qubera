import { describe, expect, it } from 'vitest'
import type { CircuitState } from '../../types/quantumLab'
import { circuitToApiIr, hasResetOperation, resolveRequestedOutputs } from '../circuitToApi'

function makeCircuit(operations: CircuitState['operations'], num_qubits = 2): CircuitState {
  return { num_qubits, operations }
}

describe('hasResetOperation', () => {
  it('is false for an empty circuit', () => {
    expect(hasResetOperation(makeCircuit([]))).toBe(false)
  })

  it('is false when only unitary/measurement gates are present', () => {
    const circuit = makeCircuit([
      { id: '1', gate: 'H', targets: [0], moment: 0 },
      { id: '2', gate: 'M', targets: [0], moment: 1 },
    ])
    expect(hasResetOperation(circuit)).toBe(false)
  })

  it('is true when a RESET is present', () => {
    const circuit = makeCircuit([
      { id: '1', gate: 'X', targets: [0], moment: 0 },
      { id: '2', gate: 'RESET', targets: [0], moment: 1 },
    ])
    expect(hasResetOperation(circuit)).toBe(true)
  })
})

describe('resolveRequestedOutputs', () => {
  it('requests all four datasets for a plain circuit', () => {
    const circuit = makeCircuit([{ id: '1', gate: 'H', targets: [0], moment: 0 }])
    expect(resolveRequestedOutputs(circuit)).toEqual([
      'counts',
      'probabilities',
      'statevector',
      'bloch_vectors',
    ])
  })

  it('requests counts + probabilities only when the circuit has a mid-circuit reset', () => {
    const circuit = makeCircuit([
      { id: '1', gate: 'H', targets: [0], moment: 0 },
      { id: '2', gate: 'RESET', targets: [0], moment: 1 },
    ])
    expect(resolveRequestedOutputs(circuit)).toEqual(['counts', 'probabilities'])
  })

  it('measurements and barriers do not restrict the requested outputs', () => {
    const circuit = makeCircuit([
      { id: '1', gate: 'M', targets: [0], moment: 0 },
      { id: '2', gate: 'BARRIER', targets: [0], moment: 1 },
    ])
    expect(resolveRequestedOutputs(circuit)).toContain('statevector')
    expect(resolveRequestedOutputs(circuit)).toContain('bloch_vectors')
  })
})

describe('circuitToApiIr', () => {
  it('maps editor gate names onto the execution dialect', () => {
    const circuit = makeCircuit([
      { id: '1', gate: 'SDG', targets: [0], moment: 0 },
      { id: '2', gate: 'M', targets: [1], moment: 0 },
      { id: '3', gate: 'RESET', targets: [0], moment: 1 },
      { id: '4', gate: 'BARRIER', targets: [0], moment: 2 },
    ])
    const ir = circuitToApiIr(circuit)
    expect(ir.operations.map((op) => op.gate)).toEqual([
      'Sdg',
      'measure',
      'reset',
      'barrier',
    ])
  })

  it('sorts operations by moment and strips editor-only fields', () => {
    const circuit = makeCircuit([
      { id: 'b', gate: 'X', targets: [0], moment: 1 },
      { id: 'a', gate: 'H', targets: [0], moment: 0 },
    ])
    const ir = circuitToApiIr(circuit)
    expect(ir.operations.map((op) => op.gate)).toEqual(['H', 'X'])
    expect(ir.operations[0]).not.toHaveProperty('id')
    expect(ir.operations[0]).not.toHaveProperty('moment')
  })
})