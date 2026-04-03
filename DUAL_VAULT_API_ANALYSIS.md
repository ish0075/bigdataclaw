# Dual Vault REST API Analysis

## Current Status

| Vault | Path | REST API Status | Port |
|-------|------|-----------------|------|
| Main Working Vault | `/home/jamie/Desktop/Jamie's Personal Vault` | ✅ **ACTIVE** | 27124 |
| BDAIV2 | `/home/jamie/Documents/BDAIV2` | ❌ **NOT DETECTED** | N/A |

---

## Can It Read From Both? 

### Short Answer:
**YES, but BDAIV2 needs the REST API plugin activated first.**

---

## How It Would Work (If Both Active)

### Architecture: Dual Vault Reader

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BigDataClaw / NERVE Backend                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐        ┌─────────────────────────┐             │
│  │   ObsidianReader        │        │   ObsidianReader        │             │
│  │   (Main Vault)          │        │   (BDAIV2 Vault)        │             │
│  │                         │        │                         │             │
│  │   base_url:             │        │   base_url:             │             │
│  │   https://127.0.0.1:    │        │   https://127.0.0.1:    │             │
│  │          27124          │        │          27125          │             │
│  └───────────┬─────────────┘        └───────────┬─────────────┘             │
│              │                                  │                            │
│              │ GET /vault/                      │ GET /vault/                │
│              │ GET /files/{path}                │ GET /files/{path}          │
│              │ POST /search                     │ POST /search               │
│              ▼                                  ▼                            │
├──────────────┴──────────────────────────────────┴──────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Unified API Layer (/api/obsidian)                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  GET /api/obsidian/status?vault=main    → Query main vault          │   │
│  │  GET /api/obsidian/status?vault=bdaiv2  → Query BDAIV2 vault        │   │
│  │  GET /api/obsidian/status?vault=all     → Query both vaults         │   │
│  │                                                                      │   │
│  │  GET /api/obsidian/files?vault=main     → List main vault files     │   │
│  │  GET /api/obsidian/files?vault=bdaiv2   → List BDAIV2 files         │   │
│  │  GET /api/obsidian/files?vault=all      → List from both            │   │
│  │                                                                      │   │
│  │  POST /api/obsidian/search              → Search both vaults        │   │
│  │    { "query": "Seaway Mall", "vaults": ["main", "bdaiv2"] }          │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────┐
│  Main Working Vault     │   │  BDAIV2 Vault           │   │  NERVE Frontend │
│  (Port 27124)           │   │  (Port 27125)           │   │                 │
│                         │   │                         │   │                 │
│  259 files              │   │  Session_Logs/          │   │  Unified view   │
│  Agents/                │   │  Agent_Workspaces/      │   │  of both        │
│  Builders/              │   │  Deals/                 │   │  vaults         │
│  Commercial Realtors/   │   │  Buyers/                │   │                 │
│  Lenders/               │   │  Properties/            │   │                 │
└─────────────────────────┘   └─────────────────────────┘   └─────────────────┘
```

---

## Implementation Options

### Option 1: Two Separate Clients (Recommended)

```python
# obsidian_api_dual.py

class DualVaultReader:
    """Reads from both Main and BDAIV2 vaults"""
    
    def __init__(self):
        self.main_vault = ObsidianReader(
            api_key=DEFAULT_API_KEY,
            base_url="https://127.0.0.1:27124"  # Main vault
        )
        self.bdaiv2_vault = ObsidianReader(
            api_key=DEFAULT_API_KEY, 
            base_url="https://127.0.0.1:27125"  # BDAIV2 vault
        )
    
    def get_status(self, vault: str = "all") -> dict:
        """Get status of one or both vaults"""
        result = {}
        
        if vault in ["main", "all"]:
            connected, data = self.main_vault.test_connection()
            result["main_vault"] = {
                "connected": connected,
                "files": len(data.get('files', [])) if connected else 0,
                "path": "/home/jamie/Desktop/Jamie's Personal Vault"
            }
        
        if vault in ["bdaiv2", "all"]:
            connected, data = self.bdaiv2_vault.test_connection()
            result["bdaiv2_vault"] = {
                "connected": connected,
                "files": len(data.get('files', [])) if connected else 0,
                "path": "/home/jamie/Documents/BDAIV2"
            }
        
        return result
    
    def list_files(self, vault: str = "main", folder: str = None) -> list:
        """List files from specified vault"""
        if vault == "main":
            return self.main_vault.list_files()
        elif vault == "bdaiv2":
            return self.bdaiv2_vault.list_files()
        else:
            # List from both
            main_files = self.main_vault.list_files()
            bdaiv2_files = self.bdaiv2_vault.list_files()
            return {
                "main_vault": main_files,
                "bdaiv2_vault": bdaiv2_files
            }
    
    def search_all(self, query: str) -> list:
        """Search across both vaults"""
        main_results = self.main_vault.search(query)
        bdaiv2_results = self.bdaiv2_vault.search(query)
        
        return {
            "query": query,
            "main_vault": {
                "results": main_results,
                "count": len(main_results)
            },
            "bdaiv2_vault": {
                "results": bdaiv2_results,
                "count": len(bdaiv2_results)
            },
            "total": len(main_results) + len(bdaiv2_results)
        }
```

### Option 2: Unified Endpoint with Vault Selection

```python
@router.get("/status")
async def get_status(vault: str = Query("all", enum=["all", "main", "bdaiv2"])):
    """Get vault status - can query one or both"""
    return dual_vault_reader.get_status(vault)

@router.get("/files")
async def list_files(
    vault: str = Query("main", enum=["main", "bdaiv2", "all"]),
    folder: Optional[str] = None
):
    """List files from selected vault(s)"""
    return dual_vault_reader.list_files(vault, folder)

@router.post("/search")
async def search_vaults(request: SearchRequest):
    """Search across vaults"""
    if request.vaults == ["all"]:
        return dual_vault_reader.search_all(request.query)
    else:
        # Search specific vaults
        pass
```

---

## API Endpoints (Dual Vault)

### Status
```
GET /api/obsidian/status?vault=main
GET /api/obsidian/status?vault=bdaiv2
GET /api/obsidian/status?vault=all

Response:
{
  "main_vault": {
    "connected": true,
    "files": 259,
    "path": "/home/jamie/Desktop/Jamie's Personal Vault"
  },
  "bdaiv2_vault": {
    "connected": true,
    "files": 50,
    "path": "/home/jamie/Documents/BDAIV2"
  }
}
```

### List Files
```
GET /api/obsidian/files?vault=main&folder=Agents
GET /api/obsidian/files?vault=bdaiv2&folder=Session_Logs
GET /api/obsidian/files?vault=all
```

### Search
```
POST /api/obsidian/search
{
  "query": "Seaway Mall",
  "vaults": ["main", "bdaiv2"],  // or ["all"]
  "limit": 20
}

Response:
{
  "query": "Seaway Mall",
  "main_vault": {
    "results": [...],
    "count": 5
  },
  "bdaiv2_vault": {
    "results": [...],
    "count": 3
  },
  "total": 8
}
```

---

## What You Need To Do

### Step 1: Activate BDAIV2 REST API

1. Open BDAIV2 vault in Obsidian
2. Settings → Community Plugins → Browse
3. Install "Local REST API" plugin
4. Enable it
5. **IMPORTANT:** Change port to 27125 (so it doesn't conflict with main vault)
   - Settings → Local REST API → Port: 27125
6. Copy the API key (or use same key)

### Step 2: Verify Both Are Running

```bash
# Check both ports
curl -k https://127.0.0.1:27124/vault/ -H "Authorization: Bearer $API_KEY"
curl -k https://127.0.0.1:27125/vault/ -H "Authorization: Bearer $API_KEY"
```

### Step 3: Update Code

I can update `obsidian_api.py` to support both vaults once BDAIV2 API is active.

---

## Use Cases for Dual Vault

| Use Case | Main Vault | BDAIV2 |
|----------|------------|--------|
| **Active Projects** | ✅ Current deals, properties | ❌ |
| **Session History** | ❌ | ✅ Archived sessions |
| **Agent Workspaces** | ✅ Active agents | ✅ Archived agent data |
| **Reference Data** | ✅ Builders, lenders | ❌ |
| **Long-term Storage** | ❌ | ✅ Historical records |
| **Search Everything** | ✅ | ✅ Combined search |

---

## Current Reality

```
✅ Main Vault (27124): ONLINE - 259 files accessible
❌ BDAIV2 (27125): OFFLINE - REST API not detected
```

**Next Step:** Activate REST API in BDAIV2 vault on port 27125, then I can implement dual-vault support.

---

*Analysis Date: 2026-04-02*
*Status: Waiting for BDAIV2 REST API activation*
