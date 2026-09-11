"""HTTP routes for the execution-only quantum service."""

from fastapi import APIRouter

from app.schemas.quantum import ExecuteRequest, ExecuteResponse
from app.services.execution import QuantumExecutor

router = APIRouter()

executor = QuantumExecutor()


@router.post("/api/quantum/execute", response_model=ExecuteResponse)
def execute(request: ExecuteRequest) -> ExecuteResponse | dict:
    return executor.execute(request)