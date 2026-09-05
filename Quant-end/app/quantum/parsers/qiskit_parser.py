import ast
from typing import List, Optional, Set

from app.quantum.circuit_validator import CircuitValidationError, validate_circuit

SUPPORTED_GATES = {
    "i": "I",
    "x": "X",
    "y": "Y",
    "z": "Z",
    "h": "H",
    "s": "S",
    "t": "T",
    "cx": "CNOT",
    "cz": "CZ",
    "swap": "SWAP",
}

SINGLE_QUBIT_GATES_PY = {"i", "x", "y", "z", "h", "s", "t"}
TWO_QUBIT_GATES_PY = {"cx", "cz", "swap"}


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

    qiskit_names: Set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module == "qiskit":
            for alias in node.names:
                qiskit_names.add(alias.name)

    if not qiskit_names:
        errors.append(CircuitValidationError(
            code="PYTHON_SYNTAX_ERROR",
            message="No QuantumCircuit construction found. Expected: from qiskit import QuantumCircuit; qc = QuantumCircuit(N)",
        ))
        return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}

    num_qubits: Optional[int] = None
    circuit_var: Optional[str] = None

    for node in ast.walk(tree):
        if not isinstance(node, ast.Assign):
            continue

        if not (len(node.targets) == 1 and isinstance(node.targets[0], ast.Name)):
            continue

        target_name = node.targets[0].id
        value = node.value

        if not isinstance(value, ast.Call):
            continue

        func = value.func

        is_quantum_circuit = False
        if isinstance(func, ast.Name) and func.id in qiskit_names:
            is_quantum_circuit = True
        elif isinstance(func, ast.Attribute) and func.attr == "QuantumCircuit":
            if isinstance(func.value, ast.Name) and func.value.id in qiskit_names:
                is_quantum_circuit = True

        if not is_quantum_circuit:
            continue

        if len(value.args) == 1:
            arg = value.args[0]
            if isinstance(arg, ast.Constant) and isinstance(arg.value, int):
                if arg.value < 1:
                    errors.append(CircuitValidationError(
                        code="INVALID_QUBIT",
                        message="num_qubits must be a positive integer",
                        line=arg.lineno,
                        column=arg.col_offset,
                    ))
                    return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}
                num_qubits = arg.value
                circuit_var = target_name
            elif isinstance(arg, ast.UnaryOp) and isinstance(arg.op, ast.USub):
                operand = arg.operand
                if isinstance(operand, ast.Constant) and isinstance(operand.value, int):
                    errors.append(CircuitValidationError(
                        code="INVALID_QUBIT",
                        message="num_qubits must be a positive integer",
                        line=arg.lineno,
                        column=arg.col_offset,
                    ))
                    return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}
        elif len(value.args) == 0:
            errors.append(CircuitValidationError(
                code="INVALID_QUBIT",
                message="QuantumCircuit requires at least 1 argument (num_qubits)",
                line=node.lineno,
                column=node.col_offset,
            ))
            return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}
        else:
            errors.append(CircuitValidationError(
                code="INVALID_QUBIT",
                message="QuantumCircuit accepts exactly 1 argument (num_qubits)",
                line=node.lineno,
                column=node.col_offset,
            ))
            return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}

    if num_qubits is None:
        errors.append(CircuitValidationError(
            code="PYTHON_SYNTAX_ERROR",
            message="No QuantumCircuit construction found. Expected: from qiskit import QuantumCircuit; qc = QuantumCircuit(N)",
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

        if func.value.id != circuit_var:
            continue

        method_name = func.attr
        line = node.lineno
        column = node.col_offset

        if method_name not in SUPPORTED_GATES:
            errors.append(CircuitValidationError(
                code="INVALID_GATE",
                message=f"Unsupported gate: {method_name}",
                line=line,
                column=column,
            ))
            continue

        gate_name = SUPPORTED_GATES[method_name]
        args = []
        for arg in call.args:
            if isinstance(arg, ast.Constant) and isinstance(arg.value, int):
                args.append(arg.value)
            else:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {method_name} arguments must be integer qubit indices",
                    line=line,
                    column=column,
                ))
                break
        else:
            if method_name in SINGLE_QUBIT_GATES_PY:
                if len(args) != 1:
                    errors.append(CircuitValidationError(
                        code="INVALID_GATE_TARGETS",
                        message=f"Gate {method_name} requires exactly 1 target, got {len(args)}",
                        line=line,
                        column=column,
                    ))
                    continue
            elif method_name in TWO_QUBIT_GATES_PY:
                if len(args) != 2:
                    errors.append(CircuitValidationError(
                        code="INVALID_GATE_TARGETS",
                        message=f"Gate {method_name} requires exactly 2 targets, got {len(args)}",
                        line=line,
                        column=column,
                    ))
                    continue
                if len(set(args)) != 2:
                    errors.append(CircuitValidationError(
                        code="INVALID_GATE_TARGETS",
                        message=f"Gate {method_name} targets must be distinct",
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