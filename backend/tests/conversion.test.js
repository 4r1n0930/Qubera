/**
 * Conversion service tests (Node built-in test runner).
 * Run with: npm test  (in /backend) → `node --test tests/`
 *
 * Covers parsers, generators, validation, normalization, and the HTTP contract
 * of every /api/conversion/* endpoint without touching the database.
 */

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import conversionRoutes from '../routes/conversionRoutes.js'
import {
  parseCode,
  generateCode,
  validateIr,
  normalizeIr,
  FRAMEWORKS,
} from '../conversion/index.js'

const BELL = {
  num_qubits: 2,
  operations: [
    { id: 'a', gate: 'H', targets: [0], moment: 0 },
    { id: 'b', gate: 'CX', targets: [0, 1], moment: 1 },
    { id: 'c', gate: 'M', targets: [0], moment: 2 },
  ],
}

const PARAM = {
  num_qubits: 2,
  operations: [
    { id: 'a', gate: 'RX', targets: [0], moment: 0, params: { theta: Math.PI / 2 } },
    { id: 'b', gate: 'RZZ', targets: [0, 1], moment: 1, params: { theta: Math.PI / 2 } },
    { id: 'c', gate: 'CCX', targets: [0, 1, 2], moment: 2, params: undefined },
  ],
}

test('all five frameworks round-trip IR → code → IR', () => {
  for (const framework of FRAMEWORKS) {
    const circuit = { ...PARAM, num_qubits: 3 }
    const generated = generateCode({ circuit, framework })
    assert.match(generated.code, /./s)
    const parsed = parseCode({ code: generated.code, framework, last_valid_circuit: circuit })
    assert.equal(parsed.circuit.num_qubits, 3)
    const gates = parsed.circuit.operations.map((o) => o.gate)
    assert.ok(gates.includes('RX'), `${framework} should parse RX back`)
    assert.ok(gates.includes('RZZ'), `${framework} should parse RZZ back`)
    assert.ok(gates.includes('CCX'), `${framework} should parse CCX back`)
  }
})

test('qiskit bell state round-trips', () => {
  const generated = generateCode({ circuit: BELL, framework: 'qiskit' })
  const parsed = parseCode({ code: generated.code, framework: 'qiskit' })
  assert.deepEqual(parsed.circuit.operations.map((o) => o.gate), ['H', 'CX', 'M'])
  assert.equal(parsed.circuit.num_qubits, 2)
})

test('openqasm2 does not leak gate definitions into operation count', () => {
  const withAllQasmExtras = {
    num_qubits: 3,
    operations: [
      { id: 'a', gate: 'RX', targets: [0], moment: 0, params: { theta: Math.PI / 2 } },
      { id: 'b', gate: 'RZZ', targets: [0, 1], moment: 1, params: { theta: Math.PI / 2 } },
      { id: 'c', gate: 'RXX', targets: [1, 2], moment: 2, params: { theta: Math.PI / 2 } },
      { id: 'd', gate: 'CCX', targets: [0, 1, 2], moment: 3 },
      { id: 'e', gate: 'CCZ', targets: [0, 1, 2], moment: 4 },
    ],
  }
  const generated = generateCode({ circuit: withAllQasmExtras, framework: 'openqasm2' })
  assert.match(generated.code, /gate rzz\(theta\) a, b \{/)
  assert.match(generated.code, /gate rxx\(theta\) a, b \{/)
  assert.match(generated.code, /gate ccz a, b, c \{/)
  const parsed = parseCode({ code: generated.code, framework: 'openqasm2' })
  const gates = parsed.circuit.operations.map((o) => o.gate)
  assert.deepEqual(gates, ['RX', 'RZZ', 'RXX', 'CCX', 'CCZ'])
})

test('openqasm parser understands hand-written user code', () => {
  const userCode = [
    'OPENQASM 2.0;',
    'include "qelib1.inc";',
    'qreg q[3];',
    'creg c[3];',
    'h q[0];',
    'cx q[0], q[1];',
    'rx(pi/2) q[2];',
    'measure q[0] -> c[0];',
  ].join('\n')
  const parsed = parseCode({ code: userCode, framework: 'openqasm2' })
  assert.deepEqual(parsed.circuit.operations.map((o) => o.gate), ['H', 'CX', 'RX', 'M'])
  assert.equal(parsed.circuit.operations.find((o) => o.gate === 'RX').params.theta, Math.PI / 2)
})

test('validate matches the error contract', () => {
  const valid = validateIr({ circuit: BELL })
  assert.equal(valid.valid, true)
  assert.deepEqual(valid.errors, [])

  const invalid = validateIr({
    circuit: {
      num_qubits: 2,
      operations: [
        { gate: 'CX', targets: [0] },
        { gate: 'NOPE', targets: [0] },
        { gate: 'H', targets: [5] },
      ],
    },
  })
  assert.equal(invalid.valid, false)
  const types = invalid.errors.map((e) => e.type)
  assert.ok(types.includes('wrong_target_count'))
  assert.ok(types.includes('unknown_gate'))
  assert.ok(types.includes('target_out_of_range'))

  const none = validateIr({ circuit: null })
  assert.equal(none.valid, false)
})

test('normalize clamps qubit count, drops bad ops, and fills default params', () => {
  const result = normalizeIr({
    circuit: {
      num_qubits: 99,
      operations: [
        { id: 'keep', gate: 'RX', targets: [0], moment: 0 },
        { id: 'drop', gate: 'RX', targets: [50], moment: 1 },
        { id: 'nope', gate: 'BOGUS', targets: [0], moment: 0 },
        { id: 'fill', gate: 'RY', targets: [1], moment: 1 },
      ],
    },
  })
  assert.equal(result.circuit.num_qubits, 8)
  const gates = result.circuit.operations.map((o) => o.gate)
  assert.deepEqual(gates, ['RX', 'RY'])
  const ry = result.circuit.operations.find((o) => o.gate === 'RY')
  assert.equal(ry.params.theta, Math.PI / 2)
  assert.ok(result.validation.errors.some((e) => e.type === 'param_defaulted'))
})

test('ir-to-code returns valid source for every framework', () => {
  for (const framework of FRAMEWORKS) {
    const { code } = generateCode({ circuit: BELL, framework })
    assert.ok(code.length > 10, `${framework} should generate code`)
  }
})

// ---------------------------------------------------------------------------
// HTTP layer
// ---------------------------------------------------------------------------

let server
let base

before(async () => {
  const app = express()
  app.use(express.json())
  app.use('/api/conversion', conversionRoutes)
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  base = `http://127.0.0.1:${port}/api/conversion`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
})

test('POST /code-to-ir returns normalized IR', async () => {
  const res = await fetch(`${base}/code-to-ir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: generateCode({ circuit: BELL, framework: 'qiskit' }).code, framework: 'qiskit' }),
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.deepEqual(body.result.circuit.operations.map((o) => o.gate), ['H', 'CX', 'M'])
})

test('POST /code-to-ir returns 400 with structured syntax error', async () => {
  const res = await fetch(`${base}/code-to-ir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'qc.cx(0, ', framework: 'qiskit' }),
  })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.success, false)
  assert.equal(body.error.type, 'syntax_error')
  assert.equal(typeof body.error.line, 'number')
})

test('POST /code-to-ir rejects unknown frameworks', async () => {
  const res = await fetch(`${base}/code-to-ir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'h q[0];', framework: 'qiskit3' }),
  })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.error.type, 'unsupported_framework')
})

test('POST /ir-to-code emits code', async () => {
  const res = await fetch(`${base}/ir-to-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ circuit: BELL, framework: 'openqasm3' }),
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.match(body.result.code, /OPENQASM 3\.0/)
})

test('POST /validate reports validity', async () => {
  const good = await fetch(`${base}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ circuit: BELL }),
  }).then((r) => r.json())
  assert.equal(good.result.valid, true)

  const bad = await fetch(`${base}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ circuit: { num_qubits: 1, operations: [{ gate: 'CX', targets: [0] }] } }),
  }).then((r) => r.json())
  assert.equal(bad.result.valid, false)
})

test('POST /normalize returns a canonical IR', async () => {
  const res = await fetch(`${base}/normalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ circuit: { num_qubits: 0, operations: [{ gate: 'RX', targets: [0], moment: 0 }] } }),
  })
  const body = await res.json()
  assert.equal(body.result.circuit.num_qubits, 1)
  assert.equal(body.result.circuit.operations[0].params.theta, Math.PI / 2)
})

test('GET /frameworks and GET /gates', async () => {
  const fw = await fetch(`${base}/frameworks`).then((r) => r.json())
  assert.deepEqual(fw.result.frameworks, FRAMEWORKS)

  const gates = await fetch(`${base}/gates`).then((r) => r.json())
  assert.ok(gates.result.gates.length >= 20)
  assert.ok(gates.result.gates.some((g) => g.type === 'CX'))
  const rx = gates.result.gates.find((g) => g.type === 'RX')
  assert.deepEqual(rx.params, [{ name: 'theta', default: Math.PI / 2 }])
})