"""Pydantic request/response schemas for the execution-only quantum service."""

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.exception import APIError
from app.utils.validation import validate_circuit

MAX_SHOTS = 100000
MIN_SHOTS = 1

DEFAULT_OUTPUT = ["counts", "probabilities", "statevector", "bloch_vectors"]

SUPPORTED_OUTPUTS = {"counts", "probabilities", "statevector", "bloch_vectors"}


class BackendName(str, Enum):
    PENNYLANE = "pennylane"
    QISKIT = "qiskit"
    CIRQ = "cirq"


class OutputType(str, Enum):
    COUNTS = "counts"
    PROBABILITIES = "probabilities"
    STATEVECTOR = "statevector"
    BLOCH_VECTORS = "bloch_vectors"


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
    output: Optional[List[str]] = Field(default=None)
    circuit: Circuit

    @field_validator("backend")
    @classmethod
    def validate_backend(cls, value: str) -> str:
        if value not in {b.value for b in BackendName}:
            raise APIError(
                code="INVALID_BACKEND",
                message=f"Unsupported backend: {value}. Supported backends: qiskit, pennylane, cirq.",
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

    @field_validator("output")
    @classmethod
    def validate_output(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value is None:
            return None
        if not isinstance(value, list) or len(value) == 0:
            raise APIError(
                code="INVALID_OUTPUT",
                message=f"output must be a non-empty list. Supported outputs: {sorted(SUPPORTED_OUTPUTS)}.",
            )
        for item in value:
            if item not in SUPPORTED_OUTPUTS:
                raise APIError(
                    code="INVALID_OUTPUT",
                    message=f"Invalid output type: {item}. Supported outputs: {sorted(SUPPORTED_OUTPUTS)}.",
                )
        return value

    @field_validator("circuit")
    @classmethod
    def validate_circuit(cls, circuit: Circuit) -> Circuit:
        validate_circuit(circuit.num_qubits, circuit.operations)
        return circuit

    @property
    def resolved_output(self) -> List[str]:
        return self.output if self.output is not None else list(DEFAULT_OUTPUT)


class ExecuteResponse(BaseModel):
    success: bool = True
    backend: str
    shots: int
    num_qubits: int
    output: List[str]
    counts: Optional[dict] = None
    probabilities: Optional[dict] = None
    statevector: Optional[List[dict]] = None
    bloch_vectors: Optional[dict] = None
    elapsed_time_ms: float