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

GATE_TO_CIRQ = {
    "I": "cirq.I",
    "X": "cirq.X",
    "Y": "cirq.Y",
    "Z": "cirq.Z",
    "H": "cirq.H",
    "S": "cirq.S",
    "Sdg": "(cirq.S**-1)",
    "T": "cirq.T",
    "Tdg": "(cirq.T**-1)",
    "RX": "cirq.rx",
    "RY": "cirq.ry",
    "RZ": "cirq.rz",
    "P": "cirq.PhaseShift",
    "CNOT": "cirq.CNOT",
    "CX": "cirq.CNOT",
    "CZ": "cirq.CZ",
    "SWAP": "cirq.SWAP",
    "RXX": "cirq.XXPowGate",
    "RZZ": "cirq.ZZPowGate",
    "CCX": "cirq.TOFFOLI",
    "CCZ": "cirq.CCZ",
}

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

    needs_numpy = False
    needs_math = False

    for op in operations:
        gate = op["gate"]
        targets = op["targets"]
        params = op.get("params", [])

        if gate in OPERATION_GATES:
            if gate == "reset":
                for t in targets:
                    lines.append(f"circuit.append(cirq.reset(qubits[{t}]))")
            continue

        gate_ref = GATE_TO_CIRQ[gate]

        if gate in ROTATION_GATES:
            param_str, used_np = _format_param(params[0])
            needs_numpy = needs_numpy or used_np
            if gate == "RX":
                lines.append(f"circuit.append(cirq.rx({param_str})(qubits[{targets[0]}]))")
            elif gate == "RY":
                lines.append(f"circuit.append(cirq.ry({param_str})(qubits[{targets[0]}]))")
            elif gate == "RZ":
                lines.append(f"circuit.append(cirq.rz({param_str})(qubits[{targets[0]}]))")
            elif gate == "P":
                needs_math = True
                lines.append(f"circuit.append((cirq.Z**({param_str}/math.pi))(qubits[{targets[0]}]))")
        elif gate in TWO_QUBIT_ROTATION_GATES:
            qubit_str = ", ".join(f"qubits[{t}]" for t in targets)
            param_str, used_np = _format_param(params[0])
            needs_numpy = needs_numpy or used_np
            needs_math = True
            if gate == "RXX":
                lines.append(f"circuit.append(cirq.XXPowGate(exponent={param_str}/math.pi)({qubit_str}))")
            elif gate == "RZZ":
                lines.append(f"circuit.append(cirq.ZZPowGate(exponent={param_str}/math.pi)({qubit_str}))")
        elif gate in THREE_QUBIT_GATES:
            qubit_str = ", ".join(f"qubits[{t}]" for t in targets)
            lines.append(f"circuit.append({gate_ref}({qubit_str}))")
        elif gate in TWO_QUBIT_GATES:
            qubit_str = ", ".join(f"qubits[{t}]" for t in targets)
            lines.append(f"circuit.append({gate_ref}({qubit_str}))")
        else:
            lines.append(f"circuit.append({gate_ref}(qubits[{targets[0]}]))")

    lines.append(f'circuit.append(cirq.measure(*qubits, key="{MEASURE_KEY}"))')

    if needs_numpy:
        lines.insert(1, "import numpy as np")
    if needs_math:
        lines.insert(1, "import math")

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
