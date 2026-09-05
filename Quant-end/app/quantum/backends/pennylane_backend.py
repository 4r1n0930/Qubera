import pennylane as qml

from app.quantum.base import QuantumBackend


GATE_MAP = {
    "I": qml.Identity,
    "X": qml.PauliX,
    "Y": qml.PauliY,
    "Z": qml.PauliZ,
    "H": qml.Hadamard,
    "S": qml.S,
    "Sdg": qml.adjoint(qml.S),
    "T": qml.T,
    "Tdg": qml.adjoint(qml.T),
    "RX": qml.RX,
    "RY": qml.RY,
    "RZ": qml.RZ,
    "P": qml.PhaseShift,
    "CNOT": qml.CNOT,
    "CX": qml.CNOT,
    "CZ": qml.CZ,
    "SWAP": qml.SWAP,
    "RXX": qml.IsingXX,
    "RZZ": qml.IsingZZ,
    "CCX": qml.Toffoli,
    "CCZ": qml.CCZ,
}

TWO_QUBIT_GATES = {"CNOT", "CX", "CZ", "SWAP"}
THREE_QUBIT_GATES = {"CCX", "CCZ"}
PARAMETERIZED_GATES = {"RX", "RY", "RZ", "P", "RXX", "RZZ"}
OPERATION_GATES = {"measure", "reset", "barrier"}


class PennyLaneBackend(QuantumBackend):
    name = "pennylane"

    def execute(self, circuit, shots: int):
        num_qubits = circuit.num_qubits

        dev = qml.device("default.qubit", wires=num_qubits, shots=shots)

        @qml.qnode(dev)
        def qnode():
            for op in circuit.operations:
                if op.gate in OPERATION_GATES:
                    if op.gate == "reset":
                        for t in op.targets:
                            m = qml.measure(t)
                            qml.cond(m, qml.X)(t)
                    continue

                gate = GATE_MAP[op.gate]
                targets = op.targets
                params = list(getattr(op, "params", []))

                if op.gate in PARAMETERIZED_GATES:
                    gate(*params, wires=targets if len(targets) > 1 else targets[0])
                elif op.gate in THREE_QUBIT_GATES:
                    gate(wires=targets)
                elif op.gate in TWO_QUBIT_GATES:
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