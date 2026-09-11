# Execute Quantum Circuit

**Endpoint:** `POST /api/quantum/execute`

## Description

Executes a quantum circuit on the specified backend. The execution endpoint consumes the Circuit IR directly.

## Input

| Field | Type | Description |
|-------|------|-------------|
| `backend` | string | Backend to execute on: `pennylane`, `qiskit`, or `cirq` |
| `shots` | integer | Number of measurements (1 to 100000) |
| `circuit` | object | The normalized Circuit IR |
| `output` | array (optional) | Which result fields to populate; defaults to `["counts", "probabilities", "statevector", "bloch_vectors"]` |

### Circuit IR Schema

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

### Supported Gates

**Single-qubit:** `I`, `X`, `Y`, `Z`, `H`, `S`, `Sdg`, `T`, `Tdg` (exactly 1 target)

**Rotations:** `RX(θ)`, `RY(θ)`, `RZ(θ)`, `P(θ)` (exactly 1 target, θ in radians)

**Two-qubit:** `CNOT`, `CX`, `CZ`, `SWAP` (exactly 2 distinct targets)

**Two-qubit rotations:** `RXX(θ)`, `RZZ(θ)` (exactly 2 distinct targets, θ in radians)

**Multi-qubit:** `CCX`, `CCZ` (exactly 3 distinct targets)

**Operations:** `measure`, `reset`, `barrier` (no target-count restrictions)

### Output Types

The `output` field selects which result fields are returned. It may be any
non-empty subset of:

| Value | Field populated | Notes |
|-------|-----------------|-------|
| `counts` | `counts` | Finite-shot measurement counts keyed by bitstring |
| `probabilities` | `probabilities` | Probabilities keyed by bitstring |
| `statevector` | `statevector` | Ideal (noise-free) final statevector |
| `bloch_vectors` | `bloch_vectors` | Per-qubit Bloch vectors derived from the statevector |

When omitted, the default is all four outputs; the response echoes the resolved
list in `output`.

## Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` on success |
| `backend` | string | Backend used for execution |
| `shots` | integer | Number of shots used |
| `num_qubits` | integer | Number of qubits |
| `output` | array | The resolved output list |
| `counts` | object | Measurement counts keyed by bitstring (or `null`) |
| `probabilities` | object | Normalized probabilities keyed by bitstring (or `null`) |
| `statevector` | array | List of `{"real": r, "imag": i}` amplitudes, q0-leftmost order (or `null`) |
| `bloch_vectors` | object | `{"q0": {"x", "y", "z"}, ...}` per qubit (or `null`) |
| `elapsed_time_ms` | number | Server-side circuit execution time in milliseconds (2 decimal places) |

### Output semantics

- **`statevector`** — one `{"real", "imag"}` pair per basis state in q0-leftmost order
  (index `i` ↔ bitstring `format(i, n)`); real/imag rounded to 8 decimal places.
- **`probabilities`** — for circuits *without* a mid-circuit reset these are ideal
  (theoretical) values derived from the statevector, so all basis states appear and the
  values sum exactly to 1. For circuits *with* a `reset` they are estimated from
  `counts` (`count / shots`).
- **`bloch_vectors`** — each vector is derived from the qubit's reduced density matrix
  (partial trace of the final statevector), so it correctly represents superpositions
  and entanglement; rounded to 6 decimal places.
- **`elapsed_time_ms`** — measures server-side simulation time with
  `time.perf_counter()` around only the backend circuit execution.

> Requesting `statevector` or `bloch_vectors` for a circuit containing a mid-circuit
> `reset` returns a `STATEVECTOR_NOT_AVAILABLE` error, because a reset circuit has no
> well-defined pure final state.

## Errors

All errors return HTTP 400 with the shape `{"success": false, "error": {"type", "message"}}`.

| Code | Description |
|------|-------------|
| `INVALID_BACKEND` | Unsupported backend value |
| `INVALID_SHOTS` | Shots out of range [1, 100000] |
| `INVALID_QUBIT` | Invalid `num_qubits` or out-of-range target |
| `INVALID_GATE` | Unsupported gate |
| `INVALID_GATE_TARGETS` | Wrong number / duplicate targets for a gate |
| `INVALID_GATE_PARAMS` | Missing / wrong number of parameters for a parameterized gate |
| `INVALID_OUTPUT` | Unknown or empty `output` value |
| `STATEVECTOR_NOT_AVAILABLE` | `statevector`/`bloch_vectors` requested for a circuit with a mid-circuit `reset` |
| `CIRCUIT_EXECUTION_ERROR` | Backend execution failure |
| `VALIDATION_ERROR` | Malformed request body |

## Example

### Request

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

### Response

```json
{
  "success": true,
  "backend": "qiskit",
  "shots": 1000,
  "num_qubits": 2,
  "output": ["counts", "probabilities", "statevector", "bloch_vectors"],
  "counts": {"00": 502, "11": 498},
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