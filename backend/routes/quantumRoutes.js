/**
 * Quantum execution gateway.
 *
 *   POST /api/quantum/execute
 *
 * React → Node → Python Quantum Service.
 *
 * Node performs basic request validation and forwards the request (including
 * the Circuit IR) to the Python quantum service unchanged. The Python response
 * — counts, probabilities, statevector, bloch_vectors, elapsed_time_ms, and any
 * structured error — is returned verbatim so this layer never transforms or
 * recomputes quantum results.
 */

import { Router } from 'express'
import axios from 'axios'

const SUPPORTED_BACKENDS = new Set(['qiskit', 'pennylane', 'cirq'])
const SUPPORTED_OUTPUTS = new Set([
  'counts',
  'probabilities',
  'statevector',
  'bloch_vectors',
])

function httpError(res, status, type, message) {
  res.status(status).json({ success: false, error: { type, message } })
}

/**
 * Basic gateway validation. Python remains the authoritative Circuit IR
 * validator, so gate-by-gate semantics are intentionally NOT duplicated here.
 * Returns `{ value }` on success or `{ error: { type, message } }`.
 */
function validateExecuteRequest(body) {
  if (!body || typeof body !== 'object') {
    return {
      error: { type: 'INVALID_REQUEST', message: 'Request body must be a JSON object.' },
    }
  }

  const { backend, shots, circuit, output } = body

  if (!SUPPORTED_BACKENDS.has(backend)) {
    return {
      error: {
        type: 'INVALID_BACKEND',
        message: `Unsupported backend: ${backend}. Supported backends: qiskit, pennylane, cirq.`,
      },
    }
  }

  if (!Number.isInteger(shots) || shots < 1 || shots > 100000) {
    return {
      error: {
        type: 'INVALID_SHOTS',
        message: 'shots must be an integer between 1 and 100000.',
      },
    }
  }

  if (output !== undefined && (!Array.isArray(output) || output.length === 0)) {
    return {
      error: {
        type: 'INVALID_OUTPUT',
        message: 'output must be a non-empty array when provided.',
      },
    }
  }
  if (Array.isArray(output)) {
    for (const item of output) {
      if (!SUPPORTED_OUTPUTS.has(item)) {
        return {
          error: { type: 'INVALID_OUTPUT', message: `Invalid output type: ${item}.` },
        }
      }
    }
  }

  if (!circuit || typeof circuit !== 'object') {
    return {
      error: { type: 'INVALID_CIRCUIT', message: 'Field "circuit" must be an object.' },
    }
  }
  if (!Number.isInteger(circuit.num_qubits) || circuit.num_qubits < 1) {
    return {
      error: {
        type: 'INVALID_QUBIT',
        message: 'circuit.num_qubits must be a positive integer.',
      },
    }
  }
  if (!Array.isArray(circuit.operations)) {
    return {
      error: {
        type: 'INVALID_CIRCUIT',
        message: 'circuit.operations must be an array.',
      },
    }
  }

  return {
    value: {
      backend,
      shots,
      circuit,
      ...(output !== undefined ? { output } : {}),
    },
  }
}

/**
 * Creates a quantum execution gateway router.
 *
 * @param {object} options
 * @param {string} [options.quantumServiceUrl]  Python service base URL.
 * @param {number} [options.timeoutMs]          Upstream request timeout (ms).
 */
export function createQuantumRouter({
  quantumServiceUrl = process.env.QUANTUM_SERVICE_URL || 'http://localhost:8000',
  timeoutMs = Number(process.env.QUANTUM_SERVICE_TIMEOUT_MS || 60000),
} = {}) {
  const router = Router()
  const serviceUrl = quantumServiceUrl.replace(/\/$/, '')

  router.post('/quantum/execute', async (req, res) => {
    const checked = validateExecuteRequest(req.body)
    if (checked.error) {
      return httpError(res, 400, checked.error.type, checked.error.message)
    }

    try {
      const response = await axios.post(
        `${serviceUrl}/api/quantum/execute`,
        checked.value,
        {
          timeout: timeoutMs,
          // Preserve upstream status + body (including 400 validation failures).
          validateStatus: () => true,
        }
      )

      return res.status(response.status).json(response.data)
    } catch (error) {
      const unreachable =
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ECONNABORTED' ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ETIMEDOUT'

      if (unreachable) {
        console.error('[quantum gateway] services unreachable:', error?.code)
        return httpError(
          res,
          502,
          'SERVICE_UNAVAILABLE',
          'Quantum simulation service is unavailable. Please try again.'
        )
      }

      console.error('[quantum gateway] upstream failure:', error?.message)
      return httpError(
        res,
        502,
        'GATEWAY_ERROR',
        'Failed to reach the quantum simulation service.'
      )
    }
  })

  return router
}

export default createQuantumRouter()