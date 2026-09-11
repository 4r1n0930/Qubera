/**
 * Circuit IR normalization for the conversion service.
 * Produces a canonical IR: qubit count clamped, invalid ops dropped,
 * default parameters filled in, ops sorted by (moment, first target).
 */

import { GATE_LAYOUT, MAX_QUBITS } from './catalog.js'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function normalizeCircuit(circuit) {
  const issues = []

  if (!circuit || typeof circuit !== 'object' || Array.isArray(circuit)) {
    return {
      circuit: { num_qubits: 1, operations: [] },
      validation: {
        errors: [{ type: 'invalid_circuit', message: 'Circuit must be a JSON object with num_qubits and operations.' }],
      },
    }
  }

  const num_qubits = Number.isInteger(circuit.num_qubits)
    ? clamp(circuit.num_qubits, 1, MAX_QUBITS)
    : 1

  const sourceOps = Array.isArray(circuit.operations) ? circuit.operations : []

  const operations = sourceOps
    .map((op, index) => {
      if (!op || typeof op !== 'object') {
        issues.push({ type: 'invalid_operation', message: `operations[${index}] dropped (not an object).` })
        return null
      }
      const layout = GATE_LAYOUT[op.gate]
      if (!layout) {
        issues.push({ type: 'unknown_gate', message: `operations[${index}]: dropped unknown gate "${op.gate}".` })
        return null
      }

      const targets = Array.isArray(op.targets)
        ? op.targets.filter((t) => Number.isInteger(t) && t >= 0 && t < num_qubits)
        : []

      if (targets.length !== layout.targets) {
        issues.push({
          type: 'operation_clipped',
          message: `operations[${index}]: gate "${op.gate}" dropped after target/range clamping.`,
        })
        return null
      }

      const params = { ...(op.params && typeof op.params === 'object' ? op.params : {}) }
      for (const param of layout.params ?? []) {
        if (typeof params[param.name] !== 'number' || !Number.isFinite(params[param.name])) {
          params[param.name] = param.default
          issues.push({
            type: 'param_defaulted',
            message: `operations[${index}]: "${op.gate}" param "${param.name}" defaulted to ${param.default}.`,
          })
        }
      }

      return {
        id: typeof op.id === 'string' ? op.id : undefined,
        gate: op.gate,
        targets,
        ...(Number.isInteger(op.moment) && op.moment >= 0 && Number.isFinite(op.moment) ? { moment: op.moment } : {}),
        ...(Object.keys(params).length > 0 ? { params } : {}),
      }
    })
    .filter(Boolean)

  operations.sort((a, b) => {
    if ((a.moment ?? 0) !== (b.moment ?? 0)) return (a.moment ?? 0) - (b.moment ?? 0)
    return (a.targets[0] ?? 0) - (b.targets[0] ?? 0)
  })

  return {
    circuit: { num_qubits, operations },
    validation: { errors: issues },
  }
}