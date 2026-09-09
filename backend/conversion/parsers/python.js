/**
 * Static Python parser — Qiskit / Cirq / PennyLane → circuit IR.
 *
 * Ported from the frontend's parsePythonCode so the Node conversion service
 * and the offline fallback stay behaviorally identical. Parsing is purely
 * line-based/static; user code is NEVER executed.
 */

import { PYTHON_FRAMEWORKS } from '../catalog.js'

let idCounter = 1000

function genGateId() {
  return `gate_${Date.now()}_${++idCounter}`
}

export function parsePythonCode(code, framework, lastValidCircuit) {
  if (!PYTHON_FRAMEWORKS.includes(framework)) {
    throw new Error(`Unsupported Python framework "${framework}".`)
  }

  const lines = String(code ?? '').split(/\r?\n/)
  const lineToGateId = {}
  const gateIdToLine = {}
  const ops = []

  let detectedQubits = lastValidCircuit?.num_qubits ?? 2
  let maxReferencedQubit = 0
  const qubitMoments = new Array(8).fill(0)

  const pushOp = ({ gate, targets, params, lineNum }) => {
    const moment = targets.reduce((acc, t) => Math.max(acc, qubitMoments[t] || 0), 0)
    for (const t of targets) qubitMoments[t] = moment + 1

    const id = genGateId()
    const op = { id, gate, targets, moment }
    if (params) op.params = params
    ops.push(op)
    lineToGateId[lineNum] = id
    gateIdToLine[id] = lineNum
  }

  const pushSingle = ({ gate, target, params, lineNum }) => {
    maxReferencedQubit = Math.max(maxReferencedQubit, target)
    pushOp({ gate, targets: [target], params, lineNum })
  }

  const syntaxError = (lineNum, trimmed) => {
    return {
      circuit: lastValidCircuit || { num_qubits: detectedQubits, operations: ops },
      lineToGateId,
      gateIdToLine,
      error: `Syntax error on line ${lineNum}: Incomplete quantum operation "${trimmed}"`,
      errorLine: lineNum,
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()
    const lineNum = i + 1

    if (!trimmed || trimmed.startsWith('#')) continue

    const qiskitCircuitMatch = trimmed.match(/QuantumCircuit\s*\(\s*(\d+)/i)
    if (qiskitCircuitMatch) {
      const q = parseInt(qiskitCircuitMatch[1], 10)
      if (!isNaN(q) && q >= 1 && q <= 6) detectedQubits = q
      continue
    }

    const cirqRangeMatch = trimmed.match(/LineQubit\.range\s*\(\s*(\d+)/i)
    if (cirqRangeMatch) {
      const q = parseInt(cirqRangeMatch[1], 10)
      if (!isNaN(q) && q >= 1 && q <= 6) detectedQubits = q
      continue
    }

    const pennyLaneWiresMatch = trimmed.match(/wires\s*=\s*(\d+)/i)
    if (pennyLaneWiresMatch) {
      const q = parseInt(pennyLaneWiresMatch[1], 10)
      if (!isNaN(q) && q >= 1 && q <= 6) detectedQubits = q
    }

    // 0. Qiskit measure_all(): measure every declared qubit.
    const measureAllMatch = trimmed.match(/^qc\.measure_all\s*\(\s*\)/i)
    if (measureAllMatch) {
      for (let q = 0; q < Math.max(detectedQubits, 1); q++) {
        pushSingle({ gate: 'M', target: q, lineNum })
      }
      continue
    }

    // 1. Qiskit single-qubit gates: qc.h(0), qc.rx(theta, 0)
    const qiskitSingleMatch = trimmed.match(/^qc\.([a-zA-Z]+)\s*\(([^)]*)\)/i)
    if (qiskitSingleMatch) {
      const gateName = qiskitSingleMatch[1].toLowerCase()
      const args = qiskitSingleMatch[2].split(',').map((a) => a.trim())
      let target
      let param

      const extraArgGates = ['rx', 'ry', 'rz', 'p']
      if (extraArgGates.includes(gateName) && args.length >= 2) {
        const pv = parseFloat(args[0])
        target = parseInt(args[1], 10)
        if (!isNaN(pv)) param = pv
      } else {
        target = parseInt(args[0], 10)
      }

      if (!isNaN(target)) {
        let gateType = null
        let gateParams
        switch (gateName) {
          case 'id':
          case 'i': gateType = 'I'; break
          case 'x': gateType = 'X'; break
          case 'y': gateType = 'Y'; break
          case 'z': gateType = 'Z'; break
          case 'h': gateType = 'H'; break
          case 's': gateType = 'S'; break
          case 'sdg': gateType = 'SDG'; break
          case 't': gateType = 'T'; break
          case 'tdg': gateType = 'TDG'; break
          case 'sx': gateType = 'SX'; break
          case 'rx': gateType = 'RX'; gateParams = { theta: param ?? Math.PI / 2 }; break
          case 'ry': gateType = 'RY'; gateParams = { theta: param ?? Math.PI / 2 }; break
          case 'rz': gateType = 'RZ'; gateParams = { theta: param ?? Math.PI / 2 }; break
          case 'p': gateType = 'P'; gateParams = { lambda: param ?? Math.PI / 2 }; break
          case 'reset': gateType = 'RESET'; break
          case 'barrier': gateType = 'BARRIER'; break
          case 'measure': gateType = 'M'; break
        }

        if (gateType) {
          pushSingle({ gate: gateType, target, params: gateParams, lineNum })
          continue
        }
      }
    }

    // 2. Qiskit 2-qubit / multi-qubit gates: qc.cx(0, 1), qc.rxx(theta, 0, 1), qc.ccx(0,1,2)
    const qiskitTwoMatch = trimmed.match(/^qc\.(cx|cnot|cz|swap|rxx|rzz|ccx|ccz)\s*\(([^)]*)\)/i)
    if (qiskitTwoMatch) {
      const gateName = qiskitTwoMatch[1].toLowerCase()
      const args = qiskitTwoMatch[2].split(',').map((a) => a.trim())
      let targets
      let param

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
        let gateType = null
        let gateParams
        switch (gateName) {
          case 'cx':
          case 'cnot': gateType = 'CX'; break
          case 'cz': gateType = 'CZ'; break
          case 'swap': gateType = 'SWAP'; break
          case 'rxx': gateType = 'RXX'; gateParams = { theta: param ?? Math.PI / 2 }; break
          case 'rzz': gateType = 'RZZ'; gateParams = { theta: param ?? Math.PI / 2 }; break
          case 'ccx': gateType = 'CCX'; break
          case 'ccz': gateType = 'CCZ'; break
        }
        if (gateType) {
          maxReferencedQubit = Math.max(...targets, maxReferencedQubit)
          pushOp({ gate: gateType, targets, params: gateParams, lineNum })
          continue
        }
      }
    }

    // 3. Cirq single gates
    let cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(rx|ry|rz)\(\s*([^\s,)]+)\)\s*\(\s*q?(\d+)/i)
    if (cirqSingleMatch) {
      const gateName = cirqSingleMatch[1].toLowerCase()
      const param = parseFloat(cirqSingleMatch[2])
      const target = parseInt(cirqSingleMatch[3], 10)
      let gateType = 'RX'
      if (gateName === 'ry') gateType = 'RY'
      else if (gateName === 'rz') gateType = 'RZ'
      pushSingle({ gate: gateType, target, params: { theta: isNaN(param) ? Math.PI / 2 : param }, lineNum })
      continue
    }

    cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(reset)\s*\(\s*q?(\d+)/i)
    if (cirqSingleMatch) {
      const target = parseInt(cirqSingleMatch[2], 10)
      pushSingle({ gate: 'RESET', target, lineNum })
      continue
    }

    cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.measure\(\s*q?(\d+)/i)
    if (cirqSingleMatch) {
      const target = parseInt(cirqSingleMatch[1], 10)
      pushSingle({ gate: 'M', target, lineNum })
      continue
    }

    cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(H|X|Y|Z|S|T|I)(?!\w)(\(\s*q?(\d+)\))?(\s*\*\*\s*([^\s,)]+))?/i)
    if (cirqSingleMatch) {
      const gateName = cirqSingleMatch[1].toUpperCase()
      const target = parseInt(cirqSingleMatch[3] ?? '0', 10)
      const powerStr = cirqSingleMatch[5]
      let gateType = gateName
      if (powerStr) {
        const power = parseFloat(powerStr)
        if (gateName === 'S' && power === -1) gateType = 'SDG'
        else if (gateName === 'T' && power === -1) gateType = 'TDG'
        else if (gateName === 'X' && Math.abs(power - 0.5) < 1e-6) gateType = 'SX'
      }
      pushSingle({ gate: gateType, target, lineNum })
      continue
    }

    // 4. Cirq 2-qubit gates
    let cirqTwoMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(CNOT|CX|CZ|SWAP|CCX|CCZ)\s*\(([^)]*)\)/i)
    if (cirqTwoMatch) {
      const gateName = cirqTwoMatch[1].toUpperCase()
      const args = cirqTwoMatch[2].split(',').map((a) => a.trim().replace(/^q/i, ''))
      const targets = args.map((a) => parseInt(a, 10))
      const valid = targets.every((t) => !isNaN(t))
      if (valid) {
        let gateType
        switch (gateName) {
          case 'CCX': gateType = 'CCX'; break
          case 'CCZ': gateType = 'CCZ'; break
          case 'CZ': gateType = 'CZ'; break
          case 'SWAP': gateType = 'SWAP'; break
          default: gateType = 'CX'
        }
        maxReferencedQubit = Math.max(...targets, maxReferencedQubit)
        pushOp({ gate: gateType, targets, lineNum })
        continue
      }
    }

    cirqTwoMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.(XXPowGate|ZZPowGate)\(\s*exponent\s*=\s*([^\s,)]+)\)\s*\(\s*q?(\d+)\s*,\s*q?(\d+)/i)
    if (cirqTwoMatch) {
      const gateName = cirqTwoMatch[1]
      const exponent = parseFloat(cirqTwoMatch[2])
      const q0 = parseInt(cirqTwoMatch[3], 10)
      const q1 = parseInt(cirqTwoMatch[4], 10)
      const gateType = gateName === 'XXPowGate' ? 'RXX' : 'RZZ'
      const theta = isNaN(exponent) ? Math.PI / 2 : exponent * Math.PI
      maxReferencedQubit = Math.max(maxReferencedQubit, q0, q1)
      pushOp({ gate: gateType, targets: [q0, q1], params: { theta }, lineNum })
      continue
    }

    cirqSingleMatch = trimmed.match(/circuit\.append\s*\(\s*cirq\.ZPowGate\(\s*exponent\s*=\s*([^\s,)]+)\)\s*\(\s*q?(\d+)/i)
    if (cirqSingleMatch) {
      const exponent = parseFloat(cirqSingleMatch[1])
      const target = parseInt(cirqSingleMatch[2], 10)
      const lambda = isNaN(exponent) ? Math.PI / 2 : exponent * Math.PI
      pushSingle({ gate: 'P', target, params: { lambda }, lineNum })
      continue
    }

    // 5. PennyLane single gates
    let pennySingleMatch = trimmed.match(/qml\.(RX|RY|RZ)\(\s*([^\s,]+)\s*,\s*wires\s*=\s*(\d+)/i)
    if (pennySingleMatch) {
      const name = pennySingleMatch[1].toUpperCase()
      const param = parseFloat(pennySingleMatch[2])
      const target = parseInt(pennySingleMatch[3], 10)
      const gateType = name === 'RY' ? 'RY' : name === 'RZ' ? 'RZ' : 'RX'
      pushSingle({ gate: gateType, target, params: { theta: isNaN(param) ? Math.PI / 2 : param }, lineNum })
      continue
    }

    pennySingleMatch = trimmed.match(/qml\.(PhaseShift)\(\s*([^\s,]+)\s*,\s*wires\s*=\s*(\d+)/i)
    if (pennySingleMatch) {
      const param = parseFloat(pennySingleMatch[2])
      const target = parseInt(pennySingleMatch[3], 10)
      pushSingle({ gate: 'P', target, params: { lambda: isNaN(param) ? Math.PI / 2 : param }, lineNum })
      continue
    }

    pennySingleMatch = trimmed.match(/qml\.(Reset)\(\s*wires\s*=\s*(\d+)/i)
    if (pennySingleMatch) {
      const target = parseInt(pennySingleMatch[2], 10)
      pushSingle({ gate: 'RESET', target, lineNum })
      continue
    }

    pennySingleMatch = trimmed.match(/qml\.(SX|Hadamard|PauliX|PauliY|PauliZ|S|T|Identity)\s*\(\s*wires\s*=\s*(\d+)/i)
    if (pennySingleMatch) {
      const name = pennySingleMatch[1]
      const invMatch = trimmed.match(/\.inv\s*\(\s*\)/i)
      const target = parseInt(pennySingleMatch[2], 10)
      let gateType
      switch (name) {
        case 'PauliX': gateType = 'X'; break
        case 'PauliY': gateType = 'Y'; break
        case 'PauliZ': gateType = 'Z'; break
        case 'S': gateType = invMatch ? 'SDG' : 'S'; break
        case 'T': gateType = invMatch ? 'TDG' : 'T'; break
        case 'SX': gateType = 'SX'; break
        case 'Identity': gateType = 'I'; break
        default: gateType = 'H'
      }
      pushSingle({ gate: gateType, target, lineNum })
      continue
    }

    // 6. PennyLane controlled gates
    let pennyTwoMatch = trimmed.match(/qml\.(IsingXX|IsingZZ)\(\s*([^\s,]+)\s*,\s*wires\s*=\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]/i)
    if (pennyTwoMatch) {
      const name = pennyTwoMatch[1]
      const param = parseFloat(pennyTwoMatch[2])
      const q0 = parseInt(pennyTwoMatch[3], 10)
      const q1 = parseInt(pennyTwoMatch[4], 10)
      const gateType = name === 'IsingXX' ? 'RXX' : 'RZZ'
      const theta = isNaN(param) ? Math.PI / 2 : param
      maxReferencedQubit = Math.max(maxReferencedQubit, q0, q1)
      pushOp({ gate: gateType, targets: [q0, q1], params: { theta }, lineNum })
      continue
    }

    pennyTwoMatch = trimmed.match(/qml\.(Toffoli|CCZ|CNOT|CZ|SWAP)\s*\(\s*wires\s*=\s*\[\s*([\d,\s]+)\s*\]/i)
    if (pennyTwoMatch) {
      const name = pennyTwoMatch[1]
      const nums = pennyTwoMatch[2].split(',').map((a) => parseInt(a.trim(), 10))
      const targets = nums.filter((n) => !isNaN(n))
      let gateType
      switch (name) {
        case 'Toffoli': gateType = 'CCX'; break
        case 'CCZ': gateType = 'CCZ'; break
        case 'CZ': gateType = 'CZ'; break
        case 'SWAP': gateType = 'SWAP'; break
        default: gateType = 'CX'
      }
      maxReferencedQubit = Math.max(...targets, maxReferencedQubit)
      pushOp({ gate: gateType, targets, lineNum })
      continue
    }

    // 7. Incomplete / invalid quantum statements
    if (trimmed.startsWith('qc.') || trimmed.startsWith('circuit.append') || trimmed.startsWith('qml.')) {
      return syntaxError(lineNum, trimmed)
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