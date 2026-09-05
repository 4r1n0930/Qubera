import pennylane as qml

from app.quantum.base import QuantumBackend


GATE_MAP = {
    "I": qml.Identity,
    "X": qml.PauliX,
    "Y": qml.PauliY,
    "Z": qml.PauliZ,
    "H": qml.Hadamard,
    "S": qml.S,
    "T": qml.T,
    "CNOT": qml.CNOT,
    "CZ": qml.CZ,
    "SWAP": qml.SWAP,
}

TWO_QUBIT_GATES = {"CNOT", "CZ", "SWAP"}


class PennyLaneBackend(QuantumBackend):
    name = "pennylane"

    def execute(self, circuit, shots: int):
        num_qubits = circuit.num_qubits

        dev = qml.device("default.qubit", wires=num_qubits, shots=shots)

        @qml.qnode(dev)
        def qnode():
            for op in circuit.operations:
                gate = GATE_MAP[op.gate]
                targets = op.targets
                if op.gate in TWO_QUBIT_GATES:
                    gate(wires=targets)
                else:
                    gate(wires=targets[0])
            return qml.counts()

        counts_dict = qnode()
        counts = dict(counts_dict)

        return self._normalize(counts, num_qubits, shots)

    def _normalize(self, raw_counts, num_qubits, shots):
        counts: dict[str, int] = {}
        for bitstring, count in raw_counts.items():
            padded = bitstring.zfill(num_qubits)
            counts[padded] = int(counts.get(padded, 0)) + int(count)

        probabilities = {k: round(float(v) / shots, 6) for k, v in counts.items()}
        return counts, probabilities