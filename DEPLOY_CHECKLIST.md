# Mission Control — Pixel Agents Pass 1–3 Deploy Checklist

## Pre-deploy

- [ ] SSH into Hostinger VPS
- [ ] Verify current backend is running: `curl -s https://bigdataclaw.srv1368913.hstgr.cloud/api/health`
- [ ] Backup current `api_server.py` on VPS:
  ```bash
  cp /path/to/bigdataclaw/api_server.py /path/to/bigdataclaw/api_server.py.backup.$(date +%s)
  ```
- [ ] Confirm frontend Vercel build has latest `nerve/src/` changes

## Backend Deploy

- [ ] Copy updated `api_server.py` to VPS
  ```bash
  # From local:
  scp api_server.py user@187.77.24.26:/path/to/bigdataclaw/api_server.py
  ```
  
  Or if git-based:
  ```bash
  # On VPS:
  cd /path/to/bigdataclaw
  git pull origin main
  ```

- [ ] Restart the production backend container:
  ```bash
  cd /path/to/bigdataclaw
  docker compose -f docker-compose.vps.yml down bigdataclaw-api
  docker compose -f docker-compose.vps.yml up -d --build bigdataclaw-api
  ```

- [ ] Verify container is healthy:
  ```bash
  docker ps | grep bigdataclaw-api
  docker logs bigdataclaw-api --tail 20
  ```

## Backend Smoke Test (on VPS)

```bash
# 1. Pixel agents list
curl -s http://localhost:8000/api/pixel-agents | jq '.agents | length'
# Expected: 6

# 2. Auto-route concierge
curl -s -X POST http://localhost:8000/api/openclaw/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What do you do?","persona":"auto","auto_route":true}' \
  | jq '.metadata'
# Expected: persona="concierge", mode="fast", auto_routed=true

# 3. Auto-route analyst
curl -s -X POST http://localhost:8000/api/openclaw/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Find buyers in Toronto","persona":"auto","auto_route":true}' \
  | jq '.metadata'
# Expected: persona="analyst", mode="deep", auto_routed=true

# 4. Auto-route report
curl -s -X POST http://localhost:8000/api/openclaw/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Write a report on lenders","persona":"auto","auto_route":true}' \
  | jq '.metadata'
# Expected: persona="analyst", mode="report", auto_routed=true

# 5. Manual override wins
curl -s -X POST http://localhost:8000/api/openclaw/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Find buyers in Toronto","persona":"concierge","auto_route":false}' \
  | jq '.metadata'
# Expected: persona="concierge", auto_routed=false

# 6. Pixel agent chat proxy
curl -s -X POST http://localhost:8000/api/pixel-agents/kimi/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}' | jq '.agent_id, .persona'
# Expected: "kimi", "analyst"
```

## Frontend Deploy

- [ ] Build and deploy frontend to Vercel
  ```bash
  cd nerve
  npm run build
  # Or push to trigger Vercel auto-deploy
  ```
- [ ] Verify `VITE_API_URL` is set to production domain in Vercel env vars:
  ```
  VITE_API_URL=https://bigdataclaw.srv1368913.hstgr.cloud
  ```

## Prod Smoke Test (from browser)

Visit: `https://mission-control-v2-five-eta.vercel.app/pixel-agents`

- [ ] Page loads, 6 agents appear
- [ ] Select Kimi, open chat
- [ ] Type: `"What do you do?"`
  - [ ] Routing badge shows: "Routed to Concierge"
  - [ ] Response streams in
- [ ] Type: `"Find buyers in Toronto"`
  - [ ] Routing badge shows: "Routed to Analyst (Deep)"
  - [ ] Response streams in
- [ ] Type: `"Write a report on lenders"`
  - [ ] Routing badge shows: "Routed to Analyst (Report mode)"
  - [ ] Response streams in
- [ ] Switch toggle to "Guide" manually
  - [ ] Type: `"Find buyers in Toronto"`
  - [ ] No routing badge (manual override)
  - [ ] Response is concierge-style
- [ ] Switch toggle to "Analyst" manually
  - [ ] Type: `"hello"`
  - [ ] No routing badge (manual override)
  - [ ] Response is analyst-style

## Rollback Plan

If anything breaks:

```bash
# On VPS — instant rollback to previous backend
cd /path/to/bigdataclaw
cp api_server.py.backup.$(ls -t api_server.py.backup.* | head -1) api_server.py
docker compose -f docker-compose.vps.yml restart bigdataclaw-api

# Verify rollback
curl -s https://bigdataclaw.srv1368913.hstgr.cloud/api/health
```

Frontend rollback: revert the last Vercel deployment in the Vercel dashboard.

## Post-Deploy Cleanup (next session)

- [ ] Extract `detect_persona_and_mode()` keywords into a config file
- [ ] Extract `PIXEL_AGENTS_REGISTRY` into a shared backend config
- [ ] Enhance `/api/health` to return:
  ```json
  {
    "status": "healthy",
    "db": "connected",
    "qdrant": "connected",
    "pixel_agents": 6,
    "provider": "ollama",
    "version": "2.1.0"
  }
  ```
