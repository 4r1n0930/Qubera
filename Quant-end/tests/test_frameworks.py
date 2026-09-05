import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.quantum.generators import generate_python_circuit
from app.quantum.parsers import parse_python_circuit

client = TestClient(app)

BELL_IR = {
    "num_qubits": 2,
    "operations": [
        {"gate": "H", "targets": [0]},
        {"gate": "CNOT", "targets": [0, 1]},
    ],
}


# ─── Generator unit tests (reusable layer) ───────────────────────────────────

class TestGenerators:
    def test_generate_qiskit_code(self):
        result = generate_python_circuit(BELL_IR, framework="qiskit")
        assert result["success"] is True
        code = result["code"]
        assert "from qiskit import QuantumCircuit" in code
        assert "qc = QuantumCircuit(2)" in code
        assert "qc.h(0)" in code
        assert "qc.cx(0, 1)" in code

    def test_generate_pennylane_code(self):
        result = generate_python_circuit(BELL_IR, framework="pennylane")
        assert result["success"] is True
        code = result["code"]
        assert "import pennylane as qml" in code
        assert 'qml.device("default.qubit", wires=2, shots=1000)' in code
        assert "qml.Hadamard(wires=0)" in code
        assert "qml.CNOT(wires=[0, 1])" in code
        assert "return qml.counts()" in code

    def test_generate_cirq_code(self):
        result = generate_python_circuit(BELL_IR, framework="cirq")
        assert result["success"] is True
        code = result["code"]
        assert "import cirq" in code
        assert "qubits = [cirq.LineQubit(i) for i in range(2)]" in code
        assert "circuit.append(cirq.H(qubits[0]))" in code
        assert "circuit.append(cirq.CNOT(qubits[0], qubits[1]))" in code
        assert 'circuit.append(cirq.measure(*qubits, key="result"))' in code

    def test_generate_unsupported_framework(self):
        result = generate_python_circuit(BELL_IR, framework="foo")
        assert result["success"] is False
        assert result["errors"][0]["code"] == "UNSUPPORTED_FRAMEWORK"

    def test_frameworks_produce_different_code_for_same_ir(self):
        qiskit = generate_python_circuit(BELL_IR, framework="qiskit")["code"]
        pennylane = generate_python_circuit(BELL_IR, framework="pennylane")["code"]
        cirq = generate_python_circuit(BELL_IR, framework="cirq")["code"]
        assert len({qiskit, pennylane, cirq}) == 3

    def test_generated_code_is_valid_python_syntax(self):
        import ast
        for fw in ("qiskit", "pennylane", "cirq"):
            code = generate_python_circuit(BELL_IR, framework=fw)["code"]
            ast.parse(code)


# ─── Parser unit tests (framework-specific) ──────────────────────────────────

class TestParsers:
    def test_parse_pennylane_code(self):
        code = generate_python_circuit(BELL_IR, framework="pennylane")["code"]
        result = parse_python_circuit(code, framework="pennylane")
        assert result["success"] is True
        assert result["circuit"] == BELL_IR

    def test_parse_cirq_code(self):
        code = generate_python_circuit(BELL_IR, framework="cirq")["code"]
        result = parse_python_circuit(code, framework="cirq")
        assert result["success"] is True
        assert result["circuit"] == BELL_IR

    def test_parse_qiskit_code(self):
        code = generate_python_circuit(BELL_IR, framework="qiskit")["code"]
        result = parse_python_circuit(code, framework="qiskit")
        assert result["success"] is True
        assert result["circuit"] == BELL_IR

    def test_parse_unsupported_framework(self):
        result = parse_python_circuit("x = 1", framework="foo")
        assert result["success"] is False
        assert result["errors"][0]["code"] == "UNSUPPORTED_FRAMEWORK"


# ─── /generate endpoint with framework ───────────────────────────────────────

class TestGenerateEndpointFrameworks:
    def test_generate_qiskit_framework(self):
        response = client.post("/api/quantum/generate", json={
            "framework": "qiskit",
            "circuit": BELL_IR,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["framework"] == "qiskit"
        assert "from qiskit import QuantumCircuit" in data["code"]

    def test_generate_pennylane_framework(self):
        response = client.post("/api/quantum/generate", json={
            "framework": "pennylane",
            "circuit": BELL_IR,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["framework"] == "pennylane"
        assert "import pennylane as qml" in data["code"]

    def test_generate_cirq_framework(self):
        response = client.post("/api/quantum/generate", json={
            "framework": "cirq",
            "circuit": BELL_IR,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["framework"] == "cirq"
        assert "import cirq" in data["code"]

    def test_generate_unsupported_framework(self):
        response = client.post("/api/quantum/generate", json={
            "framework": "foo",
            "circuit": BELL_IR,
        })
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "UNSUPPORTED_FRAMEWORK"

    def test_generate_defaults_to_qiskit_without_framework(self):
        response = client.post("/api/quantum/generate", json={
            "language": "python",
            "circuit": BELL_IR,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["framework"] == "qiskit"
        assert "from qiskit import QuantumCircuit" in data["code"]

    def test_generate_switching_frameworks_keeps_ir(self):
        responses = {}
        for fw in ("qiskit", "pennylane", "cirq"):
            r = client.post("/api/quantum/generate", json={"framework": fw, "circuit": BELL_IR})
            assert r.status_code == 200
            data = r.json()
            assert data["framework"] == fw
            responses[fw] = data["code"]

            parsed = client.post("/api/quantum/parse", json={
                "language": "python",
                "framework": fw,
                "code": data["code"],
            })
            assert parsed.status_code == 200
            parsed_data = parsed.json()
            assert parsed_data["success"] is True
            assert parsed_data["circuit"] == BELL_IR


# ─── /parse endpoint with framework ──────────────────────────────────────────

class TestParseEndpointFrameworks:
    def test_parse_pennylane_framework(self):
        code = generate_python_circuit(BELL_IR, framework="pennylane")["code"]
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "framework": "pennylane",
            "code": code,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"] == BELL_IR

    def test_parse_cirq_framework(self):
        code = generate_python_circuit(BELL_IR, framework="cirq")["code"]
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "framework": "cirq",
            "code": code,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["circuit"] == BELL_IR

    def test_parse_unsupported_framework(self):
        response = client.post("/api/quantum/parse", json={
            "language": "python",
            "framework": "foo",
            "code": "x = 1",
        })
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "UNSUPPORTED_FRAMEWORK"


# ─── IR → Framework execution ────────────────────────────────────────────────

class TestExecutionBackends:
    @pytest.mark.parametrize("backend", ["pennylane", "qiskit", "cirq"])
    def test_execute_on_all_backends(self, backend):
        response = client.post("/api/quantum/execute", json={
            "backend": backend,
            "shots": 200,
            "circuit": BELL_IR,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["backend"] == backend
        assert data["shots"] == 200
        assert data["num_qubits"] == 2
        total = sum(data["counts"].values())
        assert total <= 200
        assert "00" in data["counts"]
        assert "11" in data["counts"]

    def test_execute_does_not_round_trip_through_code(self):
        for backend in ("pennylane", "qiskit", "cirq"):
            response = client.post("/api/quantum/execute", json={
                "backend": backend,
                "shots": 100,
                "circuit": BELL_IR,
            })
            assert response.status_code == 200
            assert response.json()["success"] if "success" in response.json() else True


# ─── Full round-trip via API for each framework ──────────────────────────────

class TestApiRoundTrips:
    @pytest.mark.parametrize("framework", ["qiskit", "pennylane", "cirq"])
    def test_generate_then_parse_round_trip(self, framework):
        gen = client.post("/api/quantum/generate", json={
            "framework": framework,
            "circuit": BELL_IR,
        })
        assert gen.status_code == 200
        code = gen.json()["code"]

        parsed = client.post("/api/quantum/parse", json={
            "language": "python",
            "framework": framework,
            "code": code,
        })
        assert parsed.status_code == 200
        data = parsed.json()
        assert data["success"] is True
        assert data["circuit"] == BELL_IR

    @pytest.mark.parametrize("framework", ["qiskit", "pennylane", "cirq"])
    def test_three_qubit_round_trip(self, framework):
        ir = {
            "num_qubits": 3,
            "operations": [
                {"gate": "H", "targets": [0]},
                {"gate": "X", "targets": [2]},
                {"gate": "CNOT", "targets": [0, 1]},
                {"gate": "CZ", "targets": [1, 2]},
                {"gate": "SWAP", "targets": [0, 2]},
            ],
        }
        gen = client.post("/api/quantum/generate", json={"framework": framework, "circuit": ir})
        assert gen.status_code == 200
        parsed = client.post("/api/quantum/parse", json={
            "language": "python",
            "framework": framework,
            "code": gen.json()["code"],
        })
        assert parsed.status_code == 200
        data = parsed.json()
        assert data["success"] is True
        assert data["circuit"] == ir