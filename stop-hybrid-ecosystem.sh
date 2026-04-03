#!/bin/bash
# Stop all hybrid ecosystem servers

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "Stopping hybrid ecosystem servers..."

# Kill by PID files
for pidfile in api_server.pid nerve_server.pid vite_server.pid paperclip/paperclip_server.pid; do
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile")
    if kill "$pid" 2>/dev/null; then
      echo "  Stopped $pidfile (PID: $pid)"
    fi
    rm -f "$pidfile"
  fi
done

# Kill any remaining processes on known ports
for port in 5173 8000 3090 3100; do
  pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null || true
    echo "  Killed processes on port $port"
  fi
done

echo "All servers stopped."
