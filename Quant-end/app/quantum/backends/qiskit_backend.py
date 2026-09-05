from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

from app.quantum.base import QuantumBackend


GATE_MAP = {
    "I": "id",
    "X": "x",
    "Y": "y",
    "Z": "z",
    "H": "h",
    "S": "s",
    "Sdg": "sdg",
    "T": "t",
    "Tdg": "tdg",
    "RX": "rx",
    "RY": "ry",
    "RZ": "rz",
    "P": "p",
    "CNOT": "cx",
    "CX": "cx",
    "CZ": "cz",
    "SWAP": "swap",
    "RXX": "rxx",
    "RZZ": "rzz",
    "CCX": "ccx",
    "CCZ": "ccz",
}

TWO_QUBIT_GATES = {"CNOT", "CX", "CZ", "SWAP"}
THREE_QUBIT_GATES = {"CCX", "CCZ"}
PARAMETERIZED_GATES = {"RX", "RY", "RZ", "P", "RXX", "RZZ"}
OPERATION_GATES = {"measure", "reset", "barrier"}


class QiskitBackend(QuantumBackend):
    name = "qiskit"

    def execute(self, circuit, shots: int):
        num_qubits = circuit.num_qubits

        qc = QuantumCircuit(num_qubits, num_qubits)

        for op in circuit.operations:
            if op.gate in OPERATION_GATES:
                if op.gate == "reset":
                    for t in op.targets:
                        qc.reset(t)
                elif op.gate == "barrier":
                    if op.targets:
                        qc.barrier(*op.targets)
                    else:
                        qc.barrier()
                continue

            method = GATE_MAP[op.gate]
            targets = op.targets
            params = list(getattr(op, "params", []))

            if op.gate in PARAMETERIZED_GATES:
                getattr(qc, method)(*params, *targets)
            elif op.gate in THREE_QUBIT_GATES:
                getattr(qc, method)(*targets)
            elif op.gate in TWO_QUBIT_GATES:
                getattr(qc, method)(targets[0], targets[1])
            else:
                getattr(qc, method)(targets[0])

        qc.measure(range(num_qubits), range(num_qubits))

        backend = AerSimulator()
        compiled = transpile(qc, backend)
        result = backend.run(compiled, shots=shots).result()
        raw_counts = result.get_counts(qc)

        return self._normalize(raw_counts, num_qubits, shots)

    def _normalize(self, raw_counts, num_qubits, shots):
        counts: dict[str, int] = {}
        for bitstring, count in raw_counts.items():
            reversed_bitstring = bitstring.zfill(num_qubits)[::-1]
            counts[reversed_bitstring] = counts.get(reversed_bitstring, 0) + count

        probabilities = {k: round(v / shots, 6) for k, v in counts.items()}
        return counts, probabilities