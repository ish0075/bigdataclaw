# BigDataClaw Agent Skills Index

**Last Updated:** January 14, 2026  
**System:** BigDataClaw Multi-Agent Orchestrator  
**Version:** 1.0

---

## 🎯 AGENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATOR                        │
│                   (agents/orchestrator.py)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │  Agent  │   │  Agent  │   │  Agent  │   │  Agent  │
   │    1    │   │    2    │   │    3    │   │    4    │
   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
        │              │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │ Skills  │   │ Skills  │   │ Skills  │   │ Skills  │
   │Module   │   │Module   │   │Module   │   │Module   │
   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

---

## 🤖 AGENT ROSTER

| # | Agent Name | Core Function | File | Status |
|---|-----------|---------------|------|--------|
| **0** | **🏛️ Obsidian Expert** | **Property intelligence & calculations** | `obsidian_agent.py` | **✅ ACTIVE** |
| 1 | Transaction Scout | Find recent comparable deals | `orchestrator.py` | ✅ Active |
| 2 | Hot Money Identifier | Identify active buyers | `orchestrator.py` | ✅ Active |
| 3 | Portfolio Analyzer | Match buyer portfolios | `orchestrator.py` | ✅ Active |
| 4 | Agent Finder | Find listing/buyer agents | `orchestrator.py` | ✅ Active |
| 5 | Lender Matcher | Match debt sources | `orchestrator.py` | ✅ Active |
| 6 | Scoring Engine | Rank all matches | `orchestrator.py` | ✅ Active |

> **Note:** The Obsidian Expert is Phase 0 - it runs first to provide property intelligence and calculations that inform all other agents.

---

## 🏛️ OBSIDIAN REAL ESTATE EXPERT (AGENT #0)

**File:** `obsidian_agent_skill.md` & `obsidian_agent.py`

### Role
The **central intelligence hub** - a seasoned real estate database expert who knows every property and can calculate all key metrics.

### Capabilities

| Capability | Description | Example |
|------------|-------------|---------|
| `property_database_query` | Query any property by address/city/class | "Find Bayshore Mall" |
| `calculate_all_metrics` | Cap rate, $/sf, $/acre, $/lot, $/unit | $300M / 880K sf = $341/sf |
| `market_statistics` | Regional averages and trends | "Ottawa retail avg cap: 6.2%" |
| `get_comparables` | Find similar properties | Top 10 comparable sales |
| `coordinate_agents` | Call other agents for data | Gather full intelligence |
| `vault_integration` | Create Obsidian notes | Auto-generate property notes |

### Asset Class Expertise
- **Multifamily:** Price/Unit, GRM, rent growth
- **Retail:** Price/SF, sales/SF, anchor analysis
- **Industrial:** Price/SF, clear height, logistics
- **Office:** Price/SF, WALT, tenant credit
- **Hospitality:** Price/Key, RevPAR, occupancy
- **Senior Living:** Price/Bed, care levels
- **Land:** Price/Acre, Price/Lot, zoning
- **Mixed-Use:** Component valuation

### Quick Usage

```python
from agents.obsidian_agent import get_obsidian_agent

# Get the expert
obsidian = get_obsidian_agent()

# Research any property
results = obsidian.coordinate_data_gathering({
    'address': '100 Bayshore Dr',
    'city': 'Ottawa',
    'asset_class': 'retail',
    'price': 300000000,
    'size_sf': 880000,
    'noi': 15400000
})

# Get instant calculations
metrics = results['results']['calculated_metrics']
# Returns: cap_rate, price_per_sf, price_per_acre, etc.

# Ask natural language questions
answer = obsidian.answer_question(
    "What's the cap rate for Bayshore Mall?",
    context={'property': property_data}
)
```

---

## 🛠️ SKILL MODULES

### Transaction Scout Agent Skills
**File:** `transaction_scout_skill.md`

| Skill | Description | Priority |
|-------|-------------|----------|
| `web_scrape_comps` | Scrape Costar, REIT press releases | 🔴 High |
| `api_data_pull` | Integrate Altus, MPAC APIs | 🔴 High |
| `geo_expand_search` | Expand search to adjacent regions | 🟡 Medium |
| `trend_analyzer` | Price/SF trends, volume analysis | 🟡 Medium |

---

### Hot Money Identifier Skills
**File:** `hot_money_skill.md`

| Skill | Description | Priority |
|-------|-------------|----------|
| `fund_life_tracker` | Track fund exit windows | 🔴 Critical |
| `distress_scanner` | Detect dark anchors, CMBS maturities | 🔴 Critical |
| `capital_monitor` | Track new fund raises | 🟡 Medium |
| `peer_velocity` | Compare to peer group activity | 🟢 Low |

**Use Case:** KingSett Bayshore - fund life tracker identified 2024-2026 exit window

---

### Portfolio Analyzer Skills
**File:** `portfolio_analyzer_skill.md`

| Skill | Description | Priority |
|-------|-------------|----------|
| `portfolio_vacancy_scan` | Analyze portfolio vacancies | 🔴 High |
| `debt_maturity_monitor` | Track CMBS maturities | 🔴 High |
| `esg_portfolio_scan` | Carbon compliance analysis | 🟡 Medium |
| `densification_analyzer` | Untapped land value | 🟡 Medium |

**Use Case:** Erin Mills 12.3 acres intensification analysis

---

### Agent Finder Skills
**File:** `agent_finder_skill.md`

| Skill | Description | Priority |
|-------|-------------|----------|
| `linkedin_agent_scan` | LinkedIn intelligence | 🔴 High |
| `brokerage_listing_scan` | Scrape CBRE, Colliers sites | 🔴 High |
| `mls_agent_search` | CoStar/MLS agent lookup | 🟡 Medium |
| `social_activity_track` | Twitter/X, Instagram monitoring | 🟢 Low |
| `commission_network` | Relationship mapping | 🟡 Medium |

---

### Lender Matcher Skills
**File:** `lender_matcher_skill.md`

| Skill | Description | Priority |
|-------|-------------|----------|
| `cmbs_maturity_monitor` | Track 2026 maturity wall | 🔴 Critical |
| `lender_criteria_api` | Real-time lending criteria | 🔴 High |
| `rate_tracker` | Prime, bond, spread tracking | 🟡 Medium |
| `construction_lender_finder` | Development financing | 🟡 Medium |
| `distressed_debt_scan` | NPL, workout opportunities | 🟢 Low |

**Use Case:** Bayshore Mall - CMBS tracker shows $76.6B 2026 maturities = distressed opportunities

---

### Scoring Engine Skills
**File:** `scoring_engine_skill.md`

| Skill | Description | Priority |
|-------|-------------|----------|
| `ml_score_optimizer` | ML-based weight optimization | 🔴 High |
| `outcome_tracker` | Feedback loop from results | 🔴 High |
| `confidence_calculator` | Score range (vs point estimate) | 🟡 Medium |
| `score_explainer` | Natural language explanations | 🟡 Medium |
| `segmented_rankings` | By buyer type, timeline, certainty | 🟢 Low |

---

## 📊 SKILL PRIORITY MATRIX

| Skill | Impact | Effort | Priority | Timeline |
|-------|--------|--------|----------|----------|
| `fund_life_tracker` | 🔴 High | 🟡 Medium | **P0** | Q1 2026 |
| `distress_scanner` | 🔴 High | 🟡 Medium | **P0** | Q1 2026 |
| `cmbs_maturity_monitor` | 🔴 High | 🟡 Medium | **P0** | Q1 2026 |
| `web_scrape_comps` | 🔴 High | 🟢 Low | **P0** | Q1 2026 |
| `ml_score_optimizer` | 🔴 High | 🔴 High | **P1** | Q2 2026 |
| `linkedin_agent_scan` | 🟡 Medium | 🟡 Medium | **P1** | Q2 2026 |
| `debt_maturity_monitor` | 🟡 Medium | 🟡 Medium | **P1** | Q2 2026 |
| `outcome_tracker` | 🟡 Medium | 🟡 Medium | **P1** | Q2 2026 |
| `api_data_pull` | 🟡 Medium | 🔴 High | **P2** | Q3 2026 |
| `score_explainer` | 🟡 Medium | 🟢 Low | **P2** | Q3 2026 |

---

## 🔧 IMPLEMENTATION GUIDE

### Phase 1: Critical Skills (P0)

```python
# Add to orchestrator.py

class EnhancedAgentOrchestrator(AgentOrchestrator):
    def __init__(self, data_path="~/CortexOS/workspace"):
        super().__init__(data_path)
        self.skills = {
            'fund_life': FundLifeTracker(),
            'distress': DistressScanner(),
            'cmbs': CMBSMaturityMonitor(),
            'web_scrape': WebScraper()
        }
    
    def research_property(self, property_data, skills_enabled=None):
        if skills_enabled is None:
            skills_enabled = []
        
        # Run base research
        results = super().research_property(property_data)
        
        # Apply skills
        if 'fund_life' in skills_enabled:
            results['fund_analysis'] = self.skills['fund_life'].analyze(
                results['matches']['hot_money_buyers']
            )
        
        if 'distress' in skills_enabled:
            results['distress_signals'] = self.skills['distress'].scan(
                property_data
            )
        
        return results
```

### Phase 2: Integration Points

| Skill | Integration | Data Source |
|-------|-------------|-------------|
| `fund_life_tracker` | Hot Money Identifier | Preqin, PitchBook |
| `distress_scanner` | Portfolio Analyzer | Court filings, news |
| `cmbs_maturity_monitor` | Lender Matcher | Trepp, KBRA |
| `web_scrape_comps` | Transaction Scout | Costar, REIT sites |
| `linkedin_agent_scan` | Agent Finder | LinkedIn Sales Nav |

---

## 📈 SKILL IMPACT METRICS

### Before Skills
- Data source: CSV only
- Recency: Historical only
- Scoring: Static weights
- Explanation: None

### After Skills (Target)
- Data sources: CSV + APIs + Web
- Recency: Real-time signals
- Scoring: ML-optimized
- Explanation: Natural language

### KPIs
| Metric | Current | Target |
|--------|---------|--------|
| Match accuracy | 65% | 85% |
| Response rate | 20% | 40% |
| Time to insight | 24hrs | 1hr |
| Distress detection | Manual | Automated |

---

## 📁 FILE STRUCTURE

```
agents/
├── __init__.py
├── orchestrator.py          # Main orchestrator
├── skills/
│   ├── README.md            # This file
│   ├── transaction_scout_skill.md
│   ├── hot_money_skill.md
│   ├── portfolio_analyzer_skill.md
│   ├── agent_finder_skill.md
│   ├── lender_matcher_skill.md
│   └── scoring_engine_skill.md
└── __pycache__/
```

---

## 🚀 NEXT STEPS

1. **Implement P0 Skills** (Q1 2026)
   - Fund life tracker
   - Distress scanner
   - CMBS maturity monitor
   - Web scraper

2. **Build Skill Registry**
   - Create skill loader
   - Add skill enable/disable
   - Implement skill chaining

3. **Feedback Loop**
   - Track outcomes
   - Optimize weights
   - Improve accuracy

---

*Maintained by: BigDataClaw Team*  
*Last Review: January 14, 2026*
