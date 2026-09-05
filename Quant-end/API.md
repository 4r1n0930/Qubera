# Quantum Service API

Multi-backend quantum execution API. Backends/Frameworks: PennyLane, Qiskit, Cirq.

## Architecture

The **Circuit IR** (intermediate representation) is the single source of truth. It is
backend-independent and shared by code generation, parsing, and execution:

```text
                         Circuit IR
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
      Code Generation                  Execution
             │                             │
     ┌───────┼────────┐            ┌───────┼────────┐
     ▼       ▼        ▼            ▼       ▼        ▼
  Qiskit  PennyLane  Cirq        Qiskit PennyLane  Cirq
 Generator Generator Generator   Backend Backend  Backend
     │       │        │            │       │        │
     ▼       ▼        ▼            ▼       ▼        ▼
  Python  Python    Python       Results Results  Results
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

## Bit Ordering Convention

All backends normalize their output to the same bit ordering:

- A bitstring `"101"` means `q0 = 1`, `q1 = 0`, `q2 = 1`
- `q0` is the leftmost (most significant) bit
- Backend-specific orderings (e.g. Qiskit's reversed convention) are normalized before returning

---

## Execute Quantum Circuit

endpoint name: POST /api/quantum/execute  
inputs -> backend, shots, circuit  
output -> backend, shots, num_qubits, counts, probabilities, elapsed_time_ms

The execution endpoint consumes the Circuit IR directly. It does **not** generate Python
code or parse code back into IR.

### Input

- `backend` — `pennylane | qiskit | cirq`
- `shots` — number of measurements (1 to 100000)
- `circuit` — the normalized circuit IR

Supported gates:

- Single-qubit: `I`, `X`, `Y`, `Z`, `H`, `S`, `T` (exactly 1 target)
- Two-qubit: `CNOT`, `CZ`, `SWAP` (exactly 2 distinct targets)

### Output

- `backend` — backend used for execution
- `shots` — number of shots used
- `num_qubits` — number of qubits
- `counts` — measurement counts keyed by bitstring
- `probabilities` — normalized probabilities (`count / shots`) keyed by bitstring
- `elapsed_time_ms` — server-side circuit execution/simulation time in milliseconds (2 decimal places)

> Note: `elapsed_time_ms` measures server-side simulation time, not real hardware execution time or browser-observed latency. It is measured with `time.perf_counter()` around only the backend circuit execution on the server.

### Errors

- `INVALID_BACKEND` — unsupported backend value
- `INVALID_SHOTS` — shots out of range [1, 100000]
- `INVALID_QUBIT` — invalid `num_qubits` or out-of-range target
- `INVALID_GATE` — unsupported gate
- `INVALID_GATE_TARGETS` — wrong number / duplicate targets for a gate
- `INVALID_CIRCUIT` — malformed circuit
- `CIRCUIT_EXECUTION_ERROR` — backend execution failure

### Example

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

---

## Parse Python Quantum Circuit

endpoint name: POST /api/quantum/parse  
inputs -> language, framework, code  
output -> success, circuit, errors

Parses framework-specific Python quantum-circuit code into the normalized Circuit IR.
Uses safe AST/static analysis only; submitted code is never executed.

### Input

- `language` — `python` (only `python` is supported)
- `framework` — `qiskit` (default) | `pennylane` | `cirq`
- `code` — Python source code for the selected framework

Supported framework code:

```python
# qiskit
from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
```

```python
# pennylane
import pennylane as qml
dev = qml.device("default.qubit", wires=2, shots=1000)
@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.counts()
```

```python
# cirq
import cirq
qubits = [cirq.LineQubit(i) for i in range(2)]
circuit = cirq.Circuit()
circuit.append(cirq.H(qubits[0]))
circuit.append(cirq.CNOT(qubits[0], qubits[1]))
circuit.append(cirq.measure(*qubits, key="result"))
```

Gate operations recognized in each framework are mapped to the normalized gates:

- Single-qubit: `i`/`qml.Identity`/`cirq.I` -> `I`, `x`/`qml.PauliX`/`cirq.X` -> `X`,
  `y`/`qml.PauliY`/`cirq.Y` -> `Y`, `z`/`qml.PauliZ`/`cirq.Z` -> `Z`,
  `h`/`qml.Hadamard`/`cirq.H` -> `H`, `s`/`qml.S`/`cirq.S` -> `S`,
  `t`/`qml.T`/`cirq.T` -> `T`
- Two-qubit: `cx`/`qml.CNOT`/`cirq.CNOT` -> `CNOT`, `cz`/`qml.CZ`/`cirq.CZ` -> `CZ`,
  `swap`/`qml.SWAP`/`cirq.SWAP` -> `SWAP`

### Output

- `success` — boolean
- `circuit` — normalized circuit IR (or `null` on failure)
- `errors` — array of parsing/validation errors with `code`, `message`, and optional `line`/`column`

### Errors

- `UNSUPPORTED_LANGUAGE` — language is not `python`
- `UNSUPPORTED_FRAMEWORK` — framework is not `qiskit`, `pennylane`, or `cirq`
- `PYTHON_SYNTAX_ERROR` — invalid Python syntax or no circuit found for the framework
- `INVALID_QUBIT` — invalid num_qubits or out-of-range qubit index
- `INVALID_GATE` — unsupported gate for the framework
- `INVALID_GATE_TARGETS` — wrong number or duplicate targets

### Example

```json
{
  "language": "python",
  "framework": "qiskit",
  "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)"
}
```

Response:

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

Error example (incomplete code while typing in the editor):

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

---

## Generate Python Quantum Circuit

endpoint name: POST /api/quantum/generate  
inputs -> framework, circuit  
output -> success, framework, code, errors

Converts the normalized Circuit IR into framework-specific Python code. The same IR can
be regenerated for any framework without modification. The generation layer
(`app/quantum/generators`) is reusable independently of the API.

### Input

- `framework` — `qiskit` (default) | `pennylane` | `cirq`
- `circuit` — the normalized circuit IR

(`language` is accepted for backward compatibility: `python` implies `qiskit`.)

### Output

- `success` — boolean
- `framework` — framework used for generation
- `code` — generated Python code (or `null` on failure)
- `errors` — array of validation errors

### Errors

- `UNSUPPORTED_LANGUAGE` — language is not `python`
- `UNSUPPORTED_FRAMEWORK` — framework is not `qiskit`, `pennylane`, or `cirq`
- `INVALID_QUBIT` — invalid num_qubits or out-of-range target
- `INVALID_GATE` — unsupported gate
- `INVALID_GATE_TARGETS` — wrong number or duplicate targets

### Example

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

Response:

```json
{
  "success": true,
  "framework": "qiskit",
  "code": "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\n",
  "errors": []
}
```

### Framework switching

The same Circuit IR generates framework-specific code:

```json
{ "framework": "pennylane", "circuit": { "num_qubits": 2, "operations": [{"gate": "H", "targets": [0]}, {"gate": "CNOT", "targets": [0, 1]}] } }
```

generates:

```python
import pennylane as qml

dev = qml.device("default.qubit", wires=2, shots=1000)

@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.counts()
```

```json
{ "framework": "cirq", "circuit": { "num_qubits": 2, "operations": [{"gate": "H", "targets": [0]}, {"gate": "CNOT", "targets": [0, 1]}] } }
```

generates:

```python
import cirq

qubits = [cirq.LineQubit(i) for i in range(2)]
circuit = cirq.Circuit()
circuit.append(cirq.H(qubits[0]))
circuit.append(cirq.CNOT(qubits[0], qubits[1]))
circuit.append(cirq.measure(*qubits, key="result"))
```

---

## Code <-> Circuit Synchronization

Python code can be converted into the normalized circuit representation using:

POST /api/quantum/parse

The visual circuit can be converted back into Python using:

POST /api/quantum/generate

The frontend is responsible for real-time synchronization and debouncing.

The backend does not maintain a live synchronization session.

Both endpoints operate on the same backend-independent circuit representation used by:

POST /api/quantum/execute

### Recommended frontend state

```text
currentCircuitIR   <- canonical state
selectedFramework  <- qiskit | pennylane | cirq
generatedCode      <- produced by /generate using selectedFramework
```

### Visual -> Code

```text
Visual change
    ↓
Update Circuit IR
    ↓
/generate with selectedFramework
    ↓
Update Monaco
```

### Code -> Visual

```text
Code change
    ↓
Debounce ~300-500 ms
    ↓
/parse with selectedFramework
    ↓
Circuit IR
    ↓
Update visual circuit
```

### Run

```text
Run
  ↓
currentCircuitIR
  ↓
/execute with selected backend
  ↓
measurement results
```

Do **not** parse generated code again during Run. Execution consumes the Circuit IR directly.

### Preventing synchronization loops

Track the update source:

```text
updateSource:
- visual
- code
- system
```

When a visual change generates code, do not immediately feed that generated code back
into the parser. The Circuit IR is the canonical state.

---

## Health Check

endpoint name: GET /health  
inputs -> none  
output -> status