# Commercial Agent Recruiter - Implementation Plan

## Data Separation Strategy

### Current Data
| Dataset | Count | Type | Source |
|---------|-------|------|--------|
| **96K Agents** | ~96,000 | Residential | `QUICK_LINKS_ALL_REALTORS_V2.csv` |
| **Commercial Agents** | ~6,697 | Commercial | `dbeaver_final_exports/broker_agents_final.csv` |

### Key Differences
| Feature | Residential | Commercial |
|---------|-------------|------------|
| **Focus** | Home buyers/sellers | Investment properties, offices, retail |
| **Brokerages** | RE/MAX, Royal LePage | CBRE, Colliers, JLL, Avison Young |
| **Deal Size** | $500K-$2M | $2M-$50M+ |
| **Recruiting Angle** | EXP commission split | Commercial resources, market data |
| **Contact Method** | Social media (FB/IG) | LinkedIn, direct email |

## Implementation Options

### Option 1: Separate Page (Recommended)
Create `CommercialAgentRecruiter.jsx` - completely separate from residential

**Pros:**
- Clean separation of concerns
- Different UI for different workflows
- Targeted quick links (LinkedIn-heavy for commercial)
- Separate tracking/stats

**Cons:**
- More code to maintain
- Two places to check

### Option 2: Toggle in Current Page
Add "Residential / Commercial" toggle in EXP Agent Recruiter

**Pros:**
- Single interface
- Easy comparison

**Cons:**
- More complex UI
- Different data structures
- Could confuse users

## Recommended Approach: Option 1

### New Page: Commercial Agent Recruiter

**Sidebar Entry:**
```
Recruitment
├── EXP Agent Recruiter (Residential) 96K
└── Commercial Agent Recruiter 6.7K
```

**Features:**
- Same builder-style cards
- LinkedIn-focused quick links
- Email-heavy (commercial agents prefer email)
- Company/transaction data integration
- No EXP sorting (commercial is different market)

### Data Import

**From DBeaver:**
- `broker_agents_final.csv` (6,697 agents)
- Linked to `sales` table for transaction history
- Company/brokerage info from broker tables

**Fields:**
- Name, Email, Phone
- Company/Brokerage
- Transaction volume (from sales data)
- Specialties (office, retail, industrial, multi-family)

### Quick Links Differences

| Link | Residential | Commercial |
|------|-------------|------------|
| **Primary** | Facebook, Instagram | LinkedIn, Email |
| **Search** | Realtor.ca | LoopNet, CoStar |
| **Research** | Reviews | Deal history, Transaction volume |
| **Contact** | Social media | Direct email, Office phone |

## ✅ COMPLETED

### ✅ 1. Import Script
Created: `scripts/import_commercial_agents.py`
- Imports from `broker_agents_final.csv`
- Detects company from email domain
- Generates commercial-focused quick links

### ✅ 2. CommercialAgentRecruiter.jsx
Created: `nerve/src/views/CommercialAgentRecruiter.jsx`
- LinkedIn-focused UI
- Company-colored avatars
- LoopNet/CoStar quick links
- Group by company/status

### ✅ 3. Sidebar Navigation
Updated: `nerve/src/components/Common/Sidebar.jsx`
```
Recruitment
├── EXP Agent Recruiter (96K)      # Residential
└── Commercial Agents (6.7K)        # Commercial ✨ NEW
```

### ✅ 4. Route Added
Updated: `nerve/src/App.jsx`
- Route: `/commercial-agent-recruiter`

### ✅ 5. Data Files Generated
- `commercial_agents_full.json` (6,697 agents)
- `commercial_agents_sample.json` (500 agents)
- `commercial_agents_meta.json`

---

## Key Differences Implemented

| Feature | Residential | Commercial |
|---------|-------------|------------|
| **Count** | 96K | 6,697 |
| **Data** | Realtors CSV | DBeaver broker_agents |
| **Avatar** | Random colors | Company colors |
| **Primary** | Facebook | LinkedIn |
| **Platforms** | Realtor.ca | LoopNet, CoStar |
| **EXP Sort** | Yes | No |

---

## Files Created/Modified

```
✅ nerve/src/views/CommercialAgentRecruiter.jsx      # New page
✅ nerve/src/components/Common/Sidebar.jsx           # Add nav item
✅ nerve/src/App.jsx                                 # Add route
✅ scripts/import_commercial_agents.py               # Import script
✅ nerve/public/data/commercial_agents_full.json     # Data file
✅ nerve/public/data/commercial_agents_sample.json   # Sample data
✅ nerve/public/data/commercial_agents_meta.json     # Metadata
✅ COMMERCIAL_AGENT_RECRUITER.md                     # Documentation
```

---

## Future Enhancements (Optional)

- [ ] Link to sales/transaction data for deal volume
- [ ] Filter by specialty (Office/Retail/Industrial/Multi-family)
- [ ] Import transaction history per agent
- [ ] Company logos instead of initials
- [ ] LinkedIn profile auto-detection


## Questions for You

1. **Should commercial agents also be sorted by EXP?** (Probably not relevant)
2. **Do you want transaction history visible on cards?** (Deal count, volume)
3. **Should we filter by property type?** (Office, Retail, Industrial, Multi-family)
4. **LinkedIn priority?** Commercial agents are more LinkedIn-active

Ready to build this?
