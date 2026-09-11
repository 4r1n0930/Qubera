import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

from app.backends.base import QuantumBackend


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

    def _build_circuit(self, circuit, num_qubits: int) -> QuantumCircuit:
        qc = QuantumCircuit(num_qubits)

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

        return qc

    def execute(self, circuit, shots: int):
        num_qubits = circuit.num_qubits

        qc = self._build_circuit(circuit, num_qubits)
        qc.measure_all()

        backend = AerSimulator()
        compiled = transpile(qc, backend)
        result = backend.run(compiled, shots=shots).result()
        raw_counts = result.get_counts(qc)

        counts: dict[str, int] = {}
        for bitstring, count in raw_counts.items():
            key = bitstring.zfill(num_qubits)[::-1]
            counts[key] = counts.get(key, 0) + count

        return counts

    def statevector(self, circuit) -> np.ndarray:
        num_qubits = circuit.num_qubits

        qc = self._build_circuit(circuit, num_qubits)
        sv = np.asarray(Statevector(qc).data, dtype=complex)

        return self._to_q0_leftmost(sv, num_qubits)

    @staticmethod
    def _to_q0_leftmost(sv: np.ndarray, num_qubits: int) -> np.ndarray:
        """Qiskit indexes amplitudes little-endian (qubit 0 = LSB).

        Reorder so index `i` corresponds to the bitstring `format(i, n)` with
        qubit 0 as the most significant bit, matching the other backends.
        """
        m = 2 ** num_qubits
        reorder = np.array(
            [int(format(i, f"0{num_qubits}b")[::-1], 2) for i in range(m)],
            dtype=int,
        )
        return sv[reorder]