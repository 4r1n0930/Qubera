from typing import List

from app.quantum.circuit_validator import CircuitValidationError, validate_circuit

GATE_TO_CIRQ = {
    "I": "cirq.I",
    "X": "cirq.X",
    "Y": "cirq.Y",
    "Z": "cirq.Z",
    "H": "cirq.H",
    "S": "cirq.S",
    "T": "cirq.T",
    "CNOT": "cirq.CNOT",
    "CZ": "cirq.CZ",
    "SWAP": "cirq.SWAP",
}

SINGLE_QUBIT_GATES = {"I", "X", "Y", "Z", "H", "S", "T"}
TWO_QUBIT_GATES = {"CNOT", "CZ", "SWAP"}

MEASURE_KEY = "result"


def generate(circuit: dict) -> dict:
    errors: List[CircuitValidationError] = []

    num_qubits = circuit.get("num_qubits")
    operations = circuit.get("operations", [])

    circuit_errors = validate_circuit(num_qubits, operations)
    if circuit_errors:
        errors.extend(circuit_errors)
        return {"success": False, "code": None, "errors": [err.to_dict() for err in errors]}

    lines = [
        "import cirq",
        "",
        f"qubits = [cirq.LineQubit(i) for i in range({num_qubits})]",
        "circuit = cirq.Circuit()",
    ]

    for op in operations:
        gate = op["gate"]
        targets = op["targets"]
        gate_ref = GATE_TO_CIRQ[gate]
        if gate in TWO_QUBIT_GATES:
            qubit_str = ", ".join(f"qubits[{t}]" for t in targets)
            lines.append(f"circuit.append({gate_ref}({qubit_str}))")
        else:
            lines.append(f"circuit.append({gate_ref}(qubits[{targets[0]}]))")

    lines.append(f'circuit.append(cirq.measure(*qubits, key="{MEASURE_KEY}"))')

    code = "\n".join(lines) + "\n"

    return {"success": True, "code": code, "errors": []}