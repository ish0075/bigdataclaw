---
name: property-matcher
description: Commercial real estate buyer matching and deal intelligence. Use when working with property listings, buyer databases, hot money detection, matching algorithms, or any LandSwipe/Deal Generator related tasks. Activates for buyer matching, seller analysis, property database operations, deal flow automation, and outreach list generation.
---

# Property Matcher Skill

## Overview

This skill covers Jamie Isherwood's commercial real estate matching system (LandSwipe/The Deal Generator). It connects recent sellers (with hot capital) to active listings using AI-powered matching algorithms.

## Key Capabilities

- **Buyer Database Management**: 21,703+ contacts, filtering, searching
- **Hot Money Detection**: Identify recent sellers with fresh capital
- **Property Matching**: Match listings to qualified buyers
- **Outreach Generation**: Create contact lists with LinkedIn/phone data
- **Deal Intelligence**: SPA status, buyer capacity, motivation signals

## Core Data Sources

| File | Purpose |
|------|---------|
| `FEBRUARY_2026_HOT_MONEY.md` | Fresh whale deals ($343.7M) |
| `THOROLD_BUYERS_PRIORITY_LIST.md` | Qualified buyers with phones |
| `HOT_BUYERS_LINKEDIN_LIST.md` | 30 top buyers with LinkedIn |
| `FULL_CLICKABLE_LINKEDIN_LIST.md` | 40 buyers with contact links |
| `HOT_MONEY_SELLERS_PRIME_TARGETS.md` | Recent sellers with $244M+ cash |
| `memory/2026-03-12.md` | Broker agents (560+), firms (1,100+), lenders (576+) |

## Active Listings Reference

| ID | Property | City | Price | Status | Matches |
|----|----------|------|-------|--------|---------|
| 17 | Byron Meadows | London | $6.59M | Pre-App Complete | 15+ |
| 7 | 75 Ormond St S | Thorold | $4.82M | SPA APPROVED | 8 |
| 8 | 700 Line 1 South | One Medonte | $10M | City Incorporated | 5 |

## Buyer Archetypes

- **Cash Buyer**: All-cash, quick close, no financing
- **Contrarian**: Buys when others sell, distressed opportunities
- **Portfolio**: Multi-property, diversification focused
- **Developer**: Ground-up construction, value-add
- **1031 Exchange**: Timeline pressure, specific criteria
- **Institutional**: REITs, funds, large checks

## Matching Algorithm

Score buyers on:
1. **Capacity** (0-3): Proven transaction size
2. **Geography** (0-2): Market familiarity
3. **Asset Fit** (0-3): Property type alignment
4. **Timing** (0-2): Recent activity, hot money status

**Total Score: 0-10** → Rank and filter top 5

## Quick Commands

```python
# Load buyer database
import json
with open('realtrack_hot_money_2026-03-16.json') as f:
    buyers = json.load(f)

# Filter by capacity
whales = [b for b in buyers if b.get('sale_price', 0) > 10_000_000]

# Find by location
local = [b for b in buyers if 'Niagara' in b.get('location', '')]
```

## Output Formats

- **Priority List**: Table with phones, ranked by match score
- **LinkedIn List**: Clickable profile links for outreach
- **Cold Call Sheet**: Name, phone, capacity, angle
- **Email Sequence**: 5-touch drip campaign

## Integration Points

- Connects to CORTEX OS as MatchAgent data source
- Feeds PDF Generator for feature sheets
- Exports to CRM (Salesforce, HubSpot)

## Hot Money Signals

Recent sale (30-90 days) + no replacement purchase = hot money

| Signal | Weight |
|--------|--------|
| Closed within 60 days | +3 |
| All cash | +2 |
| No new purchase recorded | +2 |
| Government/corporate seller | +1 |
| High financing rate on prior deal | +2 (desperate to refinance) |

## References

For detailed buyer database schema: See `references/buyer-schema.md`
For matching engine implementation: See `references/matching-algorithm.md`