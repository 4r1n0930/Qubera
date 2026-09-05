from typing import List

from app.quantum.circuit_validator import CircuitValidationError, validate_circuit

GATE_TO_PENNYLANE = {
    "I": "qml.Identity",
    "X": "qml.PauliX",
    "Y": "qml.PauliY",
    "Z": "qml.PauliZ",
    "H": "qml.Hadamard",
    "S": "qml.S",
    "T": "qml.T",
    "CNOT": "qml.CNOT",
    "CZ": "qml.CZ",
    "SWAP": "qml.SWAP",
}

SINGLE_QUBIT_GATES = {"I", "X", "Y", "Z", "H", "S", "T"}
TWO_QUBIT_GATES = {"CNOT", "CZ", "SWAP"}

DEFAULT_SHOTS = 1000


def generate(circuit: dict) -> dict:
    errors: List[CircuitValidationError] = []

    num_qubits = circuit.get("num_qubits")
    operations = circuit.get("operations", [])

    circuit_errors = validate_circuit(num_qubits, operations)
    if circuit_errors:
        errors.extend(circuit_errors)
        return {"success": False, "code": None, "errors": [err.to_dict() for err in errors]}

    lines = [
        "import pennylane as qml",
        "",
        f'dev = qml.device("default.qubit", wires={num_qubits}, shots={DEFAULT_SHOTS})',
        "",
        "@qml.qnode(dev)",
        "def circuit():",
    ]

    for op in operations:
        gate = op["gate"]
        targets = op["targets"]
        gate_ref = GATE_TO_PENNYLANE[gate]
        if gate in TWO_QUBIT_GATES:
            wire_str = ", ".join(str(t) for t in targets)
            lines.append(f"    {gate_ref}(wires=[{wire_str}])")
        else:
            lines.append(f"    {gate_ref}(wires={targets[0]})")

    lines.append("    return qml.counts()")

    code = "\n".join(lines) + "\n"

    return {"success": True, "code": code, "errors": []}