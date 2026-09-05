# Parse Python Quantum Circuit

**Endpoint:** `POST /api/quantum/parse`

## Description

Parses framework-specific Python quantum-circuit code into the normalized Circuit IR. Uses safe AST/static analysis only; submitted code is never executed.

## Input

| Field | Type | Description |
|-------|------|-------------|
| `language` | string | Must be `python` (only `python` is supported) |
| `framework` | string | Framework used: `qiskit` (default), `pennylane`, or `cirq` |
| `code` | string | Python source code for the selected framework |

### Supported Framework Code Examples

**Qiskit:**
```python
from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
```

**PennyLane:**
```python
import pennylane as qml
dev = qml.device("default.qubit", wires=2, shots=1000)
@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.counts()
```

**Cirq:**
```python
import cirq
qubits = [cirq.LineQubit(i) for i in range(2)]
circuit = cirq.Circuit()
circuit.append(cirq.H(qubits[0]))
circuit.append(cirq.CNOT(qubits[0], qubits[1]))
circuit.append(cirq.measure(*qubits, key="result"))
```

### Gate Mappings

| Normalized Gate | Qiskit | PennyLane | Cirq |
|-----------------|--------|-----------|------|
| `I` | `i` / `id` | `qml.Identity` | `cirq.I` |
| `X` | `x` | `qml.PauliX` | `cirq.X` |
| `Y` | `y` | `qml.PauliY` | `cirq.Y` |
| `Z` | `z` | `qml.PauliZ` | `cirq.Z` |
| `H` | `h` | `qml.Hadamard` | `cirq.H` |
| `S` | `s` | `qml.S` | `cirq.S` |
| `Sdg` | `sdg` | `qml.adjoint(qml.S)` | `cirq.S**-1` |
| `T` | `t` | `qml.T` | `cirq.T` |
| `Tdg` | `tdg` | `qml.adjoint(qml.T)` | `cirq.T**-1` |
| `RX(θ)` | `rx(θ, 0)` | `qml.RX(θ, wires=0)` | `cirq.rx(θ)(0)` |
| `RY(θ)` | `ry(θ, 0)` | `qml.RY(θ, wires=0)` | `cirq.ry(θ)(0)` |
| `RZ(θ)` | `rz(θ, 0)` | `qml.RZ(θ, wires=0)` | `cirq.rz(θ)(0)` |
| `P(θ)` | `p(θ, 0)` | `qml.PhaseShift(θ, wires=0)` | `cirq.Z**(θ/π)` |
| `CNOT` | `cx` | `qml.CNOT` | `cirq.CNOT` |
| `CX` | `cx` | `qml.CNOT` | `cirq.CNOT` |
| `CZ` | `cz` | `qml.CZ` | `cirq.CZ` |
| `SWAP` | `swap` | `qml.SWAP` | `cirq.SWAP` |
| `RXX(θ)` | `rxx(θ, 0, 1)` | `qml.IsingXX(θ, wires=[0, 1])` | `cirq.XXPowGate(exponent=θ/π)` |
| `RZZ(θ)` | `rzz(θ, 0, 1)` | `qml.IsingZZ(θ, wires=[0, 1])` | `cirq.ZZPowGate(exponent=θ/π)` |
| `CCX` | `ccx` | `qml.Toffoli` | `cirq.TOFFOLI` |
| `CCZ` | `ccz` | `qml.CCZ` | `cirq.CCZ` |
| `measure` | `qc.measure_all()` | `return qml.counts()` | `cirq.measure` |
| `reset` | `qc.reset(0)` | `qml.measure(0); qml.cond(m0, qml.X)(0)` | `cirq.reset` |
| `barrier` | `qc.barrier()` | — (no-op) | — (no-op) |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether parsing succeeded |
| `circuit` | object \| null | Normalized Circuit IR (or `null` on failure) |
| `errors` | array | Array of parsing/validation errors |

### Error Object Schema

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Error code |
| `message` | string | Human-readable error message |
| `line` | integer (optional) | Line number where error occurred |
| `column` | integer (optional) | Column number where error occurred |

## Errors

| Code | Description |
|------|-------------|
| `UNSUPPORTED_LANGUAGE` | Language is not `python` |
| `UNSUPPORTED_FRAMEWORK` | Framework is not `qiskit`, `pennylane`, or `cirq` |
| `PYTHON_SYNTAX_ERROR` | Invalid Python syntax or no circuit found for the framework |
| `INVALID_QUBIT` | Invalid num_qubits or out-of-range qubit index |
| `INVALID_GATE` | Unsupported gate for the framework |
| `INVALID_GATE_TARGETS` | Wrong number or duplicate targets |
| `INVALID_GATE_PARAMS` | Missing / wrong number of parameters for a parameterized gate |

## Example

### Request

```json
{
  "language": "python",
  "framework": "qiskit",
  "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)"
}
```

### Success Response

```json
{
  "success": true,
  "circuit": {
    "num_qubits": 2,
    "operations": [
      {"gate": "H", "targets": [0]},
      {"gate": "CNOT", "targets": [0, 1]}
    ]
  },
  "errors": []
}
```

### Error Response

```json
{
  "success": false,
  "circuit": null,
  "errors": [
    {
      "code": "PYTHON_SYNTAX_ERROR",
      "message": "Incomplete CNOT operation.",
      "line": 5,
      "column": 8
    }
  ]
}
```