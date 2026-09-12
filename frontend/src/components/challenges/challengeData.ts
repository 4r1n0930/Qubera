/**
 * Predefined Guess the Output Challenges.
 *
 * Each challenge specifies:
 *  - circuit: The input quantum circuit (source of truth). The simulator generates the actual result.
 *  - predictionType: 'multiple_choice' or 'probability_distribution'
 *  - tolerance: Configurable per-challenge tolerance for probability comparison (default 0.05)
 *  - explanation: Conceptual feedback explaining WHY the circuit produces the result.
 */

import type { ChallengeDefinition } from '../../types/challenges'

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'guess-hadamard-01',
    title: 'Single-Qubit Superposition',
    description: 'A single qubit begins in the |0⟩ state and passes through a Hadamard gate.',
    difficulty: 'beginner',
    topic: 'superposition',
    circuit: {
      num_qubits: 1,
      operations: [
        {
          id: 'h1',
          gate: 'H',
          targets: [0],
          moment: 0,
        },
      ],
    },
    predictionType: 'multiple_choice',
    options: [
      { id: 'opt-50-50', label: '50% |0⟩ + 50% |1⟩', description: 'Equal superposition between |0⟩ and |1⟩' },
      { id: 'opt-pure-0', label: '100% |0⟩', description: 'Remains in the ground state' },
      { id: 'opt-pure-1', label: '100% |1⟩', description: 'Flips completely to |1⟩' },
      { id: 'opt-unequal', label: '75% |0⟩ + 25% |1⟩', description: 'Biased superposition' },
    ],
    expectedAnswer: 'opt-50-50',
    tolerance: 0.05,
    explanation:
      'The Hadamard (H) gate places the qubit into an equal superposition: |+⟩ = (|0⟩ + |1⟩)/√2. When measured in the computational basis, each basis state has probability |1/√2|² = 0.50 (50%).',
    hint: 'Think about what the Hadamard gate does to the initial |0⟩ state on the Bloch sphere (it rotates Z to X).',
  },
  {
    id: 'guess-pauli-x-02',
    title: 'Quantum NOT Gate',
    description: 'A qubit initialized in |0⟩ encounters a Pauli-X gate.',
    difficulty: 'beginner',
    topic: 'bit_flip',
    circuit: {
      num_qubits: 1,
      operations: [
        {
          id: 'x1',
          gate: 'X',
          targets: [0],
          moment: 0,
        },
      ],
    },
    predictionType: 'multiple_choice',
    options: [
      { id: 'opt-100-1', label: '100% |1⟩', description: 'State is flipped completely' },
      { id: 'opt-100-0', label: '100% |0⟩', description: 'State remains unchanged' },
      { id: 'opt-50-50', label: '50% |0⟩ + 50% |1⟩', description: 'Superposition' },
      { id: 'opt-75-25', label: '75% |1⟩ + 25% |0⟩', description: 'Partial rotation' },
    ],
    expectedAnswer: 'opt-100-1',
    tolerance: 0.05,
    explanation:
      'The Pauli-X gate is the quantum analog of a classical NOT gate. It rotates the state by π radians around the X-axis, mapping |0⟩ directly to |1⟩.',
    hint: 'The Pauli-X matrix is [[0, 1], [1, 0]]. Applying it to [1, 0] gives [0, 1].',
  },
  {
    id: 'guess-double-hadamard-03',
    title: 'Double Hadamard Interference',
    description: 'What happens when two consecutive Hadamard gates are applied to a single qubit?',
    difficulty: 'beginner',
    topic: 'interference',
    circuit: {
      num_qubits: 1,
      operations: [
        {
          id: 'h1',
          gate: 'H',
          targets: [0],
          moment: 0,
        },
        {
          id: 'h2',
          gate: 'H',
          targets: [0],
          moment: 1,
        },
      ],
    },
    predictionType: 'multiple_choice',
    options: [
      { id: 'opt-100-0', label: '100% |0⟩', description: 'Returns exactly to |0⟩ via interference' },
      { id: 'opt-100-1', label: '100% |1⟩', description: 'Leaves the qubit in |1⟩' },
      { id: 'opt-50-50', label: '50% |0⟩ + 50% |1⟩', description: 'Remains in superposition' },
      { id: 'opt-zero', label: '0% probability for all', description: 'Destructive collapse' },
    ],
    expectedAnswer: 'opt-100-0',
    tolerance: 0.05,
    explanation:
      'The Hadamard gate is self-inverse: H² = I. The first H gate creates the superposition (|0⟩ + |1⟩)/√2. The second H gate induces constructive interference on |0⟩ and destructive interference on |1⟩, returning the qubit to |0⟩.',
    hint: 'All quantum gates are unitary and reversible. Since H is Hermitian, H† = H, meaning H · H = I.',
  },
  {
    id: 'guess-bell-state-04',
    title: 'The Bell State (Entanglement)',
    description: 'A 2-qubit circuit with a Hadamard on q0 followed by a CNOT (CX) with control q0 and target q1.',
    difficulty: 'intermediate',
    topic: 'entanglement',
    circuit: {
      num_qubits: 2,
      operations: [
        {
          id: 'h1',
          gate: 'H',
          targets: [0],
          moment: 0,
        },
        {
          id: 'cx1',
          gate: 'CX',
          targets: [0, 1],
          moment: 1,
        },
      ],
    },
    predictionType: 'probability_distribution',
    tolerance: 0.05,
    explanation:
      'Applying an H gate to q0 places it into (|0⟩ + |1⟩)/√2 while q1 is |0⟩, forming (|00⟩ + |10⟩)/√2. The CNOT then flips q1 only when q0 is |1⟩, producing the maximally entangled Bell state (|00⟩ + |11⟩)/√2. The measurement outcomes are perfectly correlated: 50% |00⟩ and 50% |11⟩.',
    hint: 'Remember: if q0 is 0, q1 stays 0. If q0 is 1, q1 is flipped to 1. Both branches happen in superposition!',
  },
  {
    id: 'guess-swap-05',
    title: 'Two-Qubit SWAP Gate',
    description: 'An X gate excites q0 into |1⟩, followed by a SWAP gate between q0 and q1.',
    difficulty: 'intermediate',
    topic: 'multi_qubit',
    circuit: {
      num_qubits: 2,
      operations: [
        {
          id: 'x1',
          gate: 'X',
          targets: [0],
          moment: 0,
        },
        {
          id: 'swap1',
          gate: 'SWAP',
          targets: [0, 1],
          moment: 1,
        },
      ],
    },
    predictionType: 'multiple_choice',
    options: [
      { id: 'opt-01', label: '100% |01⟩', description: 'q0 becomes |0⟩ and q1 becomes |1⟩' },
      { id: 'opt-10', label: '100% |10⟩', description: 'q0 remains |1⟩ and q1 remains |0⟩' },
      { id: 'opt-50-50', label: '50% |10⟩ + 50% |01⟩', description: 'Superposition of exchange' },
      { id: 'opt-11', label: '100% |11⟩', description: 'Both qubits flipped' },
    ],
    expectedAnswer: 'opt-01',
    tolerance: 0.05,
    explanation:
      'The initial state is |00⟩. The X gate on q0 transforms the system into |10⟩ (where q0=1 and q1=0). The SWAP gate exchanges the states of both wires, resulting in q0=0 and q1=1, which is |01⟩ with 100% probability.',
    hint: 'In Qubera bitstring ordering, index i corresponds to q0q1...qn-1. Follow which wire holds the excitation.',
  },
  {
    id: 'guess-phase-flip-06',
    title: 'Phase Flip with Interference (X-H-Z-H)',
    description: 'A circuit testing phase manipulation: X → H → Z → H on a single qubit.',
    difficulty: 'intermediate',
    topic: 'phase',
    circuit: {
      num_qubits: 1,
      operations: [
        { id: 'x1', gate: 'X', targets: [0], moment: 0 },
        { id: 'h1', gate: 'H', targets: [0], moment: 1 },
        { id: 'z1', gate: 'Z', targets: [0], moment: 2 },
        { id: 'h2', gate: 'H', targets: [0], moment: 3 },
      ],
    },
    predictionType: 'multiple_choice',
    options: [
      { id: 'opt-0', label: '100% |0⟩', description: 'Interferes constructively to |0⟩' },
      { id: 'opt-1', label: '100% |1⟩', description: 'Interferes constructively to |1⟩' },
      { id: 'opt-half', label: '50% |0⟩ + 50% |1⟩', description: 'Equal superposition' },
      { id: 'opt-imag', label: 'Pure imaginary phase |+i⟩', description: 'Y-axis state' },
    ],
    expectedAnswer: 'opt-0',
    tolerance: 0.05,
    explanation:
      'Step-by-step: |0⟩ → (X) → |1⟩. Then H|1⟩ = |-⟩ = (|0⟩ - |1⟩)/√2. Next, the Z gate inverts the phase of |1⟩, turning |-⟩ into |+⟩ = (|0⟩ + |1⟩)/√2. Finally, H|+⟩ = |0⟩. The phase flip turned a destructive path into constructive interference for |0⟩!',
    hint: 'Z|-⟩ = |+⟩, and what does H do to |+⟩?',
  },
  {
    id: 'guess-ghz-07',
    title: '3-Qubit GHZ Entanglement',
    description: 'A 3-qubit circuit with H on q0, CNOT(q0 → q1), and CNOT(q1 → q2).',
    difficulty: 'advanced',
    topic: 'entanglement',
    circuit: {
      num_qubits: 3,
      operations: [
        { id: 'h1', gate: 'H', targets: [0], moment: 0 },
        { id: 'cx1', gate: 'CX', targets: [0, 1], moment: 1 },
        { id: 'cx2', gate: 'CX', targets: [1, 2], moment: 2 },
      ],
    },
    predictionType: 'probability_distribution',
    tolerance: 0.05,
    explanation:
      'q0 is placed into (|0⟩ + |1⟩)/√2. The first CNOT creates (|000⟩ + |110⟩)/√2. The second CNOT uses q1 to target q2, entangling all three into the Greenberger-Horne-Zeilinger (GHZ) state: (|000⟩ + |111⟩)/√2. The system has 50% probability of |000⟩ and 50% probability of |111⟩.',
    hint: 'Cascaded CNOTs propagate the superposition across all connected qubits.',
  },
  {
    id: 'guess-uniform-superposition-08',
    title: 'Two-Qubit Uniform Superposition',
    description: 'Independent Hadamard gates applied simultaneously to q0 and q1.',
    difficulty: 'advanced',
    topic: 'superposition',
    circuit: {
      num_qubits: 2,
      operations: [
        { id: 'h1', gate: 'H', targets: [0], moment: 0 },
        { id: 'h2', gate: 'H', targets: [1], moment: 0 },
      ],
    },
    predictionType: 'probability_distribution',
    tolerance: 0.05,
    explanation:
      'Since H is applied independently to both qubits, the state is (|0⟩ + |1⟩)/√2 ⊗ (|0⟩ + |1⟩)/√2 = 1/2 (|00⟩ + |01⟩ + |10⟩ + |11⟩). Each of the four computational basis states has an equal probability of |1/2|² = 0.25 (25%).',
    hint: 'The tensor product of two equal superpositions creates equal weights over 2² = 4 states.',
  },
]
