import cirq

from app.quantum.base import QuantumBackend


GATE_MAP = {
    "I": cirq.I,
    "X": cirq.X,
    "Y": cirq.Y,
    "Z": cirq.Z,
    "H": cirq.H,
    "S": cirq.S,
    "T": cirq.T,
    "CNOT": cirq.CNOT,
    "CZ": cirq.CZ,
    "SWAP": cirq.SWAP,
}

TWO_QUBIT_GATES = {"CNOT", "CZ", "SWAP"}

MEASURE_KEY = "result"


class CirqBackend(QuantumBackend):
    name = "cirq"

    def execute(self, circuit, shots: int):
        num_qubits = circuit.num_qubits

        qubits = [cirq.LineQubit(i) for i in range(num_qubits)]

        operations = []
        for op in circuit.operations:
            gate = GATE_MAP[op.gate]
            targets = [qubits[t] for t in op.targets]
            if op.gate in TWO_QUBIT_GATES:
                operations.append(gate(*targets))
            else:
                operations.append(gate(targets[0]))

        operations.append(cirq.measure(*qubits, key=MEASURE_KEY))

        c = cirq.Circuit(operations)
        simulator = cirq.Simulator()
        result = simulator.run(c, repetitions=shots)

        raw_counts = result.histogram(key=MEASURE_KEY)

        return self._normalize(raw_counts, num_qubits, shots)

    def _normalize(self, raw_counts, num_qubits, shots):
        counts: dict[str, int] = {}
        for bitstring, count in raw_counts.items():
            padded = format(bitstring, f"0{num_qubits}b")
            counts[padded] = counts.get(padded, 0) + count

        probabilities = {k: round(v / shots, 6) for k, v in counts.items()}
        return counts, probabilities