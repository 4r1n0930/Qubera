import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ─── Health ───────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


# ─── Parse Endpoint ──────────────────────────────────────────────────────────

class TestParseValidGates:
    def test_parse_h_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.h(0)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["num_qubits"] == 1
        assert data["circuit"]["operations"] == [{"gate": "H", "targets": [0]}]
        assert data["errors"] == []

    def test_parse_x_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.x(0)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["operations"] == [{"gate": "X", "targets": [0]}]

    def test_parse_y_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.y(0)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["operations"] == [{"gate": "Y", "targets": [0]}]

    def test_parse_z_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.z(0)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["operations"] == [{"gate": "Z", "targets": [0]}]

    def test_parse_s_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.s(0)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["operations"] == [{"gate": "S", "targets": [0]}]

    def test_parse_t_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.t(0)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["operations"] == [{"gate": "T", "targets": [0]}]

    def test_parse_i_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.i(0)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["operations"] == [{"gate": "I", "targets": [0]}]

    def test_parse_cnot_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.cx(0, 1)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["operations"] == [{"gate": "CNOT", "targets": [0, 1]}]

    def test_parse_cz_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.cz(0, 1)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["operations"] == [{"gate": "CZ", "targets": [0, 1]}]

    def test_parse_swap_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.swap(0, 1)",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"]["operations"] == [{"gate": "SWAP", "targets": [0, 1]}]

    def test_parse_multiple_operations(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit(2)\n"
                "qc.h(0)\n"
                "qc.cx(0, 1)"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["circuit"]["operations"]) == 2
        assert data["circuit"]["operations"][0] == {"gate": "H", "targets": [0]}
        assert data["circuit"]["operations"][1] == {"gate": "CNOT", "targets": [0, 1]}


class TestParseErrors:
    def test_parse_invalid_language(self):
        response = client.post("/api/quantum/parse", json={
            "language": "javascript",
            "code": "console.log('hello')",
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "UNSUPPORTED_LANGUAGE"

    def test_parse_invalid_python_syntax(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "def foo(",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert len(data["errors"]) > 0
        assert data["errors"][0]["code"] == "PYTHON_SYNTAX_ERROR"

    def test_parse_incomplete_operation(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit(2)\n"
                "qc.cx(0,"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["errors"][0]["code"] == "PYTHON_SYNTAX_ERROR"

    def test_parse_invalid_qubit_index(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit(2)\n"
                "qc.h(5)"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        error_codes = [e["code"] for e in data["errors"]]
        assert "INVALID_QUBIT" in error_codes

    def test_parse_too_many_targets_single_qubit(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit(2)\n"
                "qc.h(0, 1)"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        error_codes = [e["code"] for e in data["errors"]]
        assert "INVALID_GATE_TARGETS" in error_codes

    def test_parse_too_few_targets_two_qubit(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit(2)\n"
                "qc.cx(0)"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        error_codes = [e["code"] for e in data["errors"]]
        assert "INVALID_GATE_TARGETS" in error_codes

    def test_parse_duplicate_targets_two_qubit(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit(2)\n"
                "qc.cx(0, 0)"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        error_codes = [e["code"] for e in data["errors"]]
        assert "INVALID_GATE_TARGETS" in error_codes

    def test_parse_unsupported_gate(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit(2)\n"
                "qc.foo(0)"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        error_codes = [e["code"] for e in data["errors"]]
        assert "INVALID_GATE" in error_codes

    def test_parse_malformed_quantum_circuit_no_args(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit()"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        error_codes = [e["code"] for e in data["errors"]]
        assert "INVALID_QUBIT" in error_codes

    def test_parse_malformed_quantum_circuit_negative(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit(-1)"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        error_codes = [e["code"] for e in data["errors"]]
        assert "INVALID_QUBIT" in error_codes

    def test_parse_no_quantum_circuit_found(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "x = 5",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["errors"][0]["code"] == "PYTHON_SYNTAX_ERROR"

    def test_parse_arbitrary_python_code_does_not_execute(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": "import os; os.system('echo pwned')",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["circuit"] is None

    def test_parse_line_column_info(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": (
                "from qiskit import QuantumCircuit\n"
                "qc = QuantumCircuit(2)\n"
                "qc.foo(0)"
            ),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        error = data["errors"][0]
        assert "line" in error
        assert "column" in error


# ─── Generate Endpoint ───────────────────────────────────────────────────────

class TestGenerateValidGates:
    def test_generate_h_gate(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 1,
                "operations": [{"gate": "H", "targets": [0]}],
            },
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "qc.h(0)" in data["code"]
        assert "from qiskit import QuantumCircuit" in data["code"]
        assert "qc = QuantumCircuit(1)" in data["code"]

    def test_generate_x_gate(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 1,
                "operations": [{"gate": "X", "targets": [0]}],
            },
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "qc.x(0)" in data["code"]

    def test_generate_cnot_gate(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 2,
                "operations": [{"gate": "CNOT", "targets": [0, 1]}],
            },
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "qc.cx(0, 1)" in data["code"]

    def test_generate_cz_gate(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 2,
                "operations": [{"gate": "CZ", "targets": [0, 1]}],
            },
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "qc.cz(0, 1)" in data["code"]

    def test_generate_swap_gate(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 3,
                "operations": [{"gate": "SWAP", "targets": [1, 2]}],
            },
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "qc.swap(1, 2)" in data["code"]

    def test_generate_multiple_operations(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 3,
                "operations": [
                    {"gate": "H", "targets": [0]},
                    {"gate": "X", "targets": [2]},
                    {"gate": "CNOT", "targets": [0, 1]},
                    {"gate": "SWAP", "targets": [1, 2]},
                ],
            },
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "qc = QuantumCircuit(3)" in data["code"]
        assert "qc.h(0)" in data["code"]
        assert "qc.x(2)" in data["code"]
        assert "qc.cx(0, 1)" in data["code"]
        assert "qc.swap(1, 2)" in data["code"]


class TestGenerateErrors:
    def test_generate_invalid_language(self):
        response = client.post("/api/quantum/generate", json={
            "language": "javascript",
            "circuit": {
                "num_qubits": 1,
                "operations": [{"gate": "H", "targets": [0]}],
            },
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "UNSUPPORTED_LANGUAGE"

    def test_generate_zero_qubits(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 0,
                "operations": [],
            },
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_QUBIT"

    def test_generate_negative_qubits(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": -1,
                "operations": [],
            },
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_QUBIT"

    def test_generate_invalid_gate(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 1,
                "operations": [{"gate": "FOO", "targets": [0]}],
            },
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_GATE"

    def test_generate_invalid_target_count(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 2,
                "operations": [{"gate": "H", "targets": [0, 1]}],
            },
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_GATE_TARGETS"

    def test_generate_duplicate_targets(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 2,
                "operations": [{"gate": "CNOT", "targets": [0, 0]}],
            },
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_GATE_TARGETS"

    def test_generate_out_of_range_target(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": {
                "num_qubits": 2,
                "operations": [{"gate": "H", "targets": [5]}],
            },
        })
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_QUBIT"


# ─── Round-trip Test ─────────────────────────────────────────────────────────

class TestRoundTrip:
    def test_generate_then_parse(self):
        circuit = {
            "num_qubits": 2,
            "operations": [
                {"gate": "H", "targets": [0]},
                {"gate": "CNOT", "targets": [0, 1]},
            ],
        }

        gen_response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": circuit,
        })
        assert gen_response.status_code == 200
        gen_data = gen_response.json()
        assert gen_data["success"] is True

        parse_response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": gen_data["code"],
        })
        assert parse_response.status_code == 200
        parse_data = parse_response.json()
        assert parse_data["success"] is True
        assert parse_data["circuit"]["num_qubits"] == circuit["num_qubits"]
        assert parse_data["circuit"]["operations"] == circuit["operations"]

    def test_round_trip_three_qubit_circuit(self):
        circuit = {
            "num_qubits": 3,
            "operations": [
                {"gate": "H", "targets": [0]},
                {"gate": "X", "targets": [2]},
                {"gate": "CNOT", "targets": [0, 1]},
                {"gate": "SWAP", "targets": [1, 2]},
            ],
        }

        gen_response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": circuit,
        })
        gen_data = gen_response.json()
        assert gen_data["success"] is True

        parse_response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": gen_data["code"],
        })
        parse_data = parse_response.json()
        assert parse_data["success"] is True
        assert parse_data["circuit"]["num_qubits"] == circuit["num_qubits"]
        assert parse_data["circuit"]["operations"] == circuit["operations"]

    def test_round_trip_all_single_qubit_gates(self):
        circuit = {
            "num_qubits": 1,
            "operations": [
                {"gate": "I", "targets": [0]},
                {"gate": "X", "targets": [0]},
                {"gate": "Y", "targets": [0]},
                {"gate": "Z", "targets": [0]},
                {"gate": "H", "targets": [0]},
                {"gate": "S", "targets": [0]},
                {"gate": "T", "targets": [0]},
            ],
        }

        gen_response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": circuit,
        })
        gen_data = gen_response.json()
        assert gen_data["success"] is True

        parse_response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": gen_data["code"],
        })
        parse_data = parse_response.json()
        assert parse_data["success"] is True
        assert parse_data["circuit"]["num_qubits"] == circuit["num_qubits"]
        assert parse_data["circuit"]["operations"] == circuit["operations"]

    def test_round_trip_all_two_qubit_gates(self):
        circuit = {
            "num_qubits": 3,
            "operations": [
                {"gate": "CNOT", "targets": [0, 1]},
                {"gate": "CZ", "targets": [1, 2]},
                {"gate": "SWAP", "targets": [0, 2]},
            ],
        }

        gen_response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": circuit,
        })
        gen_data = gen_response.json()
        assert gen_data["success"] is True

        parse_response = client.post("/api/quantum/parse", json={
            "language": "python",
            "code": gen_data["code"],
        })
        parse_data = parse_response.json()
        assert parse_data["success"] is True
        assert parse_data["circuit"]["num_qubits"] == circuit["num_qubits"]
        assert parse_data["circuit"]["operations"] == circuit["operations"]


# ─── Existing Execute Endpoint ───────────────────────────────────────────────

class TestExecute:
    def test_execute_still_works(self):
        response = client.post("/api/quantum/execute", json={
            "backend": "pennylane",
            "shots": 100,
            "circuit": {
                "num_qubits": 2,
                "operations": [
                    {"gate": "H", "targets": [0]},
                    {"gate": "CNOT", "targets": [0, 1]},
                ],
            },
        })
        assert response.status_code == 200
        data = response.json()
        assert data["backend"] == "pennylane"
        assert data["shots"] == 100
        assert data["num_qubits"] == 2
        assert "counts" in data
        assert "probabilities" in data
        assert "elapsed_time_ms" in data
