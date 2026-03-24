# BigDataClaw Multi-Agent Research System - Game Plan
## 1000% Optimized Architecture for Real-Time Buyer/Agent/Lender Matching

---

## 🎯 Executive Summary

Build a multi-agent swarm that:
1. **Searches recent transactions** (0-90 days) in the target asset class
2. **Identifies hot money** - buyers who just sold and have capital
3. **Finds portfolio matches** - entities with existing holdings in that asset class
4. **Sources active agents** - brokers who closed deals in that asset class recently
5. **Matches lenders** - financing sources active in that asset class
6. **Returns Obsidian-linked profiles** with one-click contact actions

---

## 🤖 Multi-Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BIGDATACLAW ORCHESTRATOR AGENT                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐         ┌───────────────────┐         ┌───────────────────┐
│ Transaction   │         │ Portfolio         │         │ Agent/Lender      │
│ Scout Agent   │         │ Analyzer Agent    │         │ Finder Agent      │
└───────┬───────┘         └─────────┬─────────┘         └─────────┬─────────┘
        │                           │                             │
        ▼                           ▼                             ▼
┌───────────────┐         ┌───────────────────┐         ┌───────────────────┐
│ - Search DB   │         │ - Query vault     │         │ - Search DB       │
│ - Filter 90d  │         │ - Match asset     │         │ - Filter by deals │
│ - Get sellers │         │   class           │         │ - Get contact     │
│ - Get buyers  │         │ - Check holdcos   │         │   info            │
└───────────────┘         └───────────────────┘         └───────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MATCH SCORING ENGINE                                │
│  - Recency Score (days since transaction)                                   │
│  - Capital Availability Score (sale price vs target price)                  │
│  - Asset Class Match Score (portfolio alignment)                            │
│  - Geographic Overlap Score (market proximity)                              │
│  - Contact Completeness Score (LinkedIn, email, phone)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OBSIDIAN PROFILE GENERATOR                               │
│  - Create/update buyer profiles                                             │
│  - Add quick-action links (mailto, LinkedIn, phone)                         │
│  - Generate match reports                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Sources & Architecture

### Primary Data Sources

| Source | Location | Records | Update Frequency |
|--------|----------|---------|------------------|
| **Transaction DB** | `data_export.csv` | 641 | Weekly |
| **Buyer Database** | `new_data.csv` | 15,285 | Daily |
| **Fresh Leads** | `fresh_data.csv` | 3,624 | Real-time |
| **Obsidian Buyers** | `obsidian-buyers/` | 3+ profiles | Manual |
| **Obsidian Export** | `obsidian_export/` | Indexed | Daily |

### Data Schema

```python
TRANSACTION_RECORD = {
    "email": "contact@company.com",
    "contact_type": "Buyer|Seller",
    "full_name": "John Smith",
    "job_title": "VP Acquisitions",
    "verified": 1,
    "linkedin": "linkedin.com/in/...",
    "company": {
        "name": "Dream Industrial REIT",
        "city": "Toronto",
        "province": "Ontario",
        "phone": "416-555-0100"
    },
    "sales": {
        "address": "1500 Michael Drive",
        "city": "Welland",
        "date": "2025-12-18",
        "price": 5000000,
        "property_type": "Industrial"
    }
}
```

---

## 🔍 Research Workflow (Step-by-Step)

### Phase 1: User Submits Property

```yaml
Input:
  address: "1500 Michael Drive, Welland"
  asset_class: "industrial"
  price: 5000000
  size_sf: 80000
  city: "Welland"
  region: "Niagara"
```

### Phase 2: Transaction Scout Agent

**Mission:** Find all transactions in asset class (0-90 days)

```python
# Search Parameters
search_criteria = {
    "date_range": (today - 90_days, today),
    "asset_class": "industrial",  # Match user's submission
    "region": "Niagara",          # Same or adjacent region
    "min_price": 2000000,         # Reasonable range
    "max_price": 10000000
}

# Returns
recent_transactions = [
    {
        "address": "...",
        "buyer": {...},
        "seller": {...},
        "price": 4800000,
        "date": "2025-03-01",
        "days_ago": 22
    }
]
```

### Phase 3: Hot Money Identifier

**Mission:** Find entities that SOLD recently (have capital)

```python
hot_money_targets = []

for transaction in recent_transactions:
    seller = transaction["seller"]
    sale_price = transaction["price"]
    days_ago = transaction["days_ago"]
    
    # Score based on:
    score = 0
    score += 30 if sale_price >= target_price * 0.5 else 10  # Has capital
    score += 20 if days_ago <= 30 else 10                     # Very recent
    score += 10 if seller.get("verified") else 0              # Verified contact
    
    hot_money_targets.append({
        "entity": seller,
        "sale_price": sale_price,
        "days_since_sale": days_ago,
        "capital_score": score,
        "hot_money_rank": "A" if score >= 50 else "B"
    })
```

### Phase 4: Portfolio Analyzer Agent

**Mission:** Find entities with EXISTING holdings in this asset class

```python
# Query: Who owns industrial properties in Niagara/GTA?
portfolio_matches = query_vault(
    asset_class="industrial",
    region=["Niagara", "Hamilton", "GTA"],
    has_holdings=True
)

# Returns entities like:
# - Dream Industrial REIT (45 industrial props)
# - Carttera (12 industrial props)
# - Local investors with 2-3 buildings
```

### Phase 5: Agent Finder Agent

**Mission:** Find brokers/agents who closed deals in this asset class

```python
# Search for listing brokers on recent transactions
active_agents = []

for transaction in recent_transactions:
    agent = {
        "name": transaction.get("listing_broker"),
        "company": transaction.get("listing_company"),
        "recent_deals": [transaction],
        "specialization": [asset_class],
        "market": transaction["city"]
    }
    
    # Score based on deal volume
    agent["score"] = calculate_agent_score(agent)
```

### Phase 6: Lender Matcher Agent

**Mission:** Find lenders active in this asset class

```python
# Query criteria
lender_criteria = {
    "asset_class": "industrial",
    "loan_size": price * 0.65,  # Typical 65% LTV
    "region": "Ontario"
}

# Match from database
matched_lenders = [
    {
        "name": "RBC Commercial Banking",
        "loan_types": ["Acquisition", "Refinance"],
        "typical_ltv": "60-75%",
        "contact": {...},
        "recent_deals_in_class": [...]
    }
]
```

---

## 📈 Scoring Algorithm

### Match Score Components

```python
def calculate_match_score(entity, property_submission):
    """
    Calculate 0-100 match score
    """
    scores = {
        # 1. HOT MONEY (30 points)
        "hot_money": min(30, entity.get("recent_sale_amount", 0) / property_submission["price"] * 15),
        
        # 2. PORTFOLIO FIT (25 points)
        "portfolio_fit": 25 if entity.get("portfolio_asset_class") == property_submission["asset_class"] else 
                        15 if property_submission["asset_class"] in entity.get("interested_asset_classes", []) else 5,
        
        # 3. DEAL SIZE MATCH (20 points)
        "deal_size": 20 if entity["typical_deal_min"] <= property_submission["price"] <= entity["typical_deal_max"] else
                     10 if property_submission["price"] * 0.5 <= entity["typical_deal_max"] else 0,
        
        # 4. GEOGRAPHIC OVERLAP (15 points)
        "geography": 15 if property_submission["city"] in entity.get("markets", []) else
                     10 if property_submission["region"] in entity.get("regions", []) else 5,
        
        # 5. CONTACT QUALITY (10 points)
        "contact_quality": sum([
            3 if entity.get("email") else 0,
                            3 if entity.get("linkedin") else 0,
                            2 if entity.get("phone") else 0,
                            2 if entity.get("verified") else 0
        ])
    }
    
    total = sum(scores.values())
    return min(100, total), scores
```

---

## 📁 Obsidian Integration (Quick Links)

### Profile Template with Quick Actions

```markdown
---
type: buyer-profile
asset-class: industrial
capital-available: "2025-03-15"
last-transaction: 4800000
hot-money-rank: A
portfolio-size: 12
regions:
  - Niagara
  - Hamilton
  - GTA
typical-deal-size: "5M-20M"
contact:
  name: "Michael Cooper"
  title: "VP Acquisitions"
  email: "m.cooper@dream.ca"
  phone: "416-555-0101"
  linkedin: "https://linkedin.com/in/mcooper"
quick-actions:
  email: "mailto:m.cooper@dream.ca?subject=Industrial Opportunity - Welland"
  linkedin: "https://linkedin.com/in/mcooper"
  phone: "tel:+14165550101"
  calendar: "https://calendly.com/mcooper"
match-score: 95
last-updated: 2025-03-23
---

# Dream Industrial REIT

## 🎯 Investment Criteria
- **Asset Class:** Industrial, Logistics, Last-Mile
- **Deal Size:** $10M - $100M
- **Markets:** Major Canadian markets, selective secondary
- **Cap Rate Target:** 4% - 6%

## 💰 Capital Status
- **HOT MONEY RANK:** A (Sold $48M property 22 days ago)
- **Available Capital:** High (recent disposition)
- **Investment Horizon:** Core/Core-Plus

## 🏢 Portfolio
- Total Properties: 256
- Industrial: 100%
- Ontario Holdings: 45 properties
- Recent Activity: 3 acquisitions in last 6 months

## 📞 Quick Contact
<div class="quick-actions">
  <a href="mailto:m.cooper@dream.ca?subject=Industrial Opportunity - Welland" class="btn-email">✉️ Email</a>
  <a href="https://linkedin.com/in/mcooper" class="btn-linkedin">💼 LinkedIn</a>
  <a href="tel:+14165550101" class="btn-phone">📞 Call</a>
</div>

## 📊 Match History
| Property | Match Score | Contacted | Result |
|----------|-------------|-----------|--------|
| 1500 Michael | 95% | 2025-03-23 | Pending |

## 🔗 Related Profiles
- [[Pure Industrial REIT]]
- [[Carttera Private Equity]]
```

### Quick Action Links Format

```yaml
# Standardized quick-action schema
quick_actions:
  email:
    primary: "mailto:email@company.com?subject=RE: [Asset Class] Opportunity - [City]"
    cc: "mailto:email@company.com,assistant@company.com"
  
  linkedin:
    profile: "https://linkedin.com/in/..."
    message: "https://linkedin.com/messaging/compose?to=..."
  
  phone:
    mobile: "tel:+14165550101"
    office: "tel:+14165550100"
  
  calendar:
    booking: "https://calendly.com/..."
  
  research:
    company_news: "https://www.google.com/search?q=Company+Name+news"
    recent_deals: "#Recent-Deals"
```

---

## 🔧 API Endpoints Design

```python
# Enhanced API with real data integration

@app.route('/research', methods=['POST'])
def research_property():
    """
    Main research endpoint - triggers all agents
    """
    data = request.get_json()
    
    # Phase 1: Transaction Scout
    recent_deals = transaction_scout.search(
        asset_class=data['asset_class'],
        region=data['region'],
        days_back=90
    )
    
    # Phase 2: Hot Money Identifier
    hot_money = hot_money_agent.identify(recent_deals, data['price'])
    
    # Phase 3: Portfolio Analyzer
    portfolio_matches = portfolio_agent.query_vault(
        asset_class=data['asset_class'],
        region=data['region']
    )
    
    # Phase 4: Agent Finder
    active_agents = agent_finder.search(
        asset_class=data['asset_class'],
        region=data['region'],
        recent_deals=recent_deals
    )
    
    # Phase 5: Lender Matcher
    matched_lenders = lender_matcher.find(
        asset_class=data['asset_class'],
        loan_amount=data['price'] * 0.65
    )
    
    # Phase 6: Score & Rank
    all_matches = score_engine.calculate(
        hot_money + portfolio_matches + active_agents + matched_lenders,
        property_data=data
    )
    
    # Phase 7: Save to Obsidian
    obsidian_paths = obsidian_generator.create_profiles(
        all_matches,
        property_data=data
    )
    
    return jsonify({
        "property": data,
        "research_date": datetime.now(),
        "data_sources_checked": [
            "transaction_db",
            "buyer_database",
            "obsidian_vault"
        ],
        "results": {
            "hot_money_buyers": hot_money,
            "portfolio_matches": portfolio_matches,
            "active_agents": active_agents,
            "matched_lenders": matched_lenders
        },
        "top_matches": sorted(all_matches, key=lambda x: x['score'], reverse=True)[:20],
        "obsidian_paths": obsidian_paths,
        "quick_actions_summary": generate_quick_actions_summary(all_matches)
    })

@app.route('/quick-contact/<entity_id>', methods=['GET'])
def get_quick_contact(entity_id):
    """
    Get all contact methods for an entity
    """
    entity = get_entity(entity_id)
    return jsonify({
        "entity": entity,
        "quick_actions": {
            "email": generate_mailto_link(entity, context=""),
            "linkedin": entity.get('linkedin'),
            "phone": entity.get('phone'),
            "obsidian_note": f"obsidian://open?vault=Personal&file=BigDataClaw/Buyer-Profiles/{entity['name']}"
        }
    })
```

---

## 📋 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Set up agent orchestration framework
- [ ] Connect to CSV data sources
- [ ] Build transaction query engine
- [ ] Create basic scoring algorithm

### Phase 2: Intelligence (Week 2)
- [ ] Implement hot money detection
- [ ] Build portfolio analyzer
- [ ] Create agent/lender matching
- [ ] Add geographic proximity scoring

### Phase 3: Integration (Week 3)
- [ ] Obsidian REST API integration
- [ ] Profile template generation
- [ ] Quick-link automation
- [ ] Vault synchronization

### Phase 4: Optimization (Week 4)
- [ ] Caching layer for frequent queries
- [ ] Real-time data updates
- [ ] Advanced filtering UI
- [ ] Batch processing for multiple properties

---

## 🎨 UI/UX Flow

```
User Submits Property
        │
        ▼
┌─────────────────┐
│  Shows Loading  │
│  "Researching   │
│   15,000+       │
│   records..."   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Results Dashboard      │
├─────────────────────────┤
│ 🔥 Hot Money (5)       │
│    [Entity] [Score] [→] │
│                         │
│ 🏢 Portfolio Matches (8)│
│    [Entity] [Score] [→] │
│                         │
│ 🕵️ Active Agents (3)   │
│    [Name] [Deals] [→]  │
│                         │
│ 🏦 Matched Lenders (4)  │
│    [Bank] [LTV] [→]    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Click Any Match        │
│  → Opens Obsidian Note   │
│  → Pre-filled Email      │
│  → LinkedIn Message      │
│  → Phone Call Link       │
└─────────────────────────┘
```

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Research Time** | < 5 seconds | From submit to results |
| **Match Accuracy** | > 85% precision | User feedback score |
| **Contact Coverage** | > 70% | % of matches with email/LinkedIn |
| **Hot Money Detection** | > 90% recall | Capture rate of recent sellers |
| **Obsidian Sync** | < 2 seconds | Profile creation time |

---

## 🔐 Data Privacy & Compliance

- All data stays local (no external APIs for research)
- Obsidian vault is encrypted at rest
- API keys stored in environment variables
- Buyer contact preferences respected (unsubscribe tracking)
- GDPR/CCPA compliance for contact data

---

## 🚀 Next Steps

1. **Review this game plan** - Confirm approach
2. **Build Agent Orchestrator** - Core framework
3. **Implement Transaction Scout** - First agent
4. **Test with sample property** - Validate scoring
5. **Integrate Obsidian** - Quick links
6. **Deploy & iterate** - Real usage feedback

---

*Game Plan Version 1.0*  
*Created: 2025-03-23*  
*Status: Ready for Implementation*
