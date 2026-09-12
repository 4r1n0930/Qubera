/**
 * Quantum execution for tutor tools.
 *
 * The tutor ALWAYS runs circuits through the existing Node quantum gateway
 * (POST /api/quantum/execute → Quant-end Python service). It never simulates
 * locally and never talks to the Python service directly, so the single
 * authoritative execution path is preserved.
 */

import axios from "axios";

const NODE_GATEWAY_URL = (
  process.env.VITE_API_URL ||
  process.env.API_GATEWAY_URL ||
  "http://localhost:3000/api"
).replace(/\/$/, "");

const DEFAULT_OUTPUT = [
  "counts",
  "probabilities",
  "statevector",
  "bloch_vectors",
];

/**
 * Executes a canonical Circuit IR through the Node gateway.
 * Resolves with the gateway's normalized response (counts, probabilities,
 * statevector, bloch_vectors, elapsed_time_ms).
 */
export async function executeCircuit(circuit, { backend = "qiskit", shots = 1000, output = DEFAULT_OUTPUT } = {}) {
  if (!circuit || typeof circuit.num_qubits !== "number") {
    throw new Error("A valid circuit is required to run an experiment.");
  }

  try {
    const response = await axios.post(
      `${NODE_GATEWAY_URL}/quantum/execute`,
      { backend, shots, circuit, output },
      { timeout: 60000, validateStatus: () => true }
    );

    if (response.status >= 400) {
      const error = response.data?.error || response.data;
      throw new Error(
        `Quantum execution failed: ${error?.type || "REQUEST_FAILED"} — ${
          error?.message || JSON.stringify(response.data)
        }`
      );
    }

    return response.data;
  } catch (error) {
    if (error.response !== undefined) throw error;
    throw new Error(
      `Quantum simulation service unreachable (${error.code || error.message}).`
    );
  }
}