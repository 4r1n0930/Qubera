import ast
import math
from typing import List, Optional, Set

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

SUPPORTED_GATES = {
    "id": "I",
    "i": "I",
    "x": "X",
    "y": "Y",
    "z": "Z",
    "h": "H",
    "s": "S",
    "sdg": "Sdg",
    "t": "T",
    "tdg": "Tdg",
    "rx": "RX",
    "ry": "RY",
    "rz": "RZ",
    "p": "P",
    "cx": "CNOT",
    "cz": "CZ",
    "swap": "SWAP",
    "rxx": "RXX",
    "rzz": "RZZ",
    "ccx": "CCX",
    "ccz": "CCZ",
}

SINGLE_QUBIT_GATES_PY = {"id", "i", "x", "y", "z", "h", "s", "sdg", "t", "tdg"}
ROTATION_GATES_PY = {"rx", "ry", "rz", "p"}
TWO_QUBIT_GATES_PY = {"cx", "cz", "swap"}
TWO_QUBIT_ROTATION_GATES_PY = {"rxx", "rzz"}
THREE_QUBIT_GATES_PY = {"ccx", "ccz"}


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

        if method_name == "measure_all":
            operations.append({"gate": "measure", "targets": []})
            continue

        if method_name == "measure":
            continue

        if method_name == "barrier":
            continue

        if method_name == "reset":
            args = []
            for arg in call.args:
                if isinstance(arg, ast.Constant) and isinstance(arg.value, int):
                    args.append(arg.value)
            if args:
                operations.append({"gate": "reset", "targets": args})
            continue

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
        params = []
        valid_args = True

        for arg in call.args:
            if isinstance(arg, ast.Constant):
                if isinstance(arg.value, int):
                    args.append(arg.value)
                elif isinstance(arg.value, float):
                    params.append(arg.value)
                else:
                    valid_args = False
            elif isinstance(arg, ast.UnaryOp) and isinstance(arg.op, ast.USub):
                operand = arg.operand
                if isinstance(operand, ast.Constant):
                    if isinstance(operand.value, (int, float)):
                        params.append(-operand.value)
                    else:
                        valid_args = False
                else:
                    valid_args = False
            elif isinstance(arg, ast.Attribute):
                if arg.attr == "pi":
                    params.append(math.pi)
                else:
                    valid_args = False
            elif isinstance(arg, ast.BinOp):
                val = _eval_numeric_expr(arg)
                if val is not None:
                    params.append(val)
                else:
                    valid_args = False
            elif isinstance(arg, ast.Call):
                if isinstance(arg.func, ast.Attribute) and arg.func.attr == "pi":
                    params.append(math.pi)
                else:
                    valid_args = False
            else:
                valid_args = False

        if not valid_args:
            errors.append(CircuitValidationError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate {method_name} arguments must be integer qubit indices or numeric parameters",
                line=line,
                column=column,
            ))
            continue

        if method_name in SINGLE_QUBIT_GATES_PY:
            if len(args) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {method_name} requires exactly 1 target, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
        elif method_name in ROTATION_GATES_PY:
            if len(args) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {method_name} requires exactly 1 target, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
            if len(params) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate {method_name} requires exactly 1 parameter (angle in radians)",
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
        elif method_name in TWO_QUBIT_ROTATION_GATES_PY:
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
            if len(params) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate {method_name} requires exactly 1 parameter (angle in radians)",
                    line=line,
                    column=column,
                ))
                continue
        elif method_name in THREE_QUBIT_GATES_PY:
            if len(args) != 3:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {method_name} requires exactly 3 targets, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
            if len(set(args)) != 3:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {method_name} targets must be distinct",
                    line=line,
                    column=column,
                ))
                continue

        op = {"gate": gate_name, "targets": args}
        if params:
            op["params"] = params
        operations.append(op)

    circuit_errors = validate_circuit(num_qubits, operations)
    errors.extend(circuit_errors)

    if errors:
        return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}

    return {
        "success": True,
        "circuit": {"num_qubits": num_qubits, "operations": operations},
        "errors": [],
    }


def _eval_numeric_expr(node: ast.AST) -> Optional[float]:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        val = _eval_numeric_expr(node.operand)
        return -val if val is not None else None
    if isinstance(node, ast.BinOp):
        left = _eval_numeric_expr(node.left)
        right = _eval_numeric_expr(node.right)
        if left is not None and right is not None:
            if isinstance(node.op, ast.Add):
                return left + right
            elif isinstance(node.op, ast.Sub):
                return left - right
            elif isinstance(node.op, ast.Mult):
                return left * right
            elif isinstance(node.op, ast.Div):
                return left / right
    if isinstance(node, ast.Attribute) and node.attr == "pi":
        return math.pi
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
        if node.func.attr == "pi":
            return math.pi
    return None
