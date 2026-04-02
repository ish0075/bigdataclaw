# ContextKeep Beta v1.2 Integration

Semantic memory search and retrieval for BigDataClaw using Obsidian's ContextKeep MCP Server.

## Quick Start

### 1. Install ContextKeep in Obsidian

```bash
# In Obsidian → Settings → Community Plugins
# 1. Enable Safe Mode: OFF
# 2. Browse → Search "ContextKeep"
# 3. Install & Enable
# 4. Open ContextKeep settings
```

### 2. Configure MCP Server

In Obsidian's ContextKeep settings:
1. **Enable MCP Server** (Beta)
2. Set port to `8080`
3. Note the API key
4. Click "Start MCP Server"

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
CONTEXTKEEP_API_KEY=your-key-here
OBSIDIAN_VAULT_PATH=/path/to/your/vault
```

### 4. Install MCP Config

The MCP config is already at `.codex/mcp.json`:

```json
{
  "mcpServers": {
    "contextkeep": {
      "command": "npx",
      "args": ["-y", "@contextkeep/mcp-server@beta"],
      "env": {
        "CONTEXTKEEP_API_KEY": "${CONTEXTKEEP_API_KEY}",
        "OBSIDIAN_VAULT_PATH": "${OBSIDIAN_VAULT_PATH}"
      }
    }
  }
}
```

## Available Tools

### `list_all_memories`
Index all memories in your vault with pagination and filtering.

```python
from contextkeep_integration import ContextKeepSync

ck = ContextKeepSync()
ck.connect()

# List all buyer memories
memories = ck.list_all_memories(
    limit=100,
    tags=["buyer", "profile"],
    source_filter="Buyer-Profiles/"
)

for m in memories:
    print(f"{m.id}: {m.content[:100]}...")
```

### `query_memories`
Semantic search through memories using natural language.

```python
# Find buyers interested in industrial properties
results = ck.query_memories(
    query="buyer interested in industrial warehouse Hamilton",
    top_k=5,
    min_relevance=0.7,
    tags=["buyer"]
)

for r in results:
    print(f"{r.relevance_score:.2%}: {r.memory.content[:200]}")
```

### `add_memory`
Add new memories to the index.

```python
memory_id = ck.add_memory(
    content="Buyer Acme Corp closed $5M deal in Hamilton",
    tags=["buyer", "deal-closed", "hamilton"],
    metadata={"company": "Acme Corp", "amount": 5000000},
    source_file="Buyer-Profiles/Acme_Corp.md"
)
```

## Usage Examples

See `contextkeep_examples.py` for complete examples:

```bash
# Run all examples
python contextkeep_examples.py
```

### Example 1: List All Memories
```python
async def list_memories():
    client = ContextKeepClient()
    await client.connect()
    
    memories = await client.list_all_memories(
        limit=50,
        tags=["buyer", "hot-money"]
    )
    
    print(f"Found {len(memories)} memories")
    return memories
```

### Example 2: Buyer Intelligence
```python
# Get all historical context about a buyer
intelligence = ck.get_buyer_intelligence("Acme Properties")

print(f"Found {intelligence['memories_found']} memories")
for interaction in intelligence['interactions']:
    print(f"[{interaction['date']}] {interaction['content']}")
```

### Example 3: Semantic Property Matching
```python
# Find relevant buyers for a property
results = ck.query_memories(
    query="""
    Industrial warehouse in Hamilton
    50,000 sq ft, $5.5 million
    Rail spur access, heavy power
    """,
    top_k=10,
    tags=["buyer", "profile"]
)

for r in results:
    print(f"{r.relevance_score:.0%} match: {r.memory.metadata.get('company')}")
```

### Example 4: Combined with Obsidian
```python
from contextkeep_integration import ContextKeepObsidianBridge

bridge = ContextKeepObsidianBridge()

# Search both traditional Obsidian + semantic ContextKeep
results = bridge.enhanced_buyer_search("industrial buyer Toronto")

print(f"Obsidian matches: {results['obsidian_matches']}")
print(f"Semantic matches: {results['semantic_matches']}")
```

## Integration with Matching Engine

Add to `matching_engine.py`:

```python
from contextkeep_integration import ContextKeepSync

def find_buyers_with_memory_context(self, property_data):
    """Enhance matching with ContextKeep semantic search"""
    
    # Traditional matching
    base_matches = self.calculate_matches(property_data)
    
    # Semantic memory search
    ck = ContextKeepSync()
    query = f"""
    {property_data['asset_class']} property
    {property_data['city']} area
    ${property_data['price']:,.0f}
    """
    
    memory_results = ck.query_memories(query, top_k=10)
    
    # Combine and rank
    enhanced_matches = self.combine_matches(base_matches, memory_results)
    return enhanced_matches
```

## API Reference

### ContextKeepClient (Async)

| Method | Description |
|--------|-------------|
| `connect()` | Establish MCP connection |
| `list_all_memories(limit, offset, tags, source_filter)` | Index memories |
| `query_memories(query, top_k, min_relevance, tags)` | Semantic search |
| `add_memory(content, tags, metadata, source_file)` | Add memory |
| `get_buyer_intelligence(buyer_name)` | Get buyer context |
| `sync_buyer_profile_to_memory(buyer, match_result)` | Sync profile |

### ContextKeepSync (Sync Wrapper)

Same methods as ContextKeepClient but synchronous for easier scripting.

### ContextKeepObsidianBridge

| Method | Description |
|--------|-------------|
| `test_connections()` | Test both Obsidian + ContextKeep |
| `enhanced_buyer_search(query)` | Search both systems |

## Troubleshooting

### Connection refused
```bash
# Check if ContextKeep MCP server is running
curl http://127.0.0.1:8080/health

# Restart from Obsidian: ContextKeep settings → Restart MCP Server
```

### No memories found
```python
# Check if vault path is correct
export OBSIDIAN_VAULT_PATH=/absolute/path/to/your/vault

# Force re-index in ContextKeep settings
```

### Authentication failed
```bash
# Verify API key
export CONTEXTKEEP_API_KEY=your-actual-key

# Check in Obsidian: ContextKeep settings → MCP API Key
```

## Architecture

```
┌─────────────────┐     MCP      ┌──────────────────┐
│  BigDataClaw    │◄────────────►│ ContextKeep MCP  │
│                 │   (stdio)    │ Server (Obsidian)│
└─────────────────┘              └──────────────────┘
         │                                │
         │ HTTP                           │ Index
         ▼                                ▼
┌─────────────────┐              ┌──────────────────┐
│ Obsidian REST   │              │ Memory Vector DB │
│ API (27124)     │              │ (Embeddings)     │
└─────────────────┘              └──────────────────┘
```

## Files

- `contextkeep_integration.py` - Main integration module
- `contextkeep_examples.py` - Usage examples
- `.codex/mcp.json` - MCP server configuration
- `CONTEXTKEEP_SETUP.md` - This file
