from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.exception import APIError

MAX_SHOTS = 100000
MIN_SHOTS = 1

SINGLE_QUBIT_GATES = {"I", "X", "Y", "Z", "H", "S", "Sdg", "T", "Tdg"}
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


class BackendName(str, Enum):
    PENNYLANE = "pennylane"
    QISKIT = "qiskit"
    CIRQ = "cirq"


class GateOperation(BaseModel):
    gate: str
    targets: List[int] = Field(default_factory=list)
    params: List[float] = Field(default_factory=list)


class Circuit(BaseModel):
    num_qubits: int
    operations: List[GateOperation]


class ExecuteRequest(BaseModel):
    backend: str
    shots: int
    circuit: Circuit

    @field_validator("backend")
    @classmethod
    def validate_backend(cls, value: str) -> str:
        if value not in {b.value for b in BackendName}:
            raise APIError(
                code="INVALID_BACKEND",
                message=f"Unsupported backend: {value}",
            )
        return value

    @field_validator("shots")
    @classmethod
    def validate_shots(cls, value: int) -> int:
        if value < MIN_SHOTS:
            raise APIError(
                code="INVALID_SHOTS",
                message=f"shots must be >= {MIN_SHOTS}",
            )
        if value > MAX_SHOTS:
            raise APIError(
                code="INVALID_SHOTS",
                message=f"shots must be <= {MAX_SHOTS}",
            )
        return value

    @field_validator("circuit")
    @classmethod
    def validate_circuit(cls, circuit: Circuit) -> Circuit:
        if circuit.num_qubits < 1:
            raise APIError(
                code="INVALID_QUBIT",
                message="num_qubits must be a positive integer",
            )
        for op in circuit.operations:
            if op.gate not in ALL_GATES:
                raise APIError(
                    code="INVALID_GATE",
                    message=f"Unsupported gate: {op.gate}",
                )

            if op.gate in OPERATION_GATES:
                continue

            if op.gate in SINGLE_QUBIT_GATES and len(op.targets) != 1:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 1 target",
                )
            if op.gate in ROTATION_GATES and len(op.targets) != 1:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 1 target",
                )
            if op.gate in ROTATION_GATES and len(op.params) != 1:
                raise APIError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate {op.gate} requires exactly 1 parameter (angle in radians)",
                )
            if op.gate in TWO_QUBIT_GATES and len(op.targets) != 2:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 2 targets",
                )
            if op.gate in TWO_QUBIT_GATES and len(set(op.targets)) != 2:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} targets must be distinct",
                )
            if op.gate in TWO_QUBIT_ROTATION_GATES and len(op.targets) != 2:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 2 targets",
                )
            if op.gate in TWO_QUBIT_ROTATION_GATES and len(set(op.targets)) != 2:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} targets must be distinct",
                )
            if op.gate in TWO_QUBIT_ROTATION_GATES and len(op.params) != 1:
                raise APIError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate {op.gate} requires exactly 1 parameter (angle in radians)",
                )
            if op.gate in THREE_QUBIT_GATES and len(op.targets) != 3:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 3 targets",
                )
            if op.gate in THREE_QUBIT_GATES and len(set(op.targets)) != 3:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} targets must be distinct",
                )
            for target in op.targets:
                if target < 0 or target >= circuit.num_qubits:
                    raise APIError(
                        code="INVALID_QUBIT",
                        message=f"Target {target} out of range [0, {circuit.num_qubits})",
                    )
        return circuit


class ExecuteResponse(BaseModel):
    backend: str
    shots: int
    num_qubits: int
    counts: dict
    probabilities: dict
    elapsed_time_ms: float


class ParseRequest(BaseModel):
    language: str = "python"
    framework: Optional[str] = None
    code: str

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str) -> str:
        if value != "python":
            raise APIError(
                code="UNSUPPORTED_LANGUAGE",
                message=f"Unsupported language: {value}. Only 'python' is supported.",
            )
        return value

    @field_validator("framework")
    @classmethod
    def validate_framework(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in {b.value for b in BackendName}:
            raise APIError(
                code="UNSUPPORTED_FRAMEWORK",
                message=f"Unsupported framework: {value}. Supported frameworks: qiskit, pennylane, cirq.",
            )
        return value


class ParseResponse(BaseModel):
    success: bool
    circuit: Optional[dict] = None
    errors: list = []


class GenerateRequest(BaseModel):
    language: Optional[str] = None
    framework: Optional[str] = None
    circuit: Circuit

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value != "python":
            raise APIError(
                code="UNSUPPORTED_LANGUAGE",
                message=f"Unsupported language: {value}. Only 'python' is supported.",
            )
        return value

    @field_validator("framework")
    @classmethod
    def validate_framework(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in {b.value for b in BackendName}:
            raise APIError(
                code="UNSUPPORTED_FRAMEWORK",
                message=f"Unsupported framework: {value}. Supported frameworks: qiskit, pennylane, cirq.",
            )
        return value

    @field_validator("circuit")
    @classmethod
    def validate_circuit(cls, circuit: Circuit) -> Circuit:
        if circuit.num_qubits < 1:
            raise APIError(
                code="INVALID_QUBIT",
                message="num_qubits must be a positive integer",
            )
        for op in circuit.operations:
            if op.gate not in ALL_GATES:
                raise APIError(
                    code="INVALID_GATE",
                    message=f"Unsupported gate: {op.gate}",
                )

            if op.gate in OPERATION_GATES:
                continue

            if op.gate in SINGLE_QUBIT_GATES and len(op.targets) != 1:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 1 target",
                )
            if op.gate in ROTATION_GATES and len(op.targets) != 1:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 1 target",
                )
            if op.gate in ROTATION_GATES and len(op.params) != 1:
                raise APIError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate {op.gate} requires exactly 1 parameter (angle in radians)",
                )
            if op.gate in TWO_QUBIT_GATES and len(op.targets) != 2:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 2 targets",
                )
            if op.gate in TWO_QUBIT_GATES and len(set(op.targets)) != 2:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} targets must be distinct",
                )
            if op.gate in TWO_QUBIT_ROTATION_GATES and len(op.targets) != 2:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 2 targets",
                )
            if op.gate in TWO_QUBIT_ROTATION_GATES and len(set(op.targets)) != 2:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} targets must be distinct",
                )
            if op.gate in TWO_QUBIT_ROTATION_GATES and len(op.params) != 1:
                raise APIError(
                    code="INVALID_GATE_PARAMS",
                    message=f"Gate {op.gate} requires exactly 1 parameter (angle in radians)",
                )
            if op.gate in THREE_QUBIT_GATES and len(op.targets) != 3:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} requires exactly 3 targets",
                )
            if op.gate in THREE_QUBIT_GATES and len(set(op.targets)) != 3:
                raise APIError(
                    code="INVALID_GATE_TARGETS",
                    message=f"Gate {op.gate} targets must be distinct",
                )
            for target in op.targets:
                if target < 0 or target >= circuit.num_qubits:
                    raise APIError(
                        code="INVALID_QUBIT",
                        message=f"Target {target} out of range [0, {circuit.num_qubits})",
                    )
        return circuit


class GenerateResponse(BaseModel):
    success: bool
    framework: Optional[str] = None
    code: Optional[str] = None
    errors: list = []
