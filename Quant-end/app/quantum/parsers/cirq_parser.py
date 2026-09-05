import ast
import math
from typing import List, Optional, Set, Tuple

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
    "I": "I",
    "X": "X",
    "Y": "Y",
    "Z": "Z",
    "H": "H",
    "S": "S",
    "T": "T",
    "CNOT": "CNOT",
    "CZ": "CZ",
    "SWAP": "SWAP",
    "rx": "RX",
    "ry": "RY",
    "rz": "RZ",
    "PhaseShift": "P",
    "XXPowGate": "RXX",
    "ZZPowGate": "RZZ",
    "TOFFOLI": "CCX",
    "CCZ": "CCZ",
    "reset": "reset",
}

POWER_GATES = {"S", "T"}


def _extract_qubit_index(node: ast.AST, qubits_var: str) -> Optional[int]:
    if isinstance(node, ast.Subscript):
        if isinstance(node.value, ast.Name) and node.value.id == qubits_var:
            sl = node.slice
            if isinstance(sl, ast.Constant) and isinstance(sl.value, int):
                return sl.value
    if isinstance(node, ast.Name) and node.id in ("q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7"):
        return int(node.id[1:])
    return None


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


def _extract_gate_name(inner: ast.Call, cirq_names: Set[str]) -> Tuple[Optional[str], Optional[float]]:
    """Extract the cirq gate attribute and an optional exponent from a gate
    construction call like cirq.X, cirq.S**-1, or cirq.rx(theta)."""
    f = inner.func

    if isinstance(f, ast.Attribute):
        if isinstance(f.value, ast.Name) and f.value.id in cirq_names:
            if f.attr in POWER_GATES:
                return f.attr, None
            return f.attr, None
        return None, None

    if isinstance(f, ast.BinOp) and isinstance(f.op, ast.Pow):
        left = f.left
        if isinstance(left, ast.Attribute) and isinstance(left.value, ast.Name) and left.value.id in cirq_names:
            exponent = _eval_numeric_expr(f.right)
            if exponent is not None:
                return left.attr, exponent
        return None, None

    if isinstance(f, ast.Call):
        cf = f.func
        if isinstance(cf, ast.Attribute) and isinstance(cf.value, ast.Name) and cf.value.id in cirq_names:
            return cf.attr, None

    return None, None


def _extract_construction_params(inner: ast.Call, cirq_names: Set[str]) -> List[float]:
    """Extract numeric parameters from a curried gate construction call."""
    params: List[float] = []
    f = inner.func

    if isinstance(f, ast.Call):
        for arg in f.args:
            val = _eval_numeric_expr(arg)
            if val is not None:
                params.append(val)
        for kw in f.keywords:
            val = _eval_numeric_expr(kw.value)
            if val is not None:
                params.append(val)

    return params


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

    cirq_names: Set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name == "cirq":
                    cirq_names.add(alias.asname or alias.name)
        elif isinstance(node, ast.ImportFrom) and node.module == "cirq":
            for alias in node.names:
                cirq_names.add(alias.asname or alias.name)

    if not cirq_names:
        errors.append(CircuitValidationError(
            code="PYTHON_SYNTAX_ERROR",
            message="No Cirq import found. Expected: import cirq",
        ))
        return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}

    num_qubits: Optional[int] = None
    circuit_var: Optional[str] = None
    qubits_var: Optional[str] = None

    for node in ast.walk(tree):
        if not isinstance(node, ast.Assign):
            continue

        if not (len(node.targets) == 1 and isinstance(node.targets[0], ast.Name)):
            continue

        target_name = node.targets[0].id
        value = node.value

        if isinstance(value, ast.ListComp):
            elt = value.elt
            if isinstance(elt, ast.Call) and isinstance(elt.func, ast.Attribute):
                if elt.func.attr == "LineQubit" and isinstance(elt.func.value, ast.Name) and elt.func.value.id in cirq_names:
                    for gen in value.generators:
                        target = gen.target
                        iterable = gen.iter
                        if isinstance(target, ast.Name) and isinstance(iterable, ast.Call):
                            if isinstance(iterable.func, ast.Name) and iterable.func.id == "range":
                                if iterable.args and isinstance(iterable.args[0], ast.Constant) and isinstance(iterable.args[0].value, int):
                                    num_qubits = iterable.args[0].value
                                    qubits_var = target_name

        if isinstance(value, ast.Call) and isinstance(value.func, ast.Attribute):
            if value.func.attr == "Circuit" and isinstance(value.func.value, ast.Name) and value.func.value.id in cirq_names:
                circuit_var = target_name

    if num_qubits is None:
        errors.append(CircuitValidationError(
            code="PYTHON_SYNTAX_ERROR",
            message="Unable to determine num_qubits. Expected: qubits = [cirq.LineQubit(i) for i in range(N)]",
        ))
        return {"success": False, "circuit": None, "errors": [err.to_dict() for err in errors]}

    if circuit_var is None:
        errors.append(CircuitValidationError(
            code="PYTHON_SYNTAX_ERROR",
            message="No Cirq circuit found. Expected: circuit = cirq.Circuit()",
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
        if not (isinstance(func, ast.Attribute) and func.attr == "append"):
            continue
        if not (isinstance(func.value, ast.Name) and func.value.id == circuit_var):
            continue

        if not call.args:
            continue

        inner = call.args[0]
        if not isinstance(inner, ast.Call):
            continue

        gate_attr, exponent = _extract_gate_name(inner, cirq_names)

        if gate_attr is None:
            continue

        line = node.lineno
        column = node.col_offset

        if gate_attr == "measure":
            continue

        if gate_attr == "reset":
            args = []
            for arg in inner.args:
                idx = _extract_qubit_index(arg, qubits_var or "qubits")
                if idx is not None:
                    args.append(idx)
            if args:
                operations.append({"gate": "reset", "targets": args})
            continue

        if gate_attr in POWER_GATES or gate_attr == "Z":
            if gate_attr == "Z" and exponent is not None:
                gate_name = "P"
            elif exponent == -1.0 and gate_attr == "S":
                gate_name = "Sdg"
            elif exponent == -1.0 and gate_attr == "T":
                gate_name = "Tdg"
            elif exponent is None or exponent == 1.0:
                gate_name = "Z" if gate_attr == "Z" else gate_attr
            else:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE",
                    message=f"Unsupported gate exponent: cirq.{gate_attr}**{exponent}",
                    line=line,
                    column=column,
                ))
                continue
        elif exponent is not None:
            errors.append(CircuitValidationError(
                code="INVALID_GATE",
                message=f"Unsupported gate exponent: cirq.{gate_attr}**{exponent}",
                line=line,
                column=column,
            ))
            continue
        else:
            if gate_attr not in GATE_MAP:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE",
                    message=f"Unsupported gate: cirq.{gate_attr}",
                    line=line,
                    column=column,
                ))
                continue
            gate_name = GATE_MAP[gate_attr]

        args = []
        params = []
        valid_args = True

        for arg in inner.args:
            idx = _extract_qubit_index(arg, qubits_var or "qubits")
            if idx is not None:
                args.append(idx)
            else:
                val = _eval_numeric_expr(arg)
                if val is not None:
                    params.append(val)
                else:
                    valid_args = False

        construction_params = _extract_construction_params(inner, cirq_names)
        params.extend(construction_params)

        if gate_name == "P" and exponent is not None:
            params.append(exponent * math.pi)

        if not valid_args:
            errors.append(CircuitValidationError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate cirq.{gate_attr} arguments must be qubit references",
                line=line,
                column=column,
            ))
            continue

        if gate_name in ROTATION_GATES:
            if len(args) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate cirq.{gate_attr} requires exactly 1 target, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
            if len(params) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate cirq.{gate_attr} requires exactly 1 parameter (angle in radians)",
                    line=line,
                    column=column,
                ))
                continue
        elif gate_name in TWO_QUBIT_ROTATION_GATES:
            if len(args) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate cirq.{gate_attr} requires exactly 2 targets, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
            if len(set(args)) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate cirq.{gate_attr} targets must be distinct",
                    line=line,
                    column=column,
                ))
                continue
            if len(params) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate cirq.{gate_attr} requires exactly 1 parameter (angle in radians)",
                    line=line,
                    column=column,
                ))
                continue
        elif gate_name in SINGLE_QUBIT_GATES:
            if len(args) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate cirq.{gate_attr} requires exactly 1 target, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
        elif gate_name in TWO_QUBIT_GATES:
            if len(args) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate cirq.{gate_attr} requires exactly 2 targets, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
            if len(set(args)) != 2:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate cirq.{gate_attr} targets must be distinct",
                    line=line,
                    column=column,
                ))
                continue
        elif gate_name in THREE_QUBIT_GATES:
            if len(args) != 3:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate cirq.{gate_attr} requires exactly 3 targets, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
            if len(set(args)) != 3:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate cirq.{gate_attr} targets must be distinct",
                    line=line,
                    column=column,
                ))
                continue

        if gate_name in TWO_QUBIT_ROTATION_GATES and params:
            params[0] = params[0] * math.pi

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