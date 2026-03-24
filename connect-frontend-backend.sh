#!/bin/bash
# Connect Frontend (Vercel) to Backend (Railway) for ish0075

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔗 CONNECT FRONTEND TO BACKEND                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

cd "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw"

echo "Enter your Railway backend URL:"
echo "(Example: https://bigdataclaw-production.up.railway.app)"
read -p "> " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ Error: No URL provided"
    exit 1
fi

echo ""
echo "📝 Updating frontend API URL..."

# Update the API URL in the frontend
sed -i "s|const API_URL = 'http://localhost:9999';|const API_URL = '$RAILWAY_URL';|g" src/views/BuyerMatchingViewReal.jsx

echo "✅ Frontend updated"
echo ""
echo "📤 Committing changes to GitHub..."

git add .
git commit -m "Update API URL for production - connect to Railway backend"
git push origin main

echo ""
echo "🚀 Redeploying frontend to Vercel..."
vercel --prod

echo ""
echo "✅ DONE!"
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "🌐 YOUR LIVE URLS:"
echo "══════════════════════════════════════════════════════════════════"
echo ""
echo "Frontend: https://bigdataclaw.vercel.app"
echo "Backend:  $RAILWAY_URL"
echo "GitHub:   https://github.com/ish0075/bigdataclaw"
echo ""
echo "Test it:"
echo "  curl $RAILWAY_URL/health"
echo ""
