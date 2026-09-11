/**
 * IR → OpenQASM 2.0 / 3.0 code generation.
 * Behavioral port of frontend/src/utils/openQasm.ts.
 */

const formatNumber = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(4))

function sortedOps(circuit) {
  return [...circuit.operations].sort((a, b) => {
    if (a.moment !== b.moment) return a.moment - b.moment
    return (a.targets[0] ?? 0) - (b.targets[0] ?? 0)
  })
}

function paramValue(op, key, fallback) {
  return op.params && typeof op.params[key] === 'number' ? op.params[key] : fallback
}

export function generateOpenQasm(circuit, version) {
  const dialect = version === 'openqasm3' ? 'qasm3' : 'qasm2'
  const numQubits = Math.max(1, circuit.num_qubits || 1)

  const lines = []
  const lineToGateId = {}
  const gateIdToLine = {}

  const addLine = (codeLine, gateId) => {
    lines.push(codeLine)
    const lineNum = lines.length
    if (gateId) {
      lineToGateId[lineNum] = gateId
      gateIdToLine[gateId] = lineNum
    }
  }

  const ops = sortedOps(circuit)
  const hasRzz = ops.some((o) => o.gate === 'RZZ')
  const hasRxx = ops.some((o) => o.gate === 'RXX')
  const hasCcz = ops.some((o) => o.gate === 'CCZ')

  if (dialect === 'qasm2') {
    addLine('OPENQASM 2.0;')
    addLine('include "qelib1.inc";')
  } else {
    addLine('OPENQASM 3.0;')
    addLine('include "stdgates.inc";')
  }
  addLine('')

  if (dialect === 'qasm2') {
    if (hasRzz) {
      addLine('gate rzz(theta) a, b {')
      addLine('  cx a, b;')
      addLine('  rz(theta) b;')
      addLine('  cx a, b;')
      addLine('}')
    }
    if (hasRxx) {
      addLine('gate rxx(theta) a, b {')
      addLine('  h a;')
      addLine('  h b;')
      addLine('  rzz(theta) a, b;')
      addLine('  h a;')
      addLine('  h b;')
      addLine('}')
    }
    if (hasCcz) {
      addLine('gate ccz a, b, c {')
      addLine('  h c;')
      addLine('  ccx a, b, c;')
      addLine('  h c;')
      addLine('}')
    }
  }

  if (dialect === 'qasm2') {
    addLine(`qreg q[${numQubits}];`)
    addLine(`creg c[${numQubits}];`)
  } else {
    addLine(`qubit[${numQubits}] q;`)
    addLine(`bit[${numQubits}] c;`)
  }
  addLine('')

  for (const op of ops) {
    const q0 = op.targets[0] ?? 0
    const q1 = op.targets[1] ?? q0 + 1
    const q2 = op.targets[2] ?? q1 + 1
    const theta = formatNumber(paramValue(op, 'theta', Math.PI / 2))
    const lambda = formatNumber(paramValue(op, 'lambda', Math.PI / 2))

    switch (op.gate) {
      case 'I': addLine(`id q[${q0}];`, op.id); break
      case 'X': addLine(`x q[${q0}];`, op.id); break
      case 'Y': addLine(`y q[${q0}];`, op.id); break
      case 'Z': addLine(`z q[${q0}];`, op.id); break
      case 'H': addLine(`h q[${q0}];`, op.id); break
      case 'S': addLine(`s q[${q0}];`, op.id); break
      case 'SDG': addLine(`sdg q[${q0}];`, op.id); break
      case 'T': addLine(`t q[${q0}];`, op.id); break
      case 'TDG': addLine(`tdg q[${q0}];`, op.id); break
      case 'SX':
        addLine(dialect === 'qasm2' ? `u2(-pi/2, pi/2) q[${q0}];` : `sx q[${q0}];`, op.id)
        break
      case 'RX': addLine(`rx(${theta}) q[${q0}];`, op.id); break
      case 'RY': addLine(`ry(${theta}) q[${q0}];`, op.id); break
      case 'RZ': addLine(`rz(${theta}) q[${q0}];`, op.id); break
      case 'P':
        addLine(dialect === 'qasm2' ? `u1(${lambda}) q[${q0}];` : `p(${lambda}) q[${q0}];`, op.id)
        break
      case 'CX': addLine(`cx q[${q0}], q[${q1}];`, op.id); break
      case 'CZ': addLine(`cz q[${q0}], q[${q1}];`, op.id); break
      case 'SWAP': addLine(`swap q[${q0}], q[${q1}];`, op.id); break
      case 'RXX': addLine(`rxx(${theta}) q[${q0}], q[${q1}];`, op.id); break
      case 'RZZ': addLine(`rzz(${theta}) q[${q0}], q[${q1}];`, op.id); break
      case 'CCX': addLine(`ccx q[${q0}], q[${q1}], q[${q2}];`, op.id); break
      case 'CCZ': addLine(`ccz q[${q0}], q[${q1}], q[${q2}];`, op.id); break
      case 'RESET': addLine(`reset q[${q0}];`, op.id); break
      case 'BARRIER': addLine(`barrier q[${q0}];`, op.id); break
      case 'M': addLine(`measure q[${q0}] -> c[${q0}];`, op.id); break
    }
  }

  return { code: lines.join('\n'), lineToGateId, gateIdToLine }
}