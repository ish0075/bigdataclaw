#!/bin/bash
# Stop all local BigDataClaw services

set -e

echo "Stopping local ecosystem..."

for pidfile in api_server.pid nerve_server.pid vite_server.pid ollama.pid; do
  if [ -f "$pidfile" ]; then
    kill $(cat "$pidfile") 2>/dev/null || true
    rm -f "$pidfile"
    echo "  Stopped $pidfile"
  fi
done

# Kill by port just in case
for port in 5173 3090 8000 11434; do
  pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
    echo "  Freed port $port"
  fi
done

echo "✓ All local services stopped"
