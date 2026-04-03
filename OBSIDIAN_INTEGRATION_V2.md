# Obsidian Integration V2 - Seamless File Storage & Retrieval

## Overview

This document outlines the enhanced Obsidian integration architecture for seamless bidirectional sync between the NERVE web application and Obsidian vault.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NERVE Web Application                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Obsidian     │  │ Agent Notes  │  │ Session Logs │  │ Deal Files   │       │
│  │ Vault View   │  │ Component    │  │ Auto-Save    │  │ Manager      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                 │                 │                 │
│         └─────────────────┴─────────────────┴─────────────────┘                 │
│                              │                                                  │
│                    ┌─────────────────┐                                          │
│                    │ ObsidianBridge  │  ← Central sync manager                   │
│                    │   (React Hook)  │                                          │
│                    └─────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTP/WebSocket
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Backend API Layer (FastAPI)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                     Obsidian Router (/api/obsidian/*)                     │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │  GET    /status           → Check vault connection & stats               │  │
│  │  GET    /files            → List files with pagination & filters         │  │
│  │  GET    /files/{path}     → Get file content                             │  │
│  │  POST   /files            → Create new file                              │  │
│  │  PUT    /files/{path}     → Update file content                          │  │
│  │  DELETE /files/{path}     → Delete file                                  │  │
│  │  POST   /search           → Full-text search vault                       │  │
│  │  POST   /sync             → Bidirectional sync                           │  │
│  │  GET    /folders          → List folder structure                        │  │
│  │  POST   /folders          → Create folder                                │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                       │
│                    ┌─────────────────────┼─────────────────────┐                 │
│                    │                     │                     │                 │
│                    ▼                     ▼                     ▼                 │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  Local REST API     │  │  File System        │  │  SQLite Cache       │      │
│  │  (Port 27124)       │  │  (Direct Access)    │  │  (Sync State)       │      │
│  │  - Real-time ops    │  │  - Backup/fallback  │  │  - Offline queue    │      │
│  │  - Active file      │  │  - Bulk operations  │  │  - Change log       │      │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Obsidian Vault                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  📁 BDAIV2/                                                                      │
│  ├── 📁 Session_Logs/          ← Auto-exported sessions                          │
│  ├── 📁 Agent_Workspaces/      ← Agent notes, tasks, memories                    │
│  ├── 📁 Deals/                 ← Deal profiles, analysis                           │
│  │   ├── 📁 Hot_Money/                                                              │
│  │   ├── 📁 Active/                                                                 │
│  │   └── 📁 Closed/                                                                 │
│  ├── 📁 Buyers/                ← Buyer profiles                                   │
│  ├── 📁 Properties/            ← Property research                                 │
│  ├── 📁 Recruiters/            ← Agent recruitment tracking                        │
│  ├── 📁 Daily_Notes/           ← Daily activity logs                               │
│  └── 📁 System/                ← Configuration, backups                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. **Automatic Session Logging**
Every user action is automatically saved to both ContextKeep (JSON) and Obsidian (Markdown):
- Session summaries with full context
- Code changes with diffs
- Database queries and results
- Screenshots and visual progress

### 2. **Agent Workspace Sync**
Agent activities are mirrored to Obsidian:
```
Agent_Workspaces/
├── {agent_id}/
│   ├── SOUL.md              # Agent personality & goals
│   ├── HEARTBEAT.md         # Daily activity log
│   ├── Tasks/
│   │   ├── active.md
│   │   └── completed.md
│   ├── Memory/
│   │   └── important_facts.md
│   └── Conversations/
│       └── {date}.md
```

### 3. **Deal File Management**
Seamless deal tracking:
- Hot Money leads auto-export as buyer profiles
- Deal pipeline status synced to Obsidian
- Meeting notes from Bot Boardroom saved
- Property research linked to deals

### 4. **Bidirectional Sync**
- Changes in NERVE → Obsidian (instant)
- Changes in Obsidian → NERVE (on demand/periodic)
- Conflict resolution for simultaneous edits
- Offline queue for when Obsidian is closed

### 5. **Quick Capture**
From any page in NERVE:
- `Ctrl+Shift+O` → Quick note to Obsidian
- Selected text → New note
- Screenshot → Auto-attached
- Agent response → Logged to conversation

---

## API Endpoints

### Status & Health
```
GET /api/obsidian/status
Response: {
  "connected": true,
  "vault_path": "/home/jamie/Documents/BDAIV2",
  "total_files": 1247,
  "last_sync": "2026-04-02T17:30:00Z",
  "pending_sync": 0,
  "version": "1.0.0"
}
```

### File Operations
```
# List files with filtering
GET /api/obsidian/files?folder=Deals&tag=hot-money&limit=50

# Get file content
GET /api/obsidian/files/Deals/Hot_Money/Beedie_Profile.md

# Create/update file
POST /api/obsidian/files
Body: {
  "path": "Deals/Hot_Money/New_Deal.md",
  "content": "# Deal Title...",
  "frontmatter": {
    "created": "2026-04-02",
    "tags": ["deal", "hot-money"]
  }
}

# Delete file
DELETE /api/obsidian/files/Deals/Old_Deal.md
```

### Search
```
POST /api/obsidian/search
Body: {
  "query": "Seaway Mall",
  "folders": ["Deals", "Buyers"],
  "tags": ["retail"],
  "limit": 20
}
```

### Sync
```
POST /api/obsidian/sync
Body: {
  "direction": "bidirectional",  # or "to_obsidian", "from_obsidian"
  "folders": ["Session_Logs", "Agent_Workspaces"],
  "force": false
}
```

---

## Frontend Components

### 1. ObsidianVault View (Enhanced)
```jsx
<ObsidianVault>
  ├── <VaultBrowser />      # File tree navigation
  ├── <NotePreview />       # Markdown preview with edit
  ├── <SyncStatus />        # Connection & sync state
  ├── <QuickActions />      # New note, capture, sync
  └── <SearchPanel />       # Full-text search
</ObsidianVault>
```

### 2. ObsidianClipper (Global)
```jsx
// Floating button on all pages
<ObsidianClipper 
  context={currentPageData}
  agent={currentAgent}
  onClip={saveToObsidian}
/>
```

### 3. useObsidian Hook
```javascript
const {
  connected,      // Connection status
  files,          // File listing
  currentFile,    // Selected file
  loadFile,       // Load file content
  saveFile,       // Save file
  createNote,     // Create new note
  search,         // Search vault
  sync,           // Trigger sync
  isSyncing       // Sync state
} = useObsidian({
  autoSync: true,
  syncInterval: 30000
})
```

---

## Database Schema (Sync State)

```sql
-- Track sync state for offline support
CREATE TABLE obsidian_sync_queue (
    id INTEGER PRIMARY KEY,
    operation TEXT,  -- 'create', 'update', 'delete'
    file_path TEXT,
    content TEXT,
    frontmatter JSON,
    status TEXT,     -- 'pending', 'synced', 'failed'
    created_at TIMESTAMP,
    synced_at TIMESTAMP
);

-- Cache file metadata
CREATE TABLE obsidian_files (
    id INTEGER PRIMARY KEY,
    path TEXT UNIQUE,
    title TEXT,
    tags JSON,
    modified_at TIMESTAMP,
    size INTEGER,
    cached_content TEXT
);
```

---

## Implementation Phases

### Phase 1: Core API (Today)
- [ ] Extend `api_server.py` with full Obsidian router
- [ ] Implement file CRUD operations
- [ ] Add search endpoint
- [ ] Create sync queue table

### Phase 2: Frontend Integration (Tomorrow)
- [ ] Enhance `ObsidianVault.jsx` with full features
- [ ] Create `useObsidian` hook
- [ ] Add Obsidian clipper to all views
- [ ] Implement auto-save for sessions

### Phase 3: Advanced Features (This Week)
- [ ] Bidirectional sync with conflict resolution
- [ ] Agent workspace auto-export
- [ ] Deal file templates
- [ ] Daily note automation

### Phase 4: Polish (Next Week)
- [ ] Offline mode support
- [ ] Sync conflict UI
- [ ] Performance optimization
- [ ] Documentation

---

## Files to Create/Modify

### New Files:
1. `obsidian_api.py` - Full Obsidian REST API router
2. `nerve/src/hooks/useObsidian.js` - React hook for Obsidian
3. `nerve/src/components/Obsidian/ObsidianBridge.jsx` - Sync manager
4. `nerve/src/components/Obsidian/FileBrowser.jsx` - File tree
5. `nerve/src/components/Obsidian/NoteEditor.jsx` - Markdown editor

### Modified Files:
1. `api_server.py` - Add Obsidian router
2. `nerve/src/views/ObsidianVault.jsx` - Full rewrite
3. `nerve/src/components/Common/ObsidianClipper.jsx` - Enhance
4. `save_session_to_contextkeep_obsidian.py` - Auto-export

---

## Configuration

```env
# .env
OBSIDIAN_API_KEY=REDACTED_OBSIDIAN_API_KEY
OBSIDIAN_BASE_URL=https://127.0.0.1:27124
OBSIDIAN_VAULT_PATH=/home/jamie/Documents/BDAIV2
OBSIDIAN_AUTO_SYNC=true
OBSIDIAN_SYNC_INTERVAL=30000
```

---

## Security Considerations

1. **API Key** - Stored in backend only, frontend uses proxied endpoints
2. **File Access** - Restricted to vault directory, path traversal protection
3. **Content Sanitization** - Prevent XSS in markdown content
4. **Rate Limiting** - Prevent abuse of sync endpoints

---

*Document Version: 1.0*
*Created: 2026-04-02*
*Status: Ready for Implementation*
