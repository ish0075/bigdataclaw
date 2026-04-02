#!/bin/bash
# ContextKeep Beta v1.2 Complete Setup Script
# This script guides you through the entire installation process

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     CONTEXTKEEP BETA v1.2 - COMPLETE SETUP WIZARD          ║"
echo "║         For BigDataClaw Obsidian Integration               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "contextkeep_integration.py" ]; then
    echo -e "${RED}Error: Please run this script from the bigdataclaw directory${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1/7: Checking Python dependencies...${NC}"
python3 -c "import aiohttp, requests" 2>/dev/null || {
    echo -e "${YELLOW}Installing required Python packages...${NC}"
    pip install aiohttp requests --quiet
}
echo -e "${GREEN}✓ Python dependencies OK${NC}"

echo ""
echo -e "${BLUE}Step 2/7: Checking MCP configuration...${NC}"
if [ -f ".codex/mcp.json" ]; then
    echo -e "${GREEN}✓ MCP config found at .codex/mcp.json${NC}"
    cat .codex/mcp.json | grep -A 5 "contextkeep"
else
    echo -e "${YELLOW}Creating MCP config...${NC}"
    mkdir -p .codex
    cat > .codex/mcp.json << 'EOFMCP'
{
  "mcpServers": {
    "contextkeep": {
      "name": "ContextKeep Beta v1.2",
      "description": "Semantic memory search for Obsidian vault",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@contextkeep/mcp-server@beta"],
      "env": {
        "CONTEXTKEEP_API_KEY": "${CONTEXTKEEP_API_KEY}",
        "OBSIDIAN_VAULT_PATH": "${OBSIDIAN_VAULT_PATH}",
        "MEMORY_INDEX_PATH": "${MEMORY_INDEX_PATH}"
      },
      "disabled": false,
      "alwaysAllow": [
        "list_all_memories",
        "query_memories",
        "add_memory",
        "get_memory",
        "update_memory"
      ]
    }
  }
}
EOFMCP
    echo -e "${GREEN}✓ MCP config created${NC}"
fi

echo ""
echo -e "${BLUE}Step 3/7: Checking environment variables...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    export $(grep -v '^#' .env | xargs) 2>/dev/null || true
    echo "  - OBSIDIAN_BASE_URL: $OBSIDIAN_BASE_URL"
    echo "  - CONTEXTKEEP_MCP_URL: $CONTEXTKEEP_MCP_URL"
else
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << 'EOFENV'
# BigDataClaw Environment Configuration
OPENAI_API_KEY=${OPENAI_API_KEY:-your-openai-api-key-here}
OBSIDIAN_API_KEY=REDACTED_OBSIDIAN_API_KEY
OBSIDIAN_BASE_URL=https://127.0.0.1:27124
CONTEXTKEEP_API_KEY=${CONTEXTKEEP_API_KEY:-your-contextkeep-api-key}
CONTEXTKEEP_MCP_URL=http://127.0.0.1:8080
OBSIDIAN_VAULT_PATH=/home/jamie/Documents/Obsidian/BigDataClaw
MEMORY_INDEX_PATH=/home/jamie/.contextkeep/memory
CONTEXTKEEP_PORT=8080
CONTEXTKEEP_HOST=127.0.0.1
EOFENV
    echo -e "${GREEN}✓ .env file created${NC}"
fi

echo ""
echo -e "${BLUE}Step 4/7: Obsidian Plugin Instructions${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "You need to install the ContextKeep plugin in Obsidian:"
echo ""
echo "1. Open Obsidian"
echo "2. Go to Settings → Community Plugins"
echo "3. Turn OFF 'Safe Mode'"
echo "4. Click 'Browse' and search for 'ContextKeep'"
echo "5. Install and Enable the plugin"
echo "6. Open ContextKeep settings from the left sidebar"
echo "7. Enable 'MCP Server' (Beta feature)"
echo "8. Set port to: 8080"
echo "9. Copy the API key shown"
echo "10. Click 'Start MCP Server'"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "${BLUE}Step 5/7: Testing Obsidian REST API...${NC}"
echo "Testing connection to Obsidian (port 27124)..."
if curl -k -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer REDACTED_OBSIDIAN_API_KEY" \
    https://127.0.0.1:27124/vault/ 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓ Obsidian REST API is RUNNING on port 27124${NC}"
else
    echo -e "${RED}✗ Obsidian REST API not responding${NC}"
    echo "  Make sure:"
    echo "  - Obsidian is running"
    echo "  - Local REST API plugin is installed and enabled"
    echo "  - API key is configured"
    echo "  - Port 27124 is available"
fi

echo ""
echo -e "${BLUE}Step 6/7: Testing ContextKeep MCP Server...${NC}"
echo "Testing connection to ContextKeep (port 8080)..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓ ContextKeep MCP Server is RUNNING on port 8080${NC}"
else
    echo -e "${YELLOW}⚠ ContextKeep MCP Server not responding${NC}"
    echo "  This is expected if you haven't:"
    echo "  1. Installed the ContextKeep plugin in Obsidian"
    echo "  2. Started the MCP Server from ContextKeep settings"
    echo ""
    echo -e "${BLUE}To start ContextKeep MCP Server:${NC}"
    echo "  - Open Obsidian → ContextKeep plugin → Settings"
    echo "  - Enable 'MCP Server'"
    echo "  - Set port: 8080"
    echo "  - Click 'Start MCP Server'"
fi

echo ""
echo -e "${BLUE}Step 7/7: Creating quick test script...${NC}"
cat > test_contextkeep.py << 'EOFTEST'
#!/usr/bin/env python3
"""Quick test script for ContextKeep integration"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextkeep_integration import ContextKeepSync, ContextKeepObsidianBridge

def test_connections():
    """Test both Obsidian and ContextKeep connections"""
    print("\n" + "="*60)
    print("CONTEXTKEEP CONNECTION TEST")
    print("="*60)
    
    # Test 1: ContextKeep
    print("\n[1/3] Testing ContextKeep MCP Server...")
    try:
        ck = ContextKeepSync()
        connected, msg = ck.connect()
        if connected:
            print(f"  ✓ ContextKeep: {msg}")
        else:
            print(f"  ✗ ContextKeep: {msg}")
            print("    → Is ContextKeep MCP server running in Obsidian?")
    except Exception as e:
        print(f"  ✗ ContextKeep Error: {e}")
    
    # Test 2: Obsidian REST API
    print("\n[2/3] Testing Obsidian REST API...")
    try:
        from obsidian_integration import ObsidianIntegration
        obsidian = ObsidianIntegration()
        connected, msg = obsidian.test_connection()
        if connected:
            print(f"  ✓ Obsidian: {msg}")
        else:
            print(f"  ✗ Obsidian: {msg}")
            print("    → Is Obsidian running with Local REST API enabled?")
    except Exception as e:
        print(f"  ✗ Obsidian Error: {e}")
    
    # Test 3: Bridge both
    print("\n[3/3] Testing combined bridge...")
    try:
        bridge = ContextKeepObsidianBridge()
        statuses = bridge.test_connections()
        for service, (ok, msg) in statuses.items():
            status = "✓" if ok else "✗"
            print(f"  {status} {service}: {msg}")
    except Exception as e:
        print(f"  ✗ Bridge Error: {e}")
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)

if __name__ == "__main__":
    test_connections()
EOFTEST
chmod +x test_contextkeep.py
echo -e "${GREEN}✓ Test script created: test_contextkeep.py${NC}"

echo ""
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    SETUP SUMMARY                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Python dependencies installed${NC}"
echo -e "${GREEN}✓ MCP configuration created${NC}"
echo -e "${GREEN}✓ Environment variables configured${NC}"
echo -e "${GREEN}✓ Test script created${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. ${YELLOW}Install ContextKeep plugin in Obsidian${NC}"
echo "   (Follow Step 4 instructions above)"
echo ""
echo "2. ${YELLOW}Start the MCP Server${NC}"
echo "   Obsidian → ContextKeep → Settings → Start MCP Server"
echo ""
echo "3. ${YELLOW}Run the test${NC}"
echo "   python test_contextkeep.py"
echo ""
echo "4. ${YELLOW}Try the examples${NC}"
echo "   python contextkeep_examples.py"
echo ""
echo "5. ${YELLOW}Sync Seaway Mall buyers${NC}"
echo "   python sync_seaway_to_contextkeep.py"
echo ""
echo "For help: cat CONTEXTKEEP_SETUP.md"
echo ""
