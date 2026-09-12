/**
 * Converts the interactive circuit-builder state into the canonical Circuit IR
 * understood by the execution API (React → Node → Python).
 *
 * Editor-only fields (`id`, `moment`) are stripped, operation params are
 * flattened from a name-keyed object into a numeric array, and editor gate
 * names are mapped onto the simulator gate dialect (Python authoritative).
 */

import type { CircuitState, GateOperation } from '../types/quantumLab'
import type {
  CircuitIR,
  CircuitOperation,
  QuantumOutput,
} from '../api/quantumApi'
import { DEFAULT_QUANTUM_OUTPUTS } from '../api/quantumApi'

/** Editor gate name → execution-engine gate name (only where they differ). */
const GATE_NAME_TO_API: Record<string, string> = {
  M: 'measure',
  RESET: 'reset',
  BARRIER: 'barrier',
  SDG: 'Sdg',
  TDG: 'Tdg',
  // CX is accepted as an alias for CNOT by the execution engine.
}

/**
 * Normalizes a builder `CircuitState` into the canonical `CircuitIR`.
 * Fails closed on unknown gates (they are sent as-is so the authoritative
 * Python validator can reject them with a precise INVALID_GATE message).
 */
export function circuitToApiIr(circuit: CircuitState): CircuitIR {
  return {
    num_qubits: circuit.num_qubits,
    operations: circuit.operations
      .slice()
      .sort((a, b) => a.moment - b.moment)
      .map(operationToApiOperation),
  }
}

function operationToApiOperation(op: GateOperation): CircuitOperation {
  const gate = GATE_NAME_TO_API[op.gate] ?? op.gate
  const params = op.params ? Object.values(op.params).map(Number) : undefined
  return {
    gate,
    targets: [...op.targets],
    ...(params && params.length > 0 ? { params } : {}),
  }
}

/**
 * Whether the circuit performs a mid-circuit reset. These collapse the
 * wavefunction stochastically, so statevector/bloch_vectors are not well
 * defined and the execution service rejects them when requested.
 */
export function hasResetOperation(circuit: CircuitState): boolean {
  return circuit.operations.some((op) => op.gate === 'RESET')
}

/**
 * The outputs to request for a given circuit: with a reset only counts and
 * probabilities (derived from counts) can be produced; every other circuit
 * requests all four datasets (counts, probabilities, statevector, bloch).
 */
export function resolveRequestedOutputs(circuit: CircuitState): QuantumOutput[] {
  return hasResetOperation(circuit)
    ? ['counts', 'probabilities']
    : [...DEFAULT_QUANTUM_OUTPUTS]
}