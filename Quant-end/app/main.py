"""QUBERA quantum execution service.

Takes canonical Circuit IR, executes/simulates it with a selected backend
(Qiskit, PennyLane, or Cirq), and returns normalized quantum results
(counts, probabilities, statevector, bloch_vectors) for QUBERA's
visualizations.

Code conversion (generation) and code parsing are NOT responsibilities of
this service; they are handled by the frontend/Node.js architecture.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.exception import APIError
from app.routes.quantum import router as quantum_router

app = FastAPI(title="QUBERA Quantum Execution Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quantum_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": {"type": exc.code, "message": exc.message},
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": {
                "type": "VALIDATION_ERROR",
                "message": "Invalid request body",
            },
        },
    )