#!/bin/bash
set -e

# BigDataClaw VPS Deploy Script
# Deploys: Docker stack (API + Qdrant + Caddy) + systemd agent orchestrator

echo "🚀 BigDataClaw VPS Deployment"
echo "=============================="

# 1. Server prep
echo "🔧 Server prep..."
apt-get update
apt-get install -y docker.io docker-compose python3.12 python3.12-venv python3-pip curl
systemctl enable docker
systemctl start docker

echo "✅ Docker and Python 3.12 ready"

# 2. Verify we're in the right directory
DEPLOY_DIR="/opt/bigdataclaw"
if [ "$PWD" != "$DEPLOY_DIR" ]; then
    echo "⚠️  Run this script from $DEPLOY_DIR"
    echo "   cd $DEPLOY_DIR && ./deploy-vps.sh"
    exit 1
fi

# 3. Ensure venv exists with deps
echo "📦 Checking Python virtual environment..."
if [ ! -d "venv" ]; then
    python3.12 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
pip install -q fastapi uvicorn python-dotenv qdrant-client pydantic httpx websockets aiohttp

echo "✅ Python dependencies ready"

# 4. Check .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Create /opt/bigdataclaw/.env with at least KIMI_API_KEY=..."
    exit 1
fi

echo "✅ .env found"

# 5. Pull base images
echo "📦 Pulling Docker images..."
docker pull qdrant/qdrant:latest
docker pull caddy:2-alpine

# 6. Bring up Docker stack
echo "🏗️ Building and starting Docker stack..."
docker compose -f docker-compose.vps.yml up -d --build

echo "⏳ Waiting for API server to start..."
sleep 10

# 7. Install systemd service for agent orchestrator
echo "⚙️ Installing agent orchestrator systemd service..."
cp bigdataclaw-agent-orchestrator.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable bigdataclaw-agent-orchestrator
systemctl restart bigdataclaw-agent-orchestrator

# 8. Health checks
echo "🏥 Running health checks..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health || true)
QDRANT_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6333/healthz || true)
ORCH_STATUS=$(systemctl is-active bigdataclaw-agent-orchestrator || true)

if [ "$API_HEALTH" = "200" ]; then
    echo "✅ API Server is healthy on port 8000"
else
    echo "⚠️ API Server not responding yet (check logs: docker compose -f docker-compose.vps.yml logs -f bigdataclaw-api)"
fi

if [ "$QDRANT_HEALTH" = "200" ]; then
    echo "✅ Qdrant is healthy on port 6333"
else
    echo "⚠️ Qdrant not responding yet"
fi

if [ "$ORCH_STATUS" = "active" ]; then
    echo "✅ Agent Orchestrator is running via systemd"
else
    echo "⚠️ Agent Orchestrator status: $ORCH_STATUS"
fi

echo ""
echo "=============================="
echo "🎉 Deployment complete!"
echo ""
echo "Backend API:    http://localhost:8000"
echo "Qdrant:         http://localhost:6333"
echo "Caddy Proxy:    https://api.srv1368913.hstgr.cloud"
echo ""
echo "Logs:"
echo "  API:          docker compose -f docker-compose.vps.yml logs -f bigdataclaw-api"
echo "  Qdrant:       docker compose -f docker-compose.vps.yml logs -f qdrant"
echo "  Caddy:        docker compose -f docker-compose.vps.yml logs -f caddy"
echo "  Orchestrator: journalctl -u bigdataclaw-agent-orchestrator -f"
echo ""
echo "To update after code changes:"
echo "  git pull"
echo "  docker compose -f docker-compose.vps.yml up -d --build"
echo "  systemctl restart bigdataclaw-agent-orchestrator"
echo "=============================="
