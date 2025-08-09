#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH=/workspace
export REDIS_URL=${REDIS_URL:-redis://localhost:6379/0}
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload