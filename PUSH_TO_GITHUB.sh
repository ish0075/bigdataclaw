#!/bin/bash
# BigDataClaw GitHub Push Script for ish0075

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     PUSHING BIGDATACLAW TO GITHUB (ish0075)                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if git remote already exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Remote 'origin' already exists"
    echo "Current remote: $(git remote get-url origin)"
    echo ""
    read -p "Replace with ish0075/bigdataclaw? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove origin
    else
        echo "Aborted"
        exit 1
    fi
fi

echo "🔗 Adding GitHub remote..."
git remote add origin https://github.com/ish0075/bigdataclaw.git

echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ DONE!"
echo ""
echo "Your repository is now at:"
echo "  https://github.com/ish0075/bigdataclaw"
echo ""
echo "Next steps:"
echo "  1. Visit https://github.com/ish0075/bigdataclaw"
echo "  2. Go to Settings → Pages (if you want GitHub Pages)"
echo "  3. Deploy to Vercel: npm i -g vercel && vercel"
echo ""
