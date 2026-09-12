#!/usr/bin/env bash
#
# QUBERA AI tutor — single start command.
#
# Creates the venv on first run, installs/updates dependencies, then serves
# the RAG tutor API on :9000 (the port the Node backend expects).
#
# Usage:
#   bash ai/start.sh          # start on :9000
#   PORT=9001 bash ai/start.sh  # override the port

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VENV="$SCRIPT_DIR/.venv"
PY="${VENV}/bin/python"
UVICORN="${VENV}/bin/uvicorn"
PORT="${PORT:-9000}"

if [ ! -x "$PY" ]; then
  echo "==> Creating virtual environment in ${VENV}"
  python3 -m venv "$VENV"
fi

echo "==> Ensuring dependencies are installed"
"${VENV}/bin/pip" install -q --disable-pip-version-check -r requirements.txt

echo "==> Starting AI tutor service on http://localhost:${PORT}"
exec "$UVICORN" app:app --host 0.0.0.0 --port "$PORT"