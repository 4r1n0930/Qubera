from app.quantum.parsers import cirq_parser, pennylane_parser, qiskit_parser

PARSERS = {
    "qiskit": qiskit_parser.parse,
    "pennylane": pennylane_parser.parse,
    "cirq": cirq_parser.parse,
}


def parse_python_circuit(code: str, framework: str = "qiskit") -> dict:
    parser = PARSERS.get(framework)
    if parser is None:
        return {
            "success": False,
            "circuit": None,
            "errors": [{"code": "UNSUPPORTED_FRAMEWORK", "message": f"Unsupported framework: {framework}"}],
        }
    return parser(code)