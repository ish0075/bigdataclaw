#!/bin/bash
# Start the Mission Control backend API server
# Usage: ./start-api.sh [port]

PORT=${1:-18002}
echo "Starting BigDataClaw API on port $PORT..."
python3 -m uvicorn api_server:app --host 0.0.0.0 --port "$PORT" --reload
