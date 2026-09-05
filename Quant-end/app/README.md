# QuboraBackend

Multi-backend quantum execution API built with FastAPI.

## Features

- Quantum execution endpoint: `POST /api/quantum/execute`
- Framework code -> circuit IR parsing: `POST /api/quantum/parse`
- Circuit IR -> framework code generation: `POST /api/quantum/generate`
- Frameworks/backends: Qiskit, PennyLane, Cirq
- Backend-independent Circuit IR as the single source of truth
- Reusable code-generation layer shared by the editor and any preview/tutorial views
- Consistent bit ordering: `q0 q1 q2 ...` (q0 is the leftmost / most significant bit)
- Consistent response format regardless of backend
- Health endpoint: `GET /health`
- CORS enabled for `http://localhost:5173`

## Architecture

```text
                    Circuit IR
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
  Code Generation                  Execution
         │                             │
  ┌──────┼─────┐              ┌──────┼─────┐
  ▼      ▼      ▼              ▼      ▼      ▼
 Qiskit PennyLane Cirq      Qiskit PennyLane Cirq
 Gen.   Gen.    Gen.        Backend Backend  Backend
```

The Circuit IR is framework-independent. Execution backends consume the Circuit IR
directly and never depend on generated code or parsing.

## Project Structure

```text
app/
└── quantum/
    ├── circuit_validator.py   # shared Circuit IR validation
    ├── executor.py            # selects backend and executes Circuit IR
    ├── base.py                # QuantumBackend ABC
    ├── generators/            # Circuit IR -> framework Python
    │   ├── qiskit_generator.py
    │   ├── pennylane_generator.py
    │   └── cirq_generator.py
    ├── parsers/               # framework Python -> Circuit IR (safe AST)
    │   ├── qiskit_parser.py
    │   ├── pennylane_parser.py
    │   └── cirq_parser.py
    └── backends/              # Circuit IR -> execution results
        ├── qiskit_backend.py
        ├── pennylane_backend.py
        └── cirq_backend.py
```

## Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

Swagger documentation: `http://localhost:8000/docs`

## Example Request: Execute

```bash
curl -X POST http://localhost:8000/api/quantum/execute \
-H "Content-Type: application/json" \
-d '{
  "backend": "qiskit",
  "shots": 1000,
  "circuit": {
    "num_qubits": 2,
    "operations": [
      {"gate": "H", "targets": [0]},
      {"gate": "CNOT", "targets": [0, 1]}
    ]
  }
}'
```

Change `"backend"` to `"pennylane"` or `"cirq"` to use a different backend.

## Example Request: Generate

Generate Qiskit code from the Circuit IR:

```bash
curl -X POST http://localhost:8000/api/quantum/generate \
-H "Content-Type: application/json" \
-d '{
  "framework": "qiskit",
  "circuit": {
    "num_qubits": 2,
    "operations": [
      {"gate": "H", "targets": [0]},
      {"gate": "CNOT", "targets": [0, 1]}
    ]
  }
}'
```

Switch to another framework with the same IR:

```bash
curl -X POST http://localhost:8000/api/quantum/generate \
-H "Content-Type: application/json" \
-d '{
  "framework": "pennylane",
  "circuit": {
    "num_qubits": 2,
    "operations": [
      {"gate": "H", "targets": [0]},
      {"gate": "CNOT", "targets": [0, 1]}
    ]
  }
}'
```

## Example Request: Parse

Parse Qiskit code back into the Circuit IR:

```bash
curl -X POST http://localhost:8000/api/quantum/parse \
-H "Content-Type: application/json" \
-d '{
  "language": "python",
  "framework": "qiskit",
  "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)"
}'
```

## Code <-> Circuit Synchronization

The frontend maintains `currentCircuitIR`, `selectedFramework`, and `generatedCode`.
Visual changes update the IR and regenerate code via `/generate`. Code changes are
debounced (~300-500 ms) and parsed back into IR via `/parse`. Run uses the current
Circuit IR directly with `/execute`.

Do not parse generated code again during Run, and do not feed generated code back into
the parser immediately after a visual change - the Circuit IR is the canonical state.

## Supported Gates

Single-qubit: `I`, `X`, `Y`, `Z`, `H`, `S`, `T`
Two-qubit: `CNOT`, `CZ`, `SWAP`

## Bit Ordering

A returned bitstring like `"101"` means:

```
q0 = 1
q1 = 0
q2 = 1
```

## Tests

```bash
python -m pytest tests -v
```

See `API.md` for the full API documentation.