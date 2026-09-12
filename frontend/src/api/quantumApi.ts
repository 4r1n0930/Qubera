/**
 * Quantum execution API client.
 *
 *   React → Node.js gateway → Python quantum service
 *
 * The browser talks only to the Node API gateway. This client never calls the
 * Python service directly and never falls back to local simulation: every run
 * returns either the authoritative Python response or a structured error.
 *
 * Error contract (mirrors the backend gateway):
 *   { success: false, error: { type, message } }
 */

export type QuantumBackend = 'qiskit' | 'pennylane' | 'cirq'

export type QuantumOutput =
  | 'counts'
  | 'probabilities'
  | 'statevector'
  | 'bloch_vectors'

/** Canonical Circuit IR shared by React, Node and Python. */
export interface CircuitOperation {
  gate: string
  targets: number[]
  params?: number[]
}

export interface CircuitIR {
  num_qubits: number
  operations: CircuitOperation[]
}

export interface ExecuteQuantumRequest {
  backend: QuantumBackend
  shots: number
  circuit: CircuitIR
  output?: QuantumOutput[]
}

/** Complex amplitude (`real + imag·i`) of a statevector component. */
export interface ComplexAmplitude {
  real: number
  imag: number
}

/** Bloch vector of a single qubit on the unit sphere. */
export interface BlochVector {
  x: number
  y: number
  z: number
}

export interface QuantumExecutionResponse {
  success: boolean
  backend: QuantumBackend
  shots: number
  num_qubits: number
  output: QuantumOutput[]
  counts?: Record<string, number>
  probabilities?: Record<string, number>
  statevector?: ComplexAmplitude[]
  bloch_vectors?: Record<string, BlochVector>
  elapsed_time_ms?: number
  elapsed?: number
}

/** Structured execution failure. `type` uses the gateway/Python error codes. */
export class QuantumExecutionError extends Error {
  readonly type: string
  readonly status?: number

  constructor(type: string, message: string, status?: number) {
    super(message)
    this.name = 'QuantumExecutionError'
    this.type = type
    this.status = status
  }
}

/** Outputs requested for every lab run (all four visualization data sets). */
export const DEFAULT_QUANTUM_OUTPUTS: QuantumOutput[] = [
  'counts',
  'probabilities',
  'statevector',
  'bloch_vectors',
]

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '')

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

/**
 * Executes a circuit through the Node gateway. Resolves with the Python
 * service response untouched; rejects with a `QuantumExecutionError`.
 */
export async function executeQuantumCircuit(
  request: ExecuteQuantumRequest,
  signal?: AbortSignal
): Promise<QuantumExecutionResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/quantum/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch (err) {
    if (isAbortError(err)) throw err
    throw new QuantumExecutionError(
      'QUANTUM_SERVICE_UNAVAILABLE',
      'Quantum simulation service is unavailable. Make sure the API server is running, then try again.'
    )
  }

  let body: QuantumExecutionResponse & {
    error?: { type?: string; message?: string }
  }
  try {
    body = (await response.json()) as typeof body
  } catch {
    throw new QuantumExecutionError(
      'GATEWAY_ERROR',
      `The quantum service returned an unreadable response (HTTP ${response.status}).`,
      response.status
    )
  }

  if (!response.ok || body.success !== true) {
    const fallbackType =
      response.status === 502 ? 'QUANTUM_SERVICE_UNAVAILABLE' : 'GATEWAY_ERROR'
    throw new QuantumExecutionError(
      body.error?.type ?? fallbackType,
      body.error?.message ?? friendlyStatusMessage(response.status),
      response.status
    )
  }

  return body
}

function friendlyStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'The circuit was rejected by the quantum service.'
    case 502:
      return 'Quantum simulation service is unavailable. Please try again.'
    default:
      return `Quantum execution failed (HTTP ${status}).`
  }
}