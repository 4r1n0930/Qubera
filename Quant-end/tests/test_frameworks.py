"""Backend-level and visualization-unit tests for the execution service.

These tests exercise the simulator backends (Qiskit, PennyLane, Cirq) and the
output-normalization helpers directly, bypassing HTTP, and assert that all
backends agree on the canonical circuit interpretation.
"""

import math

import numpy as np
import pytest

from app.backends import BACKENDS, get_backend
from app.schemas.quantum import Circuit
from app.services.visualization import (
    bloch_vectors_from_statevector,
    probabilities_from_counts,
    probabilities_from_statevector,
    qubit_reduced_density_matrix,
    statevector_to_json,
)

ALL_BACKENDS = ["qiskit", "pennylane", "cirq"]

BELL_IR = {
    "num_qubits": 2,
    "operations": [
        {"gate": "H", "targets": [0]},
        {"gate": "CNOT", "targets": [0, 1]},
    ],
}


def as_circuit(ir):
    return Circuit.model_validate(ir)


def make_backend(name):
    cls = get_backend(name)
    assert cls is not None
    return cls()


class TestBackendRegistry:
    def test_all_expected_backends_registered(self):
        assert set(BACKENDS) == set(ALL_BACKENDS)

    def test_unknown_backend_returns_none(self):
        assert get_backend("foo") is None


class TestBackendCounts:
    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_bell_counts(self, backend):
        counts = make_backend(backend).execute(as_circuit(BELL_IR), shots=200)
        assert sum(counts.values()) == 200
        assert set(counts.keys()) <= {"00", "01", "10", "11"}
        assert "00" in counts and "11" in counts

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_counts_sum_equals_shots(self, backend):
        counts = make_backend(backend).execute(as_circuit(BELL_IR), shots=97)
        assert sum(counts.values()) == 97

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_bit_ordering_q0_leftmost(self, backend):
        circ = as_circuit({"num_qubits": 2, "operations": [{"gate": "X", "targets": [1]}]})
        counts = make_backend(backend).execute(circ, shots=100)
        assert counts == {"01": 100}


class TestBackendStatevector:
    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_bell_statevector(self, backend):
        sv = make_backend(backend).statevector(as_circuit(BELL_IR))
        expected = np.array([1, 0, 0, 1], dtype=complex) / math.sqrt(2)
        np.testing.assert_allclose(sv, expected, atol=1e-8)

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_single_qubit_flip_statevector(self, backend):
        circ = as_circuit({"num_qubits": 2, "operations": [{"gate": "X", "targets": [1]}]})
        sv = make_backend(backend).statevector(circ)
        expected = np.array([0, 1, 0, 0], dtype=complex)
        np.testing.assert_allclose(sv, expected, atol=1e-8)

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_statevectors_agree_across_backends(self, backend):
        circ = as_circuit({
            "num_qubits": 3,
            "operations": [
                {"gate": "H", "targets": [0]},
                {"gate": "RX", "targets": [1], "params": [0.7]},
                {"gate": "RXX", "targets": [1, 2], "params": [1.1]},
                {"gate": "CCZ", "targets": [0, 1, 2]},
            ],
        })
        sv = make_backend(backend).statevector(circ)
        assert sv.shape == (8,)
        assert np.isclose(np.linalg.norm(sv), 1.0, atol=1e-8)


class TestVisualizationHelpers:
    def test_probabilities_from_statevector(self):
        sv = np.array([1, 0, 0, 1], dtype=complex) / math.sqrt(2)
        probs = probabilities_from_statevector(sv, 2)
        assert probs == {"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5}

    def test_probabilities_include_all_zero_outcomes(self):
        sv = np.array([1, 0], dtype=complex)
        assert probabilities_from_statevector(sv, 1) == {"0": 1.0, "1": 0.0}

    def test_probabilities_from_counts(self):
        counts = {"00": 30, "11": 10}
        assert probabilities_from_counts(counts, 40) == {"00": 0.75, "11": 0.25}

    def test_statevector_to_json(self):
        sv = np.array([1, 1j], dtype=complex) / math.sqrt(2)
        out = statevector_to_json(sv)
        assert out == [
            {"real": 0.70710678, "imag": 0.0},
            {"real": 0.0, "imag": 0.70710678},
        ]

    def test_bloch_plus_state(self):
        sv = np.array([1, 1], dtype=complex) / math.sqrt(2)
        assert bloch_vectors_from_statevector(sv, 1) == {"q0": {"x": 1.0, "y": 0.0, "z": 0.0}}

    def test_bloch_entangled_bell(self):
        sv = np.array([1, 0, 0, 1], dtype=complex) / math.sqrt(2)
        assert bloch_vectors_from_statevector(sv, 2) == {
            "q0": {"x": 0.0, "y": 0.0, "z": 0.0},
            "q1": {"x": 0.0, "y": 0.0, "z": 0.0},
        }

    def test_reduced_density_matrix_three_qubit_middle_qubit(self):
        sv = np.zeros(8, dtype=complex)
        sv[0b000] = 1.0
        rho = qubit_reduced_density_matrix(sv, 1, 3)
        expected = np.array([[1, 0], [0, 0]], dtype=complex)
        np.testing.assert_allclose(rho, expected, atol=1e-12)


class TestParameterizedGates:
    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_rx_pi_flips_qubit(self, backend):
        circ = as_circuit({"num_qubits": 1, "operations": [{"gate": "RX", "targets": [0], "params": [math.pi]}]})
        counts = make_backend(backend).execute(circ, shots=100)
        assert counts == {"1": 100}

    @pytest.mark.parametrize("backend", ALL_BACKENDS)
    def test_rz_half_pi_phase(self, backend):
        circ = as_circuit({
            "num_qubits": 1,
            "operations": [{"gate": "H", "targets": [0]}, {"gate": "RZ", "targets": [0], "params": [math.pi / 2]}, {"gate": "H", "targets": [0]}],
        })
        sv = make_backend(backend).statevector(circ)

        unitary = np.array([[1, 1], [1, -1]], dtype=complex) / math.sqrt(2)
        rz = np.diag([math.e ** (-1j * math.pi / 4), math.e ** (1j * math.pi / 4)])
        expected = (unitary @ rz @ unitary) @ np.array([1, 0], dtype=complex)

        phase = np.vdot(expected, sv)
        np.testing.assert_allclose(sv, phase * expected, atol=1e-8)