"""QUBERA AI Tutor HTTP service.

Wraps the existing RAG pipeline (`src/ragpipeline`) with a FastAPI surface so
the Node tutor/agent layer can request grounded answers over HTTP.

    POST /api/tutor/chat
    GET  /health

The RAG pipeline is built once per process and cached. All heavy imports are
deferred to `tutor_service.TutorService` so this module stays lightweight.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from tutor_service import TutorService, TutorUnavailableError


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Build the RAG pipeline once per process. Tests may inject a stubbed
    # service before startup, in which case the existing instance is kept.
    if not hasattr(_app.state, "tutor_service"):
        _app.state.tutor_service = TutorService()
    yield


app = FastAPI(title="QUBERA AI Tutor Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    studentId: str | None = None
    context: dict | None = None


class ChatResponse(BaseModel):
    success: bool = True
    message: str
    grounded: bool
    sources: list[dict] = []


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-tutor"}


@app.post("/api/tutor/chat")
def tutor_chat(req: ChatRequest):
    service = getattr(app.state, "tutor_service", None)
    if service is None:  # pragma: no cover - guarded by startup
        service = TutorService()

    try:
        result = service.ask(req.message, context=req.context)
    except TutorUnavailableError as exc:
        return {
            "success": False,
            "error": {"type": "KNOWLEDGE_BASE_UNAVAILABLE", "message": str(exc)},
        }

    return ChatResponse(
        message=result["message"],
        grounded=result["grounded"],
        sources=result["sources"],
    )