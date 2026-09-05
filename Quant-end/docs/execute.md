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

## Output

| Field | Type | Description |
|-------|------|-------------|
| `backend` | string | Backend used for execution |
| `shots` | integer | Number of shots used |
| `num_qubits` | integer | Number of qubits |
| `counts` | object | Measurement counts keyed by bitstring |
| `probabilities` | object | Normalized probabilities (`count / shots`) keyed by bitstring |
| `elapsed_time_ms` | number | Server-side circuit execution time in milliseconds (2 decimal places) |

> Note: `elapsed_time_ms` measures server-side simulation time with `time.perf_counter()` around only the backend circuit execution.

## Errors

| Code | Description |
|------|-------------|
| `INVALID_BACKEND` | Unsupported backend value |
| `INVALID_SHOTS` | Shots out of range [1, 100000] |
| `INVALID_QUBIT` | Invalid `num_qubits` or out-of-range target |
| `INVALID_GATE` | Unsupported gate |
| `INVALID_GATE_TARGETS` | Wrong number / duplicate targets for a gate |
| `INVALID_GATE_PARAMS` | Missing / wrong number of parameters for a parameterized gate |
| `INVALID_CIRCUIT` | Malformed circuit |
| `CIRCUIT_EXECUTION_ERROR` | Backend execution failure |

## Example

### Request

```json
{
  "backend": "qiskit",
  "shots": 1000,
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
  "backend": "qiskit",
  "shots": 1000,
  "num_qubits": 2,
  "counts": {"00": 502, "11": 498},
  "probabilities": {"00": 0.502, "11": 0.498},
  "elapsed_time_ms": 12.34
}
```