---
name: paperclip-nerve-gateway
description: >
  Interact with the NERVE (BigDataClaw) API for commercial real estate intelligence.
  Use when you need to query hot money leads, search buyers/builders, get property
  research, or access market data. Do NOT use for general web search or non-CRE tasks.
---

# Paperclip NERVE Gateway Skill

This skill enables you to query the NERVE commercial real estate intelligence platform.

## Authentication

Environment variables (auto-injected):
- `NERVE_BASE_URL` — NERVE API base (typically http://127.0.0.1:8000)
- `NERVE_API_KEY` — API key for authentication

## Core Endpoints

### Hot Money

**List all hot money leads:**
```bash
GET {NERVE_BASE_URL}/api/hotmoney
```

**Get specific lead:**
```bash
GET {NERVE_BASE_URL}/api/hotmoney/{id}
```

**Search with filters:**
```bash
GET {NERVE_BASE_URL}/api/hotmoney?asset_class=Multifamily&region=Toronto
```

### Buyers

**Search buyers:**
```bash
GET {NERVE_BASE_URL}/api/buyers?asset_class={type}&region={market}
```

**Get buyer details:**
```bash
GET {NERVE_BASE_URL}/api/buyers/{id}
```

### Builders

**List builders:**
```bash
GET {NERVE_BASE_URL}/api/builders
```

**Filter by specialization:**
```bash
GET {NERVE_BASE_URL}/api/builders?specialization=Multifamily&region=Toronto
```

### Property Research

**Research property:**
```bash
POST {NERVE_BASE_URL}/api/research
{
  "address": "123 Main St",
  "city": "Toronto",
  "asset_class": "Office"
}
```

### Matches

**Match property to buyers:**
```bash
GET {NERVE_BASE_URL}/api/matches/{propertyId}
```

## Response Handling

**Success (200):**
- Parse JSON response
- Extract relevant fields
- Store key data

**Error handling:**
- 404: Resource not found — log and continue
- 429: Rate limited — wait and retry
- 5xx: Server error — escalate to CTO

## Best Practices

1. Always include filters to reduce payload size
2. Cache results when appropriate
3. Log query parameters for debugging
4. Handle empty results gracefully
5. Escalate API failures immediately
