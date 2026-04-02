# 🔧 ContextKeep Troubleshooting Guide

Complete troubleshooting for ContextKeep Beta v1.2 + BigDataClaw integration.

---

## 🚨 Quick Diagnostic

Run this first:
```bash
bash setup_contextkeep_complete.sh
```

Or manually check:
```bash
# Check ContextKeep MCP Server
curl http://127.0.0.1:8080/health

# Check Obsidian REST API
curl -k https://127.0.0.1:27124/vault/ \
  -H "Authorization: Bearer REDACTED_OBSIDIAN_API_KEY"
```

---

## ❌ Common Issues & Solutions

### 1. "Connection refused" - ContextKeep MCP Server

**Symptom:**
```
✗ ContextKeep: Cannot connect
```

**Causes & Fixes:**

#### A. Plugin Not Installed
```bash
# Fix:
1. Open Obsidian
2. Settings → Community Plugins
3. Safe Mode: OFF
4. Browse → Search "ContextKeep"
5. Install & Enable
```

#### B. MCP Server Not Started
```bash
# Fix:
1. Open ContextKeep plugin in Obsidian (left sidebar)
2. Click gear icon (Settings)
3. Enable "MCP Server" toggle
4. Set port: 8080
5. Copy API key
6. Click "Start MCP Server"
7. Green dot = running
```

#### C. Port Conflict
```bash
# Check if port 8080 is in use:
lsof -i :8080

# Kill process or change port:
# In ContextKeep settings, change port to 8081
# Update .env: CONTEXTKEEP_MCP_URL=http://127.0.0.1:8081
```

#### D. Wrong API Key
```bash
# Fix:
1. In Obsidian: ContextKeep → Settings → Copy API Key
2. Update .env file:
   CONTEXTKEEP_API_KEY=your-actual-key-here
```

---

### 2. "Connection refused" - Obsidian REST API

**Symptom:**
```
✗ Obsidian: Cannot connect
```

**Causes & Fixes:**

#### A. Local REST API Plugin Not Installed
```bash
# Fix:
1. Obsidian → Settings → Community Plugins
2. Browse → Search "Local REST API"
3. Install & Enable
4. Restart Obsidian
```

#### B. API Not Enabled
```bash
# Fix:
1. Settings → Local REST API
2. Enable "Start REST API automatically"
3. Set port: 27124
4. Copy API Key
5. Click "Show Advanced Settings" → Allow insecure content
```

#### C. Wrong API Key
```bash
# Fix:
# Check current key in obsidian_integration.py
# Or update .env:
OBSIDIAN_API_KEY=your-obsidian-api-key
```

#### D. Certificate Error (HTTPS)
```bash
# This is normal - Obsidian uses self-signed cert
# The code already handles this with verify=False
# If still issues:
export CURL_CA_BUNDLE=""
export REQUESTS_CA_BUNDLE=""
```

---

### 3. "No memories found" after syncing

**Symptom:**
```python
memories = ck.list_all_memories()
print(len(memories))  # 0
```

**Causes & Fixes:**

#### A. Vault Path Not Set
```bash
# Fix:
# Update .env with your actual vault path:
OBSIDIAN_VAULT_PATH=/home/jamie/Documents/Obsidian/BigDataClaw

# Or find your vault:
find ~ -name "*.md" -path "*/.obsidian/*" 2>/dev/null | head -5
```

#### B. ContextKeep Not Indexing
```bash
# Fix:
1. In Obsidian: ContextKeep sidebar
2. Click "Index Vault" or "Force Reindex"
3. Wait for indexing to complete (can take time for large vaults)
```

#### C. Tags Not Matching
```python
# When querying, use exact tags:
memories = ck.list_all_memories(tags=["buyer"])  # Not "buyers"

# Check available tags first:
all_memories = ck.list_all_memories(limit=1000)
tags = set()
for m in all_memories:
    tags.update(m.tags)
print(tags)
```

---

### 4. Slow Performance

**Symptom:** Queries take 5+ seconds

**Fixes:**

```bash
# A. Limit results
memories = ck.list_all_memories(limit=50)  # Not 1000

# B. Use specific tags
results = ck.query_memories(query, tags=["seaway-mall"])  # Filter first

# C. Check system resources
top  # or htop
# If CPU/Memory high, close other apps
```

---

### 5. Import Errors in Python

**Symptom:**
```
ModuleNotFoundError: No module named 'aiohttp'
```

**Fix:**
```bash
pip install aiohttp requests

# Or if using specific Python:
python3 -m pip install aiohttp requests
```

---

### 6. MCP Server Crashes

**Symptom:**
```
ContextKeep MCP Server stopped unexpectedly
```

**Fixes:**

```bash
# A. Restart Obsidian completely
# Close and reopen Obsidian

# B. Check Obsidian console
# View → Toggle Developer Tools → Console
# Look for red error messages

# C. Update ContextKeep plugin
# Settings → Community Plugins → Check for updates

# D. Reset ContextKeep
# Uninstall and reinstall ContextKeep plugin
```

---

## 🔍 Advanced Debugging

### Enable Debug Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)

from contextkeep_integration import ContextKeepSync
ck = ContextKeepSync()
ck.connect()
```

### Test MCP Server Directly

```bash
# Test if MCP server responds
curl -X POST http://127.0.0.1:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "list_all_memories",
    "params": {"limit": 10},
    "id": 1
  }'
```

### Check Environment Variables

```bash
# Load and check .env
export $(grep -v '^#' .env | xargs)
echo "CONTEXTKEEP_MCP_URL: $CONTEXTKEEP_MCP_URL"
echo "OBSIDIAN_BASE_URL: $OBSIDIAN_BASE_URL"
echo "OBSIDIAN_VAULT_PATH: $OBSIDIAN_VAULT_PATH"
```

### Verify File Permissions

```bash
# Check if scripts are executable
ls -la *.py *.sh

# Make executable if needed:
chmod +x sync_seaway_to_contextkeep.py
chmod +x test_contextkeep.py
chmod +x setup_contextkeep_complete.sh
```

---

## 🔄 Reset Everything

**Nuclear option - start fresh:**

```bash
# 1. Stop all services
# Close Obsidian completely

# 2. Clear ContextKeep cache
rm -rf ~/.contextkeep/memory/*

# 3. Reset environment
rm .env
cp .env.example .env
# Edit .env with correct values

# 4. Restart Obsidian
# Reinstall ContextKeep plugin if needed
# Start MCP Server

# 5. Test
python test_contextkeep.py
```

---

## 📊 Health Check Script

Create `health_check.py`:

```python
#!/usr/bin/env python3
import requests
import urllib3
urllib3.disable_warnings()

print("=== CONTEXTKEEP HEALTH CHECK ===\n")

# Check 1: ContextKeep MCP
try:
    r = requests.get("http://127.0.0.1:8080/health", timeout=5)
    print(f"✓ ContextKeep MCP: HTTP {r.status_code}")
except Exception as e:
    print(f"✗ ContextKeep MCP: {e}")

# Check 2: Obsidian REST API
try:
    r = requests.get(
        "https://127.0.0.1:27124/vault/",
        headers={"Authorization": "Bearer REDACTED_OBSIDIAN_API_KEY"},
        verify=False,
        timeout=5
    )
    print(f"✓ Obsidian REST API: HTTP {r.status_code}")
except Exception as e:
    print(f"✗ Obsidian REST API: {e}")

# Check 3: Python deps
try:
    import aiohttp, requests
    print("✓ Python dependencies: OK")
except ImportError as e:
    print(f"✗ Python dependencies: {e}")

# Check 4: .env file
import os
if os.path.exists(".env"):
    print("✓ .env file: Exists")
else:
    print("✗ .env file: Missing")

print("\n=== END HEALTH CHECK ===")
```

Run: `python health_check.py`

---

## 🆘 Still Not Working?

### Get Help Info

```bash
# Run diagnostic
bash setup_contextkeep_complete.sh 2>&1 | tee contextkeep_debug.log

# Check logs
cat contextkeep_debug.log

# Check Obsidian logs
# In Obsidian: View → Toggle Developer Tools → Console → Save as file
```

### Manual Test Sequence

```bash
# 1. Verify ports
netstat -tlnp | grep -E "8080|27124"

# 2. Test Obsidian directly
curl -k https://127.0.0.1:27124/vault/files \
  -H "Authorization: Bearer REDACTED_OBSIDIAN_API_KEY" \
  | head -20

# 3. Test ContextKeep
curl http://127.0.0.1:8080/health

# 4. Python test
python3 -c "from contextkeep_integration import ContextKeepSync; print('Import OK')"
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✓ `curl http://127.0.0.1:8080/health` returns 200
2. ✓ Obsidian REST API returns 200 with vault data
3. ✓ `python test_contextkeep.py` shows all green
4. ✓ `python sync_seaway_to_contextkeep.py` adds memories
5. ✓ Semantic queries return relevant results

---

## 📞 Quick Reference

| Component | URL | Status Check |
|-----------|-----|--------------|
| ContextKeep MCP | http://127.0.0.1:8080 | `curl http://127.0.0.1:8080/health` |
| Obsidian REST | https://127.0.0.1:27124 | `curl -k https://127.0.0.1:27124/vault/` |
| Vault Path | `/home/jamie/Documents/Obsidian/BigDataClaw` | Check in Obsidian → Settings → About |

---

Last Updated: March 26, 2026
