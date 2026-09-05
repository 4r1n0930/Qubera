/**
 * Lightweight client-side circuit IR validation.
 * Mirrors backend/conversion/validators.js so the editor can surface issues
 * without a round trip. Never mutates the input.
 */

import { GATE_CATALOG, type CircuitIR, type CodeError } from '../types/quantumLab'

const CATALOG = new Map(GATE_CATALOG.map((g) => [g.type, g]))

export function validateCircuit(ir: CircuitIR): { valid: boolean; errors: CodeError[] } {
  const errors: CodeError[] = []

  if (!ir || typeof ir !== 'object' || Array.isArray(ir)) {
    return {
      valid: false,
      errors: [{ type: 'invalid_circuit', message: 'Circuit must be an object with num_qubits and operations.' }],
    }
  }

  const { num_qubits, operations } = ir

  if (!Number.isInteger(num_qubits) || num_qubits < 1 || num_qubits > 8) {
    errors.push({ type: 'qubit_count', message: `num_qubits must be an integer between 1 and 8.` })
  }

  if (!Array.isArray(operations)) {
    errors.push({ type: 'invalid_operations', message: 'operations must be an array.' })
    return { valid: false, errors }
  }

  operations.forEach((op, index) => {
    const label = `operations[${index}]`
    const definition = CATALOG.get(op?.gate)
    if (!definition) {
      errors.push({ type: 'unknown_gate', message: `${label}: unknown gate "${op?.gate}".` })
      return
    }
    if (!Array.isArray(op.targets)) {
      errors.push({ type: 'invalid_targets', message: `${label}: targets must be an array of qubit indices.` })
      return
    }
    if (op.targets.length !== definition.qubitsRequired) {
      errors.push({
        type: 'wrong_target_count',
        message: `${label}: gate "${op.gate}" requires ${definition.qubitsRequired} target(s), got ${op.targets.length}.`,
      })
    }
    if (new Set(op.targets).size !== op.targets.length) {
      errors.push({ type: 'duplicate_target', message: `${label}: gate "${op.gate}" targets must be distinct qubits.` })
    }
    if (Number.isInteger(num_qubits)) {
      op.targets.forEach((t) => {
        if (!Number.isInteger(t) || t < 0 || t >= num_qubits) {
          errors.push({
            type: 'target_out_of_range',
            message: `${label}: qubit ${JSON.stringify(t)} is out of range (0..${num_qubits - 1}).`,
          })
        }
      })
    }
    for (const param of definition.params ?? []) {
      const value = op.params?.[param.name]
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push({
          type: 'missing_param',
          message: `${label}: gate "${op.gate}" requires a numeric "${param.name}" parameter.`,
        })
      }
    }
  })

  return { valid: errors.length === 0, errors }
}