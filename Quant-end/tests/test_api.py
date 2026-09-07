import math

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ALL_BACKENDS = ["qiskit", "pennylane", "cirq"]

ALL_OUTPUTS = ["counts", "probabilities", "statevector", "bloch_vectors"]

BELL_IR = {
    "num_qubits": 2,
    "operations": [
        {"gate": "H", "targets": [0]},
        {"gate": "CNOT", "targets": [0, 1]},
    ],
}


def execute(payload):
    response = client.post("/api/quantum/execute", json=payload)
    assert response.status_code == 200, response.text
    return response.json()


def assert_error(payload, code):
    response = client.post("/api/quantum/execute", json=payload)
    assert response.status_code == 400, response.text
    data = response.json()
    assert data["success"] is False
    assert data["error"]["type"] == code
    assert data["error"]["message"]


def assert_bell_statevector(statevector):
    """Bell state (|00> + |11>)/sqrt(2) up to backend floating-point noise."""
    assert len(statevector) == 4
    assert statevector[0] == pytest.approx({"real": 0.70710678, "imag": 0.0}, abs=1e-6)
    assert statevector[1] == pytest.approx({"real": 0.0, "imag": 0.0}, abs=1e-6)
    assert statevector[2] == pytest.approx({"real": 0.0, "imag": 0.0}, abs=1e-6)
    assert statevector[3] == pytest.approx({"real": 0.70710678, "imag": 0.0}, abs=1e-6)


# ─── Health ───────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


# ─── Removed endpoints ────────────────────────────────────────────────────────

class TestRemovedEndpoints:
    @pytest.mark.parametrize("path", ["/api/quantum/generate", "/api/quantum/parse"])
    def test_removed_endpoints_return_404(self, path):
        response = client.post(path, json={})
        assert response.status_code == 404


# ─── Baseline execute behavior ────────────────────────────────────────────────

class TestExecuteBaseline:
    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_bell_default_returns_all_outputs(self, backend):
        data = execute({"backend": backend, "shots": 200, "circuit": BELL_IR})
        assert data["success"] is True
        assert data["backend"] == backend
        assert data["shots"] == 200
        assert data["num_qubits"] == 2
        assert data["output"] == ALL_OUTPUTS
        assert data["probabilities"] == {"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5}
        assert "00" in data["counts"] and "11" in data["counts"]
        assert sum(data["counts"].values()) == 200
        assert_bell_statevector(data["statevector"])
        assert data["bloch_vectors"] == {
            "q0": {"x": 0.0, "y": 0.0, "z": 0.0},
            "q1": {"x": 0.0, "y": 0.0, "z": 0.0},
        }
        assert isinstance(data["elapsed_time_ms"], float)

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_empty_circuit_is_all_zeros(self, backend):
        data = execute({
            "backend": backend,
            "shots": 100,
            "circuit": {"num_qubits": 2, "operations": []},
        })
        assert data["counts"] == {"00": 100}
        assert data["probabilities"] == {"00": 1.0, "01": 0.0, "10": 0.0, "11": 0.0}


# ─── Output selection ─────────────────────────────────────────────────────────

class TestOutputSelection:
    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_counts_only(self, backend):
        data = execute({"backend": backend, "shots": 100, "output": ["counts"], "circuit": BELL_IR})
        assert data["output"] == ["counts"]
        assert data["counts"] is not None
        assert data["probabilities"] is None
        assert data["statevector"] is None
        assert data["bloch_vectors"] is None

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_probabilities_only(self, backend):
        data = execute({
            "backend": backend,
            "shots": 100,
            "output": ["probabilities"],
            "circuit": BELL_IR,
        })
        assert data["output"] == ["probabilities"]
        assert data["counts"] is None
        assert data["probabilities"] == {"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5}
        assert data["statevector"] is None
        assert data["bloch_vectors"] is None

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_statevector_only(self, backend):
        data = execute({
            "backend": backend,
            "shots": 100,
            "output": ["statevector"],
            "circuit": BELL_IR,
        })
        assert data["output"] == ["statevector"]
        assert data["counts"] is None
        assert data["probabilities"] is None
        assert_bell_statevector(data["statevector"])
        assert data["bloch_vectors"] is None

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_bloch_vectors_only(self, backend):
        circ = {"num_qubits": 1, "operations": [{"gate": "H", "targets": [0]}]}
        data = execute({
            "backend": backend,
            "shots": 100,
            "output": ["bloch_vectors"],
            "circuit": circ,
        })
        assert data["output"] == ["bloch_vectors"]
        assert data["counts"] is None
        assert data["probabilities"] is None
        assert data["statevector"] is None
        assert data["bloch_vectors"] == {"q0": {"x": 1.0, "y": 0.0, "z": 0.0}}

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_all_outputs_together(self, backend):
        data = execute({
            "backend": backend,
            "shots": 200,
            "output": ALL_OUTPUTS,
            "circuit": BELL_IR,
        })
        assert data["output"] == ALL_OUTPUTS
        assert data["counts"] is not None
        assert data["probabilities"] == {"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5}
        assert_bell_statevector(data["statevector"])
        assert data["bloch_vectors"] == {
            "q0": {"x": 0.0, "y": 0.0, "z": 0.0},
            "q1": {"x": 0.0, "y": 0.0, "z": 0.0},
        }


# ─── Known states across backends ─────────────────────────────────────────────

class TestKnownStates:
    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_x_on_second_qubit_bit_ordering(self, backend):
        circ = {"num_qubits": 2, "operations": [{"gate": "X", "targets": [1]}]}
        data = execute({"backend": backend, "shots": 100, "circuit": circ})
        assert data["counts"] == {"01": 100}
        assert data["probabilities"] == {"00": 0.0, "01": 1.0, "10": 0.0, "11": 0.0}
        assert data["statevector"] == [
            {"real": 0.0, "imag": 0.0},
            {"real": 1.0, "imag": 0.0},
            {"real": 0.0, "imag": 0.0},
            {"real": 0.0, "imag": 0.0},
        ]
        assert data["bloch_vectors"]["q1"] == {"x": 0.0, "y": 0.0, "z": -1.0}

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_plus_state_bloch(self, backend):
        circ = {"num_qubits": 2, "operations": [{"gate": "H", "targets": [0]}]}
        data = execute({"backend": backend, "shots": 100, "circuit": circ})
        assert data["bloch_vectors"]["q0"] == {"x": 1.0, "y": 0.0, "z": 0.0}
        assert data["bloch_vectors"]["q1"] == {"x": 0.0, "y": 0.0, "z": 1.0}

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_minus_state_bloch(self, backend):
        circ = {
            "num_qubits": 1,
            "operations": [{"gate": "X", "targets": [0]}, {"gate": "H", "targets": [0]}],
        }
        data = execute({"backend": backend, "shots": 100, "circuit": circ})
        assert data["bloch_vectors"]["q0"] == {"x": -1.0, "y": 0.0, "z": 0.0}
        assert set(data["counts"].keys()) == {"0", "1"}
        assert sum(data["counts"].values()) == 100

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_quarter_x_rotation_is_y_up(self, backend):
        circ = {"num_qubits": 1, "operations": [{"gate": "RX", "targets": [0], "params": [math.pi / 2]}]}
        data = execute({"backend": backend, "shots": 100, "circuit": circ})
        assert data["bloch_vectors"]["q0"] == {"x": 0.0, "y": 1.0, "z": 0.0}


# ─── Mid-circuit reset ────────────────────────────────────────────────────────

class TestReset:
    RESET_IR = {
        "num_qubits": 2,
        "operations": [
            {"gate": "X", "targets": [0]},
            {"gate": "reset", "targets": [0]},
            {"gate": "CNOT", "targets": [0, 1]},
        ],
    }

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_reset_counts_and_probabilities(self, backend):
        data = execute({
            "backend": backend,
            "shots": 100,
            "output": ["counts", "probabilities"],
            "circuit": self.RESET_IR,
        })
        assert data["output"] == ["counts", "probabilities"]
        assert data["counts"] == {"00": 100}
        assert data["probabilities"] == {"00": 1.0}
        assert data["statevector"] is None
        assert data["bloch_vectors"] is None

    @pytest.mark.parametrize("output", [["statevector"], ["bloch_vectors"], ["statevector", "bloch_vectors"]])
    def test_statevector_from_reset_is_rejected(self, output):
        assert_error(
            {
                "backend": "qiskit",
                "shots": 100,
                "output": output,
                "circuit": self.RESET_IR,
            },
            "STATEVECTOR_NOT_AVAILABLE",
        )

    def test_reset_with_default_outputs_is_rejected(self):
        assert_error(
            {"backend": "qiskit", "shots": 100, "circuit": self.RESET_IR},
            "STATEVECTOR_NOT_AVAILABLE",
        )


# ─── Cross-backend consistency ────────────────────────────────────────────────

class TestCrossBackendConsistency:
    def test_bell_agreement_across_backends(self):
        results = {}
        for backend in ALL_BACKENDS:
            data = execute({"backend": backend, "shots": 500, "circuit": BELL_IR})
            results[backend] = data
            assert data["probabilities"] == {"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5}

        ref = results[ALL_BACKENDS[0]]
        for backend in ALL_BACKENDS[1:]:
            other = results[backend]
            for index, comp in enumerate(ref["statevector"]):
                assert other["statevector"][index] == pytest.approx(comp, abs=1e-6)
            for qubit in ("q0", "q1"):
                for axis in ("x", "y", "z"):
                    assert other["bloch_vectors"][qubit][axis] == pytest.approx(
                        ref["bloch_vectors"][qubit][axis], abs=1e-6
                    )

    def test_rx_pi_equals_x_across_backends(self):
        via_rotation = execute({
            "backend": "qiskit",
            "shots": 100,
            "circuit": {"num_qubits": 1, "operations": [{"gate": "RX", "targets": [0], "params": [math.pi]}]},
        })["counts"]
        direct = {}
        for backend in ALL_BACKENDS:
            direct[backend] = execute({
                "backend": backend,
                "shots": 100,
                "circuit": {"num_qubits": 1, "operations": [{"gate": "X", "targets": [0]}]},
            })["counts"]
            assert direct[backend] == {"1": 100}
        assert via_rotation == {"1": 100}


# ─── Request validation errors ────────────────────────────────────────────────

class TestValidationErrors:
    GOOD_CIRCUIT = {"num_qubits": 1, "operations": [{"gate": "H", "targets": [0]}]}

    def test_invalid_backend(self):
        assert_error({"backend": "foo", "shots": 10, "circuit": self.GOOD_CIRCUIT}, "INVALID_BACKEND")

    @pytest.mark.parametrize("shots", [0, -1, 100001])
    def test_invalid_shots(self, shots):
        assert_error({"backend": "qiskit", "shots": shots, "circuit": self.GOOD_CIRCUIT}, "INVALID_SHOTS")

    @pytest.mark.parametrize("output", [[], ["foo"], ["counts", "blah"]])
    def test_invalid_output(self, output):
        assert_error(
            {"backend": "qiskit", "shots": 10, "output": output, "circuit": self.GOOD_CIRCUIT},
            "INVALID_OUTPUT",
        )

    def test_zero_qubits(self):
        assert_error(
            {"backend": "qiskit", "shots": 10, "circuit": {"num_qubits": 0, "operations": []}},
            "INVALID_QUBIT",
        )

    def test_unknown_gate(self):
        assert_error(
            {
                "backend": "qiskit",
                "shots": 10,
                "circuit": {"num_qubits": 1, "operations": [{"gate": "FOO", "targets": [0]}]},
            },
            "INVALID_GATE",
        )

    def test_wrong_target_count_single_qubit(self):
        assert_error(
            {
                "backend": "qiskit",
                "shots": 10,
                "circuit": {"num_qubits": 2, "operations": [{"gate": "H", "targets": [0, 1]}]},
            },
            "INVALID_GATE_TARGETS",
        )

    def test_duplicate_targets_two_qubit(self):
        assert_error(
            {
                "backend": "qiskit",
                "shots": 10,
                "circuit": {"num_qubits": 2, "operations": [{"gate": "CNOT", "targets": [0, 0]}]},
            },
            "INVALID_GATE_TARGETS",
        )

    def test_missing_rotation_parameter(self):
        assert_error(
            {
                "backend": "qiskit",
                "shots": 10,
                "circuit": {"num_qubits": 1, "operations": [{"gate": "RX", "targets": [0]}]},
            },
            "INVALID_GATE_PARAMS",
        )

    def test_out_of_range_target(self):
        assert_error(
            {
                "backend": "qiskit",
                "shots": 10,
                "circuit": {"num_qubits": 1, "operations": [{"gate": "H", "targets": [5]}]},
            },
            "INVALID_QUBIT",
        )

    def test_missing_required_field_is_validation_error(self):
        assert_error({"backend": "qiskit", "shots": 10}, "VALIDATION_ERROR")
        assert_error({"backend": "qiskit", "circuit": self.GOOD_CIRCUIT}, "VALIDATION_ERROR")


# ─── Unsupported gates must fail before the backend runs ─────────────────────

class TestGateCoverage:
    ALL_GATES_EXAMPLE = {
        "num_qubits": 3,
        "operations": [
            {"gate": "I", "targets": [0]},
            {"gate": "X", "targets": [1]},
            {"gate": "Y", "targets": [1]},
            {"gate": "Z", "targets": [1]},
            {"gate": "H", "targets": [2]},
            {"gate": "S", "targets": [2]},
            {"gate": "Sdg", "targets": [2]},
            {"gate": "T", "targets": [2]},
            {"gate": "Tdg", "targets": [2]},
            {"gate": "CNOT", "targets": [1, 2]},
            {"gate": "CZ", "targets": [1, 2]},
            {"gate": "SWAP", "targets": [1, 2]},
            {"gate": "barrier", "targets": [0, 1, 2]},
            {"gate": "CCX", "targets": [0, 1, 2]},
            {"gate": "CCZ", "targets": [0, 1, 2]},
        ],
    }

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_broad_gate_set_runs_on_all_backends(self, backend):
        data = execute({
            "backend": backend,
            "shots": 100,
            "circuit": self.ALL_GATES_EXAMPLE,
        })
        assert sum(data["counts"].values()) == 100
        assert sum(data["probabilities"].values()) == pytest.approx(1.0)