# Quantum Service API Documentation

Multi-backend quantum execution API supporting PennyLane, Qiskit, and Cirq backends.

The service is **execution-only**: it consumes the canonical Circuit IR and simulates it
on a selected backend. Code generation and code parsing are handled by the frontend and
are out of scope (the old `/api/quantum/generate` and `/api/quantum/parse` endpoints
have been removed and return 404).

## Architecture

The **Circuit IR** (intermediate representation) is the single source of truth. It is
backend-independent and consumed directly by the backends:

```
                    Circuit IR
                        │
                        ▼
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
    Qiskit Backend            PennyLane / Cirq
          │                           │
          ▼                           ▼
        Results                     Results
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

Parameterized gates carry a `params` array (angles in radians):

```json
{
  "num_qubits": 1,
  "operations": [
    {"gate": "RX", "targets": [0], "params": [3.141592653589793]}
  ]
}
```

### Bit Ordering Convention

All backends normalize their output to the same bit ordering:
- A bitstring `"101"` means `q0 = 1`, `q1 = 0`, `q2 = 1`
- `q0` is the leftmost (most significant) bit
- The statevector index `i` corresponds to the bitstring `format(i, n)`
- Backend-specific orderings (e.g. Qiskit's reversed convention) are normalized before returning

## Endpoints

| Endpoint | Method | Description | Docs |
|----------|--------|-------------|------|
| `/api/quantum/execute` | POST | Execute a quantum circuit on a backend | [execute.md](execute.md) |
| `/health` | GET | Health check | [health.md](health.md) |