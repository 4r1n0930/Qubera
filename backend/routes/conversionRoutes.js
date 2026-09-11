/**
 * HTTP layer for the conversion service.
 *
 * Endpoints
 *   POST /api/conversion/code-to-ir   { code, framework, last_valid_circuit? }
 *   POST /api/conversion/ir-to-code   { circuit, framework, shots? }
 *   POST /api/conversion/validate     { circuit }
 *   POST /api/conversion/normalize    { circuit }
 *   GET  /api/conversion/gates
 *   GET  /api/conversion/frameworks
 *
 * Response shapes
 *   success → { success: true, result }
 *   failure → { success: false, error: { type, message, line?, column? } }
 */

import { Router } from 'express'
import {
  parseCode,
  generateCode,
  validateIr,
  normalizeIr,
  FRAMEWORKS,
  GATE_LIST,
} from '../conversion/index.js'

const router = Router()

const ok = (result) => ({ success: true, result })

function toStructuredError(error) {
  if (error && typeof error === 'object' && error.type) {
    return {
      type: error.type,
      message: error.message ?? 'Conversion error',
      ...(error.line !== undefined ? { line: error.line } : {}),
      ...(error.column !== undefined ? { column: error.column } : {}),
    }
  }
  return {
    type: 'conversion_error',
    message: error?.message ?? 'Unknown conversion error',
  }
}

router.post('/code-to-ir', (req, res) => {
  const { code, framework, last_valid_circuit } = req.body ?? {}
  if (typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      error: toStructuredError({ type: 'missing_code', message: 'Field "code" is required.' }),
    })
  }
  if (!FRAMEWORKS.includes(framework)) {
    return res.status(400).json({
      success: false,
      error: toStructuredError({
        type: 'unsupported_framework',
        message: `Unsupported framework "${framework}". Supported: ${FRAMEWORKS.join(', ')}.`,
      }),
    })
  }
  try {
    const result = parseCode({ code, framework, last_valid_circuit })
    res.json(ok(result))
  } catch (error) {
    res.status(error.status ?? 400).json({ success: false, error: toStructuredError(error) })
  }
})

router.post('/ir-to-code', (req, res) => {
  const { circuit, framework, shots } = req.body ?? {}
  if (!FRAMEWORKS.includes(framework)) {
    return res.status(400).json({
      success: false,
      error: toStructuredError({
        type: 'unsupported_framework',
        message: `Unsupported framework "${framework}". Supported: ${FRAMEWORKS.join(', ')}.`,
      }),
    })
  }
  try {
    const result = generateCode({ circuit, framework, shots })
    res.json(ok(result))
  } catch (error) {
    res.status(error.status ?? 400).json({ success: false, error: toStructuredError(error) })
  }
})

router.post('/validate', (req, res) => {
  const { circuit } = req.body ?? {}
  res.json(ok(validateIr({ circuit })))
})

router.post('/normalize', (req, res) => {
  const { circuit } = req.body ?? {}
  res.json(ok(normalizeIr({ circuit })))
})

router.get('/gates', (_req, res) => {
  res.json(ok({ gates: GATE_LIST }))
})

router.get('/frameworks', (_req, res) => {
  res.json(ok({ frameworks: FRAMEWORKS }))
})

export default router