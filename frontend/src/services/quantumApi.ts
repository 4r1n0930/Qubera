/**
 * Quantum API Client Service
 * Interacts with /api/quantum/execute and /api/quantum/parse endpoints.
 * Provides resilient fallbacks to the local simulation and parsing engine
 * to guarantee instantaneous and reliable client-side execution.
 */

import type { CircuitState, ExecutionResult, BackendType } from '../types/quantumLab'
import { simulateCircuit } from '../utils/quantumSimulator'
import { parsePythonCode, type ParseResult } from '../utils/codeSync'

export interface ExecutePayload {
  backend: BackendType
  shots: number
  circuit: CircuitState
}

export interface ParsePayload {
  code: string
  backend: BackendType
  lastValidCircuit?: CircuitState
}

/**
 * Executes a quantum circuit via API or local simulator.
 */
export async function executeCircuitApi(payload: ExecutePayload): Promise<ExecutionResult> {
  try {
    const response = await fetch('/api/quantum/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const data = await response.json()
      return data
    }
  } catch {
    // If backend endpoint is not active or running standalone, fallback to local simulator
  }

  // Realistic simulation fallback
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = simulateCircuit(payload.circuit, payload.backend, payload.shots)
      resolve(result)
    }, 120) // Smooth realistic simulated latency
  })
}

/**
 * Parses Python code into normalized Circuit JSON via API or local parser.
 */
export async function parseCodeApi(payload: ParsePayload): Promise<ParseResult> {
  try {
    const response = await fetch('/api/quantum/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: payload.code,
        backend: payload.backend,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data
    }
  } catch {
    // Standalone fallback
  }

  // Local parser fallback
  return parsePythonCode(payload.code, payload.backend, payload.lastValidCircuit)
}
