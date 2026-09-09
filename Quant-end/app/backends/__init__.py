from app.backends.cirq_backend import CirqBackend
from app.backends.pennylane_backend import PennyLaneBackend
from app.backends.qiskit_backend import QiskitBackend


BACKENDS = {
    "qiskit": QiskitBackend,
    "pennylane": PennyLaneBackend,
    "cirq": CirqBackend,
}


def get_backend(name: str):
    """Return the backend class for a backend name (or None if unknown)."""
    return BACKENDS.get(name)