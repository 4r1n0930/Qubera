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

GATE_TO_PYTHON = {
    "I": "id",
    "X": "x",
    "Y": "y",
    "Z": "z",
    "H": "h",
    "S": "s",
    "Sdg": "sdg",
    "T": "t",
    "Tdg": "tdg",
    "RX": "rx",
    "RY": "ry",
    "RZ": "rz",
    "P": "p",
    "CNOT": "cx",
    "CX": "cx",
    "CZ": "cz",
    "SWAP": "swap",
    "RXX": "rxx",
    "RZZ": "rzz",
    "CCX": "ccx",
    "CCZ": "ccz",
}


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

    needs_numpy = False

    for op in operations:
        gate = op["gate"]
        targets = op["targets"]
        params = op.get("params", [])

        if gate in OPERATION_GATES:
            if gate == "measure":
                lines.append("qc.measure_all()")
            elif gate == "reset":
                for t in targets:
                    lines.append(f"qc.reset({t})")
            elif gate == "barrier":
                if targets:
                    target_str = ", ".join(str(t) for t in targets)
                    lines.append(f"qc.barrier({target_str})")
                else:
                    lines.append("qc.barrier()")
            continue

        py_method = GATE_TO_PYTHON[gate]

        if gate in ROTATION_GATES or gate in TWO_QUBIT_ROTATION_GATES:
            target_str = ", ".join(str(t) for t in targets)
            param_str, used_np = _format_param(params[0])
            needs_numpy = needs_numpy or used_np
            lines.append(f"qc.{py_method}({param_str}, {target_str})")
        else:
            target_str = ", ".join(str(t) for t in targets)
            lines.append(f"qc.{py_method}({target_str})")

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
