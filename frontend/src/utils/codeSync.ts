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
      const q2 = op.targets[2] ?? (q1 + 1)
      const th = op.params && typeof op.params['theta'] === 'number' ? op.params['theta'] : Math.PI / 2
      const lam = op.params && typeof op.params['lambda'] === 'number' ? op.params['lambda'] : Math.PI / 2
      const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(4))

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
        case 'SDG':
          addLine(`qc.sdg(${q0})`, op.id)
          break
        case 'T':
          addLine(`qc.t(${q0})`, op.id)
          break
        case 'TDG':
          addLine(`qc.tdg(${q0})`, op.id)
          break
        case 'SX':
          addLine(`qc.sx(${q0})`, op.id)
          break
        case 'RX':
          addLine(`qc.rx(${fmt(th)}, ${q0})`, op.id)
          break
        case 'RY':
          addLine(`qc.ry(${fmt(th)}, ${q0})`, op.id)
          break
        case 'RZ':
          addLine(`qc.rz(${fmt(th)}, ${q0})`, op.id)
          break
        case 'P':
          addLine(`qc.p(${fmt(lam)}, ${q0})`, op.id)
          break
        case 'CX':
          addLine(`qc.cx(${q0}, ${q1})`, op.id)
          break
        case 'CZ':
          addLine(`qc.cz(${q0}, ${q1})`, op.id)
          break
        case 'SWAP':
          addLine(`qc.swap(${q0}, ${q1})`, op.id)
          break
        case 'RXX':
          addLine(`qc.rxx(${fmt(th)}, ${q0}, ${q1})`, op.id)
          break
        case 'RZZ':
          addLine(`qc.rzz(${fmt(th)}, ${q0}, ${q1})`, op.id)
          break
        case 'CCX':
          addLine(`qc.ccx(${q0}, ${q1}, ${q2})`, op.id)
          break
        case 'CCZ':
          addLine(`qc.ccz(${q0}, ${q1}, ${q2})`, op.id)
          break
        case 'RESET':
          addLine(`qc.reset(${q0})`, op.id)
          break
        case 'BARRIER':
          addLine(`qc.barrier(${q0})`, op.id)
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
      const q2 = op.targets[2] ?? (q1 + 1)
      const th = op.params && typeof op.params['theta'] === 'number' ? op.params['theta'] : Math.PI / 2
      const lam = op.params && typeof op.params['lambda'] === 'number' ? op.params['lambda'] : Math.PI / 2
      const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(4))

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
        case 'SDG':
          addLine(`circuit.append(cirq.S(q${q0})**-1)`, op.id)
          break
        case 'T':
          addLine(`circuit.append(cirq.T(q${q0}))`, op.id)
          break
        case 'TDG':
          addLine(`circuit.append(cirq.T(q${q0})**-1)`, op.id)
          break
        case 'SX':
          addLine(`circuit.append(cirq.X(q${q0})**0.5)`, op.id)
          break
        case 'RX':
          addLine(`circuit.append(cirq.rx(${fmt(th)})(q${q0}))`, op.id)
          break
        case 'RY':
          addLine(`circuit.append(cirq.ry(${fmt(th)})(q${q0}))`, op.id)
          break
        case 'RZ':
          addLine(`circuit.append(cirq.rz(${fmt(th)})(q${q0}))`, op.id)
          break
        case 'P':
          addLine(`circuit.append(cirq.ZPowGate(exponent=${fmt(lam / Math.PI)})(q${q0}))`, op.id)
          break
        case 'CX':
          addLine(`circuit.append(cirq.CNOT(q${q0}, q${q1}))`, op.id)
          break
        case 'CZ':
          addLine(`circuit.append(cirq.CZ(q${q0}, q${q1}))`, op.id)
          break
        case 'SWAP':
          addLine(`circuit.append(cirq.SWAP(q${q0}, q${q1}))`, op.id)
          break
        case 'RXX':
          addLine(`circuit.append(cirq.XXPowGate(exponent=${fmt(th / Math.PI)})(q${q0}, q${q1}))`, op.id)
          break
        case 'RZZ':
          addLine(`circuit.append(cirq.ZZPowGate(exponent=${fmt(th / Math.PI)})(q${q0}, q${q1}))`, op.id)
          break
        case 'CCX':
          addLine(`circuit.append(cirq.CCX(q${q0}, q${q1}, q${q2}))`, op.id)
          break
        case 'CCZ':
          addLine(`circuit.append(cirq.CCZ(q${q0}, q${q1}, q${q2}))`, op.id)
          break
        case 'RESET':
          addLine(`circuit.append(cirq.reset(q${q0}))`, op.id)
          break
        case 'BARRIER':
          addLine(`# Barrier: circuit.append(cirq.Moment())`, op.id)
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
        const q2 = op.targets[2] ?? (q1 + 1)
        const th = op.params && typeof op.params['theta'] === 'number' ? op.params['theta'] : Math.PI / 2
        const lam = op.params && typeof op.params['lambda'] === 'number' ? op.params['lambda'] : Math.PI / 2
        const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(4))

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
          case 'SDG':
            addLine(`    qml.S(wires=${q0}).inv()`, op.id)
            break
          case 'T':
            addLine(`    qml.T(wires=${q0})`, op.id)
            break
          case 'TDG':
            addLine(`    qml.T(wires=${q0}).inv()`, op.id)
            break
          case 'SX':
            addLine(`    qml.SX(wires=${q0})`, op.id)
            break
          case 'RX':
            addLine(`    qml.RX(${fmt(th)}, wires=${q0})`, op.id)
            break
          case 'RY':
            addLine(`    qml.RY(${fmt(th)}, wires=${q0})`, op.id)
            break
          case 'RZ':
            addLine(`    qml.RZ(${fmt(th)}, wires=${q0})`, op.id)
            break
          case 'P':
            addLine(`    qml.PhaseShift(${fmt(lam)}, wires=${q0})`, op.id)
            break
          case 'CX':
            addLine(`    qml.CNOT(wires=[${q0}, ${q1}])`, op.id)
            break
          case 'CZ':
            addLine(`    qml.CZ(wires=[${q0}, ${q1}])`, op.id)
            break
          case 'SWAP':
            addLine(`    qml.SWAP(wires=[${q0}, ${q1}])`, op.id)
            break
          case 'RXX':
            addLine(`    qml.IsingXX(${fmt(th)}, wires=[${q0}, ${q1}])`, op.id)
            break
          case 'RZZ':
            addLine(`    qml.IsingZZ(${fmt(th)}, wires=[${q0}, ${q1}])`, op.id)
            break
          case 'CCX':
            addLine(`    qml.Toffoli(wires=[${q0}, ${q1}, ${q2}])`, op.id)
            break
          case 'CCZ':
            addLine(`    qml.CCZ(wires=[${q0}, ${q1}, ${q2}])`, op.id)
            break
          case 'RESET':
            addLine(`    qml.Reset(wires=${q0})`, op.id)
            break
          case 'BARRIER':
            addLine(`    # Barrier`, op.id)
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

    // 1. Single Qubit Gates: Qiskit `qc.h(0)`, `qc.x(1)`, `qc.rx(theta, 0)`, etc.
    const qiskitSingleMatch = trimmed.match(/^qc\.([a-zA-Z]+)\s*\(([^)]*)\)/i)
    if (qiskitSingleMatch) {
      const gateName = qiskitSingleMatch[1].toLowerCase()
      const args = qiskitSingleMatch[2].split(',').map((a) => a.trim())
      let target: number
      let param: number | undefined

      const extraArgGates = ['rx', 'ry', 'rz', 'p']
      if (extraArgGates.includes(gateName) && args.length >= 2) {
        const pv = parseFloat(args[0])
        target = parseInt(args[1], 10)
        if (!isNaN(pv)) param = pv
      } else {
        target = parseInt(args[0], 10)
      }

      if (!isNaN(target)) {
        maxReferencedQubit = Math.max(maxReferencedQubit, target)

        let gateType: GateType | null = null
        let gateParams: { [key: string]: number } | undefined
        switch (gateName) {
          case 'id':
          case 'i':
            gateType = 'I'
            break
          case 'x':
            gateType = 'X'
            break
          case 'y':
            gateType = 'Y'
            break
          case 'z':
            gateType = 'Z'
            break
          case 'h':
            gateType = 'H'
            break
          case 's':
            gateType = 'S'
            break
          case 'sdg':
            gateType = 'SDG'
            break
          case 't':
            gateType = 'T'
            break
          case 'tdg':
            gateType = 'TDG'
            break
          case 'sx':
            gateType = 'SX'
            break
          case 'rx':
            gateType = 'RX'
            gateParams = { theta: param ?? Math.PI / 2 }
            break
          case 'ry':
            gateType = 'RY'
            gateParams = { theta: param ?? Math.PI / 2 }
            break
          case 'rz':
            gateType = 'RZ'
            gateParams = { theta: param ?? Math.PI / 2 }
            break
          case 'p':
            gateType = 'P'
            gateParams = { lambda: param ?? Math.PI / 2 }
            break
          case 'reset':
            gateType = 'RESET'
            break
          case 'barrier':
            gateType = 'BARRIER'
            break
          case 'measure':
            gateType = 'M'
            break
        }

        if (gateType) {
          const moment = qubitMoments[target] || 0
          qubitMoments[target] = moment + 1

          const id = genGateId()
          const op: GateOperation = { id, gate: gateType, targets: [target], moment }
          if (gateParams) op.params = gateParams
          ops.push(op)
          lineToGateId[lineNum] = id
          gateIdToLine[id] = lineNum
          continue
        }
      }
    }

    // 2. Controlled / 2-Qubit + Multi-Qubit Gates: Qiskit `qc.cx(0, 1)`, `qc.rxx(θ, 0, 1)`, `qc.ccx(0,1,2)`
    const qiskitTwoMatch = trimmed.match(/^qc\.(cx|cnot|cz|swap|rxx|rzz|ccx|ccz)\s*\(([^)]*)\)/i)
    if (qiskitTwoMatch) {
      const gateName = qiskitTwoMatch[1].toLowerCase()
      const args = qiskitTwoMatch[2].split(',').map((a) => a.trim())
      let targets: number[]
      let param: number | undefined

      const angleGates = ['rxx', 'rzz']
      if (angleGates.includes(gateName)) {
        const pv = parseFloat(args[0])
        if (!isNaN(pv)) param = pv
        targets = args.slice(1).map((a) => parseInt(a, 10))
      } else {
        targets = args.map((a) => parseInt(a, 10))
      }

      const valid = targets.every((t) => !isNaN(t))
      if (valid) {
        maxReferencedQubit = Math.max(...targets, maxReferencedQubit)

        let gateType: GateType | null = null
        let gateParams: { [key: string]: number } | undefined
        switch (gateName) {
          case 'cx':
          case 'cnot':
            gateType = 'CX'
            break
          case 'cz':
            gateType = 'CZ'
            break
          case 'swap':
            gateType = 'SWAP'
            break
          case 'rxx':
            gateType = 'RXX'
            gateParams = { theta: param ?? Math.PI / 2 }
            break
          case 'rzz':
            gateType = 'RZZ'
            gateParams = { theta: param ?? Math.PI / 2 }
            break
          case 'ccx':
            gateType = 'CCX'
            break
          case 'ccz':
            gateType = 'CCZ'
            break
        }

        if (gateType) {
          const moment = targets.reduce((acc, t) => Math.max(acc, qubitMoments[t] || 0), 0)
          for (const t of targets) qubitMoments[t] = moment + 1

          const id = genGateId()
          const op: GateOperation = { id, gate: gateType, targets, moment }
          if (gateParams) op.params = gateParams
          ops.push(op)
          lineToGateId[lineNum] = id
          gateIdToLine[id] = lineNum
          continue
        }
      }
    }

    // 3. Cirq single gates: `circuit.append(cirq.H(q0))`, `cirq.rx(1.57)(q0)`, `cirq.X(q0)**0.5`
    let cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(rx|ry|rz)\(\s*([^\s,)]+)\)\s*\(\s*q?(\d+)/i)
    if (cirqSingleMatch) {
      const gateName = cirqSingleMatch[1].toLowerCase()
      const param = parseFloat(cirqSingleMatch[2])
      const target = parseInt(cirqSingleMatch[3], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)

      let gateType: GateType = 'RX'
      if (gateName === 'ry') gateType = 'RY'
      else if (gateName === 'rz') gateType = 'RZ'
      const gateParams = { theta: isNaN(param) ? Math.PI / 2 : param }

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      const op: GateOperation = { id, gate: gateType, targets: [target], moment, params: gateParams }
      ops.push(op)
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }
    // Cirq `circuit.append(cirq.reset(q0))`
    cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(reset)\s*\(\s*q?(\d+)/i)
    if (cirqSingleMatch) {
      const target = parseInt(cirqSingleMatch[2], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)
      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: 'RESET', targets: [target], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }
    // Cirq measure: `circuit.append(cirq.measure(q0, key='m0'))`
    cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.measure\(\s*q?(\d+)/i)
    if (cirqSingleMatch) {
      const target = parseInt(cirqSingleMatch[1], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)
      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: 'M', targets: [target], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }
    cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(H|X|Y|Z|S|T|I)(?!\w)(\(\s*q?(\d+)\))?(\s*\*\*\s*([^\s,)]+))?/i)
    if (cirqSingleMatch) {
      const gateName = cirqSingleMatch[1].toUpperCase() as GateType
      const target = parseInt(cirqSingleMatch[3] ?? '0', 10)
      const powerStr = cirqSingleMatch[5]
      maxReferencedQubit = Math.max(maxReferencedQubit, target)

      let gateType: GateType = gateName
      if (powerStr) {
        const power = parseFloat(powerStr)
        if (gateName === 'S' && power === -1) gateType = 'SDG'
        else if (gateName === 'T' && power === -1) gateType = 'TDG'
        else if (gateName === 'X' && Math.abs(power - 0.5) < 1e-6) gateType = 'SX'
      }

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [target], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // 4. Cirq 2-qubit gates: `circuit.append(cirq.CNOT(q0, q1))`, `cirq.XXPowGate(exponent=0.5)(q0,q1)`, `cirq.CCX(q0,q1,q2)`
    let cirqTwoMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(CNOT|CX|CZ|SWAP|CCX|CCZ)\s*\(([^)]*)\)/i)
    if (cirqTwoMatch) {
      const gateName = cirqTwoMatch[1].toUpperCase()
      const args = cirqTwoMatch[2].split(',').map((a) => a.trim().replace(/^q/i, ''))
      const targets = args.map((a) => parseInt(a, 10))
      const valid = targets.every((t) => !isNaN(t))

      if (valid) {
        maxReferencedQubit = Math.max(...targets, maxReferencedQubit)

        let gateType: GateType
        switch (gateName) {
          case 'CCX': gateType = 'CCX'; break
          case 'CCZ': gateType = 'CCZ'; break
          case 'CZ': gateType = 'CZ'; break
          case 'SWAP': gateType = 'SWAP'; break
          default: gateType = 'CX'
        }

        const moment = targets.reduce((acc, t) => Math.max(acc, qubitMoments[t] || 0), 0)
        for (const t of targets) qubitMoments[t] = moment + 1

        const id = genGateId()
        ops.push({ id, gate: gateType, targets, moment })
        lineToGateId[lineNum] = id
        gateIdToLine[id] = lineNum
        continue
      }
    }

    // Cirq XXPowGate / ZZPowGate: `circuit.append(cirq.XXPowGate(exponent=0.5)(q0, q1))`
    cirqTwoMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(XXPowGate|ZZPowGate)\(\s*exponent\s*=\s*([^\s,)]+)\)\s*\(\s*q?(\d+)\s*,\s*q?(\d+)/i)
    if (cirqTwoMatch) {
      const gateName = cirqTwoMatch[1]
      const exponent = parseFloat(cirqTwoMatch[2])
      const q0 = parseInt(cirqTwoMatch[3], 10)
      const q1 = parseInt(cirqTwoMatch[4], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, q0, q1)

      const gateType: GateType = gateName === 'XXPowGate' ? 'RXX' : 'RZZ'
      const theta = isNaN(exponent) ? Math.PI / 2 : exponent * Math.PI

      const moment = Math.max(qubitMoments[q0] || 0, qubitMoments[q1] || 0)
      qubitMoments[q0] = moment + 1
      qubitMoments[q1] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [q0, q1], moment, params: { theta } })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // Cirq ZPowGate (phase P): `circuit.append(cirq.ZPowGate(exponent=0.5)(q0))`
    cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.ZPowGate\(\s*exponent\s*=\s*([^\s,)]+)\)\s*\(\s*q?(\d+)/i)
    if (cirqSingleMatch) {
      const exponent = parseFloat(cirqSingleMatch[1])
      const target = parseInt(cirqSingleMatch[2], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)
      const lambda = isNaN(exponent) ? Math.PI / 2 : exponent * Math.PI

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: 'P', targets: [target], moment, params: { lambda } })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // 5. PennyLane single gates: `qml.Hadamard(wires=0)`, `qml.RX(1.57, wires=0)`
    let pennySingleMatch = trimmed.match(/qml\.(RX|RY|RZ)\(\s*([^\s,]+)\s*,\s*wires\s*=\s*(\d+)/i)
    if (pennySingleMatch) {
      const name = pennySingleMatch[1].toUpperCase()
      const param = parseFloat(pennySingleMatch[2])
      const target = parseInt(pennySingleMatch[3], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)

      const gateType: GateType = name === 'RY' ? 'RY' : name === 'RZ' ? 'RZ' : 'RX'
      const gateParams = { theta: isNaN(param) ? Math.PI / 2 : param }

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [target], moment, params: gateParams })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // PennyLane PhaseShift: `qml.PhaseShift(1.57, wires=0)`
    pennySingleMatch = trimmed.match(/qml\.(PhaseShift)\(\s*([^\s,]+)\s*,\s*wires\s*=\s*(\d+)/i)
    if (pennySingleMatch) {
      const param = parseFloat(pennySingleMatch[2])
      const target = parseInt(pennySingleMatch[3], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)
      const lambda = isNaN(param) ? Math.PI / 2 : param

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: 'P', targets: [target], moment, params: { lambda } })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // PennyLane Reset: `qml.Reset(wires=0)`
    pennySingleMatch = trimmed.match(/qml\.(Reset)\(\s*wires\s*=\s*(\d+)/i)
    if (pennySingleMatch) {
      const target = parseInt(pennySingleMatch[2], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: 'RESET', targets: [target], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    pennySingleMatch = trimmed.match(/qml\.(SX|Hadamard|PauliX|PauliY|PauliZ|S|T|Identity)\s*\(\s*wires\s*=\s*(\d+)/i)
    if (pennySingleMatch) {
      const name = pennySingleMatch[1]
      const invMatch = trimmed.match(/\.inv\s*\(\s*\)/i)
      const target = parseInt(pennySingleMatch[2], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, target)

      let gateType: GateType
      switch (name) {
        case 'PauliX': gateType = 'X'; break
        case 'PauliY': gateType = 'Y'; break
        case 'PauliZ': gateType = 'Z'; break
        case 'S':
          gateType = invMatch ? 'SDG' : 'S'
          break
        case 'T':
          gateType = invMatch ? 'TDG' : 'T'
          break
        case 'SX': gateType = 'SX'; break
        case 'Identity': gateType = 'I'; break
        default: gateType = 'H'
      }

      const moment = qubitMoments[target] || 0
      qubitMoments[target] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [target], moment })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    // 6. PennyLane controlled gates: `qml.CNOT(wires=[0, 1])`, `qml.Toffoli(wires=[0,1,2])`, `qml.IsingXX(1.57, wires=[0,1])`
    let pennyTwoMatch = trimmed.match(/qml\.(IsingXX|IsingZZ)\(\s*([^\s,]+)\s*,\s*wires\s*=\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]/i)
    if (pennyTwoMatch) {
      const name = pennyTwoMatch[1]
      const param = parseFloat(pennyTwoMatch[2])
      const q0 = parseInt(pennyTwoMatch[3], 10)
      const q1 = parseInt(pennyTwoMatch[4], 10)
      maxReferencedQubit = Math.max(maxReferencedQubit, q0, q1)

      const gateType: GateType = name === 'IsingXX' ? 'RXX' : 'RZZ'
      const theta = isNaN(param) ? Math.PI / 2 : param

      const moment = Math.max(qubitMoments[q0] || 0, qubitMoments[q1] || 0)
      qubitMoments[q0] = moment + 1
      qubitMoments[q1] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets: [q0, q1], moment, params: { theta } })
      lineToGateId[lineNum] = id
      gateIdToLine[id] = lineNum
      continue
    }

    pennyTwoMatch = trimmed.match(/qml\.(Toffoli|CCZ|CNOT|CZ|SWAP)\s*\(\s*wires\s*=\s*\[\s*([\d,\s]+)\s*\]/i)
    if (pennyTwoMatch) {
      const name = pennyTwoMatch[1]
      const nums = pennyTwoMatch[2].split(',').map((a) => parseInt(a.trim(), 10))
      const targets = nums.filter((n) => !isNaN(n))
      maxReferencedQubit = Math.max(...targets, maxReferencedQubit)

      let gateType: GateType
      switch (name) {
        case 'Toffoli': gateType = 'CCX'; break
        case 'CCZ': gateType = 'CCZ'; break
        case 'CZ': gateType = 'CZ'; break
        case 'SWAP': gateType = 'SWAP'; break
        default: gateType = 'CX'
      }

      const moment = targets.reduce((acc, t) => Math.max(acc, qubitMoments[t] || 0), 0)
      for (const t of targets) qubitMoments[t] = moment + 1

      const id = genGateId()
      ops.push({ id, gate: gateType, targets, moment })
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
