# Quantum Service API Documentation

Multi-backend quantum execution API supporting PennyLane, Qiskit, and Cirq backends.

## Architecture

The **Circuit IR** (intermediate representation) is the single source of truth. It is backend-independent and shared by code generation, parsing, and execution:

```
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

### Circuit IR Format

```json
{
  "num_qubits": 2,
  "operations": [
    {"gate": "H", "targets": [0]},
    {"gate": "CNOT", "targets": [0, 1]}
  ]
}
```

### Bit Ordering Convention

All backends normalize their output to the same bit ordering:
- A bitstring `"101"` means `q0 = 1`, `q1 = 0`, `q2 = 1`
- `q0` is the leftmost (most significant) bit
- Backend-specific orderings (e.g. Qiskit's reversed convention) are normalized before returning

## Endpoints

| Endpoint | Method | Description | Docs |
|----------|--------|-------------|------|
| `/api/quantum/execute` | POST | Execute a quantum circuit on a backend | [execute.md](execute.md) |
| `/api/quantum/parse` | POST | Parse Python quantum code into Circuit IR | [parse.md](parse.md) |
| `/api/quantum/generate` | POST | Generate Python code from Circuit IR | [generate.md](generate.md) |
| `/health` | GET | Health check | [health.md](health.md) |

## Code <-> Circuit Synchronization

Python code can be converted into the normalized circuit representation using `POST /api/quantum/parse`.

The visual circuit can be converted back into Python using `POST /api/quantum/generate`.

The frontend is responsible for real-time synchronization and debouncing. The backend does not maintain a live synchronization session.

### Recommended Frontend State

```
currentCircuitIR   <- canonical state
selectedFramework  <- qiskit | pennylane | cirq
generatedCode      <- produced by /generate using selectedFramework
```

### Visual -> Code Flow

```
Visual change
    ↓
Update Circuit IR
    ↓
/generate with selectedFramework
    ↓
Update Monaco
```

### Code -> Visual Flow

```
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

### Run Flow

```
Run
  ↓
currentCircuitIR
  ↓
/execute with selected backend
  ↓
measurement results
```

Do **not** parse generated code again during Run. Execution consumes the Circuit IR directly.

### Preventing Synchronization Loops

Track the update source:

```
updateSource:
- visual
- code
- system
```

When a visual change generates code, do not immediately feed that generated code back into the parser. The Circuit IR is the canonical state.