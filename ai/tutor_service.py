"""Callable interface around the existing Qubera RAG pipeline.

This module turns the CLI-only tutor into a reusable service object while
keeping the RAG implementation itself untouched. The heavy imports
(`src.ragpipeline`, FAISS, sentence-transformers) are loaded lazily on first
use so the HTTP service can boot quickly and be tested with a stubbed
pipeline.
"""

import os
import sys

SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(SERVICE_DIR, "src")

for _path in (SERVICE_DIR, SRC_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)


class TutorUnavailableError(Exception):
    """Raised when the knowledge base cannot be built."""


class TutorService:
    """Thin service over the existing RAG pipeline with a cached index."""

    def __init__(self):
        self._pipeline = None
        self._pipeline_error = None

    def get_pipeline(self):
        """Build (and cache) the RAG pipeline.

        Returns ``(embedding_model, vector_store, chunks)`` by delegating to
        the existing ``src.ragpipeline.build_rag_pipeline``. Never rebuilds
        once ready for a process lifetime.
        """
        if self._pipeline is not None:
            return self._pipeline
        if self._pipeline_error is not None:
            raise self._pipeline_error

        try:
            from src.ragpipeline import build_rag_pipeline

            self._pipeline = build_rag_pipeline()
            return self._pipeline
        except Exception as exc:  # pragma: no cover - depends on environment
            self._pipeline_error = exc
            raise TutorUnavailableError(
                f"Knowledge base unavailable: {exc}"
            ) from exc

    def ask(self, question, context=None):
        """Retrieve grounding knowledge and generate a RAG answer.

        Reuses the existing modules directly:
          * `src.retrieval.retrieve_chunks` for top-k retrieval
          * `src.llm.generate_answer` for Gemini generation

        Returns ``{"message": str, "grounded": bool, "sources": [...]}``.
        """
        embedding_model, vector_store, chunks = self.get_pipeline()

        top_k = 3
        if context and isinstance(context.get("top_k"), int):
            top_k = context["top_k"]

        from src.retrieval import retrieve_chunks

        results = retrieve_chunks(
            question, embedding_model, vector_store, chunks, top_k=top_k
        ) or []

        if not results:
            return {
                "message": (
                    "I could not find relevant information in the current "
                    "knowledge base. Try asking about superposition, "
                    "entanglement, or a specific quantum gate."
                ),
                "grounded": False,
                "sources": [],
            }

        from src.llm import generate_answer

        joined_context = "\n\n".join(r["content"] for r in results)
        answer = generate_answer(question, joined_context)

        sources = [
            {
                "source": r.get("source", ""),
                "filename": r.get("filename", ""),
                "category": r.get("category", ""),
                "chunk_id": r.get("chunk_id", 0),
                "distance": r.get("distance", 0.0),
            }
            for r in results
        ]

        return {"message": answer, "grounded": True, "sources": sources}