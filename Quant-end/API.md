# Quantum Service API

Multi-backend quantum execution API. Backends/Frameworks: PennyLane, Qiskit, Cirq.

## Scope

This service **only** executes/simulates circuits. Code generation and code
parsing are **not** responsibilities of this service; they are handled by the
frontend/Node.js architecture (e.g. the frontend's own parsing in
`utils/codeSync.ts`). The `POST /api/quantum/generate` and
`POST /api/quantum/parse` endpoints have been removed and return `404`.

The **Circuit IR** (intermediate representation) is the single source of truth. It is
backend-independent and consumed directly by the execution backends:

```text
                        Circuit IR
                           │
                           ▼
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
        Qiskit Backend          PennyLane / Cirq
              │                         │
              ▼                         ▼
            Results                   Results
```

The canonical circuit representation:

```json
{
  "num_qubits": 2,
  "operations": [
    {"gate": "H", "targets": [0]},
    {"gate": "CNOT", "targets": [0, 1]}
  ]
}
```

Parameterized gates add a `params` array (angles in radians):

```json
{
  "num_qubits": 1,
  "operations": [
    {"gate": "RX", "targets": [0], "params": [3.141592653589793]}
  ]
}
```

## Bit Ordering Convention

All backends normalize their output to the same bit ordering:

- A bitstring `"101"` means `q0 = 1`, `q1 = 0`, `q2 = 1`
- `q0` is the leftmost (most significant) bit
- The statevector index `i` corresponds to the bitstring `format(i, n)` (q0-leftmost)
- Backend-specific orderings (e.g. Qiskit's reversed convention) are normalized before returning

---

## Execute Quantum Circuit

endpoint name: POST /api/quantum/execute  
inputs -> backend, shots, circuit, output (optional)  
output -> backend, shots, num_qubits, output, counts?, probabilities?, statevector?, bloch_vectors?, elapsed_time_ms

The execution endpoint consumes the Circuit IR directly. It does **not** generate
Python code or parse code back into IR.

### Input

- `backend` — `pennylane | qiskit | cirq`
- `shots` — number of measurements (1 to 100000)
- `circuit` — the normalized circuit IR
- `output` — optional list selecting which result fields to populate. Defaults to
  `["counts", "probabilities", "statevector", "bloch_vectors"]` when omitted.
  Supported values:
  - `counts` — finite-shot measurement counts
  - `probabilities` — normalized probabilities
  - `statevector` — the ideal (noise-free) final statevector
  - `bloch_vectors` — per-qubit Bloch vectors derived from the statevector
  - Any subset of the four may be requested; at least one is required when `output`
    is provided.

Supported gates:

- Single-qubit: `I`, `X`, `Y`, `Z`, `H`, `S`, `Sdg`, `T`, `Tdg` (exactly 1 target)
- Rotations: `RX`, `RY`, `RZ`, `P` (exactly 1 target, 1 angle in radians)
- Two-qubit: `CNOT`, `CX` (alias), `CZ`, `SWAP` (exactly 2 distinct targets)
- Two-qubit rotations: `RXX`, `RZZ` (exactly 2 distinct targets, 1 angle in radians)
- Multi-qubit: `CCX`, `CCZ` (exactly 3 distinct targets)
- Operations: `measure`, `reset`, `barrier` (no target-count restrictions; `reset`/`barrier` may take optional targets)

> **Mid-circuit `reset`:** `statevector` and `bloch_vectors` require an ideal (pure)
> final state, which is not well defined for circuits containing `reset` operations.
> Requesting them for such a circuit returns `STATEVECTOR_NOT_AVAILABLE`.
> `counts` and `probabilities` still work; for reset circuits `probabilities` is
> estimated from `counts` (`count / shots`) instead of the statevector.

### Output

- `success` — always `true` on a successful execution
- `backend` — backend used for execution
- `shots` — number of shots used
- `num_qubits` — number of qubits
- `output` — the resolved output list (the `output` sent, or the default)
- `counts` — measurement counts keyed by bitstring (only if `counts` requested, else `null`)
- `probabilities` — probabilities keyed by bitstring (only if `probabilities` requested, else `null`)
- `statevector` — list of `{"real": r, "imag": i}` complex amplitudes, one per basis state in q0-leftmost order; real/imag rounded to 8 decimal places (only if `statevector` requested, else `null`)
- `bloch_vectors` — object `{"q0": {"x": ..., "y": ..., "z": ...}, ...}`; each vector is derived from the qubit's reduced density matrix (partial trace) so it correctly reflects superpositions and entanglement; rounded to 6 decimal places (only if `bloch_vectors` requested, else `null`)
- `elapsed_time_ms` — server-side circuit execution/simulation time in milliseconds (2 decimal places)

> Note: probabilities are **ideal/theoretical** (derived from the statevector) whenever the
> circuit has no mid-circuit reset, so they include all basis states and sum exactly to 1.
> With a reset they fall back to the empirical `count / shots` estimate. `counts` are
> always the finite-shot measurements.

> Note: `elapsed_time_ms` measures server-side simulation time, not real hardware
> execution time or browser-observed latency. It is measured with `time.perf_counter()`
> around only the backend circuit execution on the server.

### Errors

All errors return HTTP 400 with the shape:

```json
{
  "success": false,
  "error": {"type": "CODE", "message": "human readable explanation"}
}
```

- `INVALID_BACKEND` — unsupported backend value
- `INVALID_SHOTS` — shots out of range [1, 100000]
- `INVALID_QUBIT` — invalid `num_qubits` or out-of-range target
- `INVALID_GATE` — unsupported gate
- `INVALID_GATE_TARGETS` — wrong number / duplicate targets for a gate
- `INVALID_GATE_PARAMS` — missing / wrong number of parameters for a parameterized gate
- `INVALID_OUTPUT` — unknown or empty `output` value
- `STATEVECTOR_NOT_AVAILABLE` — `statevector`/`bloch_vectors` requested for a circuit with mid-circuit `reset`
- `CIRCUIT_EXECUTION_ERROR` — backend execution failure
- `VALIDATION_ERROR` — malformed request body (missing/incorrectly typed fields)

### Example

Request:

```json
{
  "backend": "qiskit",
  "shots": 1000,
  "output": ["counts", "probabilities", "statevector", "bloch_vectors"],
  "circuit": {
    "num_qubits": 2,
    "operations": [
      {"gate": "H", "targets": [0]},
      {"gate": "CNOT", "targets": [0, 1]}
    ]
  }
}
```

Response (Bell state `(│00⟩ + │11⟩)/√2`; counts vary by seed):

```json
{
  "success": true,
  "backend": "qiskit",
  "shots": 1000,
  "num_qubits": 2,
  "output": ["counts", "probabilities", "statevector", "bloch_vectors"],
  "counts": {"00": 496, "11": 504},
  "probabilities": {"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5},
  "statevector": [
    {"real": 0.70710678, "imag": 0.0},
    {"real": 0.0, "imag": 0.0},
    {"real": 0.0, "imag": 0.0},
    {"real": 0.70710678, "imag": 0.0}
  ],
  "bloch_vectors": {
    "q0": {"x": 0.0, "y": 0.0, "z": 0.0},
    "q1": {"x": 0.0, "y": 0.0, "z": 0.0}
  },
  "elapsed_time_ms": 12.34
}
```

For an entangled Bell state both qubits are maximally mixed, so both Bloch vectors are
the origin `(0, 0, 0)`. A separable state such as `│0⟩` yields `(0, 0, 1)` and `│+⟩`
yields `(1, 0, 0)`.

---

## Health Check

endpoint name: GET /health  
inputs -> none  
output -> status