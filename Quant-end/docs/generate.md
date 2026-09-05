# Generate Python Quantum Circuit

**Endpoint:** `POST /api/quantum/generate`

## Description

Converts the normalized Circuit IR into framework-specific Python code. The same IR can be regenerated for any framework without modification.

## Input

| Field | Type | Description |
|-------|------|-------------|
| `framework` | string | Framework to generate code for: `qiskit` (default), `pennylane`, or `cirq` |
| `circuit` | object | The normalized Circuit IR |

> Note: `language` is accepted for backward compatibility: `python` implies `qiskit`.

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

## Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether generation succeeded |
| `framework` | string | Framework used for generation |
| `code` | string \| null | Generated Python code (or `null` on failure) |
| `errors` | array | Array of validation errors |

## Errors

| Code | Description |
|------|-------------|
| `UNSUPPORTED_LANGUAGE` | Language is not `python` |
| `UNSUPPORTED_FRAMEWORK` | Framework is not `qiskit`, `pennylane`, or `cirq` |
| `INVALID_QUBIT` | Invalid num_qubits or out-of-range target |
| `INVALID_GATE` | Unsupported gate |
| `INVALID_GATE_TARGETS` | Wrong number or duplicate targets |
| `INVALID_GATE_PARAMS` | Missing / wrong number of parameters for a parameterized gate |

All gates supported by `/execute` are supported here: `I`, `X`, `Y`, `Z`, `H`, `S`, `Sdg`, `T`, `Tdg`, `RX`, `RY`, `RZ`, `P`, `CNOT`, `CX`, `CZ`, `SWAP`, `RXX`, `RZZ`, `CCX`, `CCZ`, plus operations `measure`, `reset`, `barrier`.

## Example

### Request

```json
{
  "framework": "qiskit",
  "circuit": {
    "num_qubits": 2,
    "operations": [
      {"gate": "H", "targets": [0]},
      {"gate": "CNOT", "targets": [0, 1]}
    ]
  }
}
```

### Response (Qiskit)

```json
{
  "success": true,
  "framework": "qiskit",
  "code": "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\n",
  "errors": []
}
```

### Response (PennyLane)

```json
{
  "success": true,
  "framework": "pennylane",
  "code": "import pennylane as qml\n\ndev = qml.device(\"default.qubit\", wires=2, shots=1000)\n\n@qml.qnode(dev)\ndef circuit():\n    qml.Hadamard(wires=0)\n    qml.CNOT(wires=[0, 1])\n    return qml.counts()\n",
  "errors": []
}
```

### Response (Cirq)

```json
{
  "success": true,
  "framework": "cirq",
  "code": "import cirq\n\nqubits = [cirq.LineQubit(i) for i in range(2)]\ncircuit = cirq.Circuit()\ncircuit.append(cirq.H(qubits[0]))\ncircuit.append(cirq.CNOT(qubits[0], qubits[1]))\ncircuit.append(cirq.measure(*qubits, key=\"result\"))\n",
  "errors": []
}
```