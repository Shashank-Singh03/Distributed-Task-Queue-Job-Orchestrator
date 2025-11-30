#!/usr/bin/env bash
set -e

# Render will set $PORT
HOST="0.0.0.0"
PORT="${PORT:-8000}"

# Basic uvicorn startup
exec uvicorn app.api.main:app --host "${HOST}" --port "${PORT}"

