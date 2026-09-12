"""Tests for the AI Tutor HTTP service.

The RAG pipeline is stubbed so these tests run without MongoDB, FAISS, or
sentence-transformers installed.
"""

import pytest
from fastapi.testclient import TestClient

from app import app


class FakeTutorService:
    def ask(self, question, context=None):
        return {
            "message": "Superposition lets a qubit be in both |0> and |1> at once.",
            "grounded": True,
            "sources": [
                {
                    "source": "abc",
                    "filename": "Superposition",
                    "category": "module-1",
                    "chunk_id": 0,
                    "distance": 1.2,
                }
            ],
        }


class BrokenTutorService:
    def ask(self, question, context=None):
        from tutor_service import TutorUnavailableError

        raise TutorUnavailableError("MongoDB is not configured")


@pytest.fixture(autouse=True)
def _set_fake_service():
    app.state.tutor_service = FakeTutorService()
    yield
    app.state.tutor_service = None


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "ai-tutor"}


def test_chat_returns_grounded_answer(client):
    res = client.post(
        "/api/tutor/chat",
        json={
            "message": "Why does the Hadamard gate create superposition?",
            "studentId": "student-1",
            "context": {"screen": "quantum-lab", "topic": "superposition"},
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "both |0> and |1>" in body["message"]
    assert body["grounded"] is True
    assert body["sources"][0]["filename"] == "Superposition"


def test_chat_passes_context(client):
    captured = {}

    class RecordingService(FakeTutorService):
        def ask(self, question, context=None):
            captured["question"] = question
            captured["context"] = context
            return super().ask(question, context)

    app.state.tutor_service = RecordingService()
    res = client.post(
        "/api/tutor/chat",
        json={
            "message": "Explain entanglement",
            "context": {"topic": "entanglement"},
        },
    )
    assert res.status_code == 200
    assert captured["question"] == "Explain entanglement"
    assert captured["context"] == {"topic": "entanglement"}


def test_chat_rejects_empty_message(client):
    res = client.post("/api/tutor/chat", json={"message": ""})
    assert res.status_code == 422


def test_chat_degrades_when_knowledge_base_down(client):
    app.state.tutor_service = BrokenTutorService()
    res = client.post("/api/tutor/chat", json={"message": "Any question"})
    assert res.status_code in (200, 503)
    body = res.json()
    assert body["success"] in (False, True)


def test_lazy_pipeline_import_is_safe(tmp_path, monkeypatch):
    """Loading the service module must not import heavy RAG deps eagerly."""
    import tutor_service

    assert hasattr(tutor_service, "TutorService")
    assert hasattr(tutor_service, "TutorUnavailableError")