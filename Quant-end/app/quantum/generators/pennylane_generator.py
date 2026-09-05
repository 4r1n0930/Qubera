import math
from typing import List

from app.quantum.circuit_validator import (
    CircuitValidationError,
    validate_circuit,
    SINGLE_QUBIT_GATES,
    ROTATION_GATES,
    TWO_QUBIT_GATES,
    TWO_QUBIT_ROTATION_GATES,
    THREE_QUBIT_GATES,
    OPERATION_GATES,
)

GATE_TO_PENNYLANE = {
    "I": "qml.Identity",
    "X": "qml.PauliX",
    "Y": "qml.PauliY",
    "Z": "qml.PauliZ",
    "H": "qml.Hadamard",
    "S": "qml.S",
    "Sdg": "qml.adjoint(qml.S)",
    "T": "qml.T",
    "Tdg": "qml.adjoint(qml.T)",
    "RX": "qml.RX",
    "RY": "qml.RY",
    "RZ": "qml.RZ",
    "P": "qml.PhaseShift",
    "CNOT": "qml.CNOT",
    "CX": "qml.CNOT",
    "CZ": "qml.CZ",
    "SWAP": "qml.SWAP",
    "RXX": "qml.IsingXX",
    "RZZ": "qml.IsingZZ",
    "CCX": "qml.Toffoli",
    "CCZ": "qml.CCZ",
}

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

    needs_numpy = False

    for op in operations:
        gate = op["gate"]
        targets = op["targets"]
        params = op.get("params", [])

        if gate in OPERATION_GATES:
            if gate == "reset":
                for t in targets:
                    lines.append(f"    m{t} = qml.measure({t})")
                    lines.append(f"    qml.cond(m{t}, qml.X)({t})")
            continue

        gate_ref = GATE_TO_PENNYLANE[gate]

        if gate in ROTATION_GATES:
            param_str, used_np = _format_param(params[0])
            needs_numpy = needs_numpy or used_np
            lines.append(f"    {gate_ref}({param_str}, wires={targets[0]})")
        elif gate in TWO_QUBIT_ROTATION_GATES:
            wire_str = ", ".join(str(t) for t in targets)
            param_str, used_np = _format_param(params[0])
            needs_numpy = needs_numpy or used_np
            lines.append(f"    {gate_ref}({param_str}, wires=[{wire_str}])")
        elif gate in THREE_QUBIT_GATES:
            wire_str = ", ".join(str(t) for t in targets)
            lines.append(f"    {gate_ref}(wires=[{wire_str}])")
        elif gate in TWO_QUBIT_GATES:
            wire_str = ", ".join(str(t) for t in targets)
            lines.append(f"    {gate_ref}(wires=[{wire_str}])")
        else:
            lines.append(f"    {gate_ref}(wires={targets[0]})")

    lines.append("    return qml.counts()")

    if needs_numpy:
        lines.insert(0, "import numpy as np")

    code = "\n".join(lines) + "\n"

    return {"success": True, "code": code, "errors": []}


def _format_param(value: float):
    if value == math.pi:
        return "np.pi", True
    elif value == math.pi / 2:
        return "np.pi / 2", True
    elif value == math.pi / 4:
        return "np.pi / 4", True
    elif value == 2 * math.pi:
        return "2 * np.pi", True
    elif value == -math.pi:
        return "-np.pi", True
    else:
        return str(value), False
