# BigDataClaw Deployment Guide for ish0075

## Quick Links
- GitHub Repo: https://github.com/ish0075/bigdataclaw
- Frontend: https://bigdataclaw.vercel.app
- Backend: https://bigdataclaw-production.up.railway.app

## Step 1: Push to GitHub

```bash
cd "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw"
./PUSH_TO_GITHUB.sh
```

Or manually:
```bash
git remote add origin https://github.com/ish0075/bigdataclaw.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel (Frontend)

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

## Step 3: Deploy Backend (Railway)

1. Go to https://railway.app
2. Sign in with GitHub (ish0075)
3. New Project → Deploy from GitHub repo
4. Select "bigdataclaw"
5. Railway auto-detects Python + requirements.txt
6. Click Deploy

## Step 4: Connect Frontend to Backend

Edit `src/views/BuyerMatchingViewReal.jsx`:
```javascript
const API_URL = 'https://bigdataclaw-production.up.railway.app';
```

Then:
```bash
git add . && git commit -m "Update API URL"
git push origin main
vercel --prod
```

## Test

```bash
curl https://bigdataclaw-production.up.railway.app/health
```

Open https://bigdataclaw.vercel.app and test Buyer Matching!
