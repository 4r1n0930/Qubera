import ast
from typing import List, Optional, Set

from app.quantum.circuit_validator import CircuitValidationError, validate_circuit

GATE_MAP = {
    "Identity": "I",
    "PauliX": "X",
    "PauliY": "Y",
    "PauliZ": "Z",
    "Hadamard": "H",
    "S": "S",
    "T": "T",
    "CNOT": "CNOT",
    "CZ": "CZ",
    "SWAP": "SWAP",
}

SINGLE_QUBIT_GATES = {"I", "X", "Y", "Z", "H", "S", "T"}
TWO_QUBIT_GATES = {"CNOT", "CZ", "SWAP"}


def parse(code: str) -> dict:
    errors: List[CircuitValidationError] = []

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        errors.append(CircuitValidationError(
            code="PYTHON_SYNTAX_ERROR",
            message=str(e.msg),
            line=e.lineno,
            column=e.offset,
        ))
        return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}

    pennylane_names: Set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name == "pennylane":
                    pennylane_names.add(alias.asname or alias.name)
        elif isinstance(node, ast.ImportFrom) and node.module == "pennylane":
            for alias in node.names:
                pennylane_names.add(alias.asname or alias.name)

    if not pennylane_names:
        errors.append(CircuitValidationError(
            code="PYTHON_SYNTAX_ERROR",
            message="No PennyLane import found. Expected: import pennylane as qml",
        ))
        return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}

    num_qubits: Optional[int] = None

    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue

        func = node.func
        if not (isinstance(func, ast.Attribute) and func.attr in ("device", "qjit")):
            continue
        if not (isinstance(func.value, ast.Name) and func.value.id in pennylane_names):
            continue

        for kw in node.keywords:
            if kw.arg == "wires":
                if isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, int):
                    num_qubits = kw.value.value
                elif isinstance(kw.value, ast.List):
                    elts = [e.value for e in kw.value.elts if isinstance(e, ast.Constant) and isinstance(e.value, int)]
                    if elts:
                        num_qubits = max(elts) + 1
                elif isinstance(kw.value, ast.Call):
                    if isinstance(kw.value.func, ast.Name) and kw.value.func.id == "range":
                        rng_arg = kw.value.args[0]
                        if isinstance(rng_arg, ast.Constant) and isinstance(rng_arg.value, int):
                            num_qubits = rng_arg.value

    if num_qubits is None or num_qubits < 1:
        errors.append(CircuitValidationError(
            code="INVALID_QUBIT",
            message="Unable to determine num_qubits. Expected: dev = qml.device('default.qubit', wires=N)",
        ))
        return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}

    operations: list = []

    for node in ast.walk(tree):
        if not isinstance(node, ast.Expr):
            continue

        call = node.value
        if not isinstance(call, ast.Call):
            continue

        func = call.func
        if not (isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name)):
            continue

        if func.value.id not in pennylane_names:
            continue

        gate_method = func.attr
        line = node.lineno
        column = node.col_offset

        if gate_method in ("device", "qnode", "counts", "sample", "expval", "probs", "state"):
            continue

        if gate_method not in GATE_MAP:
            errors.append(CircuitValidationError(
                code="INVALID_GATE",
                message=f"Unsupported gate: qml.{gate_method}",
                line=line,
                column=column,
            ))
            continue

        gate_name = GATE_MAP[gate_method]
        args = []
        valid_args = True

        for kw in call.keywords:
            if kw.arg == "wires":
                if isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, int):
                    args.append(kw.value.value)
                elif isinstance(kw.value, ast.List):
                    for elt in kw.value.elts:
                        if isinstance(elt, ast.Constant) and isinstance(elt.value, int):
                            args.append(elt.value)
                        else:
                            valid_args = False
                elif isinstance(kw.value, ast.Name) and kw.value.id == "range":
                    valid_args = False
                else:
                    valid_args = False

        if not valid_args:
            errors.append(CircuitValidationError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate qml.{gate_method} arguments must be integer qubit indices",
                line=line,
                column=column,
            ))
            continue

        if gate_name in SINGLE_QUBIT_GATES:
            if len(args) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate qml.{gate_method} requires exactly 1 target, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
        elif gate_name in TWO_QUBIT_GATES:
            if len(args) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate qml.{gate_method} requires exactly 2 targets, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
            if len(set(args)) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate qml.{gate_method} targets must be distinct",
                    line=line,
                    column=column,
                ))
                continue

        operations.append({"gate": gate_name, "targets": args})

    circuit_errors = validate_circuit(num_qubits, operations)
    errors.extend(circuit_errors)

    if errors:
        return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}

    return {
        "success": True,
        "circuit": {"num_qubits": num_qubits, "operations": operations},
        "errors": [],
    }