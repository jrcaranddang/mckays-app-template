#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH=/workspace
export REDIS_URL=${REDIS_URL:-redis://localhost:6379/0}
celery -A app.workers.celery_app.celery_app worker --loglevel=INFO -Q celery