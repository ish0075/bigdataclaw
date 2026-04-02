# Obsidian Real Estate Expert Agent Skill

## Agent Identity

**Name:** Obsidian  
**Role:** Seasoned Real Estate Database Expert  
**Experience:** Knows every property, buyer, and transaction in the database  
**Specialty:** Financial calculations & property intelligence  

---

## Core Capabilities

### 1. Property Knowledge Base
**Skill:** `property_database_query`
- **Scope:** Every property in the system
- **Access:** Instant recall by address, city, asset class
- **Data Points:**
  - Address, city, region
  - Asset class & property type
  - Price, size, lot details
  - Financial history
  - Comparable sales
  - Buyer history
  - Agent contacts

### 2. Financial Metric Calculations
**Skill:** `calculate_all_metrics`

| Metric | Formula | Asset Classes |
|--------|---------|---------------|
| **Cap Rate** | (NOI / Price) × 100 | All income-producing |
| **Price/SF** | Price / Building SF | All except land |
| **Price/Acre** | Price / Lot Acres | Land, industrial, retail |
| **Price/Lot** | Price / Lot Count | Land subdivisions |
| **Price/Unit** | Price / Unit Count | Multifamily, hospitality, senior |
| **GRM** | Price / Gross Rent | Multifamily, retail |
| **Going-in Yield** | Year 1 NOI / Price | Value-add properties |

### 3. Market Intelligence
**Skill:** `market_statistics_engine`
- Regional cap rate averages
- Price per SF trends
- Transaction volume analysis
- Comparable property search
- Market velocity indicators

### 4. Agent Coordination
**Skill:** `coordinate_data_gathering`
- Calls Transaction Scout for comps
- Calls Hot Money Identifier for buyers
- Calls Portfolio Analyzer for strategic fit
- Calls Agent Finder for brokers
- Calls Lender Matcher for financing
- Consolidates all intelligence

### 5. Obsidian Integration
**Skill:** `vault_integration`
- Creates property notes in Obsidian
- Updates buyer profiles
- Maintains research logs
- Generates daily summaries

---

## Asset Class Expertise

### Multifamily
**Key Metrics:** Price/Unit, Cap Rate, GRM  
**Typical Range:**
- High-rise: $250K-$400K/unit
- Mid-rise: $200K-$300K/unit
- Low-rise: $150K-$250K/unit
- Cap rates: 3.5%-5.5%

### Retail
**Key Metrics:** Price/SF, Sales/SF, Cap Rate  
**Typical Range:**
- Regional malls: $200-$400/sf
- Community centers: $150-$300/sf
- Strip retail: $200-$400/sf
- Cap rates: 5.5%-7.5%

### Industrial
**Key Metrics:** Price/SF, Clear Height, Loading  
**Typical Range:**
- Modern logistics: $150-$250/sf
- Light industrial: $100-$175/sf
- Flex: $125-$200/sf
- Cap rates: 4.5%-6.5%

### Office
**Key Metrics:** Price/SF, Tenant Credit, WALT  
**Typical Range:**
- Class A downtown: $400-$700/sf
- Class B suburban: $200-$350/sf
- Medical: $300-$500/sf
- Cap rates: 6.0%-8.5%

### Land
**Key Metrics:** Price/Acre, Price/Lot, Zoning  
**Typical Range:**
- Residential (GTA): $500K-$2M/acre
- Commercial: $300K-$1M/acre
- Industrial: $200K-$800K/acre

---

## Usage Examples

### Example 1: Property Research

```python
from agents.obsidian_agent import get_obsidian_agent

# Get the expert
obsidian = get_obsidian_agent()

# Research a property
property_data = {
    'address': '100 Bayshore Dr',
    'city': 'Ottawa',
    'region': 'Ottawa',
    'asset_class': 'retail',
    'price': 300000000,
    'size_sf': 880000,
    'noi': 15400000
}

# Coordinate full research
results = obsidian.coordinate_data_gathering(property_data)

# Access calculated metrics
metrics = results['results']['calculated_metrics']
print(f"Cap Rate: {metrics['cap_rate']:.2f}%")
print(f"Price/SF: ${metrics['price_per_sf']:.2f}")
```

### Example 2: Query Property Database

```python
# Find all retail in Ottawa
properties = obsidian.query_property(
    city='Ottawa',
    asset_class='retail'
)

# Get specific property metrics
metrics = obsidian.get_property_metrics(
    address='100 Bayshore Dr',
    city='Ottawa'
)
```

### Example 3: Get Comparables

```python
comparables = obsidian.get_comparable_properties(
    property_data={
        'asset_class': 'retail',
        'region': 'Ottawa',
        'price': 300000000,
        'size_sf': 880000
    },
    radius='same_region'
)
```

### Example 4: Market Statistics

```python
stats = obsidian.get_market_statistics(
    region='Ottawa',
    asset_class='retail'
)

print(f"Avg Cap Rate: {stats['avg_cap_rate']:.2f}%")
print(f"Avg Price/SF: ${stats['avg_price_per_sf']:.2f}")
```

### Example 5: Natural Language Queries

```python
# Ask questions
answer = obsidian.answer_question(
    "What's the cap rate for Bayshore Mall?",
    context={'property': property_data}
)

answer = obsidian.answer_question(
    "Show me all industrial properties in Hamilton"
)

answer = obsidian.answer_question(
    "What should I offer for a 50000 sf warehouse?"
)
```

---

## Integration with Orchestrator

```python
class EnhancedAgentOrchestrator(AgentOrchestrator):
    def __init__(self):
        super().__init__()
        self.obsidian = get_obsidian_agent()
    
    def research_property(self, property_data):
        # Phase 0: Obsidian Intelligence
        print("\n🏛️ Phase 0: Obsidian Expert Analysis")
        
        # Get comprehensive data from Obsidian
        obsidian_data = self.obsidian.coordinate_data_gathering(
            property_data,
            agents_to_call=['transaction_scout', 'hot_money', 'portfolio']
        )
        
        # Continue with other phases
        results = super().research_property(property_data)
        
        # Merge Obsidian intelligence
        results['obsidian_analysis'] = obsidian_data
        results['calculated_metrics'] = obsidian_data['results'].get('calculated_metrics')
        results['comparable_properties'] = obsidian_data['results'].get('comparable_properties')
        results['market_statistics'] = obsidian_data['results'].get('market_statistics')
        
        return results
```

---

## Knowledge Base Structure

```
Obsidian Agent Knowledge:
│
├── Property Database (property_db)
│   ├── PropertyKnowledge objects
│   ├── Calculated metrics
│   ├── Comparable sales
│   └── Historical data
│
├── Buyer Database (buyer_db)
│   ├── Investment criteria
│   ├── Geographic focus
│   ├── Deal history
│   └── Contact info
│
├── Transaction Database (transaction_db)
│   ├── All historical sales
│   ├── Price trends
│   └── Market velocity
│
└── Asset Class Expertise
    ├── 8 asset class profiles
    ├── Typical metrics ranges
    └── Key valuation drivers
```

---

## Output Formats

### Property Note (Obsidian Markdown)

```markdown
---
date: 2026-01-14
address: "100 Bayshore Dr"
city: Ottawa
region: Ottawa
asset-class: retail
price: 300000000
cap-rate: 5.13
price-per-sf: 340.91
status: research
tags:
  - asset/retail
  - region/ottawa
  - status/research
---

# 100 Bayshore Dr

## Property Overview

| Attribute | Value |
|-----------|-------|
| **Address** | 100 Bayshore Dr |
| **City** | Ottawa |
| **Asset Class** | Retail |
| **Price** | $300,000,000 |

## Financial Metrics

| Metric | Value |
|--------|-------|
| **Cap Rate** | 5.13% |
| **Price/SF** | $340.91 |
| **Size** | 880,000 SF |

## Research Notes

*Generated by Obsidian Agent*
```

---

## Quick Reference: Metric Calculations

| Scenario | Calculation |
|----------|-------------|
| **Bayshore Mall** | $300M / 880K sf = **$341/sf** |
| **Erin Mills** | $370M / 911K sf = **$406/sf** (2010) |
| **Centre on Barton** | $150M / 677K sf = **$222/sf** |
| **Conestoga** | $269.7M / 582K sf = **$463/sf** |
| **Cap Rate** | NOI $15.4M / $300M = **5.13%** |
| **Land (Erin Mills)** | 12.3 acres @ $20M/acre = **$246M** |

---

## File Location
- **Agent:** `agents/obsidian_agent.py`
- **Skill Doc:** `agents/skills/obsidian_agent_skill.md`
- **Tests:** Run `python agents/obsidian_agent.py`

---

*The Obsidian Agent is your central nervous system for property intelligence.*
