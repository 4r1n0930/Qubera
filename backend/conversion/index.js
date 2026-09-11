/**
 * Conversion service facade — the single entry point for the /api/conversion/*
 * routes. Keeps parsers/generators/validators/normalizers decoupled from HTTP.
 *
 * Security: parsing is static line/token based; user code is never executed.
 * Validation and normalization never mutate their inputs.
 */

import { parsePythonCode } from './parsers/python.js'
import { parseOpenQasm } from './parsers/openqasm.js'
import { generatePythonCode } from './generators/python.js'
import { generateOpenQasm } from './generators/openqasm.js'
import { validateCircuit } from './validators.js'
import { normalizeCircuit } from './normalizers.js'
import { FRAMEWORKS, PYTHON_FRAMEWORKS, GATE_LIST } from './catalog.js'

export { FRAMEWORKS, PYTHON_FRAMEWORKS, GATE_LIST }

function makeError(type, message, extra = {}) {
  const error = new Error(message)
  error.type = type
  if (extra.line !== undefined) error.line = extra.line
  if (extra.column !== undefined) error.column = extra.column
  if (extra.status !== undefined) error.status = extra.status
  return error
}

export function ensureFramework(framework) {
  if (!FRAMEWORKS.includes(framework)) {
    throw makeError(
      'unsupported_framework',
      `Unsupported framework "${framework}". Supported: ${FRAMEWORKS.join(', ')}.`,
      { status: 400 }
    )
  }
}

/**
 * code → IR. Returns { circuit, lineToGateId, gateIdToLine }.
 * Throws structured errors (with type/line) on parse failures.
 */
export function parseCode({ code, framework, last_valid_circuit }) {
  ensureFramework(framework)
  if (typeof code !== 'string') {
    throw makeError('missing_code', 'Field "code" must be a string.', { status: 400 })
  }

  const parsed = PYTHON_FRAMEWORKS.includes(framework)
    ? parsePythonCode(code, framework, last_valid_circuit)
    : parseOpenQasm(code, framework, last_valid_circuit)

  if (parsed.error) {
    throw makeError('syntax_error', parsed.error, { line: parsed.errorLine, status: 400 })
  }

  return {
    circuit: parsed.circuit,
    lineToGateId: parsed.lineToGateId,
    gateIdToLine: parsed.gateIdToLine,
  }
}

/**
 * IR → code. Returns { code, lineToGateId, gateIdToLine }.
 */
export function generateCode({ circuit, framework, shots }) {
  ensureFramework(framework)
  if (!circuit || typeof circuit !== 'object') {
    throw makeError('invalid_circuit', 'Field "circuit" must be an object.', { status: 400 })
  }

  if (PYTHON_FRAMEWORKS.includes(framework)) {
    return generatePythonCode(circuit, framework, shots ?? 1000)
  }
  return generateOpenQasm(circuit, framework)
}

/** IR validation. Returns { valid, errors }. Never throws for bad circuits. */
export function validateIr({ circuit }) {
  if (!circuit || typeof circuit !== 'object') {
    return {
      valid: false,
      errors: [{ type: 'invalid_circuit', message: 'Circuit must be an object.' }],
    }
  }
  return validateCircuit(circuit)
}

/** IR normalization. Returns { circuit, validation }. */
export function normalizeIr({ circuit }) {
  return normalizeCircuit(circuit)
}