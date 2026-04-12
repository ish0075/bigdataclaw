# BigDataClaw VPS Deployment Guide

## Server Specs (Hostinger KVM 2)
- **2 vCPUs / 8GB RAM** — plenty of headroom for this stack
- Full root access via SSH
- Docker + systemd both available

## Stack & Process Management

| Component | Manager | Why |
|-----------|---------|-----|
| FastAPI + Uvicorn (`api_server.py`) | Docker Compose | Stateless, clean container boundaries |
| Qdrant | Docker Compose | Official Docker image, easiest path |
| Caddy (SSL proxy) | Docker Compose | Designed to run containerized |
| Agent Orchestrator | systemd | Spawns subprocesses, writes state files, needs cleaner process ownership |

## Access Model: Public-Facing API

Your Vercel frontend needs to reach the backend over the internet, so this is **public-facing but secured**:

- **Subdomain:** `api.srv1368913.hstgr.cloud`
- **SSL:** Auto-managed by Caddy (free Let's Encrypt certificates)
- **CORS:** Configured to allow your Vercel origin
- **No auth wall on API** currently — the endpoints are open (standard for your current setup)

If you want to lock it down later, we can add API key auth or IP allowlisting.

## Pre-Flight Checklist

### 1. DNS Record
In Hostinger DNS, create an **A record**:
```
api.srv1368913.hstgr.cloud  A  →  187.77.24.26
```

### 2. SSH into VPS
```bash
ssh root@187.77.24.26
```

### 3. Upload your code
Option A — clone from GitHub:
```bash
cd /opt
git clone https://github.com/ish0075/bigdataclaw.git
cd bigdataclaw
```

Option B — rsync from local machine:
```bash
rsync -avz --exclude node_modules --exclude venv --exclude .git \
  /path/to/bigdataclaw/ root@187.77.24.26:/opt/bigdataclaw/
```

### 4. Create `.env` on the VPS
Do **not** copy your local `.env` verbatim — local paths won't work.

Create `/opt/bigdataclaw/.env` with at minimum:
```env
KIMI_API_KEY=sk-...
OPENAI_API_KEY=sk-... (optional)
```

If you plan to use Obsidian integration from the VPS, update `OBSIDIAN_BASE_URL` to wherever Obsidian runs (probably not on the VPS).

### 5. Run the deploy script
```bash
cd /opt/bigdataclaw
chmod +x deploy-vps.sh
./deploy-vps.sh
```

## Post-Deploy Verification

```bash
# Check Docker stack
docker compose -f docker-compose.vps.yml ps

# Check API health
curl https://api.srv1368913.hstgr.cloud/api/health

# Check agent orchestrator
systemctl status bigdataclaw-agent-orchestrator
journalctl -u bigdataclaw-agent-orchestrator -f
```

## Connect Vercel Frontend

Update the API base URL in your frontend build:

```bash
cd nerve
export VITE_API_URL=https://api.srv1368913.hstgr.cloud
npm run build
vercel --prod
```

Or update `vite.config.js` proxy targets if you want local dev to also hit the VPS.

## Updating After Code Changes

```bash
cd /opt/bigdataclaw
git pull

# Update Docker stack
docker compose -f docker-compose.vps.yml up -d --build

# Restart agent orchestrator
systemctl restart bigdataclaw-agent-orchestrator
```

## Troubleshooting

### Caddy can't get SSL
- DNS A record must be propagated (`dig api.srv1368913.hstgr.cloud`)
- Hostinger firewall must allow ports 80 and 443
- Check logs: `docker compose -f docker-compose.vps.yml logs -f caddy`

### Agent orchestrator keeps restarting
```bash
journalctl -u bigdataclaw-agent-orchestrator -n 50
free -h
```

### API returns 502
The backend might still be starting. Wait 30 seconds and retry.
