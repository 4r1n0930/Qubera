import math

import cirq
import numpy as np

from app.backends.base import QuantumBackend


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
    "SX": cirq.X ** 0.5,
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

    def _build_operations(self, circuit, qubits):
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
                    operations.append(cirq.XXPowGate(exponent=params[0] / math.pi)(*targets))
                elif op.gate == "RZZ":
                    operations.append(cirq.ZZPowGate(exponent=params[0] / math.pi)(*targets))
            elif op.gate in THREE_QUBIT_GATES:
                operations.append(GATE_MAP[op.gate](*targets))
            elif op.gate in TWO_QUBIT_GATES:
                operations.append(GATE_MAP[op.gate](*targets))
            else:
                operations.append(GATE_MAP[op.gate](targets[0]))

        return operations

    def _qubits(self, num_qubits):
        return [cirq.LineQubit(i) for i in range(num_qubits)]

    def execute(self, circuit, shots: int):
        num_qubits = circuit.num_qubits
        qubits = self._qubits(num_qubits)

        operations = self._build_operations(circuit, qubits)
        operations.append(cirq.measure(*qubits, key=MEASURE_KEY))

        c = cirq.Circuit(operations)
        result = cirq.Simulator().run(c, repetitions=shots)

        counts: dict[str, int] = {}
        for bit, count in result.histogram(key=MEASURE_KEY).items():
            bitstring = format(int(bit), f"0{num_qubits}b")
            counts[bitstring] = counts.get(bitstring, 0) + int(count)

        return counts

    def statevector(self, circuit) -> np.ndarray:
        num_qubits = circuit.num_qubits
        qubits = self._qubits(num_qubits)

        operations = self._build_operations(circuit, qubits)
        c = cirq.Circuit(operations)

        result = cirq.Simulator().simulate(c, qubit_order=qubits)
        sv = np.asarray(result.final_state_vector, dtype=complex)

        return sv