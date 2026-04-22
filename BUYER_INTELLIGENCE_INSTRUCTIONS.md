# Buyer Intelligence Report — Instructions for Terminal/CLI Usage

> Saved for agent reference. When the user asks to "create a buyer intelligence report through the terminal," use this document.

---

## What It Does

The Buyer Intelligence engine takes any property and returns a **ranked, actionable list of who to call, why they'll buy, and how to reach them**. It searches across 5 data sources:

| Source | What It Finds |
|--------|---------------|
| **Hot Money Buyers** | Recent sellers with fresh capital (highest priority) |
| **Registered Buyers** | 5,000+ buyers in the database |
| **Sellers with Capital** | 1031 exchange / portfolio reinvestment candidates |
| **Lenders** | Matched financing sources for the deal |
| **Commercial Agents** | Active brokers in the target market |
| **Comparable Deals** | Recent transactions in the same price range |

---

## How to Generate a Report

### Frontend
Navigate to **Buyer Intelligence** in the sidebar.

### API (direct — use this for terminal/CLI)

```bash
curl -X POST http://localhost:8000/api/buyer-intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "property_type": "Industrial",
    "address": "1500 Michael Drive",
    "city": "Welland",
    "province": "ON",
    "size_sqft": 85000,
    "price": 18500000,
    "net_income": 925000,
    "cap_rate": 5.0,
    "description": "Modern industrial facility near QEW corridor",
    "target_count": 25
  }'
```

---

## Input Fields

| Field | Required | Example |
|-------|----------|---------|
| `property_type` | ✅ | `Office`, `Industrial`, `Retail`, `Multifamily` |
| `address` | ✅ | `1500 Michael Drive` |
| `city` | ✅ | `Mississauga` |
| `province` | ✅ | `ON` |
| `price` | ✅ | `25000000` |
| `size_sqft` | Optional | `100000` |
| `net_income` | Optional | `1400000` |
| `cap_rate` | Optional | `5.6` |
| `description` | Optional | `Value-add potential near airport` |
| `target_count` | Optional | `25` (default) |

---

## Scoring System (0–100)

Each buyer is scored across 7 factors:

| Factor | Max Points | How It Works |
|--------|------------|--------------|
| **Asset Match** | 20 | Exact asset class match = 20, partial = 12 |
| **Location Match** | 15 | Same city = 15, same province = 5 |
| **Price/Size Fit** | 15 | Cash ≥ 1.5× price = 15, ≥ 0.8× = 12 |
| **Recency** | 15 | Sale within 30 days = 15, 90 days = 10 |
| **Capital** | 15 | $10M+ = 15, $5M+ = 10, $1M+ = 5 |
| **Portfolio Match** | 10 | Matching asset class in portfolio |
| **Contact Quality** | 10 | Has email + phone + LinkedIn |

---

## Output Tiers

Buyers are grouped into 3 outreach tiers:

| Tier | Score | Action |
|------|-------|--------|
| **Tier 1** | 75–100 | 🚨 **Call NOW** — highest probability |
| **Tier 2** | 55–74 | 📧 **Email + Feature Sheet** — qualified |
| **Tier 3** | 25–54 | 🔍 **Broker Network / Research** — nurture |

---

## What's In the Report

```json
{
  "subject_property": { ... },
  "summary": {
    "hot_money_buyers_found": 12,
    "registered_buyers_found": 8,
    "sellers_with_capital_found": 5,
    "lenders_found": 15,
    "agents_found": 23,
    "comparable_deals_found": 7,
    "estimated_total_buyer_capacity": 147000000
  },
  "ranked_buyers": [ ... ],
  "sellers_with_capital": [ ... ],
  "capable_lenders": [ ... ],
  "active_agents": [ ... ],
  "comparable_deals": [ ... ],
  "priority_outreach_list": [ ... ],
  "upsells": {
    "feature_sheet": { "endpoint": "/api/property-feature-sheet" },
    "teaser_email": { "endpoint": "/api/buyer-intelligence/teaser" },
    "outreach_package": { "endpoint": "/api/buyer-intelligence/export" }
  }
}
```

---

## Upsells (One-Click)

| Upsell | Endpoint | What It Does |
|--------|----------|--------------|
| **Feature Sheet** | `POST /api/property-feature-sheet` | Branded property webpage to share |
| **Teaser Email** | `POST /api/buyer-intelligence/teaser` | Blast-ready email with highlights |
| **Outreach Package** | `POST /api/buyer-intelligence/export` | PDF with all contacts & quick links |

---

## Quick Links Per Buyer

Every buyer gets auto-generated quick links:

- 🔗 **Google Search** — `https://www.google.com/search?q={name}`
- 🔗 **LinkedIn Profile** — `https://www.google.com/search?q={name}+linkedin`
- 🔗 **CEO/President Search** — `https://www.google.com/search?q={name}+President+OR+CEO+linkedin`
- 🔗 **Recent Deal Search** — `https://www.google.com/search?q={name}+{city}+recent+deal+property`
- 🔗 **News Search** — `https://www.google.com/search?q={name}+real+estate&tbm=nws`
- 🔗 **Contact Page** — `https://www.google.com/search?q={name}+contact`
- 🔗 **Website** — `https://{domain}` (if available)
- 🔗 **Google Maps** — `https://www.google.com/maps/search/{name}+{city}`
- 🔗 **CRE Google** — `https://www.google.com/search?q={name}+commercial+real+estate`
- 🔗 **CRE Listings** — `https://www.google.com/search?q={name}+properties+for+sale+lease`
- 🔗 **Key People** — `https://www.google.com/search?q={name}+CEO+OR+President+real+estate`
- 🔗 **Facebook** — `https://www.google.com/search?q={name}+facebook`
- 🔗 **Instagram** — `https://www.google.com/search?q={name}+instagram`
- 🔗 **Twitter/X** — `https://www.google.com/search?q={name}+twitter+OR+x.com`

---

## Demo Script (10 seconds)

> *"I enter a property — say, a $25M office in Mississauga — and in 2 seconds the system scores every potential buyer in our database across 7 factors. It tells me who to call first, why they'll buy, and gives me one-click links to their LinkedIn, recent deals, and news. These are ranked by probability — Tier 1 means call now, Tier 2 means email with a feature sheet."*

---

## Terminal/CLI Quick Reference

```bash
# 1. Generate buyer intelligence report
curl -X POST http://localhost:8000/api/buyer-intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "property_type": "Office",
    "address": "123 Main St",
    "city": "Mississauga",
    "province": "ON",
    "price": 25000000,
    "target_count": 25
  }'

# 2. Generate feature sheet
curl -X POST http://localhost:8000/api/property-feature-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "property_type": "Office",
    "address": "123 Main St",
    "city": "Mississauga",
    "province": "ON",
    "price": 25000000
  }'

# 3. Generate teaser email
curl -X POST http://localhost:8000/api/buyer-intelligence/teaser \
  -H "Content-Type: application/json" \
  -d '{
    "property_type": "Office",
    "address": "123 Main St",
    "city": "Mississauga",
    "province": "ON",
    "price": 25000000
  }'
```

---

*Saved for BigDataClaw agent reference. Last updated: 2026-04-22*
