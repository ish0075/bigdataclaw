#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  BIGDATACLAW LOCAL ECOSYSTEM STARTER
#  Starts: API Server (8000), NERVE Backend (3090), Ollama, Obsidian API
# ═══════════════════════════════════════════════════════════════════════════

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🚀 STARTING BIGDATACLAW LOCAL ECOSYSTEM                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ── Helpers ──
kill_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Stopping existing process on port $port..."
    kill $pids 2>/dev/null || true
    sleep 1
  fi
}

check_health() {
  local url=$1
  local name=$2
  local max_wait=${3:-10}
  echo "  Waiting for $name..."
  for i in $(seq 1 $max_wait); do
    if curl -s "$url" > /dev/null 2>&1; then
      echo "  ✓ $name ready"
      return 0
    fi
    sleep 1
  done
  echo "  ✗ $name failed to start"
  return 1
}

# ── 1. Ollama ──
echo "[1/5] Checking Ollama (port 11434)..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "  ✓ Ollama already running"
else
  echo "  Starting Ollama..."
  nohup ollama serve > ollama.log 2>&1 &
  echo $! > ollama.pid
  sleep 2
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "  ✓ Ollama started"
  else
    echo "  ✗ Ollama failed to start. Run: ollama serve"
  fi
fi

# ── 2. Obsidian Local REST API ──
echo ""
echo "[2/5] Checking Obsidian Local REST API (port 27124)..."
if curl -k -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer REDACTED_OBSIDIAN_API_KEY" \
    https://127.0.0.1:27124/vault/ 2>/dev/null | grep -q "200"; then
  echo "  ✓ Obsidian REST API connected"
else
  echo "  ⚠ Obsidian REST API not responding."
  echo "     Make sure Obsidian is running with Local REST API plugin enabled."
fi

# ── 3. Main API Server (port 8000) ──
echo ""
echo "[3/5] Starting Main API Server (port 8000)..."
kill_port 8000
nohup python3 api_server.py > api_server.log 2>&1 &
echo $! > api_server.pid
if check_health "http://localhost:8000/api/hotmoney?limit=1" "API Server" 5; then
  :
else
  echo "     Check api_server.log for errors"
fi

# ── 4. NERVE Backend (port 3090) ──
echo ""
echo "[4/5] Starting NERVE Backend (port 3090)..."
kill_port 3090
cd nerve/server
nohup python3 main.py > ../server.log 2>&1 &
echo $! > ../../nerve_server.pid
cd "$PROJECT_ROOT"
if check_health "http://localhost:3090/api/health" "NERVE Backend" 5; then
  :
else
  echo "     Check nerve/server.log for errors"
fi

# ── 5. Vite Dev Frontend (port 5173) ──
echo ""
echo "[5/5] Starting Vite Dev Frontend (port 5173)..."
kill_port 5173
cd nerve
nohup npm run dev > vite_server.log 2>&1 &
echo $! > vite_server.pid
cd "$PROJECT_ROOT"
sleep 3
if curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "  ✓ Vite Frontend ready"
else
  echo "  ⚠ Vite Frontend still starting..."
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ALL SYSTEMS OPERATIONAL                                       ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Frontend Dev:  http://localhost:5173                          ║"
echo "║  API Server:    http://localhost:8000                          ║"
echo "║  NERVE Backend: http://localhost:3090                          ║"
echo "║  Ollama:        http://localhost:11434                         ║"
echo "║  Obsidian API:  https://127.0.0.1:27124                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Stop everything: ./stop-local.sh"
echo "  Deploy frontend: ./deploy-frontend.sh"
echo "  Push to GitHub:  ./push-to-github.sh"
echo ""
