/**
 * Quantum Lab Workspace Types
 * Centralized types for quantum circuit state, gate palette,
 * backend engines, and measurement results.
 */

export type BackendType = 'qiskit' | 'cirq' | 'pennylane' | 'openqasm'

export type GateCategory =
  | 'GENERAL'
  | 'ROTATION'
  | 'TWO_QUBIT'
  | 'MULTI_QUBIT'
  | 'OPERATIONS'

export type GateType =
  | 'I'
  | 'X'
  | 'Y'
  | 'Z'
  | 'H'
  | 'S'
  | 'SDG'
  | 'T'
  | 'TDG'
  | 'SX'
  | 'RX'
  | 'RY'
  | 'RZ'
  | 'P'
  | 'CX'
  | 'CZ'
  | 'SWAP'
  | 'RXX'
  | 'RZZ'
  | 'CCX'
  | 'CCZ'
  | 'M'
  | 'RESET'
  | 'BARRIER'

export interface GateDefinition {
  type: GateType
  name: string
  symbol: string
  category: GateCategory
  qubitsRequired: number
  description: string
  matrixSummary?: string
  params?: { name: string; default: number; label?: string }[]
}

export interface GateOperation {
  id: string
  gate: GateType
  targets: number[] // [0] for single qubit; [control, target] for multi-qubit
  moment: number // column/time step index (0, 1, 2, ...)
  params?: { [key: string]: number }
}

export interface CircuitState {
  num_qubits: number
  operations: GateOperation[]
}

export type UpdateSource = 'visual' | 'system'

export type Operation = GateOperation

/** Complex amplitude coefficient of a statevector component. */
export interface ComplexAmplitude {
  re: number
  im: number
}

/** Bloch vector coordinates for a single qubit (unit sphere for pure states). */
export interface BlochVector {
  x: number
  y: number
  z: number
}

/**
 * Per-qubit state derived from a partial trace of the global statevector.
 * Shared by the probability chart and the Bloch sphere visualization.
 */
export interface QubitState {
  qubitIndex: number
  blochVector: BlochVector
  probability0: number
  probability1: number
}

export interface ExecutionResult {
  backend: BackendType
  shots: number
  num_qubits: number
  probabilities: Record<string, number>
  counts: Record<string, number>
  execution_time_ms?: number
  statevector_summary?: string
  statevector?: ComplexAmplitude[]
  qubitStates?: QubitState[]
  blochAngles?: { theta: number; phi: number }
}

export interface ExecutionState {
  status: 'idle' | 'loading' | 'success' | 'error'
  result?: ExecutionResult
  error?: string
}

export const GATE_CATALOG: GateDefinition[] = [
  // General (single-qubit)
  {
    type: 'I',
    name: 'Identity',
    symbol: 'I',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Leaves the qubit state unchanged.',
    matrixSummary: '[[1, 0], [0, 1]]',
  },
  {
    type: 'X',
    name: 'Pauli-X (NOT)',
    symbol: 'X',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Flips |0⟩ to |1⟩ and |1⟩ to |0⟩ (quantum NOT).',
    matrixSummary: '[[0, 1], [1, 0]]',
  },
  {
    type: 'Y',
    name: 'Pauli-Y',
    symbol: 'Y',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Pauli-Y rotation (bit and phase flip with complex phase).',
    matrixSummary: '[[0, -i], [i, 0]]',
  },
  {
    type: 'Z',
    name: 'Pauli-Z',
    symbol: 'Z',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Flips the phase of the |1⟩ component.',
    matrixSummary: '[[1, 0], [0, -1]]',
  },
  {
    type: 'H',
    name: 'Hadamard',
    symbol: 'H',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Creates superposition: |0⟩ → |+⟩ and |1⟩ → |-⟩.',
    matrixSummary: '1/√2 [[1, 1], [1, -1]]',
  },
  {
    type: 'S',
    name: 'Phase (S / √Z)',
    symbol: 'S',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Applies a π/2 (90°) phase shift to the |1⟩ state.',
    matrixSummary: '[[1, 0], [0, i]]',
  },
  {
    type: 'SDG',
    name: 'S† (S-dagger)',
    symbol: 'S†',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Applies a −π/2 phase shift to the |1⟩ state (inverse of S).',
    matrixSummary: '[[1, 0], [0, -i]]',
  },
  {
    type: 'T',
    name: 'T-Gate (π/8)',
    symbol: 'T',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Applies a π/4 (45°) phase shift to the |1⟩ state.',
    matrixSummary: '[[1, 0], [0, e^(iπ/4)]]',
  },
  {
    type: 'TDG',
    name: 'T† (T-dagger)',
    symbol: 'T†',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Applies a −π/4 phase shift to the |1⟩ state (inverse of T).',
    matrixSummary: '[[1, 0], [0, e^(-iπ/4)]]',
  },
  {
    type: 'SX',
    name: '√X (SX)',
    symbol: '√X',
    category: 'GENERAL',
    qubitsRequired: 1,
    description: 'Square-root of the X gate (half an X rotation).',
    matrixSummary: '1/2 [[1+i, 1-i], [1-i, 1+i]]',
  },

  // Rotation
  {
    type: 'RX',
    name: 'RX (Rotation-X)',
    symbol: 'RX',
    category: 'ROTATION',
    qubitsRequired: 1,
    description: 'Rotation about the X axis by angle θ.',
    matrixSummary: 'R_x(θ)',
    params: [{ name: 'theta', default: Math.PI / 2, label: 'θ' }],
  },
  {
    type: 'RY',
    name: 'RY (Rotation-Y)',
    symbol: 'RY',
    category: 'ROTATION',
    qubitsRequired: 1,
    description: 'Rotation about the Y axis by angle θ.',
    matrixSummary: 'R_y(θ)',
    params: [{ name: 'theta', default: Math.PI / 2, label: 'θ' }],
  },
  {
    type: 'RZ',
    name: 'RZ (Rotation-Z)',
    symbol: 'RZ',
    category: 'ROTATION',
    qubitsRequired: 1,
    description: 'Rotation about the Z axis by angle θ.',
    matrixSummary: 'R_z(θ)',
    params: [{ name: 'theta', default: Math.PI / 2, label: 'θ' }],
  },
  {
    type: 'P',
    name: 'Phase (P)',
    symbol: 'P',
    category: 'ROTATION',
    qubitsRequired: 1,
    description: 'Generalized phase gate: applies e^(iλ) to the |1⟩ state.',
    matrixSummary: '[[1, 0], [0, e^(iλ)]]',
    params: [{ name: 'lambda', default: Math.PI / 2, label: 'λ' }],
  },

  // Two Qubit
  {
    type: 'CX',
    name: 'Controlled-NOT (CX)',
    symbol: '⊕',
    category: 'TWO_QUBIT',
    qubitsRequired: 2,
    description: 'Flips the target qubit if the control qubit is |1⟩.',
  },
  {
    type: 'CZ',
    name: 'Controlled-Z',
    symbol: 'CZ',
    category: 'TWO_QUBIT',
    qubitsRequired: 2,
    description: 'Applies a phase flip to the |11⟩ state.',
  },
  {
    type: 'SWAP',
    name: 'Swap',
    symbol: '✕',
    category: 'TWO_QUBIT',
    qubitsRequired: 2,
    description: 'Exchanges the quantum states of two qubits.',
  },
  {
    type: 'RXX',
    name: 'RXX (Rotation-XX)',
    symbol: 'RXX',
    category: 'TWO_QUBIT',
    qubitsRequired: 2,
    description: 'Two-qubit rotation about the XX axis by angle θ.',
    matrixSummary: 'R_xx(θ)',
    params: [{ name: 'theta', default: Math.PI / 2, label: 'θ' }],
  },
  {
    type: 'RZZ',
    name: 'RZZ (Rotation-ZZ)',
    symbol: 'RZZ',
    category: 'TWO_QUBIT',
    qubitsRequired: 2,
    description: 'Two-qubit rotation about the ZZ axis by angle θ.',
    matrixSummary: 'R_zz(θ)',
    params: [{ name: 'theta', default: Math.PI / 2, label: 'θ' }],
  },

  // Multi Qubit
  {
    type: 'CCX',
    name: 'Toffoli (CCX)',
    symbol: 'CCX',
    category: 'MULTI_QUBIT',
    qubitsRequired: 3,
    description: 'Flips target if both control qubits are |1⟩.',
  },
  {
    type: 'CCZ',
    name: 'Controlled-Controlled-Z',
    symbol: 'CCZ',
    category: 'MULTI_QUBIT',
    qubitsRequired: 3,
    description: 'Applies a phase flip when all three qubits are |1⟩.',
  },

  // Operations
  {
    type: 'M',
    name: 'Measurement',
    symbol: 'M',
    category: 'OPERATIONS',
    qubitsRequired: 1,
    description: 'Collapses the quantum state into a classical bit outcome.',
  },
  {
    type: 'RESET',
    name: 'Reset',
    symbol: '|0⟩',
    category: 'OPERATIONS',
    qubitsRequired: 1,
    description: 'Resets a qubit to the |0⟩ state.',
  },
  {
    type: 'BARRIER',
    name: 'Barrier',
    symbol: '▮',
    category: 'OPERATIONS',
    qubitsRequired: 1,
    description: 'Prevents gate optimization across it (visual separator).',
  },
]

export const GATE_CATEGORIES: { label: string; value: GateCategory }[] = [
  { label: 'Single Qubit', value: 'GENERAL' },
  { label: 'Rotations', value: 'ROTATION' },
  { label: 'Two Qubit', value: 'TWO_QUBIT' },
  { label: 'Multi Qubit', value: 'MULTI_QUBIT' },
  { label: 'Operations', value: 'OPERATIONS' },
]
