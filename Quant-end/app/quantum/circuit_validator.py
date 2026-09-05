from typing import List, Optional

SINGLE_QUBIT_GATES = {"I", "X", "Y", "Z", "H", "S", "Sdg", "T", "Tdg"}
ROTATION_GATES = {"RX", "RY", "RZ", "P"}
TWO_QUBIT_GATES = {"CNOT", "CX", "CZ", "SWAP"}
TWO_QUBIT_ROTATION_GATES = {"RXX", "RZZ"}
THREE_QUBIT_GATES = {"CCX", "CCZ"}
OPERATION_GATES = {"measure", "reset", "barrier"}

SUPPORTED_GATES = (
    SINGLE_QUBIT_GATES | ROTATION_GATES | TWO_QUBIT_GATES |
    TWO_QUBIT_ROTATION_GATES | THREE_QUBIT_GATES | OPERATION_GATES
)

PARAMETERIZED_GATES = ROTATION_GATES | TWO_QUBIT_ROTATION_GATES


class CircuitValidationError:
    def __init__(self, code: str, message: str, line: Optional[int] = None, column: Optional[int] = None):
        self.code = code
        self.message = message
        self.line = line
        self.column = column

    def to_dict(self) -> dict:
        d = {"code": self.code, "message": self.message}
        if self.line is not None:
            d["line"] = self.line
        if self.column is not None:
            d["column"] = self.column
        return d


def validate_circuit(num_qubits: int, operations: list) -> List[CircuitValidationError]:
    errors: List[CircuitValidationError] = []

    if not isinstance(num_qubits, int) or num_qubits < 1:
        errors.append(CircuitValidationError(
            code="INVALID_QUBIT",
            message="num_qubits must be a positive integer",
        ))
        return errors

    for op in operations:
        gate = op.get("gate") if isinstance(op, dict) else getattr(op, "gate", None)
        targets = op.get("targets") if isinstance(op, dict) else getattr(op, "targets", None)
        params = op.get("params", []) if isinstance(op, dict) else getattr(op, "params", [])

        if gate not in SUPPORTED_GATES:
            errors.append(CircuitValidationError(
                code="INVALID_GATE",
                message=f"Unsupported gate: {gate}",
            ))
            continue

        if gate in OPERATION_GATES:
            continue

        if gate in SINGLE_QUBIT_GATES:
            if not isinstance(targets, list) or len(targets) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {gate} requires exactly 1 target",
                ))
                continue

        if gate in ROTATION_GATES:
            if not isinstance(targets, list) or len(targets) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {gate} requires exactly 1 target",
                ))
                continue
            if not isinstance(params, list) or len(params) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate {gate} requires exactly 1 parameter (angle in radians)",
                ))
                continue

        if gate in TWO_QUBIT_GATES:
            if not isinstance(targets, list) or len(targets) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {gate} requires exactly 2 targets",
                ))
                continue
            if len(set(targets)) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {gate} targets must be distinct",
                ))
                continue

        if gate in TWO_QUBIT_ROTATION_GATES:
            if not isinstance(targets, list) or len(targets) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {gate} requires exactly 2 targets",
                ))
                continue
            if len(set(targets)) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {gate} targets must be distinct",
                ))
                continue
            if not isinstance(params, list) or len(params) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate {gate} requires exactly 1 parameter (angle in radians)",
                ))
                continue

        if gate in THREE_QUBIT_GATES:
            if not isinstance(targets, list) or len(targets) != 3:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {gate} requires exactly 3 targets",
                ))
                continue
            if len(set(targets)) != 3:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {gate} targets must be distinct",
                ))
                continue

        if targets:
            for t in targets:
                if not isinstance(t, int) or t < 0 or t >= num_qubits:
                    errors.append(CircuitValidationError(
                        code="INVALID_QUBIT",
                        message=f"Qubit index {t} is out of range for a {num_qubits}-qubit circuit.",
                    ))

    return errors
