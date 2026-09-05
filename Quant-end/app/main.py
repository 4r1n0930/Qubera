from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.exception import APIError
from app.quantum.executor import QuantumExecutor
from app.quantum.generators import generate_python_circuit
from app.quantum.parsers import parse_python_circuit
from app.schemas import (
    ExecuteRequest,
    ExecuteResponse,
    ParseRequest,
    ParseResponse,
    GenerateRequest,
    GenerateResponse,
)

app = FastAPI(title="Quantum Service API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = QuantumExecutor()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/quantum/execute", response_model=ExecuteResponse)
def execute(request: ExecuteRequest):
    try:
        return executor.execute(request)
    except ValueError as e:
        raise APIError(code="INVALID_BACKEND", message=str(e))
    except Exception as e:
        raise APIError(code="CIRCUIT_EXECUTION_ERROR", message=str(e))


@app.post("/api/quantum/parse", response_model=ParseResponse)
def parse(request: ParseRequest):
    try:
        framework = request.framework or "qiskit"
        return parse_python_circuit(request.code, framework=framework)
    except Exception as e:
        raise APIError(code="PARSE_ERROR", message=str(e))


@app.post("/api/quantum/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest):
    try:
        framework = request.framework or "qiskit"
        result = generate_python_circuit(request.circuit.model_dump(), framework=framework)
        if result.get("success"):
            result["framework"] = framework
        return result
    except Exception as e:
        raise APIError(code="GENERATION_ERROR", message=str(e))


@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=400,
        content={"error": {"code": exc.code, "message": exc.message}},
    )