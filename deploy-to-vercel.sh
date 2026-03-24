#!/bin/bash
# Deploy BigDataClaw to Vercel - Automated Script for ish0075

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🚀 DEPLOY BIGDATACLAW TO VERCEL (ish0075)                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

cd "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

echo ""
echo "🔐 Login to Vercel (this will open a browser)..."
echo "   Use your ish0075 GitHub account"
echo ""
vercel login

echo ""
echo "🚀 Deploying to Vercel..."
echo ""
echo "When prompted:"
echo "  ? Set up and deploy \"bigdataclaw\"? [Y/n] → Press Y"
echo "  ? Which scope? [ish0075] → Press Enter"
echo "  ? Link to existing project? [n] → Press n"
echo "  ? Project name: [bigdataclaw] → Press Enter"
echo ""

vercel

echo ""
echo "⏳ Initial deployment complete!"
echo ""
echo "Now deploying to production..."
vercel --prod

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "Your frontend is now live at:"
echo "  https://bigdataclaw.vercel.app"
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "NEXT: Deploy backend to Railway"
echo "══════════════════════════════════════════════════════════════════"
echo ""
echo "1. Go to https://railway.app"
echo "2. Sign in with GitHub (ish0075)"
echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
echo "4. Select 'ish0075/bigdataclaw'"
echo "5. Click 'Deploy'"
echo ""
echo "Then run ./connect-frontend-backend.sh"
echo ""
