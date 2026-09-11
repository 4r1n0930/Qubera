from abc import ABC, abstractmethod
from typing import Dict

import numpy as np


class QuantumBackend(ABC):
    """Simulator backend contract.

    Backends consume the canonical Circuit IR directly (never generated code)
    and return normalized results:
      - counts:       dict of {bitstring: int}, q0 leftmost / most significant bit
      - statevector:  numpy complex128 array of length 2**n, q0-leftmost ordering
    """

    name: str = "base"

    @abstractmethod
    def execute(self, circuit, shots: int) -> Dict[str, int]:
        """Run the circuit with finite shots and return normalized counts."""
        raise NotImplementedError

    @abstractmethod
    def statevector(self, circuit) -> np.ndarray:
        """Compute the ideal final statevector (no shots)."""
        raise NotImplementedError

    @staticmethod
    def _to_bitstring(value: int, num_qubits: int) -> str:
        return format(value, f"0{num_qubits}b")