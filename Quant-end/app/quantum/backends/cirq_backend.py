import math

import cirq

from app.quantum.base import QuantumBackend


GATE_MAP = {
    "I": cirq.I,
    "X": cirq.X,
    "Y": cirq.Y,
    "Z": cirq.Z,
    "H": cirq.H,
    "S": cirq.S,
    "Sdg": cirq.S ** -1,
    "T": cirq.T,
    "Tdg": cirq.T ** -1,
    "CNOT": cirq.CNOT,
    "CX": cirq.CNOT,
    "CZ": cirq.CZ,
    "SWAP": cirq.SWAP,
    "CCX": cirq.TOFFOLI,
    "CCZ": cirq.CCZ,
}

TWO_QUBIT_GATES = {"CNOT", "CX", "CZ", "SWAP"}
THREE_QUBIT_GATES = {"CCX", "CCZ"}
PARAMETERIZED_GATES = {"RX", "RY", "RZ", "P", "RXX", "RZZ"}
OPERATION_GATES = {"measure", "reset", "barrier"}

MEASURE_KEY = "result"


class CirqBackend(QuantumBackend):
    name = "cirq"

    def execute(self, circuit, shots: int):
        num_qubits = circuit.num_qubits

        qubits = [cirq.LineQubit(i) for i in range(num_qubits)]

        operations = []
        for op in circuit.operations:
            if op.gate in OPERATION_GATES:
                if op.gate == "reset":
                    for t in op.targets:
                        operations.append(cirq.reset(qubits[t]))
                continue

            targets = [qubits[t] for t in op.targets]
            params = list(getattr(op, "params", []))

            if op.gate in PARAMETERIZED_GATES:
                if op.gate == "RX":
                    operations.append(cirq.rx(params[0])(targets[0]))
                elif op.gate == "RY":
                    operations.append(cirq.ry(params[0])(targets[0]))
                elif op.gate == "RZ":
                    operations.append(cirq.rz(params[0])(targets[0]))
                elif op.gate == "P":
                    operations.append((cirq.Z ** (params[0] / math.pi))(targets[0]))
                elif op.gate == "RXX":
                    exponent = params[0] / math.pi
                    operations.append(cirq.XXPowGate(exponent=exponent)(*targets))
                elif op.gate == "RZZ":
                    exponent = params[0] / math.pi
                    operations.append(cirq.ZZPowGate(exponent=exponent)(*targets))
            elif op.gate in THREE_QUBIT_GATES:
                operations.append(GATE_MAP[op.gate](*targets))
            elif op.gate in TWO_QUBIT_GATES:
                operations.append(GATE_MAP[op.gate](*targets))
            else:
                operations.append(GATE_MAP[op.gate](targets[0]))

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