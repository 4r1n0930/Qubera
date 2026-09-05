from abc import ABC, abstractmethod
from typing import Dict


class QuantumBackend(ABC):
    name: str = "base"

    @abstractmethod
    def execute(self, circuit, shots: int) -> tuple[Dict[str, int], Dict[str, float]]:
        raise NotImplementedError

    def normalize_counts(
        self, raw_counts: Dict[int, int], num_qubits: int, shots: int
    ) -> tuple[Dict[str, int], Dict[str, float]]:
        counts: Dict[str, int] = {}
        for bitstring, count in raw_counts.items():
            key = self._to_bitstring(bitstring, num_qubits)
            counts[key] = counts.get(key, 0) + count

        probabilities: Dict[str, float] = {}
        for key, count in counts.items():
            probabilities[key] = round(count / shots, 6)

        return counts, probabilities

    @staticmethod
    def _to_bitstring(value: int, num_qubits: int) -> str:
        return format(value, f"0{num_qubits}b")
