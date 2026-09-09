/**
 * Circuit IR validation for the conversion service.
 * Does NOT mutate its input; returns a list of structured CodeError items.
 */

import { GATE_LAYOUT, MAX_QUBITS } from './catalog.js'

export function validateCircuit(circuit) {
  const errors = []

  if (!circuit || typeof circuit !== 'object' || Array.isArray(circuit)) {
    return {
      valid: false,
      errors: [{ type: 'invalid_circuit', message: 'Circuit must be a JSON object with num_qubits and operations.' }],
    }
  }

  const { num_qubits, operations } = circuit

  if (!Number.isInteger(num_qubits) || num_qubits < 1 || num_qubits > MAX_QUBITS) {
    errors.push({
      type: 'qubit_count',
      message: `num_qubits must be an integer between 1 and ${MAX_QUBITS}. Got ${JSON.stringify(num_qubits)}.`,
    })
  }

  const ops = Array.isArray(operations) ? operations : []
  if (!Array.isArray(operations)) {
    errors.push({ type: 'invalid_operations', message: 'operations must be an array.' })
  }

  ops.forEach((op, index) => {
    const label = `operations[${index}]`
    if (!op || typeof op !== 'object') {
      errors.push({ type: 'invalid_operation', message: `${label} must be an object.` })
      return
    }

    const layout = GATE_LAYOUT[op.gate]
    if (!layout) {
      errors.push({ type: 'unknown_gate', message: `${label}: unknown gate "${op.gate}".` })
      return
    }

    if (!Array.isArray(op.targets)) {
      errors.push({ type: 'invalid_targets', message: `${label}: targets must be an array of qubit indices.` })
      return
    }

    if (op.targets.length !== layout.targets) {
      errors.push({
        type: 'wrong_target_count',
        message: `${label}: gate "${op.gate}" requires ${layout.targets} target(s), got ${op.targets.length}.`,
      })
    }

    if (new Set(op.targets).size !== op.targets.length) {
      errors.push({
        type: 'duplicate_target',
        message: `${label}: gate "${op.gate}" targets must be distinct qubits.`,
      })
    }

    if (Number.isInteger(num_qubits)) {
      op.targets.forEach((target) => {
        if (!Number.isInteger(target) || target < 0 || target >= num_qubits) {
          errors.push({
            type: 'target_out_of_range',
            message: `${label}: qubit ${JSON.stringify(target)} is out of range (0..${num_qubits - 1}).`,
          })
        }
      })
    }

    for (const param of layout.params ?? []) {
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