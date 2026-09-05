from app.quantum.backends.cirq_backend import CirqBackend
from app.quantum.backends.pennylane_backend import PennyLaneBackend
from app.quantum.backends.qiskit_backend import QiskitBackend

BACKENDS = {
    "qiskit": QiskitBackend,
    "pennylane": PennyLaneBackend,
    "cirq": CirqBackend,
}


def get_backend(name: str):
    return BACKENDS.get(name)