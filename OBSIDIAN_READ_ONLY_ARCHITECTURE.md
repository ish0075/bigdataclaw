# Obsidian Integration - READ ONLY Architecture

## ⚠️ CRITICAL CONSTRAINT

**NERVE/BigDataClaw ONLY READS from BDAIV2**  
**NO WRITE OPERATIONS to BDAIV2 from this project**

---

## Architecture (Read-Only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BigDataClaw / NERVE (Read Only)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Obsidian     │  │ Session Logs │  │ Search       │  │ File Browser │   │
│  │ Vault View   │  │ (ContextKeep│  │ (Read Only)  │  │ (Read Only)  │   │
│  │ (Read Only)  │  │  Only!)      │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                 │                 │                 │            │
│         └─────────────────┴─────────────────┴─────────────────┘            │
│                              │                                              │
│                    ┌─────────────────┐                                     │
│                    │ ObsidianReader  │  ← READ ONLY client                  │
│                    │   (Read Only)   │                                     │
│                    └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTP GET / Search Only
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BDAIV2 Obsidian Vault                                │
│                    (READ ONLY - No writes from NERVE)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📁 Session_Logs/          ← Read for reference only                         │
│  📁 Agent_Workspaces/      ← Read agent data                                 │
│  📁 Deals/                 ← Read deal profiles                              │
│  📁 Buyers/                ← Read buyer profiles                             │
│  📁 Properties/            ← Read property research                          │
│  📁 Recruiters/            ← Read recruitment data                           │
│  📁 Daily_Notes/           ← Read daily logs                                 │
│  📁 System/                ← Read configuration                              │
│                                                                              │
│  ⚠️  ALL WRITES BLOCKED FROM NERVE PROJECT                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

---

## What This Project Does (Read-Only)

### ✅ ALLOWED Operations:
- **GET** file contents from BDAIV2
- **SEARCH** across vault for information
- **LIST** files and folders
- **READ** session logs for context
- **BROWSE** vault structure
- **DISPLAY** notes in NERVE UI

### ❌ BLOCKED Operations:
- ❌ Create new files in BDAIV2
- ❌ Update/modify existing files
- ❌ Delete files
- ❌ Auto-save sessions to BDAIV2
- ❌ Write agent workspaces to BDAIV2
- ❌ Sync from NERVE → BDAIV2

---

## Session Logging (ContextKeep ONLY)

Sessions are saved to:
- ✅ `CONTEXTKEEP_CONVERSATIONS.json` (local project)
- ❌ NOT to `BDAIV2/Session_Logs/` (separate project)

```
Sessions → ContextKeep (JSON) → Obsidian (Separate Project)
                ↑
         (Manual export if needed)
```

---

## Separate Write Project (Future)

A **separate standalone project** would handle writes:

```
┌─────────────────────────────────────────┐
│    BDAIV2 Writer (Separate Project)     │
├─────────────────────────────────────────┤
│  - Session log exporter                 │
│  - Agent workspace sync                 │
│  - Deal file creator                    │
│  - Daily note automation                │
│  - Manual export tool                   │
└─────────────────────────────────────────┘
                    │
                    ▼ Writes Only
┌─────────────────────────────────────────┐
│           BDAIV2 Vault                  │
└─────────────────────────────────────────┘
```

This writer project would be:
- Separate repository
- Separate Python environment
- Run independently
- Only activated when explicit export needed

---

## API Endpoints (Read-Only Version)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/obsidian/status` | Check connection (read stats only) |
| GET | `/api/obsidian/files` | List files (read metadata) |
| GET | `/api/obsidian/files/{path}` | Get file content (read only) |
| POST | `/api/obsidian/search` | Search vault (query only) |
| GET | `/api/obsidian/folders` | List folder structure |

### ❌ REMOVED Endpoints:
- ~~POST /api/obsidian/files~~ (create)
- ~~PUT /api/obsidian/files/{path}~~ (update)
- ~~DELETE /api/obsidian/files/{path}~~ (delete)
- ~~POST /api/obsidian/sync~~ (bidirectional)
- ~~POST /api/obsidian/quick-capture~~ (write)
- ~~POST /api/obsidian/session-log~~ (write to BDAIV2)

---

## Files to Modify

### Strip Write Operations From:
1. `obsidian_api.py` - Remove all write endpoints, keep only read operations
2. `save_session_to_contextkeep_obsidian.py` - Remove BDAIV2 write, keep ContextKeep only
3. Any frontend components - Remove "Create Note", "Save to Obsidian" buttons

---

## Configuration

```env
# .env - Read Only Mode
OBSIDIAN_MODE=read-only
OBSIDIAN_API_KEY=REDACTED_OBSIDIAN_API_KEY
OBSIDIAN_BASE_URL=https://127.0.0.1:27124
OBSIDIAN_VAULT_PATH=/home/jamie/Desktop/Jamie's Personal Vault

# Explicitly disable write operations
OBSIDIAN_ALLOW_WRITES=false
```

---

## Data Flow

```
User Action in NERVE
        │
        ▼
┌───────────────┐
│  Read from    │
│  BDAIV2       │ ←──── GET /api/obsidian/files
│  (Reference)  │
└───────────────┘
        │
        ▼
┌───────────────┐
│  Save to      │
│  ContextKeep  │ ←──── CONTEXTKEEP_CONVERSATIONS.json
│  (Project DB) │
└───────────────┘
        │
        ▼
┌───────────────┐
│  Display in   │
│  NERVE UI     │
└───────────────┘
```

**NO WRITE PATH TO BDAIV2**

---

## Quick Fixes Needed

1. ✅ Remove write endpoints from `obsidian_api.py`
2. ✅ Remove BDAIV2 write from session exporter
3. ✅ Add read-only enforcement checks
4. ✅ Update documentation

---

*Document Version: 2.0 - READ ONLY*  
*Updated: 2026-04-02*  
*Status: Requires immediate fixes*
