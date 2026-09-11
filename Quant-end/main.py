"""Convenience entry point: `uvicorn main:app` from the repo root.

The canonical application lives at `app.main` (see `app/README.md`); this
shim re-exports it so both launch commands work.
"""

from app.main import app  # noqa: F401
