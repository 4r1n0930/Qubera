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

GATE_MAP = {
    "Identity": "I",
    "PauliX": "X",
    "PauliY": "Y",
    "PauliZ": "Z",
    "Hadamard": "H",
    "S": "S",
    "SDG": "Sdg",
    "T": "T",
    "TDG": "Tdg",
    "RX": "RX",
    "RY": "RY",
    "RZ": "RZ",
    "PhaseShift": "P",
    "CNOT": "CNOT",
    "CZ": "CZ",
    "SWAP": "SWAP",
    "IsingXX": "RXX",
    "IsingZZ": "RZZ",
    "Toffoli": "CCX",
    "CCZ": "CCZ",
    "Reset": "reset",
}

SINGLE_QUBIT_GATES_IR = {"I", "X", "Y", "Z", "H", "S", "Sdg", "T", "Tdg"}
ROTATION_GATES_IR = {"RX", "RY", "RZ", "P"}
TWO_QUBIT_GATES_IR = {"CNOT", "CZ", "SWAP"}
TWO_QUBIT_ROTATION_GATES_IR = {"RXX", "RZZ"}
THREE_QUBIT_GATES_IR = {"CCX", "CCZ"}


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

    measure_wires: dict = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Assign):
            continue
        if len(node.targets) != 1 or not isinstance(node.targets[0], ast.Name):
            continue
        value = node.value
        if not (isinstance(value, ast.Call) and isinstance(value.func, ast.Attribute)):
            continue
        if not (isinstance(value.func.value, ast.Name) and value.func.value.id in pennylane_names):
            continue
        if value.func.attr != "measure":
            continue
        if len(value.args) != 1:
            continue
        arg = value.args[0]
        if isinstance(arg, ast.Constant) and isinstance(arg.value, int):
            measure_wires[node.targets[0].id] = arg.value

    for node in ast.walk(tree):
        if not isinstance(node, ast.Expr):
            continue

        call = node.value
        if not isinstance(call, ast.Call):
            continue

        func = call.func
        if not (isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name)):
            if isinstance(func, ast.Call):
                reset_wire = _parse_cond_reset(func, call.args, measure_wires, pennylane_names)
                if reset_wire is not None:
                    operations.append({"gate": "reset", "targets": [reset_wire]})
                    continue
                adjoint_gate = _parse_adjoint_call(func, pennylane_names)
                if adjoint_gate is not None:
                    args = []
                    for kw in call.keywords:
                        if kw.arg == "wires":
                            if isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, int):
                                args.append(kw.value.value)
                            elif isinstance(kw.value, ast.List):
                                for elt in kw.value.elts:
                                    if isinstance(elt, ast.Constant) and isinstance(elt.value, int):
                                        args.append(elt.value)
                    if args:
                        operations.append({"gate": adjoint_gate, "targets": args})
                    continue
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

        if gate_name == "reset":
            args = []
            for kw in call.keywords:
                if kw.arg == "wires":
                    if isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, int):
                        args.append(kw.value.value)
                    elif isinstance(kw.value, ast.List):
                        for elt in kw.value.elts:
                            if isinstance(elt, ast.Constant) and isinstance(elt.value, int):
                                args.append(elt.value)
            if args:
                operations.append({"gate": "reset", "targets": args})
            continue

        args = []
        params = []
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
            elif kw.arg == "theta" or kw.arg == "phi" or kw.arg == "param":
                val = _eval_numeric_expr(kw.value)
                if val is not None:
                    params.append(val)
                else:
                    valid_args = False

        for arg in call.args:
            val = _eval_numeric_expr(arg)
            if val is not None:
                params.append(val)

        if not valid_args:
            errors.append(CircuitValidationError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate qml.{gate_method} arguments must be integer qubit indices",
                line=line,
                column=column,
            ))
            continue

        if gate_name in SINGLE_QUBIT_GATES_IR:
            if len(args) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate qml.{gate_method} requires exactly 1 target, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
        elif gate_name in ROTATION_GATES_IR:
            if len(args) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate qml.{gate_method} requires exactly 1 target, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
            if len(params) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate qml.{gate_method} requires exactly 1 parameter (angle in radians)",
                    line=line,
                    column=column,
                ))
                continue
        elif gate_name in TWO_QUBIT_GATES_IR:
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
        elif gate_name in TWO_QUBIT_ROTATION_GATES_IR:
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
            if len(params) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate qml.{gate_method} requires exactly 1 parameter (angle in radians)",
                    line=line,
                    column=column,
                ))
                continue
        elif gate_name in THREE_QUBIT_GATES_IR:
            if len(args) != 3:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate qml.{gate_method} requires exactly 3 targets, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
            if len(set(args)) != 3:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate qml.{gate_method} targets must be distinct",
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


def _parse_adjoint_call(node: ast.Call, pennylane_names: Set[str]) -> Optional[str]:
    inner = node.func
    if not (isinstance(inner, ast.Attribute) and inner.attr == "adjoint"):
        return None
    if not (isinstance(inner.value, ast.Name) and inner.value.id in pennylane_names):
        return None
    if len(node.args) != 1:
        return None
    arg = node.args[0]
    if not (isinstance(arg, ast.Attribute) and isinstance(arg.value, ast.Name) and arg.value.id in pennylane_names):
        return None
    if arg.attr == "S":
        return "Sdg"
    if arg.attr == "T":
        return "Tdg"
    return None


def _parse_cond_reset(
    cond_call: ast.Call,
    call_args: list,
    measure_wires: dict,
    pennylane_names: Set[str],
) -> Optional[int]:
    inner_func = cond_call.func
    if not (isinstance(inner_func, ast.Attribute) and inner_func.attr == "cond"):
        return None
    if not (isinstance(inner_func.value, ast.Name) and inner_func.value.id in pennylane_names):
        return None
    if len(call_args) != 1:
        return None
    outer_arg = call_args[0]
    if not (isinstance(outer_arg, ast.Constant) and isinstance(outer_arg.value, int)):
        return None
    wire = outer_arg.value
    if len(cond_call.args) != 2:
        return None
    measure_name = cond_call.args[0]
    reset_action = cond_call.args[1]
    if not isinstance(measure_name, ast.Name):
        return None
    if measure_wires.get(measure_name.id) != wire:
        return None
    if not (isinstance(reset_action, ast.Attribute) and reset_action.attr == "X"):
        return None
    if not (isinstance(reset_action.value, ast.Name) and reset_action.value.id in pennylane_names):
        return None
    return wire
