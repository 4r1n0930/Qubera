# QuboraBackend

Multi-backend quantum execution API built with FastAPI.

## Features

- Quantum execution endpoint: `POST /api/quantum/execute`
- Frameworks/backends: Qiskit, PennyLane, Cirq
- Backend-independent Circuit IR as the single source of truth
- Selectable outputs: `counts`, `probabilities`, `statevector`, `bloch_vectors` (all four by default)
- Consistent bit ordering: `q0 q1 q2 ...` (q0 is the leftmost / most significant bit)
- Consistent response format regardless of backend
- Health endpoint: `GET /health`
- CORS enabled for `http://localhost:5173`

Code generation and parsing are intentionally **out of scope** — the Circuit IR is
consumed directly by the execution backends. `/api/quantum/generate` and
`/api/quantum/parse` are gone (they return 404).

## Architecture

```text
                Circuit IR
                    │
                    ▼
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   Qiskit Backend        PennyLane / Cirq
        │                       │
        ▼                       ▼
      Results                 Results
```

The Circuit IR is framework-independent. Execution backends consume the Circuit IR
directly and never depend on generated code or parsing.

## Project Structure

```text
app/
├── main.py                  # FastAPI app, CORS, health, error handlers
├── exception.py             # APIError (code + message)
├── routes/
│   └── quantum.py           # POST /api/quantum/execute
├── schemas/
│   └── quantum.py           # ExecuteRequest / ExecuteResponse / Circuit IR
├── services/
│   ├── execution.py         # QuantumExecutor: backend selection + response assembly
│   └── visualization.py     # statevector/probabilities/Bloch vector normalization
├── backends/
│   ├── base.py              # QuantumBackend ABC
│   ├── qiskit_backend.py
│   ├── pennylane_backend.py
│   └── cirq_backend.py
└── utils/
    └── validation.py        # gate sets, circuit validation, reset detection
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
  "output": ["counts", "probabilities", "statevector", "bloch_vectors"],
  "circuit": {
    "num_qubits": 2,
    "operations": [
      {"gate": "H", "targets": [0]},
      {"gate": "CNOT", "targets": [0, 1]}
    ]
  }
}'
```

Change `"backend"` to `"pennylane"` or `"cirq"` to use a different backend. When
`output` is omitted it defaults to `["counts", "probabilities", "statevector",
"bloch_vectors"]`; only the requested result fields are populated.

## Supported Gates

- Single-qubit: `I`, `X`, `Y`, `Z`, `H`, `S`, `Sdg`, `T`, `Tdg`
- Rotations: `RX`, `RY`, `RZ`, `P` (angle in radians)
- Two-qubit: `CNOT`, `CX` (alias), `CZ`, `SWAP`
- Two-qubit rotations: `RXX`, `RZZ` (angle in radians)
- Multi-qubit: `CCX`, `CCZ`
- Operations: `measure`, `reset`, `barrier`

Note: requesting `statevector` or `bloch_vectors` for a circuit with a mid-circuit
`reset` returns a `STATEVECTOR_NOT_AVAILABLE` error, because a reset circuit has no
well-defined pure final state.

## Bit Ordering

A returned bitstring like `"101"` means:

```
q0 = 1
q1 = 0
q2 = 1
```

`q0` is the leftmost / most significant bit. The statevector index `i` corresponds to
the bitstring `format(i, n)`. Qiskit's native (reversed) ordering is normalized away.

## Tests

```bash
python -m pytest tests -q
```

See `API.md` for the full API documentation.