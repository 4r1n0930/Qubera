/**
 * Static OpenQASM 2.0 / 3.0 parser → circuit IR.
 * Tokenizes statements; never executes anything. Parameter expressions are
 * evaluated with a constrained grammar (numbers, `pi`, + - * / parentheses).
 */

const GATE_MAP = {
  id: 'I',
  i: 'I',
  x: 'X',
  y: 'Y',
  z: 'Z',
  h: 'H',
  s: 'S',
  sdg: 'SDG',
  t: 'T',
  tdg: 'TDG',
  sx: 'SX',
  rx: { type: 'RX', param: 'theta' },
  ry: { type: 'RY', param: 'theta' },
  rz: { type: 'RZ', param: 'theta' },
  p: { type: 'P', param: 'lambda' },
  u1: { type: 'P', param: 'lambda' },
  cx: 'CX',
  cnot: 'CX',
  cz: 'CZ',
  swap: 'SWAP',
  rxx: { type: 'RXX', param: 'theta' },
  rzz: { type: 'RZZ', param: 'theta' },
  ccx: 'CCX',
  toffoli: 'CCX',
  ccz: 'CCZ',
  reset: 'RESET',
  barrier: 'BARRIER',
}

const MULTI_QUBIT = new Set(['CX', 'CZ', 'SWAP', 'CCX', 'CCZ'])

/** OpenQASM 2.0 decomposes SX = u2(-π/2, π/2); recover it here. */
function isSxU2(values) {
  if (values.length !== 2) return false
  return Math.abs(values[0] + Math.PI / 2) < 1e-6 && Math.abs(values[1] - Math.PI / 2) < 1e-6
}

/**
 * Safe expression evaluator: numbers, `pi`, + - * /, unary sign, parentheses.
 * Returns number | null.
 */
export function evaluateExpression(input) {
  const src = String(input ?? '').trim()
  if (!src) return null
  let pos = 0

  const isDigit = (ch) => ch >= '0' && ch <= '9'
  const skipSpace = () => {
    while (pos < src.length && src[pos] === ' ') pos++
  }

  const scanNumber = () => {
    const rest = src.slice(pos)
    const m = rest.match(/^(\d+(\.\d+)?|\.\d+)/)
    if (m) {
      pos += m[0].length
      return parseFloat(m[0])
    }
    return null
  }

  const parsePrimary = () => {
    skipSpace()
    const ch = src[pos]
    if (ch === '(') {
      pos++
      const v = parseExpr()
      skipSpace()
      if (src[pos] === ')') {
        pos++
        return v
      }
      throw new Error('expected )')
    }
    if (ch === '-' || ch === '+') {
      pos++
      const v = parsePrimary()
      return ch === '-' ? -v : v
    }
    const num = scanNumber()
    if (num !== null) return num
    if (src.startsWith('pi', pos)) {
      pos += 2
      return Math.PI
    }
    if (src[pos] === 'π') {
      pos += 1
      return Math.PI
    }
    throw new Error(`unexpected token at ${pos}`)
  }

  const parseTerm = () => {
    let value = parsePrimary()
    skipSpace()
    while (src[pos] === '*' || src[pos] === '/') {
      const op = src[pos]
      pos++
      const rhs = parsePrimary()
      value = op === '*' ? value * rhs : value / rhs
      skipSpace()
    }
    return value
  }

  const parseExpr = () => {
    let value = parseTerm()
    skipSpace()
    while (src[pos] === '+' || src[pos] === '-') {
      const op = src[pos]
      pos++
      const rhs = parseTerm()
      value = op === '+' ? value + rhs : value - rhs
      skipSpace()
    }
    return value
  }

  try {
    const value = parseExpr()
    skipSpace()
    if (pos !== src.length) return null
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    return value
  } catch {
    return null
  }
}

class StatementParser {
  constructor(version, lastValidCircuit) {
    this.version = version === 'openqasm3' ? 3 : 2
    this.lastValidCircuit = lastValidCircuit
    this.ops = []
    this.lineToGateId = {}
    this.gateIdToLine = {}
    this.qubitMoments = new Array(64).fill(0)
    this.quantumRegisters = [] // { name, size } in declaration order
    this.detectedQubits = 0
    this.error = null
    this.gateCounter = 1000
  }

  registerIndex(name, index) {
    let offset = 0
    for (const reg of this.quantumRegisters) {
      if (reg.name === name) return offset + index
      offset += reg.size
    }
    return index // unknown register → treat index literally
  }

  pushOp(gate, targets, params, lineNum) {
    const moment = targets.reduce((acc, t) => Math.max(acc, this.qubitMoments[t] || 0), 0)
    for (const t of targets) this.qubitMoments[t] = moment + 1

    const id = `gate_${Date.now()}_${++this.gateCounter}`
    const op = { id, gate, targets, moment }
    if (params && Object.keys(params).length > 0) op.params = params
    this.ops.push(op)
    this.lineToGateId[lineNum] = id
    this.gateIdToLine[id] = lineNum
  }

  fail(lineNum, message) {
    if (!this.error) this.error = { message, line: lineNum }
  }

  handleHeader(stmt, lineNum) {
    const m = stmt.match(/^OPENQASM\s+([0-9.]+)/i)
    if (!m) return false
    const headerVersion = Math.round(parseFloat(m[1]))
    if (this.version === 2 && m[1].startsWith('3')) {
      this.fail(lineNum, `OpenQASM 3.0 source cannot be parsed as OpenQASM 2.0 (line ${lineNum}).`)
    }
    return true
  }

  handleDeclarations(stmt, lineNum) {
    // qasm2: qreg q[N];  qasm3: qubit[N] q; or qubit q;
    let m = stmt.match(/^qreg\s+([A-Za-z_]\w*)\s*\[\s*(\d+)\s*\]/)
    if (m) {
      const size = parseInt(m[2], 10)
      this.quantumRegisters.push({ name: m[1], size })
      this.detectedQubits = Math.max(this.detectedQubits, size)
      return true
    }
    m = stmt.match(/^qubit\s*(?:\[\s*(\d+)\s*\])?\s+([A-Za-z_]\w*)/)
    if (m) {
      const size = m[1] ? parseInt(m[1], 10) : 1
      this.quantumRegisters.push({ name: m[2], size })
      this.detectedQubits = Math.max(this.detectedQubits, size)
      return true
    }
    if (stmt.match(/^creg\s+[A-Za-z_]\w*\s*\[\s*\d+\s*\]/)) return true // creg q[N];
    if (stmt.match(/^bit\s*(?:\[\s*\d+\s*\])?\s+[A-Za-z_]\w*/)) return true // bit[N] c;
    if (stmt.match(/^include\s+/i)) return true
    return false
  }

  extractTargets(text) {
    const targets = []
    const re = /\b([A-Za-z_]\w*)\s*\[\s*(\d+)\s*\]/g
    let match
    while ((match = re.exec(text)) !== null) {
      targets.push(this.registerIndex(match[1], parseInt(match[2], 10)))
    }
    return targets
  }

  handleMeasure(stmt, lineNum) {
    const m = stmt.match(/^measure\s+(.+?)\s*->\s*(.+)$/)
    if (!m) return false
    const quantum = this.extractTargets(m[1])
    const classical = this.extractTargets(m[2])
    if (quantum.length !== classical.length) {
      this.fail(lineNum, `measure statement has mismatched quantum/classical targets on line ${lineNum}.`)
      return true
    }
    for (let i = 0; i < quantum.length; i++) {
      this.pushOp('M', [quantum[i]], undefined, lineNum)
    }
    return true
  }

  handleGate(stmt, lineNum) {
    const m = stmt.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(([^)]*)\))?\s+(.+)$/)
    if (!m) return false
    const name = m[1].toLowerCase()
    const paramsText = m[2]
    const targetsText = m[3]

    if (name === 'measure') return false

    let values = []
    if (paramsText !== undefined && paramsText.trim() !== '') {
      values = paramsText.split(',').map((p) => evaluateExpression(p))
      if (values.some((v) => v === null)) {
        this.fail(lineNum, `Invalid parameter expression in "${stmt}" on line ${lineNum}.`)
        return true
      }
    }

    // u2(-π/2, π/2) is our OpenQASM 2.0 spelling of SX.
    if (name === 'u2') {
      if (isSxU2(values)) {
        const targets = this.extractTargets(targetsText)
        targets.forEach((t) => this.pushOp('SX', [t], undefined, lineNum))
        return true
      }
      this.fail(lineNum, `Unsupported u2 operation on line ${lineNum} (only u2(-pi/2, pi/2) is recognized).`)
      return true
    }
    if (name === 'u3') {
      this.fail(lineNum, `Unsupported u3 operation on line ${lineNum}.`)
      return true
    }

    const mapping = GATE_MAP[name]
    if (!mapping) {
      this.fail(lineNum, `Unknown gate "${name}" on line ${lineNum}.`)
      return true
    }

    const gate = typeof mapping === 'string' ? mapping : mapping.type
    const targets = this.extractTargets(targetsText)

    if (typeof mapping === 'string') {
      if (MULTI_QUBIT.has(gate)) {
        if (targets.length === 0) {
          this.fail(lineNum, `No qubit target for gate "${name}" on line ${lineNum}.`)
          return true
        }
        this.pushOp(gate, targets, undefined, lineNum)
      } else {
        targets.forEach((t) => this.pushOp(gate, [t], undefined, lineNum))
      }
    } else {
      if (values.length === 0) {
        this.fail(lineNum, `Gate "${name}" requires a parameter on line ${lineNum}.`)
        return true
      }
      const paramValue = values[0]
      if (gate === 'P' && name === 'p' && values.length === 2) {
        // OpenQASM 3 `p(theta, phi)` variant not generated by QUBERA — reject.
        this.fail(lineNum, `Unsupported p(gate) arity on line ${lineNum}.`)
        return true
      }
      const params = { [mapping.param]: paramValue }
      if (gate === 'BARRIER' || gate === 'RESET') {
        targets.forEach((t) => this.pushOp(gate, [t], undefined, lineNum))
      } else {
        if (targets.length === 0) {
          this.fail(lineNum, `No qubit target for gate "${name}" on line ${lineNum}.`)
          return true
        }
        this.pushOp(gate, targets, params, lineNum)
      }
    }
    return true
  }

  maxTarget() {
    let maxQ = -1
    for (const op of this.ops) {
      for (const t of op.targets) maxQ = Math.max(maxQ, t)
    }
    return maxQ
  }

  result() {
    const numQubits = Math.min(8, Math.max(this.detectedQubits, this.maxTarget() + 1, 1))
    if (this.error) {
      return {
        circuit: this.lastValidCircuit || { num_qubits: numQubits, operations: this.ops },
        lineToGateId: this.lineToGateId,
        gateIdToLine: this.gateIdToLine,
        error: this.error.message,
        errorLine: this.error.line,
      }
    }
    return {
      circuit: { num_qubits: numQubits, operations: this.ops },
      lineToGateId: this.lineToGateId,
      gateIdToLine: this.gateIdToLine,
    }
  }
}

export function parseOpenQasm(code, version, lastValidCircuit) {
  const parser = new StatementParser(version, lastValidCircuit)
  const rawLines = String(code ?? '').split(/\r?\n/)

  let buffer = ''
  let bufferStartLine = 0

  const stripComment = (line) => line.replace(/\/\/.*$/, '').trim()
  const braceDelta = (text) => {
    let open = 0
    for (const ch of text) {
      if (ch === '{') open += 1
      else if (ch === '}') open -= 1
    }
    return open
  }

  for (let i = 0; i < rawLines.length; i++) {
    const cleaned = stripComment(rawLines[i])
    if (!cleaned) continue
    if (buffer === '') bufferStartLine = i + 1
    buffer += (buffer ? ' ' : '') + cleaned

    // OpenQASM 2 custom `gate name(params) a, b { ... }` definitions are
    // declarations, not operations — consume the whole block once balanced.
    if (buffer.startsWith('gate ')) {
      if (buffer.endsWith('}') && braceDelta(buffer) === 0) buffer = ''
      continue
    }

    if (!buffer.endsWith(';')) continue

    const stmt = buffer.slice(0, -1).trim()
    buffer = ''
    if (!stmt) continue

    const lineNum = bufferStartLine

    if (parser.handleHeader(stmt, lineNum)) continue
    if (parser.handleDeclarations(stmt, lineNum)) continue
    if (parser.handleMeasure(stmt, lineNum)) continue
    if (parser.handleGate(stmt, lineNum)) continue

    parser.fail(lineNum, `Unrecognized statement on line ${lineNum}: "${stmt}".`)
  }

  if (buffer.trim() !== '') {
    const lineNum = bufferStartLine || rawLines.length
    parser.fail(lineNum, `Unterminated statement on line ${lineNum} (missing ";").`)
  }

  return parser.result()
}