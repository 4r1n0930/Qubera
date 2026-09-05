/**
 * Quantum Code Synchronization Engine
 * Generates idiomatic Python code (Qiskit, Cirq, PennyLane) from visual circuit state
 * and parses Python code back into the normalized circuit state.
 * Maintains bidirectional line-to-gate highlighting mapping.
 */

import type { CircuitState, GateOperation, BackendType, GateType } from '../types/quantumLab'

export interface CodeGenResult {
  code: string
  lineToGateId: Record<number, string> // 1-indexed line number -> gate operation id
  gateIdToLine: Record<string, number> // gate operation id -> 1-indexed line number
}

export interface ParseResult {
  circuit: CircuitState
  lineToGateId: Record<number, string>
  gateIdToLine: Record<string, number>
  error?: string
  errorLine?: number
}

let idCounter = 1000
function genGateId(): string {
  return `gate_${Date.now()}_${++idCounter}`
}

/**
 * Generates Python code for a given backend from the visual circuit state.
 */
export function generatePythonCode(
  circuit: CircuitState,
  backend: BackendType,
  shots = 1000
): CodeGenResult {
  const numQubits = Math.max(1, circuit.num_qubits || 2)
  const sortedOps = [...circuit.operations].sort((a, b) => {
    if (a.moment !== b.moment) return a.moment - b.moment
    return (a.targets[0] ?? 0) - (b.targets[0] ?? 0)
  })

  const lines: string[] = []
  const lineToGateId: Record<number, string> = {}
  const gateIdToLine: Record<string, number> = {}

  const addLine = (codeLine: string, gateId?: string) => {
    lines.push(codeLine)
    const lineNum = lines.length // 1-indexed
    if (gateId) {
      lineToGateId[lineNum] = gateId
      gateIdToLine[gateId] = lineNum
    }
  }

  if (backend === 'qiskit') {
    addLine('from qiskit import QuantumCircuit')
    addLine('')
    addLine(`qc = QuantumCircuit(${numQubits})`)
    addLine('')

    let hasExplicitMeasure = false

    for (const op of sortedOps) {
      const q0 = op.targets[0] ?? 0
      const q1 = op.targets[1] ?? (q0 + 1)

      switch (op.gate) {
        case 'I':
          addLine(`qc.id(${q0})`, op.id)
          break
        case 'X':
          addLine(`qc.x(${q0})`, op.id)
          break
        case 'Y':
          addLine(`qc.y(${q0})`, op.id)
          break
        case 'Z':
          addLine(`qc.z(${q0})`, op.id)
          break
        case 'H':
          addLine(`qc.h(${q0})`, op.id)
          break
        case 'S':
          addLine(`qc.s(${q0})`, op.id)
          break
        case 'T':
          addLine(`qc.t(${q0})`, op.id)
          break
        case 'CNOT':
          addLine(`qc.cx(${q0}, ${q1})`, op.id)
          break
        case 'CZ':
          addLine(`qc.cz(${q0}, ${q1})`, op.id)
          break
        case 'SWAP':
          addLine(`qc.swap(${q0}, ${q1})`, op.id)
          break
        case 'M':
          hasExplicitMeasure = true
          addLine(`qc.measure(${q0}, ${q0})`, op.id)
          break
      }
    }

    if (!hasExplicitMeasure && sortedOps.length > 0) {
      addLine('')
      addLine('qc.measure_all()')
    }
  } else if (backend === 'cirq') {
    addLine('import cirq')
    addLine('')
    const qubitNames = Array.from({ length: numQubits }, (_, i) => `q${i}`)
    addLine(`${qubitNames.join(', ')} = cirq.LineQubit.range(${numQubits})`)
    addLine('circuit = cirq.Circuit()')
    addLine('')

    for (const op of sortedOps) {
      const q0 = op.targets[0] ?? 0
      const q1 = op.targets[1] ?? (q0 + 1)

      switch (op.gate) {
        case 'I':
          addLine(`circuit.append(cirq.I(q${q0}))`, op.id)
          break
        case 'X':
          addLine(`circuit.append(cirq.X(q${q0}))`, op.id)
          break
        case 'Y':
          addLine(`circuit.append(cirq.Y(q${q0}))`, op.id)
          break
        case 'Z':
          addLine(`circuit.append(cirq.Z(q${q0}))`, op.id)
          break
        case 'H':
          addLine(`circuit.append(cirq.H(q${q0}))`, op.id)
          break
        case 'S':
          addLine(`circuit.append(cirq.S(q${q0}))`, op.id)
          break
        case 'T':
          addLine(`circuit.append(cirq.T(q${q0}))`, op.id)
          break
        case 'CNOT':
          addLine(`circuit.append(cirq.CNOT(q${q0}, q${q1}))`, op.id)
          break
        case 'CZ':
          addLine(`circuit.append(cirq.CZ(q${q0}, q${q1}))`, op.id)
          break
        case 'SWAP':
          addLine(`circuit.append(cirq.SWAP(q${q0}, q${q1}))`, op.id)
          break
        case 'M':
          addLine(`circuit.append(cirq.measure(q${q0}, key='m${q0}'))`, op.id)
          break
      }
    }
  } else if (backend === 'pennylane') {
    addLine('import pennylane as qml')
    addLine('')
    addLine(`dev = qml.device("default.qubit", wires=${numQubits}, shots=${shots})`)
    addLine('')
    addLine('@qml.qnode(dev)')
    addLine('def circuit():')

    if (sortedOps.length === 0) {
      addLine('    qml.Identity(wires=0)')
    } else {
      for (const op of sortedOps) {
        const q0 = op.targets[0] ?? 0
        const q1 = op.targets[1] ?? (q0 + 1)

        switch (op.gate) {
          case 'I':
            addLine(`    qml.Identity(wires=${q0})`, op.id)
            break
          case 'X':
            addLine(`    qml.PauliX(wires=${q0})`, op.id)
            break
          case 'Y':
            addLine(`    qml.PauliY(wires=${q0})`, op.id)
            break
          case 'Z':
            addLine(`    qml.PauliZ(wires=${q0})`, op.id)
            break
          case 'H':
            addLine(`    qml.Hadamard(wires=${q0})`, op.id)
            break
          case 'S':
            addLine(`    qml.S(wires=${q0})`, op.id)
            break
          case 'T':
            addLine(`    qml.T(wires=${q0})`, op.id)
            break
          case 'CNOT':
            addLine(`    qml.CNOT(wires=[${q0}, ${q1}])`, op.id)
            break
          case 'CZ':
            addLine(`    qml.CZ(wires=[${q0}, ${q1}])`, op.id)
            break
          case 'SWAP':
            addLine(`    qml.SWAP(wires=[${q0}, ${q1}])`, op.id)
            break
          case 'M':
            // PennyLane measurement is sampled in return
            break
        }
      }
    }

    addLine('    return qml.sample()')
  }

  return {
    code: lines.join('\n'),
    lineToGateId,
    gateIdToLine,
  }
}

/**
 * Parses Python code into normalized CircuitState.
 * Supports Qiskit, Cirq, and PennyLane constructs.
 */
export function parsePythonCode(
  code: string,
  _backend: BackendType,
  lastValidCircuit?: CircuitState
): ParseResult {
  const lines = code.split(/\r?\n/)
  const lineToGateId: Record<number, string> = {}
  const gateIdToLine: Record<string, number> = {}
  const ops: GateOperation[] = []

  let detectedQubits = lastValidCircuit?.num_qubits ?? 2
  let maxReferencedQubit = 0

  // Track current moment per qubit to lay out sequential gates gracefully
  const qubitMoments: number[] = new Array(8).fill(0)

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()
    const lineNum = i + 1

    if (!trimmed || trimmed.startsWith('#')) continue

    // Detect Qiskit QuantumCircuit(N)
    const qiskitCircuitMatch = trimmed.match(/QuantumCircuit\s*\(\s*(\d+)/i)
    if (qiskitCircuitMatch) {
      const q = parseInt(qiskitCircuitMatch[1], 10)
      if (!isNaN(q) && q >= 1 && q <= 6) {
        detectedQubits = q
      }
      continue
    }

    // Detect Cirq LineQubit.range(N)
    const cirqRangeMatch = trimmed.match(/LineQubit\.range\s*\(\s*(\d+)/i)
    if (cirqRangeMatch) {
      const q = parseInt(cirqRangeMatch[1], 10)
      if (!isNaN(q) && q >= 1 && q <= 6) {
        detectedQubits = q
      }
      continue
    }

    // Detect PennyLane wires=N
    const pennyLaneWiresMatch = trimmed.match(/wires\s*=\s*(\d+)/i)
    if (pennyLaneWiresMatch) {
      const q = parseInt(pennyLaneWiresMatch[1], 10)
      if (!isNaN(q) && q >= 1 && q <= 6) {
        detectedQubits = q
      }
    }

    // 1. Single Qubit Gates: Qiskit `qc.h(0)`, `qc.x(1)`, etc.
    const qiskitSingleMatch = trimmed.match(/^qc\.(h|x|y|z|s|t|id|i|measure)\s*\(\s*(\d+)/i)
    if (qiskitSingleMatch) {
      const gateName = qiskitSingleMatch[1].toUpperCase()
      const target = parseInt(qiskitSingleMatch[2], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)

      let gateType: GateType = 'H'
      if (gateName === 'ID' || gateName === 'I') gateType = 'I'
      else if (gateName === 'X') gateType = 'X'
      else if (gateName === 'Y') gateType = 'Y'
      else if (gateName === 'Z') gateType = 'Z'
      else if (gateName === 'H') gateType = 'H'
      else if (gateName === 'S') gateType = 'S'
      else if (gateName === 'T') gateType = 'T'
      else if (gateName === 'MEASURE') gateType = 'M'

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [target], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // 2. Controlled / 2-Qubit Gates: Qiskit `qc.cx(0, 1)`, `qc.cz(0, 1)`, `qc.swap(0, 1)`
    const qiskitTwoMatch = trimmed.match(/^qc\.(cx|cnot|cz|swap)\s*\(\s*(\d+)\s*,\s*(\d+)/i)
    if (qiskitTwoMatch) {
      const gateName = qiskitTwoMatch[1].toUpperCase()
      const ctrl = parseInt(qiskitTwoMatch[2], 10)
      const trgt = parseInt(qiskitTwoMatch[3], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, ctrl, trgt)

      let gateType: GateType = 'CNOT'
      if (gateName === 'CX' || gateName === 'CNOT') gateType = 'CNOT'
      else if (gateName === 'CZ') gateType = 'CZ'
      else if (gateName === 'SWAP') gateType = 'SWAP'

      const moment = Math.max(qubitMoments[ctrl] || 0, qubitMoments[trgt] || 0)
      qubitMoments[ctrl] = moment + 1
      qubitMoments[trgt] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [ctrl, trgt], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // 3. Cirq single gates: `circuit.append(cirq.H(q0))`
    const cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(H|X|Y|Z|S|T|I)\s*\(\s*q?(\d+)/i)
    if (cirqSingleMatch) {
      const gateName = cirqSingleMatch[1].toUpperCase() as GateType
      const target = parseInt(cirqSingleMatch[2], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateName, targets: [target], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // 4. Cirq 2-qubit gates: `circuit.append(cirq.CNOT(q0, q1))`
    const cirqTwoMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(CNOT|CX|CZ|SWAP)\s*\(\s*q?(\d+)\s*,\s*q?(\d+)/i)
    if (cirqTwoMatch) {
      const gateName = cirqTwoMatch[1].toUpperCase()
      const ctrl = parseInt(cirqTwoMatch[2], 10)
      const trgt = parseInt(cirqTwoMatch[3], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, ctrl, trgt)

      const gateType: GateType = gateName === 'CZ' ? 'CZ' : gateName === 'SWAP' ? 'SWAP' : 'CNOT'
      const moment = Math.max(qubitMoments[ctrl] || 0, qubitMoments[trgt] || 0)
      qubitMoments[ctrl] = moment + 1
      qubitMoments[trgt] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [ctrl, trgt], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // 5. PennyLane single gates: `qml.Hadamard(wires=0)`
    const pennySingleMatch = trimmed.match(/qml\.(Hadamard|PauliX|PauliY|PauliZ|S|T|Identity)\s*\(\s*wires\s*=\s*(\d+)/i)
    if (pennySingleMatch) {
      const name = pennySingleMatch[1]
      const target = parseInt(pennySingleMatch[2], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)

      let gateType: GateType = 'H'
      if (name === 'PauliX') gateType = 'X'
      else if (name === 'PauliY') gateType = 'Y'
      else if (name === 'PauliZ') gateType = 'Z'
      else if (name === 'S') gateType = 'S'
      else if (name === 'T') gateType = 'T'
      else if (name === 'Identity') gateType = 'I'

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [target], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // 6. PennyLane controlled gates: `qml.CNOT(wires=[0, 1])`
    const pennyTwoMatch = trimmed.match(/qml\.(CNOT|CZ|SWAP)\s*\(\s*wires\s*=\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]/i)
    if (pennyTwoMatch) {
      const name = pennyTwoMatch[1]
      const ctrl = parseInt(pennyTwoMatch[2], 10)
      const trgt = parseInt(pennyTwoMatch[3], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, ctrl, trgt)

      const gateType: GateType = name === 'CZ' ? 'CZ' : name === 'SWAP' ? 'SWAP' : 'CNOT'
      const moment = Math.max(qubitMoments[ctrl] || 0, qubitMoments[trgt] || 0)
      qubitMoments[ctrl] = moment + 1
      qubitMoments[trgt] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [ctrl, trgt], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // 7. Check for incomplete/invalid syntax on quantum instructions
    if (trimmed.startsWith('qc.') || trimmed.startsWith('circuit.append') || trimmed.startsWith('qml.')) {
      // Incomplete statement (e.g. typing `qc.cx(0, `)
      return {
        circuit: lastValidCircuit || { num_qubits: detectedQubits, operations: ops },
        lineToGateId,
        gateIdToLine,
        error: `Syntax error on line ${lineNum}: Incomplete quantum operation "${trimmed}"`,
        errorLine: lineNum,
      }
    }
  }

  const numQubits = Math.max(detectedQubits, maxReferencedQubit + 1)

  return {
    circuit: {
      num_qubits: Math.min(6, Math.max(1, numQubits)),
      operations: ops,
    },
    lineToGateId,
    gateIdToLine,
  }
}
