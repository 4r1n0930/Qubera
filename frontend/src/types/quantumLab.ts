/**
 * Quantum Lab Workspace Types
 * Centralized types for quantum circuit state, gate palette,
 * backend engines, code synchronization, and execution results.
 */

export type BackendType = 'qiskit' | 'cirq' | 'pennylane'

export type GateCategory = 'BASIC' | 'PHASE' | 'CONTROLLED' | 'MULTI-QUBIT' | 'MEASURE'

export type GateType =
  | 'I'
  | 'X'
  | 'Y'
  | 'Z'
  | 'H'
  | 'S'
  | 'T'
  | 'CNOT'
  | 'CZ'
  | 'SWAP'
  | 'M'

export interface GateDefinition {
  type: GateType
  name: string
  symbol: string
  category: GateCategory
  qubitsRequired: number
  description: string
  matrixSummary?: string
}

export interface GateOperation {
  id: string
  gate: GateType
  targets: number[] // [0] for single qubit; [control, target] for 2-qubit; [q0, q1] for swap
  moment: number // column/time step index (0, 1, 2, ...)
  params?: number[]
}

export interface CircuitState {
  num_qubits: number
  operations: GateOperation[]
}

export type UpdateSource = 'visual' | 'code' | 'system'

export type Operation = GateOperation

export interface CircuitIR extends CircuitState {
  operations: GateOperation[]
}

export type QuantumResult = ExecutionResult

export interface ExecutionResult {
  backend: BackendType
  shots: number
  num_qubits: number
  execution_time_ms: number
  probabilities: Record<string, number>
  counts: Record<string, number>
  statevector_summary?: string
}

export interface ExecutionState {
  status: 'idle' | 'loading' | 'success' | 'error'
  result?: ExecutionResult
  error?: string
}

export interface PresetCircuit {
  id: string
  name: string
  description: string
  qubits: number
  operations: Omit<GateOperation, 'id'>[]
}

export const GATE_CATALOG: GateDefinition[] = [
  // Basic
  {
    type: 'I',
    name: 'Identity',
    symbol: 'I',
    category: 'BASIC',
    qubitsRequired: 1,
    description: 'Leaves the qubit state unchanged.',
    matrixSummary: '[[1, 0], [0, 1]]',
  },
  {
    type: 'X',
    name: 'Pauli-X (NOT)',
    symbol: 'X',
    category: 'BASIC',
    qubitsRequired: 1,
    description: 'Flips |0⟩ to |1⟩ and |1⟩ to |0⟩ (quantum NOT gate).',
    matrixSummary: '[[0, 1], [1, 0]]',
  },
  {
    type: 'Y',
    name: 'Pauli-Y',
    symbol: 'Y',
    category: 'BASIC',
    qubitsRequired: 1,
    description: 'Pauli-Y rotation (bit and phase flip with complex phase).',
    matrixSummary: '[[0, -i], [i, 0]]',
  },
  {
    type: 'Z',
    name: 'Pauli-Z',
    symbol: 'Z',
    category: 'BASIC',
    qubitsRequired: 1,
    description: 'Flips the phase of the |1⟩ component.',
    matrixSummary: '[[1, 0], [0, -1]]',
  },
  {
    type: 'H',
    name: 'Hadamard',
    symbol: 'H',
    category: 'BASIC',
    qubitsRequired: 1,
    description: 'Creates equal superposition: |0⟩ → |+⟩ and |1⟩ → |-⟩.',
    matrixSummary: '1/√2 [[1, 1], [1, -1]]',
  },

  // Phase
  {
    type: 'S',
    name: 'Phase (S / √Z)',
    symbol: 'S',
    category: 'PHASE',
    qubitsRequired: 1,
    description: 'Applies a π/2 (90°) phase shift to the |1⟩ state.',
    matrixSummary: '[[1, 0], [0, i]]',
  },
  {
    type: 'T',
    name: 'T-Gate (π/8)',
    symbol: 'T',
    category: 'PHASE',
    qubitsRequired: 1,
    description: 'Applies a π/4 (45°) phase shift to the |1⟩ state.',
    matrixSummary: '[[1, 0], [0, e^(iπ/4)]]',
  },

  // Controlled
  {
    type: 'CNOT',
    name: 'Controlled-NOT (CX)',
    symbol: 'CX',
    category: 'CONTROLLED',
    qubitsRequired: 2,
    description: 'Flips the target qubit if the control qubit is |1⟩.',
  },
  {
    type: 'CZ',
    name: 'Controlled-Z',
    symbol: 'CZ',
    category: 'CONTROLLED',
    qubitsRequired: 2,
    description: 'Applies a phase flip to |11⟩ state.',
  },

  // Multi-Qubit
  {
    type: 'SWAP',
    name: 'Swap',
    symbol: 'SWAP',
    category: 'MULTI-QUBIT',
    qubitsRequired: 2,
    description: 'Exchanges the quantum states of two qubits.',
  },

  // Measure
  {
    type: 'M',
    name: 'Measurement',
    symbol: 'M',
    category: 'MEASURE',
    qubitsRequired: 1,
    description: 'Collapses the quantum state into a classical bit outcome.',
  },
]

export const PRESET_CIRCUITS: PresetCircuit[] = [
  {
    id: 'bell',
    name: 'Bell State (|Φ+⟩)',
    description: 'Creates maximally entangled two-qubit Bell pair: (|00⟩ + |11⟩)/√2.',
    qubits: 2,
    operations: [
      { gate: 'H', targets: [0], moment: 0 },
      { gate: 'CNOT', targets: [0, 1], moment: 1 },
      { gate: 'M', targets: [0], moment: 2 },
      { gate: 'M', targets: [1], moment: 2 },
    ],
  },
  {
    id: 'ghz',
    name: 'GHZ State (3-Qubit)',
    description: 'Tripartite entangled Greenberger-Horne-Zeilinger state: (|000⟩ + |111⟩)/√2.',
    qubits: 3,
    operations: [
      { gate: 'H', targets: [0], moment: 0 },
      { gate: 'CNOT', targets: [0, 1], moment: 1 },
      { gate: 'CNOT', targets: [1, 2], moment: 2 },
      { gate: 'M', targets: [0], moment: 3 },
      { gate: 'M', targets: [1], moment: 3 },
      { gate: 'M', targets: [2], moment: 3 },
    ],
  },
  {
    id: 'superposition',
    name: 'Uniform Superposition',
    description: 'Puts all qubits into equal superposition with independent Hadamard gates.',
    qubits: 2,
    operations: [
      { gate: 'H', targets: [0], moment: 0 },
      { gate: 'H', targets: [1], moment: 0 },
      { gate: 'M', targets: [0], moment: 1 },
      { gate: 'M', targets: [1], moment: 1 },
    ],
  },
  {
    id: 'teleportation_step',
    name: 'Entanglement & Phase Check',
    description: 'Combines Hadamard, Phase, and Controlled-Z operations.',
    qubits: 2,
    operations: [
      { gate: 'H', targets: [0], moment: 0 },
      { gate: 'S', targets: [0], moment: 1 },
      { gate: 'H', targets: [1], moment: 0 },
      { gate: 'CZ', targets: [0, 1], moment: 2 },
      { gate: 'M', targets: [0], moment: 3 },
      { gate: 'M', targets: [1], moment: 3 },
    ],
  },
]
