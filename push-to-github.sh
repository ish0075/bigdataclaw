#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  PUSH WORKING CHANGES TO GITHUB
#  Cleans temp files, commits code changes, and pushes to origin main
# ═══════════════════════════════════════════════════════════════════════════

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     📤 PUSHING TO GITHUB                                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Clean temp/runtime files before committing
echo "[1/4] Cleaning temp files..."
find . -type f \( -name "*.log" -o -name "*.pid" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -delete 2>/dev/null || true
find . -type d -name "__pycache__" -not -path "*/.git/*" -exec rm -rf {} + 2>/dev/null || true
rm -rf nerve/node_modules/.vite 2>/dev/null || true
rm -rf nerve/dist/assets/*.map 2>/dev/null || true
echo "  ✓ Cleaned"

# Stage only tracked files first, then add new important ones
echo "[2/4] Staging changes..."
git add -u
git add *.py *.jsx *.js *.json *.md *.sh *.html *.css 2>/dev/null || true
git add nerve/src/ nerve/server/ deals/ 2>/dev/null || true

# Show status
echo "[3/4] Changes to commit:"
git status --short

# Commit with timestamped message if there are changes
if git diff --cached --quiet; then
  echo ""
  echo "✓ Nothing to commit. Already up to date."
else
  echo ""
  read -p "Enter commit message (or press Enter for auto-timestamp): " msg
  if [ -z "$msg" ]; then
    msg="wip: update $(date '+%Y-%m-%d %H:%M')"
  fi
  git commit -m "$msg"
  echo ""
  echo "[4/4] Pushing to origin main..."
  git push origin main
  echo ""
  echo "✅ Pushed to GitHub successfully!"
fi

echo ""
echo "Latest commit:"
git log -1 --oneline
