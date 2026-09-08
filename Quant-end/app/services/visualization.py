"""Normalization of raw quantum results into JSON-safe visualization outputs.

All functions assume the statevector uses the canonical ordering where index
`i` corresponds to the bitstring `format(i, n)` with qubit 0 as the most
significant bit (q0-leftmost).
"""

import numpy as np

_COMPLEX_PRECISION = 8
_PROB_PRECISION = 6
_BLOCH_PRECISION = 6


def probabilities_from_statevector(statevector: np.ndarray, num_qubits: int) -> dict:
    """Ideal (theoretical) probability distribution from the final statevector."""
    probabilities: dict[str, float] = {}
    for index, amplitude in enumerate(statevector):
        key = format(index, f"0{num_qubits}b")
        probabilities[key] = round(float((amplitude * amplitude.conjugate()).real), _PROB_PRECISION)
    return probabilities


def probabilities_from_counts(counts: dict, shots: int) -> dict:
    """Empirical probability distribution estimated from finite-shot counts."""
    return {key: round(float(count) / shots, _PROB_PRECISION) for key, count in counts.items()}


def statevector_to_json(statevector: np.ndarray) -> list:
    """Convert a complex statevector into JSON-safe {real, imag} components."""
    return [
        {
            "real": round(float(amplitude.real), _COMPLEX_PRECISION),
            "imag": round(float(amplitude.imag), _COMPLEX_PRECISION),
        }
        for amplitude in statevector
    ]


def bloch_vectors_from_statevector(statevector: np.ndarray, num_qubits: int) -> dict:
    """Compute each qubit's Bloch vector from its reduced density matrix.

    The Bloch vector of a qubit is derived from its single-qubit reduced
    density matrix obtained by partial trace, so it correctly captures
    superpositions and entanglement (it is not derived from Z-basis
    probabilities alone).

    Convention: for a pure state |ψ⟩ = α|0⟩ + β|1⟩ the vector components are
        x = 2·Re(α*β)
        y = 2·Im(α*β)
        z = |α|² − |β|²
    so that |0⟩ → +Z, |1⟩ → −Z, |+⟩ → +X, |−⟩ → −X, |+i⟩ → +Y, |-i⟩ → −Y.

    In density-matrix terms ρ = [[|α|², α·β*], [α*·β, |β|²]], so the |1⟩-|0⟩
    cross term is ρ[0,1] = α·β* = conj(α*·β). The y-component therefore picks
    up a minus sign relative to rho's off-diagonal imaginary part:
        y = 2·Im(α*β) = −2·Im(ρ[0,1]).
    """
    vectors: dict[str, dict] = {}
    for qubit in range(num_qubits):
        rho = qubit_reduced_density_matrix(statevector, qubit, num_qubits)
        vectors[f"q{qubit}"] = {
            "x": round(2 * rho[0, 1].real, _BLOCH_PRECISION),
            "y": round(-2 * rho[0, 1].imag, _BLOCH_PRECISION),
            "z": round((rho[0, 0] - rho[1, 1]).real, _BLOCH_PRECISION),
        }
    return vectors


def qubit_reduced_density_matrix(statevector: np.ndarray, target: int, num_qubits: int) -> np.ndarray:
    """Partial-trace a statevector down to a single qubit's 2x2 density matrix."""
    state = np.asarray(statevector, dtype=complex).reshape([2] * num_qubits)
    rho = np.tensordot(state, state.conj(), axes=0)

    remaining = list(range(2 * num_qubits))
    for qubit in range(num_qubits):
        if qubit == target:
            continue
        row_pos = remaining.index(qubit)
        col_pos = remaining.index(num_qubits + qubit)
        rho = np.trace(rho, axis1=min(row_pos, col_pos), axis2=max(row_pos, col_pos))
        remaining = [axis for axis in remaining if axis not in (qubit, num_qubits + qubit)]

    return np.asarray(rho, dtype=complex).reshape(2, 2)