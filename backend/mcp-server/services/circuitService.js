class CircuitService {
    constructor() {
        this.circuits = new Map();
    }

    createCircuit(circuitId, qubits = 3) {
        if (this.circuits.has(circuitId)) {
            return this.circuits.get(circuitId);
        }

        const circuit = {
            circuitId,
            qubits,
            gates: []
        };

        this.circuits.set(circuitId, circuit);

        return circuit;
    }

    addGate(circuitId, gate, qubit, column) {
        let circuit = this.circuits.get(circuitId);

        if (!circuit) {
            circuit = this.createCircuit(circuitId);
        }

        if (qubit >= circuit.qubits) {
            throw new Error(
                `Invalid qubit. Circuit has ${circuit.qubits} qubits.`
            );
        }

        const newGate = {
            gate,
            qubit,
            column
        };

        circuit.gates.push(newGate);

        return circuit;
    }
    removeGate(circuitId, qubit, column) {
        const circuit = this.circuits.get(circuitId);

        if (!circuit) {
            throw new Error(`Circuit '${circuitId}' not found`);
        }

        const gateIndex = circuit.gates.findIndex(
            (gate) => gate.qubit === qubit && gate.column === column
        );

        if (gateIndex === -1) {
            throw new Error(
                `No gate found at qubit ${qubit}, column ${column}`
            );
        }

        circuit.gates.splice(gateIndex, 1);

        return circuit;
    }
    clearCircuit(circuitId) {
        const circuit = this.circuits.get(circuitId);

        if (!circuit) {
            throw new Error(`Circuit '${circuitId}' not found`);
        }

        circuit.gates = [];

        return circuit;
    }
    deleteCircuit(circuitId) {
        const circuit = this.circuits.get(circuitId);

        if (!circuit) {
            throw new Error(`Circuit '${circuitId}' not found`);
        }

        this.circuits.delete(circuitId);

        return {
            message: `Circuit '${circuitId}' deleted successfully`,
            circuitId
        };
    }

    getCircuit(circuitId) {
        return this.circuits.get(circuitId) || null;
    }
}
export default new CircuitService();