/**
 * Quantum execution gateway tests (Node built-in test runner).
 * Run with: node --test tests/quantumGateway.test.js
 *
 * Exercises the full React → Node → Python contract by mounting the gateway
 * router against an in-process stub of the Python quantum service. Covers
 * forwarding, response/error preservation, gateway validation, service
 * unavailability, and request timeouts.
 */

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import http from 'node:http'
import { createQuantumRouter } from '../routes/quantumRoutes.js'

const BELL_IR = {
  num_qubits: 2,
  operations: [
    { gate: 'H', targets: [0] },
    { gate: 'CNOT', targets: [0, 1] },
  ],
}

const FULL_OUTPUTS = ['counts', 'probabilities', 'statevector', 'bloch_vectors']

const BELL_RESPONSE = {
  success: true,
  backend: 'qiskit',
  shots: 1000,
  num_qubits: 2,
  output: FULL_OUTPUTS,
  counts: { '00': 502, '11': 498 },
  probabilities: { '00': 0.5, '01': 0.0, '10': 0.0, '11': 0.5 },
  statevector: [
    { real: 0.70710678, imag: 0.0 },
    { real: 0.0, imag: 0.0 },
    { real: 0.0, imag: 0.0 },
    { real: 0.70710678, imag: 0.0 },
  ],
  bloch_vectors: {
    q0: { x: 0.0, y: 0.0, z: 0.0 },
    q1: { x: 0.0, y: 0.0, z: 0.0 },
  },
  elapsed_time_ms: 12.34,
}

const VALID_REQUEST = {
  backend: 'qiskit',
  shots: 1000,
  output: FULL_OUTPUTS,
  circuit: BELL_IR,
}

/** In-process stub of the Python quantum service. */
let stub
let stubPort
let stubUrl

before(async () => {
  const stubApp = express()
  stubApp.use(express.json())
  stubApp.post('/api/quantum/execute', (req, res) => {
    const { backend, shots, circuit, output } = req.body ?? {}
    if (circuit?.operations?.some((op) => op.gate === 'EXPLODE')) {
      res.status(500).json({ success: false, error: { type: 'CIRCUIT_EXECUTION_ERROR', message: 'boom' } })
      return
    }
    if (circuit?.operations?.some((op) => op.gate === 'FOO')) {
      res.status(400).json({ success: false, error: { type: 'INVALID_GATE', message: 'Unsupported gate: FOO' } })
      return
    }
    res.json({
      ...BELL_RESPONSE,
      backend,
      shots,
      output: Array.isArray(output) ? output : FULL_OUTPUTS,
    })
  })

  stub = http.createServer(stubApp)
  await new Promise((resolve) => stub.listen(0, resolve))
  stubPort = stub.address().port
  stubUrl = `http://127.0.0.1:${stubPort}`
})

after(() => {
  stub?.close()
})

/** Mounts the gateway router against a given upstream and starts the app. */
function mountApp({ url = stubUrl, timeoutMs = 5000 } = {}) {
  const app = express()
  app.use(express.json())
  app.use('/api', createQuantumRouter({ quantumServiceUrl: url, timeoutMs }))
  return new Promise((resolve) => {
    const server = http.createServer(app)
    server.listen(0, () => resolve({ server, port: server.address().port }))
  })
}

async function post(appPort, path, body) {
  const res = await fetch(`http://127.0.0.1:${appPort}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json() }
}

test('forwards the Circuit IR and returns the Python response verbatim', async () => {
  const { server, port } = await mountApp()
  try {
    const { status, data } = await post(port, '/api/quantum/execute', VALID_REQUEST)
    assert.equal(status, 200)
    assert.deepEqual(data, BELL_RESPONSE)
  } finally {
    server.close()
  }
})

test('forwards the request body unchanged (IR not transformed)', async () => {
  let received = null
  const app = express()
  app.use(express.json())
  app.post('/api/quantum/execute', (req, res) => {
    received = req.body
    res.json({ success: true, received })
  })
  const stubBody = http.createServer(app)
  await new Promise((resolve) => stubBody.listen(0, resolve))
  const bodyUrl = `http://127.0.0.1:${stubBody.address().port}`

  const { server, port } = await mountApp({ url: bodyUrl })
  try {
    await post(port, '/api/quantum/execute', VALID_REQUEST)
    assert.deepEqual(received.circuit, BELL_IR)
    assert.deepEqual(received.output, FULL_OUTPUTS)
    assert.equal(received.backend, 'qiskit')
    assert.equal(received.shots, 1000)
  } finally {
    server.close()
    stubBody.close()
  }
})

test('preserves a Python 400 validation error (INVALID_GATE)', async () => {
  const { server, port } = await mountApp()
  try {
    const { status, data } = await post(port, '/api/quantum/execute', {
      ...VALID_REQUEST,
      circuit: {
        num_qubits: 1,
        operations: [{ gate: 'FOO', targets: [0] }],
      },
    })
    assert.equal(status, 400)
    assert.equal(data.success, false)
    assert.equal(data.error.type, 'INVALID_GATE')
    assert.equal(data.error.message, 'Unsupported gate: FOO')
  } finally {
    server.close()
  }
})

test('preserves a Python 500 execution error', async () => {
  const { server, port } = await mountApp()
  try {
    const { status, data } = await post(port, '/api/quantum/execute', {
      ...VALID_REQUEST,
      circuit: {
        num_qubits: 1,
        operations: [{ gate: 'EXPLODE', targets: [0] }],
      },
    })
    assert.equal(status, 500)
    assert.equal(data.success, false)
    assert.equal(data.error.type, 'CIRCUIT_EXECUTION_ERROR')
    assert.equal(data.error.message, 'boom')
  } finally {
    server.close()
  }
})

test('rejects an unsupported backend before forwarding', async () => {
  const { server, port } = await mountApp()
  try {
    const { status, data } = await post(port, '/api/quantum/execute', {
      ...VALID_REQUEST,
      backend: 'verilog',
    })
    assert.equal(status, 400)
    assert.equal(data.error.type, 'INVALID_BACKEND')
  } finally {
    server.close()
  }
})

test('rejects a non-integer or out-of-range shots', async () => {
  const { server, port } = await mountApp()
  try {
    for (const shots of [1.5, 0, -1, 100001]) {
      const { status, data } = await post(port, '/api/quantum/execute', {
        ...VALID_REQUEST,
        shots,
      })
      assert.equal(status, 400, `shots=${shots}`)
      assert.equal(data.error.type, 'INVALID_SHOTS')
    }
  } finally {
    server.close()
  }
})

test('rejects an invalid circuit shape before forwarding', async () => {
  const { server, port } = await mountApp()
  try {
    const missingQubits = await post(port, '/api/quantum/execute', {
      ...VALID_REQUEST,
      circuit: { operations: [] },
    })
    assert.equal(missingQubits.status, 400)
    assert.equal(missingQubits.data.error.type, 'INVALID_QUBIT')

    const badOperations = await post(port, '/api/quantum/execute', {
      ...VALID_REQUEST,
      circuit: { num_qubits: 2, operations: 'nope' },
    })
    assert.equal(badOperations.status, 400)
    assert.equal(badOperations.data.error.type, 'INVALID_CIRCUIT')
  } finally {
    server.close()
  }
})

test('rejects an empty or unknown output list', async () => {
  const { server, port } = await mountApp()
  try {
    const empty = await post(port, '/api/quantum/execute', {
      ...VALID_REQUEST,
      output: [],
    })
    assert.equal(empty.status, 400)
    assert.equal(empty.data.error.type, 'INVALID_OUTPUT')

    const unknown = await post(port, '/api/quantum/execute', {
      ...VALID_REQUEST,
      output: ['counts', 'teleport'],
    })
    assert.equal(unknown.status, 400)
    assert.equal(unknown.data.error.type, 'INVALID_OUTPUT')
  } finally {
    server.close()
  }
})

test('returns SERVICE_UNAVAILABLE when the Python service is unreachable', async () => {
  // Bind nothing → connection refused.
  const deadPort = 59999
  const { server, port } = await mountApp({ url: `http://127.0.0.1:${deadPort}` })
  try {
    const { status, data } = await post(port, '/api/quantum/execute', VALID_REQUEST)
    assert.equal(status, 502)
    assert.equal(data.error.type, 'SERVICE_UNAVAILABLE')
    assert.match(data.error.message, /unavailable/i)
  } finally {
    server.close()
  }
})

test('returns SERVICE_UNAVAILABLE on upstream request timeout', async () => {
  const slowApp = express()
  slowApp.post('/api/quantum/execute', async (_req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    res.json(BELL_RESPONSE)
  })
  const slowServer = http.createServer(slowApp)
  await new Promise((resolve) => slowServer.listen(0, resolve))
  const slowUrl = `http://127.0.0.1:${slowServer.address().port}`

  const { server, port } = await mountApp({ url: slowUrl, timeoutMs: 100 })
  try {
    const { status, data } = await post(port, '/api/quantum/execute', VALID_REQUEST)
    assert.equal(status, 502)
    assert.equal(data.error.type, 'SERVICE_UNAVAILABLE')
  } finally {
    server.close()
    slowServer.close()
  }
})

test('passes the Bell-state contract checks (probabilities, statevector, bloch)', async () => {
  const { server, port } = await mountApp()
  try {
    const { status, data } = await post(port, '/api/quantum/execute', VALID_REQUEST)
    assert.equal(status, 200)
    assert.deepEqual(data.probabilities, { '00': 0.5, '01': 0.0, '10': 0.0, '11': 0.5 })
    assert.ok(Math.abs(data.statevector[0].real - 0.70710678) < 1e-6)
    assert.ok(Math.abs(data.statevector[3].real - 0.70710678) < 1e-6)
    assert.deepEqual(data.bloch_vectors, {
      q0: { x: 0.0, y: 0.0, z: 0.0 },
      q1: { x: 0.0, y: 0.0, z: 0.0 },
    })
  } finally {
    server.close()
  }
})