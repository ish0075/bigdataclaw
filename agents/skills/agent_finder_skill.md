# Agent Finder Agent Skill

## Agent Role
Identifies active listing brokers and buyer agents from transaction history and market activity.

## Current Capabilities
- Transaction-based agent identification
- Property type specialization mapping
- Recent deal flow tracking

## Enhancement Skills to Add

### 1. LinkedIn Intelligence
**Skill:** `linkedin_agent_scan`
- **Tool:** LinkedIn Sales Navigator (manual) or scraping
- **Data Points:**
  - Recent job changes
  - New listings posted
  - Activity feed (deals announced)
  - Specialization tags
- **Output:** Active agent list with contact info

### 2. Brokerage Website Scraper
**Skill:** `brokerage_listing_scan`
- **Targets:**
  - CBRE.ca
  - Colliers.com
  - JLL.ca
  - CushmanWakefield.com
  - Avison Young
- **Scrape:** Active listings by agent
- **Output:** Agent specialization + current inventory

### 3. MLS/CoStar Agent Lookup
**Skill:** `mls_agent_search`
- **Data:**
  - Recent listing agents
  - Buy-side agents
  - Deal volume by agent
- **Output:** Top agents by transaction volume

### 4. Social Media Monitor
**Skill:** `social_activity_track`
- **Platforms:**
  - LinkedIn posts
  - Twitter/X CRE accounts
  - Instagram (property tours)
- **Signals:**
  - New listings announced
  - Deals closed
  - Market commentary
- **Output:** Activity heat map

### 5. Commission Relationship Map
**Skill:** `commission_network`
- **Analysis:**
  - Which agents work with which buyers
  - Repeat business patterns
  - Commission splits history
- **Output:** Relationship strength score

## Agent Ranking Algorithm

```python
agent_score = (
    recent_deals * 0.30 +
    specialization_match * 0.25 +
    linkedin_activity * 0.15 +
    current_listings * 0.15 +
    buyer_relationships * 0.15
)
```

## Quick Actions
```python
agents = agent.find_agents({
    "property": bayshore_mall,
    "skills": ["linkedin", "brokerage_scan", "mls_lookup"],
    "region": "ottawa",
    "asset_class": "retail"
})
```

## Contact Enrichment

| Source | Data | Reliability |
|--------|------|-------------|
| LinkedIn | Email, phone, title | High |
| Brokerage site | Direct line, bio | High |
| CRE directories | Historical contact | Medium |
| Email hunter | Guessed emails | Low |

## File Location
`agents/skills/agent_finder_skill.md`
