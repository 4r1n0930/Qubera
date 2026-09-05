from typing import Optional

from app.quantum.generators import cirq_generator, pennylane_generator, qiskit_generator

GENERATORS = {
    "qiskit": qiskit_generator.generate,
    "pennylane": pennylane_generator.generate,
    "cirq": cirq_generator.generate,
}


def generate_python_circuit(circuit: dict, framework: str = "qiskit") -> dict:
    generator = GENERATORS.get(framework)
    if generator is None:
        return {
            "success": False,
            "code": None,
            "errors": [{"code": "UNSUPPORTED_FRAMEWORK", "message": f"Unsupported framework: {framework}"}],
        }
    return generator(circuit)


def available_frameworks() -> list:
    return list(GENERATORS.keys())


def get_generator(framework: str):
    return GENERATORS.get(framework)