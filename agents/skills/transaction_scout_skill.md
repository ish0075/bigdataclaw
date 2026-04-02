# Transaction Scout Agent Skill

## Agent Role
Finds recent commercial real estate transactions (0-90 days) matching target property criteria.

## Current Capabilities
- CSV database queries
- Date range filtering
- Asset class matching
- Geographic region matching

## Enhancement Skills to Add

### 1. Web Scraping Module
**Skill:** `web_scrape_comps`
- **Tool:** requests + BeautifulSoup
- **Sources:**
  - Costar transaction reports
  - REIT press releases
  - Municipal records (Teranet)
- **Output:** Recent deals not in CSV

### 2. API Integration
**Skill:** `api_data_pull`
- **Sources:**
  - Altus Group API (if available)
  - MPAC property transfer data
  - Land registry APIs
- **Output:** Real-time transaction data

### 3. Geographic Expansion
**Skill:** `geo_expand_search`
- **Logic:** If <5 deals in exact region, expand to:
  - Adjacent regions
  - Same province
  - Comparable markets
- **Output:** Expanded comparable set

### 4. Time-Series Analysis
**Skill:** `trend_analyzer`
- **Metrics:**
  - Price/SF trends (90-day moving avg)
  - Volume trends
  - Days on market
- **Output:** Market velocity indicators

## Quick Actions
```python
# Enhanced search with skills
transactions = agent.research_property({
    "address": "100 Bayshore Dr",
    "asset_class": "retail",
    "region": "ottawa",
    "skills": ["web_scrape", "api_pull", "geo_expand"]
})
```

## File Location
`agents/skills/transaction_scout_skill.md`
