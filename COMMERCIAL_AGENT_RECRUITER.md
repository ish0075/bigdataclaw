# Commercial Agent Recruiter

## Overview

Separate recruiter page for **commercial real estate agents** from DBeaver transaction data.

| Feature | Residential (EXP Agent Recruiter) | Commercial (This Page) |
|---------|-----------------------------------|------------------------|
| **Data Source** | 96K realtors CSV | DBeaver broker_agents |
| **Count** | ~96,000 agents | ~6,697 agents |
| **Focus** | Residential homes | Commercial properties |
| **Primary Contact** | Facebook/Instagram | LinkedIn/Email |
| **Platforms** | Realtor.ca | LoopNet, CoStar |

---

## Data Source

**File:** `dbeaver_final_exports/broker_agents_final.csv`

**Fields Imported:**
- Name, First Name, Last Name
- Email
- Company (auto-detected from email domain)
- Verified status

**Companies Detected:**
- CBRE, Colliers, JLL
- Cushman & Wakefield, Avison Young
- Coldwell Banker Commercial, Savills
- Century 21 Commercial, CLV Group

---

## Quick Links - Commercial Focused

### Main Buttons (Always Visible)
| Button | Icon | Action |
|--------|------|--------|
| **LinkedIn** | LinkedIn | `name+commercial+realtor+linked+in` search |
| **Email** | Mail | Direct mailto or email finder |
| **LoopNet** | Globe | LoopNet agent search |
| **Company** | Building2 | Company Google search |

### Expanded Quick Links

#### Commercial Platforms
- **LoopNet** - Commercial property database
- **CoStar** - Commercial real estate data
- **Google** - General search

#### LinkedIn & Professional
- **LinkedIn Search** - Google search
- **LinkedIn Direct** - LinkedIn people search

#### Contact
- **Email** - Direct mailto
- **Find Email** - Email finder search
- **Facebook** - Facebook search

---

## UI Differences from Residential

| Feature | Residential | Commercial |
|---------|-------------|------------|
| **Avatar Color** | Random | By company (CBRE=blue, Colliers=orange, etc.) |
| **Primary Button** | Facebook | LinkedIn |
| **Stats Shown** | Status, Contacts, Last | Status, Deals, Contact Method |
| **Group By** | Brokerage/City/Status | Company/Status |
| **Quick Links** | Social-heavy | LinkedIn/LoopNet-heavy |
| **EXP Sorting** | Yes (EXP last) | No (not relevant) |

---

## File Structure

```
nerve/src/views/CommercialAgentRecruiter.jsx       # Main component
nerve/public/data/commercial_agents_full.json      # Full dataset (6,697)
nerve/public/data/commercial_agents_sample.json    # Sample (500)
nerve/public/data/commercial_agents_meta.json      # Metadata
scripts/import_commercial_agents.py                # Import script
```

---

## Import Process

```bash
cd /home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw
python3 scripts/import_commercial_agents.py
```

This:
1. Reads `dbeaver_final_exports/broker_agents_final.csv`
2. Detects company from email domain
3. Generates commercial-focused quick links
4. Creates JSON files for frontend

---

## Sidebar Navigation

```
Recruitment
├── EXP Agent Recruiter (96K)      # Residential
└── Commercial Agents (6.7K)        # Commercial (NEW)
```

---

## Future Enhancements

- [ ] Link to sales/transaction data for deal volume
- [ ] Filter by specialty (Office/Retail/Industrial/Multi-family)
- [ ] Import transaction history per agent
- [ ] Company logos instead of initials
- [ ] LinkedIn profile auto-detection

---

## Build Status

✅ **Production Ready** - Last built: 2026-03-29
