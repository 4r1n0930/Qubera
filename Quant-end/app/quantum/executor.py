import time

from app.quantum.backends import get_backend
from app.quantum.base import QuantumBackend


class QuantumExecutor:
    def execute(self, request):
        backend_name = request.backend
        backend_cls = get_backend(backend_name)
        if backend_cls is None:
            raise ValueError(f"Unsupported backend: {backend_name}")
        backend = backend_cls()

        start = time.perf_counter()
        counts, probabilities = backend.execute(request.circuit, request.shots)
        elapsed_time_ms = round((time.perf_counter() - start) * 1000, 2)

        return {
            "backend": backend.name,
            "shots": request.shots,
            "num_qubits": request.circuit.num_qubits,
            "counts": counts,
            "probabilities": probabilities,
            "elapsed_time_ms": elapsed_time_ms,
        }