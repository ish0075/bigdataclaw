#!/bin/bash
# Unified startup script for the Hybrid NERVE + Paperclip Ecosystem

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "═══════════════════════════════════════════════════════════════"
echo "  Starting Hybrid Ecosystem: NERVE + Paperclip"
echo "═══════════════════════════════════════════════════════════════"

# Function to kill existing processes on a port
kill_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Stopping existing process on port $port..."
    kill $pids 2>/dev/null || true
    sleep 1
  fi
}

# Clean up existing servers
echo ""
echo "[1/4] Cleaning up existing servers..."
kill_port 8000
kill_port 3090
kill_port 5173
kill_port 3100

# Start NERVE API Server (port 8000)
echo ""
echo "[2/4] Starting NERVE API Server on port 8000..."
python3 api_server.py > api_server.log 2>&1 &
echo $! > api_server.pid
sleep 2
if ! curl -s http://localhost:8000/api/health > /dev/null; then
  echo "  ERROR: NERVE API server failed to start. Check api_server.log"
  exit 1
fi
echo "  ✓ NERVE API ready"

# Start NERVE Mission Control Server (port 3090)
echo ""
echo "[3/4] Starting NERVE Mission Control Server on port 3090..."
cd nerve/server
python3 main.py > ../server.log 2>&1 &
echo $! > ../../nerve_server.pid
cd "$PROJECT_ROOT"
sleep 2
if ! curl -s http://localhost:3090/api/health > /dev/null; then
  echo "  ERROR: NERVE Mission Control server failed to start. Check nerve/server.log"
  exit 1
fi
echo "  ✓ NERVE Mission Control ready"

# Start Paperclip Server (port 3100)
echo ""
echo "[4/4] Starting Paperclip Server on port 3100..."
cd paperclip
pnpm dev:once > paperclip_dev.log 2>&1 &
echo $! > paperclip_server.pid
cd "$PROJECT_ROOT"

# Wait for Paperclip to be ready (up to 30s)
echo "  Waiting for Paperclip to initialize..."
for i in {1..30}; do
  if curl -s http://localhost:3100/api/health > /dev/null; then
    echo "  ✓ Paperclip ready"
    break
  fi
  sleep 1
done

if ! curl -s http://localhost:3100/api/health > /dev/null; then
  echo "  ERROR: Paperclip server failed to start. Check paperclip/paperclip_dev.log"
  exit 1
fi

# Start NERVE Vite Frontend (port 5173)
echo ""
echo "[5/4] Starting NERVE Vite Frontend on port 5173..."
cd nerve
npm run dev > vite_server.log 2>&1 &
echo $! > vite_server.pid
cd "$PROJECT_ROOT"

sleep 3
if ! curl -s http://localhost:5173 > /dev/null; then
  echo "  WARNING: NERVE Vite frontend may still be starting..."
fi
echo "  ✓ NERVE Frontend ready"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  All systems operational!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  NERVE Frontend:    http://localhost:5173"
echo "  NERVE API:         http://localhost:8000"
echo "  NERVE Mission:     http://localhost:3090"
echo "  Paperclip:         http://localhost:3100"
echo ""
echo "  Press Ctrl+C to stop all servers (run ./stop-hybrid-ecosystem.sh)"
echo ""

# Keep script alive
trap 'echo ""; echo "Stopping hybrid ecosystem..."; ./stop-hybrid-ecosystem.sh; exit 0' INT
tail -f /dev/null
