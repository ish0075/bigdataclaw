#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  DEPLOY FRONTEND TO VERCEL (Production)
#  This builds the nerve/ app and deploys to the live Vercel project.
# ═══════════════════════════════════════════════════════════════════════════

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🚀 DEPLOYING FRONTEND TO VERCEL                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Build locally
echo "[1/3] Building frontend..."
cd nerve
npm install
npm run build
cd ..

# 2. Copy to temp dir for clean deploy
echo "[2/3] Preparing deploy package..."
TEMPDIR=$(mktemp -d)
cp -r nerve/dist/* "$TEMPDIR/"
cat > "$TEMPDIR/vercel.json" << 'EOF'
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}],
  "headers": [{
    "source": "/(.*)",
    "headers": [
      {"key": "X-Content-Type-Options", "value": "nosniff"},
      {"key": "X-Frame-Options", "value": "DENY"},
      {"key": "X-XSS-Protection", "value": "1; mode=block"}
    ]
  }]
}
EOF

# 3. Deploy
echo "[3/3] Deploying to Vercel..."
cd "$TEMPDIR"
npx vercel@latest --prod --yes

echo ""
echo "✅ Frontend deployed!"
echo ""
