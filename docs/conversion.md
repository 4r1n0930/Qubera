# Hybrid Code Conversion Architecture (QUBERA)

QUBERA's quantum lab lets users edit a circuit as **IR** (the on-screen gate
palette / grid) or as **source code** (Python for Qiskit/PennyLane/Cirq, or
OpenQASM 2/3). The two views stay in sync through a *hybrid conversion
architecture*:

- **IR → code** is generated **locally in the browser** — zero latency, fully
  offline, deterministic output for all five frameworks.
- **code → IR** is parsed **server-side** by a new Node.js `/api/conversion/*`
  service, debounced (~300 ms) with `AbortController` cancellation.

The backend is authoritative for parsing so error reporting (line/column,
`type`, `message`) is consistent across frameworks, while code generation stays
on the client to avoid a network round-trip on every palette click.

## Frameworks

| Framework   | Backend value   | Language | Frontend generator        | Backend parser            |
|-------------|-----------------|----------|---------------------------|---------------------------|
| Qiskit      | `qiskit`        | Python   | `generateCircuitCode`     | `parsers/python.js`       |
| PennyLane   | `pennylane`     | Python   | `generateCircuitCode`     | `parsers/python.js`       |
| Cirq        | `cirq`          | Python   | `generateCircuitCode`     | `parsers/python.js`       |
| OpenQASM 2  | `openqasm2`     | QASM     | `openQasm.ts`             | `parsers/openqasm.js`     |
| OpenQASM 3  | `openqasm3`     | QASM     | `openQasm.ts`             | `parsers/openqasm.js`     |

`BackendType` (the old `'qiskit' | 'cirq' | 'pennylane' | 'openqasm'` enum)
remains in the frontend for simulator/sampling options; `BACKEND_TO_FRAMEWORK`
maps the legacy `openqasm` → `openqasm3`.

## API contract (`/api/conversion/*`)

| Endpoint            | Method | Purpose                                             |
|---------------------|--------|-----------------------------------------------------|
| `code-to-ir`        | POST   | Parse source → normalized `CircuitIR`               |
| `ir-to-code`        | POST   | Emit source for a framework (backend fallback only) |
| `validate`          | POST   | `{ valid, errors }` without modifying anything      |
| `normalize`         | POST   | Canonical IR: clamped ops, defaulted params, issues |
| `gates`             | GET    | Gate catalog                                        |
| `frameworks`        | GET    | Supported framework list                            |

### Successful response

```json
{ "success": true, "result": { "circuit": { "num_qubits": 2, "operations": [] } } }
```

### Error contract

```json
{ "success": false, "error": { "type": "syntax_error", "message": "...", "line": 9, "column": null } }
```

`type` is one of `syntax_error` | `validation_error` | `unsupported_framework` |
`internal_error`. The backend throws an `Error` annotated with `type`, `line`,
`column`, and `status`; the route maps `status ?? 400`.

## Code → IR (mentored, debounced, cancellable)

```
 User types in CodePanel
        │  onCodeChange()
        ▼
 handleCodeChange → scheduleCodeParse()        (useDebouncedCallback, 300 ms)
        │  resets AbortController (abort in-flight)
        ▼
 runCodeParse(): circuitSourceRef.current = 'code'
        │
        ├─ POST /api/conversion/code-to-ir { source, framework }
        │        │  (backend line/token parser, never executes user code)
        │        ▼
        │   200 { circuit, ... } ──► latestCircuit(ir)  ──► grid updates
        │
        ├─ 4xx structured parse error ──► show codeStatus='error' + banner
        │
        └─ network/5xx failure ──► fallback to local parsePythonCode()
```

- **Debounce** coalesces fast typing into a single request.
- **AbortController** drops stale in-flight responses; a `parseVersionRef`
  request-id guard ignores out-of-order arrivals.
- `useEffect` cleanup aborts the controller on unmount.

## IR → Code (local, synchronous, zero-latency)

```
 Place / move / delete / add-qubit / clear gate
        │  handler sets circuitSourceRef.current = 'circuit'
        ▼
 QuantumLab effect on [circuit, framework]
        │  if source === 'code'           → skip (user owns code text)
        │  if generated === programmaticCodeRef → skip (echo, no change)
        ▼
 generated = generateCircuitCode(circuit, framework)   (local)
        │  programmaticCodeRef.current = generated (echo-marker)
        ▼
 CodePanel.setState(code = generated)
```

Python frameworks reuse `generatePythonCode`; OpenQASM 2/3 use
`openQasm.ts`. Anything emitted by the generator is parseable back by the same
framework (production smoke-tested for all five).

## Loop prevention

The two directions must not fight. Three guards keep the system stable:

1. **`circuitSourceRef`** (`'circuit' | 'code' | 'system'`) records which view is
   the source of truth. Palette edits force `'circuit'`; edits to code force
   `'code'`.
2. **`programmaticCodeRef`** stores the exact text the generator last wrote into
   the editor. If the next generated text equals it, `CodePanel` is left alone
   (no-op), breaking the cycle.
3. **`parseVersionRef`** + **AbortController** ensure a slow or stale code→IR
   response cannot overwrite a newer circuit edit.

Framework switching always sets `circuitSourceRef.current = 'circuit'` and
force-regenerates, so switching language mid-edit re-syncs from IR.

## Security

The backend **never executes** user-supplied Python or QASM. `python.js` is a
line/token scanner; `openqasm.js` uses a tokenizer whose expression evaluator
accepts only numbers, `pi`, and `+ − × ÷` with unary/parenthesized grouping.
OpenQASM `gate ... { ... }` blocks are skipped, not expanded into `QuantumCircuit`
calls. This keeps arbitrary code from running in the service.

## Scalability rationale

- **Local codegen** removes a request for every palette interaction; only the
  debounced, user-visible parse travels over the network.
- **Single-parse coalescing** means many rapid keystrokes collapse to one
  request; `AbortController` prevents queued work on stale editors.
- **The backend is stateless** and horizontally scalable: conversion is a pure
  function of `{ source, framework }`, so instances can be added behind a load
  balancer without session affinity.

## Tests

Frontend (`vitest`): `frontend/src/utils/__tests__`
- `codeSync.test.ts` — framework emission, line↔gate mapping, fixed-point
  generate→parse→generate, RXX ≈ (H⊗H)·RZZ·(H⊗H) within `1e-9`, `measure_all`.
- `openQasm.test.ts`, `debounce.test.ts`.

Backend (`node --test`): `backend/tests/conversion.test.js`
- All five frameworks round-trip IR→code→IR; OQ2 gate-definition no-leak;
  hand-written OQ2; validation error types; normalization; HTTP layer
  (200/400, unsupported framework, frameworks/gates).
