"""Execution orchestration: pick a simulator backend, run it, and assemble
the normalized response with only the requested outputs.
"""

import time

from app.backends import get_backend
from app.exception import APIError
from app.services.visualization import (
    bloch_vectors_from_statevector,
    probabilities_from_counts,
    probabilities_from_statevector,
    statevector_to_json,
)
from app.utils.validation import circuit_has_reset


class QuantumExecutor:
    def execute(self, request) -> dict:
        backend_cls = get_backend(request.backend)
        if backend_cls is None:
            raise APIError(
                code="INVALID_BACKEND",
                message=f"Unsupported backend: {request.backend}",
            )

        circuit = request.circuit
        outputs = request.resolved_output
        has_reset = circuit_has_reset(circuit.num_qubits, circuit.operations)

        if has_reset and {"statevector", "bloch_vectors"} & set(outputs):
            raise APIError(
                code="STATEVECTOR_NOT_AVAILABLE",
                message=(
                    "statevector and bloch_vectors require an ideal (pure) final state, "
                    "which is not well defined for circuits with mid-circuit resets."
                ),
            )

        backend = backend_cls()

        use_statevector = (
            "statevector" in outputs
            or "bloch_vectors" in outputs
            or ("probabilities" in outputs and not has_reset)
        )

        start = time.perf_counter()
        try:
            counts = backend.execute(circuit, request.shots)
            statevector = backend.statevector(circuit) if use_statevector else None
        except APIError:
            raise
        except Exception as exc:
            raise APIError(
                code="CIRCUIT_EXECUTION_ERROR",
                message=f"Backend simulation failed: {exc}",
            ) from exc
        elapsed_time_ms = round((time.perf_counter() - start) * 1000, 2)

        payload = {
            "success": True,
            "backend": backend.name,
            "shots": request.shots,
            "num_qubits": circuit.num_qubits,
            "output": outputs,
        }

        if "counts" in outputs:
            payload["counts"] = counts

        if "probabilities" in outputs:
            if has_reset or statevector is None:
                payload["probabilities"] = probabilities_from_counts(counts, request.shots)
            else:
                payload["probabilities"] = probabilities_from_statevector(
                    statevector, circuit.num_qubits
                )

        if "statevector" in outputs:
            payload["statevector"] = statevector_to_json(statevector)

        if "bloch_vectors" in outputs:
            payload["bloch_vectors"] = bloch_vectors_from_statevector(
                statevector, circuit.num_qubits
            )

        payload["elapsed_time_ms"] = elapsed_time_ms

        return payload