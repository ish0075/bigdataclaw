#!/bin/bash
# BigDataClaw Backend Ecosystem Setup
# This script sets up the complete backend: SQLite + FastAPI + Qdrant integration

set -e

echo "======================================"
echo "🚀 BigDataClaw Backend Ecosystem Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo -e "${BLUE}Checking Python...${NC}"
python3 --version || { echo "Python 3 not found!"; exit 1; }

# Install dependencies
echo ""
echo -e "${BLUE}Installing Python dependencies...${NC}"
pip install fastapi uvicorn sqlite3 qdrant-client sentence-transformers -q

# Setup SQLite database
echo ""
echo -e "${BLUE}Setting up SQLite database...${NC}"
python3 setup_sqlite_backend.py

# Start API server in background
echo ""
echo -e "${BLUE}Starting API server...${NC}"
nohup python3 api_server.py > api_server.log 2>&1 &
API_PID=$!
echo $API_PID > api_server.pid

echo ""
echo -e "${GREEN}✅ API Server started (PID: $API_PID)${NC}"
echo "   API URL: http://localhost:8000"
echo "   Log file: api_server.log"

# Wait for server
echo ""
echo -e "${YELLOW}Waiting for API to be ready...${NC}"
sleep 3

# Test API
echo ""
echo -e "${BLUE}Testing API endpoints...${NC}"
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo -e "${GREEN}✅ API is healthy${NC}"
    curl -s http://localhost:8000/api/health | python3 -m json.tool
else
    echo -e "${YELLOW}⚠️  API health check failed - check api_server.log${NC}"
fi

echo ""
echo -e "${BLUE}Testing recruiter count...${NC}"
curl -s http://localhost:8000/api/recruiters/stats | python3 -m json.tool | head -10

echo ""
echo "======================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "======================================"
echo ""
echo "📊 Backend Status:"
echo "   - SQLite Database: bigdataclaw.db"
echo "   - API Server: http://localhost:8000"
echo "   - Qdrant: http://localhost:6333"
echo ""
echo "🌐 API Endpoints:"
echo "   GET  /api/health              - Health check"
echo "   GET  /api/recruiters          - List agents (paginated)"
echo "   GET  /api/recruiters/stats    - Statistics"
echo "   GET  /api/recruiters/search?q=... - Semantic search"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update frontend to use API (see BACKEND_ECOSYSTEM_ARCHITECTURE.md)"
echo "   2. Test the new component: EXAgentRecruiterUpdated.jsx"
echo "   3. Add Redis for caching (optional)"
echo ""
echo "📋 To stop the API server:"
echo "   kill \$(cat api_server.pid)"
echo ""
