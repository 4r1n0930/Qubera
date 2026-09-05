from typing import List

from app.quantum.circuit_validator import CircuitValidationError, validate_circuit

GATE_TO_PYTHON = {
    "I": "i",
    "X": "x",
    "Y": "y",
    "Z": "z",
    "H": "h",
    "S": "s",
    "T": "t",
    "CNOT": "cx",
    "CZ": "cz",
    "SWAP": "swap",
}

SINGLE_QUBIT_GATES = {"I", "X", "Y", "Z", "H", "S", "T"}
TWO_QUBIT_GATES = {"CNOT", "CZ", "SWAP"}


def generate(circuit: dict) -> dict:
    errors: List[CircuitValidationError] = []

    num_qubits = circuit.get("num_qubits")
    operations = circuit.get("operations", [])

    circuit_errors = validate_circuit(num_qubits, operations)
    if circuit_errors:
        errors.extend(circuit_errors)
        return {"success": False, "code": None, "errors": [err.to_dict() for err in errors]}

    lines = [
        "from qiskit import QuantumCircuit",
        "",
        f"qc = QuantumCircuit({num_qubits})",
    ]

    for op in operations:
        gate = op["gate"]
        targets = op["targets"]
        py_method = GATE_TO_PYTHON[gate]
        target_str = ", ".join(str(t) for t in targets)
        lines.append(f"qc.{py_method}({target_str})")

    code = "\n".join(lines) + "\n"

    return {"success": True, "code": code, "errors": []}