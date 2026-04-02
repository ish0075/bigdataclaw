# BigDataClaw → Shared Contact Intelligence Integration

This document explains how BigDataClaw can use the BDAIV2 Contact Intelligence service without disrupting BDAIV2 operations.

## Architecture

```
┌─────────────────┐      HTTP API      ┌──────────────────────────┐
│   BigDataClaw   │  ───────────────►  │  Contact Intelligence    │
│   (This Repo)   │   Port 8011        │  API (BDAIV2)            │
│                 │  ◄───────────────  │  - 49,178 contacts       │
│ - buyer_matcher │                    │  - Local SQLite mart     │
│ - deal pipeline │                    │  - Live BigStats fallback│
│ - research      │                    │                          │
└─────────────────┘                    └──────────────────────────┘
```

**Key Point:** The Contact Intelligence API runs as a separate service on port 8011. It reads from a local SQLite mart that BDAIV2 maintains, so BigDataClaw queries don't affect BDAIV2's performance.

## Quick Start

### 1. Ensure the API is Running

The API should be running on `http://127.0.0.1:8011`. Check:

```bash
curl http://127.0.0.1:8011/health
```

If not running, start it (this won't disrupt BDAIV2):

```bash
cd /home/jamie/BDAIV2_System && python3 scripts/run_contact_intelligence_api.py &
```

### 2. Use the Client in BigDataClaw Code

```python
from contact_intelligence_client import ContactIntelligenceClient, enrich_buyer_with_contacts

# Initialize client
client = ContactIntelligenceClient()

# Check service health
health = client.health()
print(f"Mart available: {health['mart_available']}")
print(f"Records: {health['mart_row_count']:,}")

# Lookup a company
result = client.lookup_company("Dream Industrial REIT", include_contacts=True)

# Search for specific contacts
contacts = client.search_contacts(
    company_name="CBRE Limited",
    title_filter=["VP", "Director", "President"],
    limit=10
)

# Batch lookup multiple companies
results = client.lookup_companies([
    "Dream Industrial REIT",
    "RioCan Real Estate Investment Trust",
    "Carttera Private Equities"
])
```

## Integration Patterns

### Pattern 1: Enrich Matched Buyers with Contacts

Modify `universal_buyer_matcher.py` to include contact data:

```python
from contact_intelligence_client import ContactIntelligenceClient

class UniversalBuyerMatcher:
    def __init__(self):
        self.contact_client = ContactIntelligenceClient()
    
    def match_and_enrich(self, property_data):
        # ... existing matching logic ...
        matches = self.find_matches(property_data)
        
        # Enrich each match with contacts
        for match in matches:
            contact_data = self.contact_client.lookup_company(
                match['buyer_name'],
                include_contacts=True,
                include_executives=True
            )
            match['contacts'] = contact_data.get('contacts', [])
            match['emails'] = contact_data.get('emails', [])
        
        return matches
```

### Pattern 2: Contact-First Deal Pipeline

In `deal_command_center.py`, when a deal is created:

```python
def create_deal(self, entity_name, property_info):
    deal = {...}
    
    # Auto-populate contacts
    client = ContactIntelligenceClient()
    contact_info = client.lookup_company(entity_name)
    
    if contact_info.get('success'):
        deal['contacts'] = contact_info.get('contacts', [])
        deal['enriched_at'] = datetime.now().isoformat()
    
    return deal
```

### Pattern 3: Property Research Enrichment

When researching a property, enrich buyer matches:

```python
# In property research flow
from contact_intelligence_client import enrich_buyer_with_contacts

enriched_matches = []
for match in property_matches:
    enriched = enrich_buyer_with_contacts(match['buyer_name'])
    match['contact_count'] = len(enriched.get('contacts', []))
    match['has_emails'] = len(enriched.get('emails', [])) > 0
    enriched_matches.append(match)
```

## Available Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `health()` | Check service status | `client.health()` |
| `lookup_company(name)` | Get company + contacts | `lookup_company("CBRE")` |
| `lookup_domain(domain)` | Lookup by domain | `lookup_domain("cbre.com")` |
| `search_contacts()` | Find contacts by criteria | `search_contacts(company_name="CBRE", limit=5)` |
| `find_emails()` | Get email addresses | `find_emails(domain="cbre.com")` |
| `lookup_companies()` | Batch lookup | `lookup_companies(["A", "B", "C"])` |

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CONTACT_INTELLIGENCE_BASE_URL` | `http://127.0.0.1:8011` | API endpoint |

## Data Freshness

The Contact Intelligence mart is refreshed periodically by BDAIV2. Check freshness:

```python
health = client.health()
freshness = health['mart_freshness_at']  # ISO timestamp
has_live = health['has_live_session']    # True if live BigStats available
```

## Testing

```bash
# Test the client directly
python3 contact_intelligence_client.py --health

# Lookup a specific company
python3 contact_intelligence_client.py "Dream Industrial REIT"

# Test from Python
python3 -c "
from contact_intelligence_client import ContactIntelligenceClient
c = ContactIntelligenceClient()
print(c.lookup_company('RioCan Real Estate Investment Trust'))
"
```

## Troubleshooting

### Connection Refused
The API isn't running. Start it:
```bash
cd /home/jamie/BDAIV2_System && python3 scripts/run_contact_intelligence_api.py
```

### No Results
The mart may not have data for that company. Try:
- Different name variations ("CBRE" vs "CBRE Limited")
- Domain lookup instead
- Check if `has_live_session` is True (can fetch live)

### Mart Unavailable
The SQLite file might be locked. The service will fall back to live BigStats if `BIGSTATS_SESSION` is available.

## Summary

- ✅ BigDataClaw can query 49K+ contacts without disrupting BDAIV2
- ✅ HTTP API on port 8011 (separate process)
- ✅ Local-first (uses SQLite mart)
- ✅ Falls back to live BigStats when available
- ✅ Simple client wrapper: `contact_intelligence_client.py`
