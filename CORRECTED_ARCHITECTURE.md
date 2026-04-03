# CORRECTED Architecture - Single Vault Write

## Clear Separation

| Operation | Main Working Vault | BDAIV2 |
|-----------|-------------------|--------|
| **Read** | ✅ Yes | ✅ Yes (reference only) |
| **Write (Sessions, etc.)** | ✅ YES - All writes here | ❌ NO - Never write here |

---

## Vault Paths

```
Main Working Vault (READ + WRITE):
/home/jamie/Desktop/Jamie's Personal Vault
    ├── Session_Logs/          ← Write sessions here
    ├── Agent_Workspaces/      ← Write agent data here
    ├── Deals/                 ← Write deal files here
    └── ...

BDAIV2 (READ ONLY):
/home/jamie/Documents/BDAIV2
    ├── (Reference data only)
    └── NO WRITES EVER
```

---

## What Gets Written Where

### ✅ WRITES TO Main Working Vault:
- Session logs
- Agent workspaces
- Agent tasks
- Deal files
- Daily notes
- Quick captures
- Any "created by NERVE" content

### ❌ NEVER WRITES TO BDAIV2:
- No session logs
- No agent data
- No deal files
- No automated exports
- No manual exports
- NOTHING

---

## API Design

```python
# Main Vault - Full Access (Read + Write)
MainVaultClient:
  - list_files()
  - get_file()
  - create_file()      ← WRITE
  - update_file()      ← WRITE
  - delete_file()      ← WRITE
  - search()

# BDAIV2 - Read Only
BDAIV2VaultClient:
  - list_files()       ← READ ONLY
  - get_file()         ← READ ONLY
  - search()           ← READ ONLY
  - NO create/update/delete
```

---

## Implementation

All write operations go through `MainVaultClient` to:
`/home/jamie/Desktop/Jamie's Personal Vault`

BDAIV2 is accessed separately for reference data only.

---

*Corrected: 2026-04-02*
