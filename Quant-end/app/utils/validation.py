"""Circuit IR validation utilities shared by request schemas and backends."""

from app.exception import APIError

SINGLE_QUBIT_GATES = {"I", "X", "Y", "Z", "H", "S", "Sdg", "T", "Tdg", "SX"}
ROTATION_GATES = {"RX", "RY", "RZ", "P"}
TWO_QUBIT_GATES = {"CNOT", "CX", "CZ", "SWAP"}
TWO_QUBIT_ROTATION_GATES = {"RXX", "RZZ"}
THREE_QUBIT_GATES = {"CCX", "CCZ"}
OPERATION_GATES = {"measure", "reset", "barrier"}

ALL_GATES = (
    SINGLE_QUBIT_GATES | ROTATION_GATES | TWO_QUBIT_GATES |
    TWO_QUBIT_ROTATION_GATES | THREE_QUBIT_GATES | OPERATION_GATES
)

PARAMETERIZED_GATES = ROTATION_GATES | TWO_QUBIT_ROTATION_GATES


def validate_circuit(num_qubits: int, operations) -> None:
    """Validate a circuit against the canonical IR rules.

    Raises APIError with a structured error code on the first problem, so the
    API never silently ignores an invalid operation.

    `operations` must be a sequence of objects exposing `.gate`, `.targets`,
    and `.params` (e.g. pydantic GateOperation instances or simple namespaces).
    """
    if not isinstance(num_qubits, int) or num_qubits < 1:
        raise APIError(
            code="INVALID_QUBIT",
            message="num_qubits must be a positive integer",
        )

    for op in operations:
        gate = op.gate
        targets = op.targets or []
        params = op.params if hasattr(op, "params") else []

        if gate not in ALL_GATES:
            raise APIError(
                code="INVALID_GATE",
                message=f"Unsupported gate: {gate}",
            )

        if gate in OPERATION_GATES:
            continue

        if gate in SINGLE_QUBIT_GATES and len(targets) != 1:
            raise APIError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate {gate} requires exactly 1 target",
            )
        if gate in ROTATION_GATES and len(targets) != 1:
            raise APIError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate {gate} requires exactly 1 target",
            )
        if gate in ROTATION_GATES and len(params) != 1:
            raise APIError(
                code="INVALID_GATE_PARAMS",
                message=f"Gate {gate} requires exactly 1 parameter (angle in radians)",
            )
        if gate in TWO_QUBIT_GATES and len(targets) != 2:
            raise APIError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate {gate} requires exactly 2 targets",
            )
        if gate in TWO_QUBIT_GATES and len(set(targets)) != 2:
            raise APIError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate {gate} targets must be distinct",
            )
        if gate in TWO_QUBIT_ROTATION_GATES and len(targets) != 2:
            raise APIError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate {gate} requires exactly 2 targets",
            )
        if gate in TWO_QUBIT_ROTATION_GATES and len(set(targets)) != 2:
            raise APIError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate {gate} targets must be distinct",
            )
        if gate in TWO_QUBIT_ROTATION_GATES and len(params) != 1:
            raise APIError(
                code="INVALID_GATE_PARAMS",
                message=f"Gate {gate} requires exactly 1 parameter (angle in radians)",
            )
        if gate in THREE_QUBIT_GATES and len(targets) != 3:
            raise APIError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate {gate} requires exactly 3 targets",
            )
        if gate in THREE_QUBIT_GATES and len(set(targets)) != 3:
            raise APIError(
                code="INVALID_GATE_TARGETS",
                message=f"Gate {gate} targets must be distinct",
            )

        for target in targets:
            if not isinstance(target, int) or target < 0 or target >= num_qubits:
                raise APIError(
                    code="INVALID_QUBIT",
                    message=f"Invalid target qubit: {target}",
                )


def circuit_has_reset(num_qubits: int, operations) -> bool:
    """Return True if the circuit performs a mid-circuit reset.

    Mid-circuit resets collapse the wavefunction stochastically, so a
    deterministic statevector (and statevector-derived outputs) is not
    well defined for such circuits.
    """
    return any(op.gate == "reset" for op in operations)