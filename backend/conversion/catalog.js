/**
 * Shared gate catalog for the Node.js conversion service.
 * Used by validation, normalization, parsing, and generation.
 *
 * Keep in sync with frontend/src/types/quantumLab.ts (GATE_CATALOG).
 */

export const GATE_LAYOUT = {
  I: { targets: 1 },
  X: { targets: 1 },
  Y: { targets: 1 },
  Z: { targets: 1 },
  H: { targets: 1 },
  S: { targets: 1 },
  SDG: { targets: 1 },
  T: { targets: 1 },
  TDG: { targets: 1 },
  SX: { targets: 1 },
  RX: { targets: 1, params: [{ name: 'theta', default: Math.PI / 2 }] },
  RY: { targets: 1, params: [{ name: 'theta', default: Math.PI / 2 }] },
  RZ: { targets: 1, params: [{ name: 'theta', default: Math.PI / 2 }] },
  P: { targets: 1, params: [{ name: 'lambda', default: Math.PI / 2 }] },
  CX: { targets: 2 },
  CZ: { targets: 2 },
  SWAP: { targets: 2 },
  RXX: { targets: 2, params: [{ name: 'theta', default: Math.PI / 2 }] },
  RZZ: { targets: 2, params: [{ name: 'theta', default: Math.PI / 2 }] },
  CCX: { targets: 3 },
  CCZ: { targets: 3 },
  M: { targets: 1 },
  RESET: { targets: 1 },
  BARRIER: { targets: 1 },
} 

export const GATE_TYPES = Object.keys(GATE_LAYOUT)

/** Maximum qubits accepted by the circuit IR (matches the visual builder). */
export const MAX_QUBITS = 8

/** Stable public list surfaced via GET /api/conversion/gates. */
export const GATE_LIST = GATE_TYPES.map((type) => {
  const layout = GATE_LAYOUT[type]
  return {
    type,
    qubitsRequired: layout.targets,
    params: (layout.params ?? []).map((p) => ({ name: p.name, default: p.default })),
  }
})

/** Frameworks supported by the conversion service. */
export const FRAMEWORKS = ['qiskit', 'pennylane', 'cirq', 'openqasm2', 'openqasm3']

export const PYTHON_FRAMEWORKS = ['qiskit', 'pennylane', 'cirq']