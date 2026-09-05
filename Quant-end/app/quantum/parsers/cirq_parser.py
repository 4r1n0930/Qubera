import ast
from typing import List, Optional, Set

from app.quantum.circuit_validator import CircuitValidationError, validate_circuit

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
}

SINGLE_QUBIT_ATTR = {"I", "X", "Y", "Z", "H", "S", "T"}
TWO_QUBIT_ATTR = {"CNOT", "CZ", "SWAP"}


def _extract_qubit_index(node: ast.AST, qubits_var: str) -> Optional[int]:
    if isinstance(node, ast.Subscript):
        if isinstance(node.value, ast.Name) and node.value.id == qubits_var:
            sl = node.slice
            if isinstance(sl, ast.Constant) and isinstance(sl.value, int):
                return sl.value
    if isinstance(node, ast.Name) and node.id in ("q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7"):
        return int(node.id[1:])
    return None


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

        inner_func = inner.func
        if not (isinstance(inner_func, ast.Attribute) and isinstance(inner_func.value, ast.Name)):
            continue

        if inner_func.value.id not in cirq_names:
            continue

        gate_attr = inner_func.attr
        line = node.lineno
        column = node.col_offset

        if gate_attr == "measure":
            continue

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
        valid_args = True

        for arg in inner.args:
            idx = _extract_qubit_index(arg, qubits_var or "qubits")
            if idx is None:
                valid_args = False
            else:
                args.append(idx)

        if not valid_args:
            errors.append(CircuitValidationError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate cirq.{gate_attr} arguments must be qubit references",
                line=line,
                column=column,
            ))
            continue

        if gate_attr in SINGLE_QUBIT_ATTR:
            if len(args) != 1:
                errors.append(CircuitValidationError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate cirq.{gate_attr} requires exactly 1 target, got {len(args)}",
                    line=line,
                    column=column,
                ))
                continue
        elif gate_attr in TWO_QUBIT_ATTR:
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