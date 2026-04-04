#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  SAVE SESSION TO CONTEXTKEEP
#  Appends a session snapshot to CONTEXTKEEP_CONVERSATIONS.json
# ═══════════════════════════════════════════════════════════════════════════

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🧠 SAVING SESSION TO CONTEXTKEEP                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Accept custom title/summary or use defaults
TITLE="${1:-BigDataClaw Session $(date '+%Y-%m-%d %H:%M')}"
SUMMARY="${2:-Working session: updated hot money enrichment, Vercel deployment, and frontend/backend integration.}"

python3 save_session_to_contextkeep.py "$TITLE" "$SUMMARY"

echo ""
echo "  Tip: Run this after every major feature push."
