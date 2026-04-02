# Hot Money Identifier Agent Skill

## Agent Role
Identifies buyers in "buying mode" based on recent transaction velocity and capital deployment.

## Current Capabilities
- Ranks buyers by recent deal count
- Assigns hot money tiers (A, B, C)
- Tracks 90-day activity windows

## Enhancement Skills to Add

### 1. Fund Life Analysis
**Skill:** `fund_life_tracker`
- **Data Sources:**
  - Fund formation dates
  - Typical hold periods (5-7 years)
  - Exit window predictions
- **Output:** Fund exit timeline + motivation score
- **Use Case:** KingSett Bayshore (Fund IV 2021 = exit 2024-2026)

### 2. Distress Signal Detector
**Skill:** `distress_scanner`
- **Signals:**
  - Dark anchor vacancies
  - CMBS maturity dates
  - Partnership buyouts
  - Court filings (CCAA, receivership)
- **Output:** Distress score + motivation ranking
- **Use Case:** Bayshore HBC bankruptcy

### 3. Capital Raise Tracker
**Skill:** `capital_monitor`
- **Sources:**
  - Press releases (new funds)
  - LinkedIn announcements
  - Industry publications
- **Output:** Fresh capital availability score

### 4. Peer Group Velocity
**Skill:** `peer_velocity`
- **Logic:** Compare buyer activity to peer group
- **Metric:** % above/below peer average
- **Output:** Relative activity ranking

## Hot Money Ranking Algorithm

```python
score = (
    recent_deals_count * 0.3 +
    fund_life_urgency * 0.25 +
    distress_signals * 0.25 +
    capital_availability * 0.2
)

# Tiers
A: score >= 80 (immediate outreach)
B: score 60-79 (cultivate)
C: score < 60 (monitor)
```

## Quick Actions
```python
hot_money = agent.identify_hot_money({
    "property": bayshore_mall,
    "skills": ["fund_life", "distress_scan", "capital_track"],
    "time_horizon": "6_months"
})
```

## File Location
`agents/skills/hot_money_skill.md`
