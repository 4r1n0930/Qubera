/**
 * Conversion API Client
 * Talks to the Node.js conversion service at /api/conversion/*.
 *
 * The frontend uses local IR → code generation for the interactive editing loop
 * and only calls this service for the harder direction (code → IR), 300ms
 * debounced, with AbortController cancellation for stale keystrokes.
 *
 * Error contract (both directions):
 *   { success: false, error: { type, message, line?, column? } }
 */

import type { CircuitState, CircuitIR, Framework, CodeError } from '../types/quantumLab'
import { parsePythonCode } from '../utils/codeSync'

export interface CodeToIrResult {
  circuit: CircuitState
  lineToGateId: Record<number, string>
  gateIdToLine: Record<string, number>
}

export interface NormalizeResult {
  circuit: CircuitIR
  validation: { errors: CodeError[] }
}

export class ConversionError extends Error {
  readonly type: string
  readonly line?: number
  readonly column?: number
  readonly status?: number

  constructor(fields: { type: string; message: string; line?: number; column?: number; status?: number }) {
    super(fields.message)
    this.name = 'ConversionError'
    this.type = fields.type
    this.line = fields.line
    this.column = fields.column
    this.status = fields.status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

function isPythonFramework(f: Framework): f is 'qiskit' | 'cirq' | 'pennylane' {
  return f === 'qiskit' || f === 'cirq' || f === 'pennylane'
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(path, {
    method: options?.method ?? 'GET',
    headers:
      options?.method === 'POST'
        ? { 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options?.signal,
  })

  if (!response.ok) {
    let structured: { error?: CodeError } | undefined
    try {
      structured = await response.json()
    } catch {
      // non-JSON error body
    }
    const err = structured?.error
    throw new ConversionError({
      type: err?.type ?? 'http_error',
      message: err?.message ?? `Request failed with status ${response.status}`,
      line: err?.line,
      column: err?.column,
      status: response.status,
    })
  }

  const data = (await response.json()) as { success: boolean; result?: T; error?: CodeError }
  if (data.success !== true || data.result === undefined) {
    throw new ConversionError({
      type: data.error?.type ?? 'server_error',
      message: data.error?.message ?? 'Unknown conversion error',
      line: data.error?.line,
      column: data.error?.column,
    })
  }
  return data.result
}

export interface CodeToIrPayload {
  code: string
  framework: Framework
  signal?: AbortSignal
  lastValidCircuit?: CircuitState
}

/**
 * Parses code into the normalized circuit IR via the Node conversion service.
 *
 * Resilience: if the service is unreachable (network failure or 5xx), parsing
 * falls back to the bundled local Python parser for Python frameworks so the
 * editing loop degrades gracefully offline. Genuine 4xx parse errors are
 * surfaced as-is — the backend is authoritative for semantic errors.
 */
export async function codeToIrApi(payload: CodeToIrPayload): Promise<CodeToIrResult> {
  try {
    return await request<CodeToIrResult>('/api/conversion/code-to-ir', {
      method: 'POST',
      body: {
        code: payload.code,
        framework: payload.framework,
        last_valid_circuit: payload.lastValidCircuit,
      },
      signal: payload.signal,
    })
  } catch (err) {
    if (payload.signal?.aborted || (err as Error)?.name === 'AbortError') throw err

    const conversionErr = err as ConversionError
    const unreachable =
      conversionErr instanceof ConversionError &&
      (conversionErr.status === undefined || conversionErr.status >= 500)

    if (unreachable) {
      if (isPythonFramework(payload.framework)) {
        const parsed = parsePythonCode(payload.code, payload.framework, payload.lastValidCircuit)
        if (parsed.error) {
          throw new ConversionError({
            type: 'syntax_error',
            message: parsed.error,
            line: parsed.errorLine,
          })
        }
        return {
          circuit: parsed.circuit,
          lineToGateId: parsed.lineToGateId,
          gateIdToLine: parsed.gateIdToLine,
        }
      }
      throw new ConversionError({
        type: 'service_unavailable',
        message: `Conversion service is unreachable for ${payload.framework}.`,
        status: conversionErr.status,
      })
    }
    throw err
  }
}

export interface IrToCodePayload {
  circuit: CircuitIR
  framework: Framework
  shots?: number
  signal?: AbortSignal
}

/**
 * Converts IR → code on the backend for external clients.
 * The QUBERA editor itself uses the local generators in codeSync.ts.
 */
export async function irToCodeApi(
  payload: IrToCodePayload
): Promise<{ code: string }> {
  return request<{ code: string }>('/api/conversion/ir-to-code', {
    method: 'POST',
    body: payload,
    signal: payload.signal,
  })
}

export async function validateCircuitApi(
  circuit: CircuitIR,
  signal?: AbortSignal
): Promise<{ valid: boolean; errors: CodeError[] }> {
  return request<{ valid: boolean; errors: CodeError[] }>('/api/conversion/validate', {
    method: 'POST',
    body: { circuit },
    signal,
  })
}

export async function normalizeCircuitApi(
  circuit: CircuitIR,
  signal?: AbortSignal
): Promise<NormalizeResult> {
  return request<NormalizeResult>('/api/conversion/normalize', {
    method: 'POST',
    body: { circuit },
    signal,
  })
}

export async function getFrameworksApi(
  signal?: AbortSignal
): Promise<{ frameworks: string[] }> {
  return request<{ frameworks: string[] }>('/api/conversion/frameworks', { signal })
}

export async function getGatesApi(
  signal?: AbortSignal
): Promise<{ gates: unknown[] }> {
  return request<{ gates: unknown[] }>('/api/conversion/gates', { signal })
}

/**
 * Legacy-compatible code → IR API used by services/quantumApi.ts.
 * Repointed from the retired FastAPI endpoint to the Node conversion service.
 */
export async function parseCodeViaConversionApi(payload: {
  code: string
  framework: Framework
  lastValidCircuit?: CircuitState
}): Promise<CodeToIrResult> {
  return codeToIrApi({
    code: payload.code,
    framework: payload.framework,
    lastValidCircuit: payload.lastValidCircuit,
  })
}