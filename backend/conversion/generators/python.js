/**
 * IR → Python code generation (Qiskit, Cirq, PennyLane).
 * Behavioral port of frontend/src/utils/codeSync.ts `generatePythonCode`
 * so `/api/conversion/ir-to-code` matches what the editor generates locally.
 */

const formatNumber = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(4))

function sortedOps(circuit) {
  return [...circuit.operations].sort((a, b) => {
    if (a.moment !== b.moment) return a.moment - b.moment
    return (a.targets[0] ?? 0) - (b.targets[0] ?? 0)
  })
}

function gateArgs(op) {
  const q0 = op.targets[0] ?? 0
  const q1 = op.targets[1] ?? q0 + 1
  const q2 = op.targets[2] ?? q1 + 1
  const theta =
    op.params && typeof op.params.theta === 'number' ? op.params.theta : Math.PI / 2
  const lambda =
    op.params && typeof op.params.lambda === 'number' ? op.params.lambda : Math.PI / 2
  return { q0, q1, q2, theta: formatNumber(theta), lambda: formatNumber(lambda) }
}

export function generatePythonCode(circuit, backend, shots = 1000) {
  const numQubits = Math.max(1, circuit.num_qubits || 2)
  const sorted = sortedOps(circuit)

  const lines = []
  const lineToGateId = {}
  const gateIdToLine = {}

  const addLine = (codeLine, gateId) => {
    if (codeLine === null || codeLine === undefined) return
    lines.push(codeLine)
    const lineNum = lines.length
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

    for (const op of sorted) {
      const { q0, q1, q2, theta, lambda } = gateArgs(op)
      switch (op.gate) {
        case 'I': addLine(`qc.id(${q0})`, op.id); break
        case 'X': addLine(`qc.x(${q0})`, op.id); break
        case 'Y': addLine(`qc.y(${q0})`, op.id); break
        case 'Z': addLine(`qc.z(${q0})`, op.id); break
        case 'H': addLine(`qc.h(${q0})`, op.id); break
        case 'S': addLine(`qc.s(${q0})`, op.id); break
        case 'SDG': addLine(`qc.sdg(${q0})`, op.id); break
        case 'T': addLine(`qc.t(${q0})`, op.id); break
        case 'TDG': addLine(`qc.tdg(${q0})`, op.id); break
        case 'SX': addLine(`qc.sx(${q0})`, op.id); break
        case 'RX': addLine(`qc.rx(${theta}, ${q0})`, op.id); break
        case 'RY': addLine(`qc.ry(${theta}, ${q0})`, op.id); break
        case 'RZ': addLine(`qc.rz(${theta}, ${q0})`, op.id); break
        case 'P': addLine(`qc.p(${lambda}, ${q0})`, op.id); break
        case 'CX': addLine(`qc.cx(${q0}, ${q1})`, op.id); break
        case 'CZ': addLine(`qc.cz(${q0}, ${q1})`, op.id); break
        case 'SWAP': addLine(`qc.swap(${q0}, ${q1})`, op.id); break
        case 'RXX': addLine(`qc.rxx(${theta}, ${q0}, ${q1})`, op.id); break
        case 'RZZ': addLine(`qc.rzz(${theta}, ${q0}, ${q1})`, op.id); break
        case 'CCX': addLine(`qc.ccx(${q0}, ${q1}, ${q2})`, op.id); break
        case 'CCZ': addLine(`qc.ccz(${q0}, ${q1}, ${q2})`, op.id); break
        case 'RESET': addLine(`qc.reset(${q0})`, op.id); break
        case 'BARRIER': addLine(`qc.barrier(${q0})`, op.id); break
        case 'M':
          hasExplicitMeasure = true
          addLine(`qc.measure(${q0}, ${q0})`, op.id)
          break
      }
    }

    if (!hasExplicitMeasure && sorted.length > 0) {
      addLine('')
      addLine('qc.measure_all()')
    }

    return { code: lines.join('\n'), lineToGateId, gateIdToLine }
  }

  if (backend === 'cirq') {
    addLine('import cirq')
    addLine('')
    const qubitNames = Array.from({ length: numQubits }, (_, i) => `q${i}`)
    addLine(`${qubitNames.join(', ')} = cirq.LineQubit.range(${numQubits})`)
    addLine('circuit = cirq.Circuit()')
    addLine('')
    for (const op of sorted) {
      addLine(cirqLine(op), op.id)
    }
    return { code: lines.join('\n'), lineToGateId, gateIdToLine }
  }

  // pennylane
  addLine('import pennylane as qml')
  addLine('')
  addLine(`dev = qml.device("default.qubit", wires=${numQubits}, shots=${shots})`)
  addLine('')
  addLine('@qml.qnode(dev)')
  addLine('def circuit():')
  if (sorted.length === 0) {
    addLine('    qml.Identity(wires=0)')
  } else {
    for (const op of sorted) {
      addLine(pennylaneLine(op), op.id)
    }
  }
  addLine('    return qml.sample()')
  return { code: lines.join('\n'), lineToGateId, gateIdToLine }
}

function cirqLine(op) {
  const { q0, q1, q2, theta, lambda } = gateArgs(op)
  switch (op.gate) {
    case 'I': return `circuit.append(cirq.I(q${q0}))`
    case 'X': return `circuit.append(cirq.X(q${q0}))`
    case 'Y': return `circuit.append(cirq.Y(q${q0}))`
    case 'Z': return `circuit.append(cirq.Z(q${q0}))`
    case 'H': return `circuit.append(cirq.H(q${q0}))`
    case 'S': return `circuit.append(cirq.S(q${q0}))`
    case 'SDG': return `circuit.append(cirq.S(q${q0})**-1)`
    case 'T': return `circuit.append(cirq.T(q${q0}))`
    case 'TDG': return `circuit.append(cirq.T(q${q0})**-1)`
    case 'SX': return `circuit.append(cirq.X(q${q0})**0.5)`
    case 'RX': return `circuit.append(cirq.rx(${theta})(q${q0}))`
    case 'RY': return `circuit.append(cirq.ry(${theta})(q${q0}))`
    case 'RZ': return `circuit.append(cirq.rz(${theta})(q${q0}))`
    case 'P': return `circuit.append(cirq.ZPowGate(exponent=${formatNumber(parseFloat(lambda) / Math.PI)})(q${q0}))`
    case 'CX': return `circuit.append(cirq.CNOT(q${q0}, q${q1}))`
    case 'CZ': return `circuit.append(cirq.CZ(q${q0}, q${q1}))`
    case 'SWAP': return `circuit.append(cirq.SWAP(q${q0}, q${q1}))`
    case 'RXX': return `circuit.append(cirq.XXPowGate(exponent=${formatNumber(parseFloat(theta) / Math.PI)})(q${q0}, q${q1}))`
    case 'RZZ': return `circuit.append(cirq.ZZPowGate(exponent=${formatNumber(parseFloat(theta) / Math.PI)})(q${q0}, q${q1}))`
    case 'CCX': return `circuit.append(cirq.CCX(q${q0}, q${q1}, q${q2}))`
    case 'CCZ': return `circuit.append(cirq.CCZ(q${q0}, q${q1}, q${q2}))`
    case 'RESET': return `circuit.append(cirq.reset(q${q0}))`
    case 'BARRIER': return `# Barrier: circuit.append(cirq.Moment())`
    case 'M': return `circuit.append(cirq.measure(q${q0}, key='m${q0}'))`
  }
}

function pennylaneLine(op) {
  const { q0, q1, q2, theta, lambda } = gateArgs(op)
  switch (op.gate) {
    case 'I': return `    qml.Identity(wires=${q0})`
    case 'X': return `    qml.PauliX(wires=${q0})`
    case 'Y': return `    qml.PauliY(wires=${q0})`
    case 'Z': return `    qml.PauliZ(wires=${q0})`
    case 'H': return `    qml.Hadamard(wires=${q0})`
    case 'S': return `    qml.S(wires=${q0})`
    case 'SDG': return `    qml.S(wires=${q0}).inv()`
    case 'T': return `    qml.T(wires=${q0})`
    case 'TDG': return `    qml.T(wires=${q0}).inv()`
    case 'SX': return `    qml.SX(wires=${q0})`
    case 'RX': return `    qml.RX(${theta}, wires=${q0})`
    case 'RY': return `    qml.RY(${theta}, wires=${q0})`
    case 'RZ': return `    qml.RZ(${theta}, wires=${q0})`
    case 'P': return `    qml.PhaseShift(${lambda}, wires=${q0})`
    case 'CX': return `    qml.CNOT(wires=[${q0}, ${q1}])`
    case 'CZ': return `    qml.CZ(wires=[${q0}, ${q1}])`
    case 'SWAP': return `    qml.SWAP(wires=[${q0}, ${q1}])`
    case 'RXX': return `    qml.IsingXX(${theta}, wires=[${q0}, ${q1}])`
    case 'RZZ': return `    qml.IsingZZ(${theta}, wires=[${q0}, ${q1}])`
    case 'CCX': return `    qml.Toffoli(wires=[${q0}, ${q1}, ${q2}])`
    case 'CCZ': return `    qml.CCZ(wires=[${q0}, ${q1}, ${q2}])`
    case 'RESET': return `    qml.Reset(wires=${q0})`
    case 'BARRIER': return `    # Barrier`
    case 'M': return null
  }
}