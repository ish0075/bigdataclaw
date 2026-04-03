# NERVE Capital Partners — Paperclip Company Package

A complete AI-powered commercial real estate investment company for Paperclip.

## Overview

**Company Name:** NERVE Capital Partners  
**Mission:** Acquire $100M in commercial real estate assets through AI-powered sourcing and relationship management  
**Structure:** 9 AI agents organized into Acquisition and Operations teams

## Quick Start

### 1. Import into Paperclip

```bash
# From Paperclip UI
cd /path/to/paperclip
pnpm cli company:import --path /path/to/paperclip-company-cre
```

Or use the API:
```bash
POST /api/companies/imports/apply
{
  "source": "file:///path/to/paperclip-company-cre",
  "mode": "new_company"
}
```

### 2. Configure Environment

Set required secrets in `.paperclip.yaml` or via UI:
- `NERVE_API_KEY` — Your NERVE API key
- `NERVE_BASE_URL` — NERVE API URL (default: http://127.0.0.1:8000)

### 3. Start Operations

Agents will begin executing based on their configured routines:
- **Daily**: Hot money scan at 9 AM
- **Weekly**: Pipeline review on Mondays
- **Monthly**: Market reports on 1st of month
- **Quarterly**: Strategy reviews

## Company Structure

```
NERVE Capital Partners
├── CEO (Strategy & Governance)
├── CTO (Data & Acquisition)
│   ├── Buyer Scout (Hot money identification)
│   ├── Builder Scout (Construction partners)
│   └── Market Researcher (Market intelligence)
├── CMO (Relationships & Outreach)
│   ├── Capital Analyst (Capital source research)
│   ├── Outreach Strategist (Communications)
│   └── Transaction Scout (Deal flow)
└── Teams
    ├── Acquisition Team (CTO's direct reports)
    └── Operations Team (CMO's direct reports)
```

## File Structure

```
paperclip-company-cre/
├── COMPANY.md                    # Company definition
├── .paperclip.yaml               # Runtime configuration
├── README.md                     # This file
├── agents/
│   ├── ceo/
│   │   ├── AGENTS.md             # CEO identity & instructions
│   │   ├── HEARTBEAT.md          # CEO execution checklist
│   │   ├── SOUL.md               # CEO persona
│   │   └── TOOLS.md              # CEO capabilities
│   ├── cto/
│   │   ├── AGENTS.md
│   │   └── HEARTBEAT.md
│   ├── cmo/
│   │   ├── AGENTS.md
│   │   └── HEARTBEAT.md
│   ├── buyer-scout/
│   │   ├── AGENTS.md
│   │   └── HEARTBEAT.md
│   ├── builder-scout/
│   │   ├── AGENTS.md
│   │   └── HEARTBEAT.md
│   ├── capital-analyst/
│   │   ├── AGENTS.md
│   │   └── HEARTBEAT.md
│   ├── market-researcher/
│   │   ├── AGENTS.md
│   │   └── HEARTBEAT.md
│   ├── outreach-strategist/
│   │   ├── AGENTS.md
│   │   └── HEARTBEAT.md
│   └── transaction-scout/
│       ├── AGENTS.md
│       └── HEARTBEAT.md
├── skills/
│   ├── paperclip-nerve-gateway/  # NERVE API integration
│   │   └── SKILL.md
│   ├── cre-research/             # CRE methodology
│   │   └── SKILL.md
│   ├── hot-money-analysis/       # Lead scoring
│   │   └── SKILL.md
│   ├── outreach-drafting/        # Message writing
│   │   └── SKILL.md
│   └── property-valuation/       # Valuation models
│       └── SKILL.md
├── teams/
│   ├── acquisition/
│   │   └── TEAM.md               # Acquisition Team definition
│   └── operations/
│       └── TEAM.md               # Operations Team definition
└── projects/
    └── property-acquisition/
        ├── PROJECT.md            # Acquisition project
        └── tasks/
            ├── daily-hot-money-scan/
            │   └── TASK.md       # Recurring daily task
            ├── weekly-pipeline-review/
            │   └── TASK.md       # Recurring weekly task
            ├── monthly-market-report/
            │   └── TASK.md       # Recurring monthly task
            └── quarterly-strategy-review/
                └── TASK.md       # Recurring quarterly task
```

## Agent Roles & Responsibilities

### CEO (Chief Executive Officer)
- **Role:** `ceo`
- **Reports to:** Board (human operators)
- **Budget:** $20K/month
- **Key Skills:** Strategic planning, capital allocation, team building
- **Heartbeat:** Pipeline review, strategic decisions, board communication

### CTO (Chief Technology Officer)
- **Role:** `cto`
- **Reports to:** CEO
- **Budget:** $15K/month
- **Key Skills:** NERVE integration, data pipeline, agent supervision
- **Direct Reports:** Buyer Scout, Builder Scout, Market Researcher

### CMO (Chief Marketing Officer)
- **Role:** `cmo`
- **Reports to:** CEO
- **Budget:** $15K/month
- **Key Skills:** Relationship management, outreach strategy, communications
- **Direct Reports:** Capital Analyst, Outreach Strategist, Transaction Scout

### Buyer Scout
- **Role:** `researcher`
- **Reports to:** CTO
- **Budget:** $10K/month
- **Adapter:** `nerve_gateway`
- **Purpose:** Identify hot money leads and score opportunities

### Builder Scout
- **Role:** `researcher`
- **Reports to:** CTO
- **Budget:** $10K/month
- **Adapter:** `nerve_gateway`
- **Purpose:** Find construction partners and developers

### Market Researcher
- **Role:** `researcher`
- **Reports to:** CTO
- **Budget:** $8K/month
- **Adapter:** `nerve_gateway`
- **Purpose:** Provide market analysis and property valuations

### Capital Analyst
- **Role:** `researcher`
- **Reports to:** CMO
- **Budget:** $10K/month
- **Adapter:** `nerve_gateway`
- **Purpose:** Research capital sources and prepare intel briefs

### Outreach Strategist
- **Role:** `cmo`
- **Reports to:** CMO
- **Budget:** $8K/month
- **Adapter:** `process`
- **Purpose:** Draft personalized outreach messages

### Transaction Scout
- **Role:** `researcher`
- **Reports to:** CMO
- **Budget:** $8K/month
- **Adapter:** `nerve_gateway`
- **Purpose:** Monitor deal flow and identify opportunities

## Skills Reference

### paperclip-nerve-gateway
Integration with NERVE (BigDataClaw) API for CRE intelligence:
- Hot money queries
- Buyer/builder search
- Property research
- Market data access

### cre-research
Commercial real estate research methodology:
- Market analysis frameworks
- Comparable property research
- Financial modeling
- Investment thesis development

### hot-money-analysis
Lead qualification and scoring:
- 100-point scoring system
- Research checklists
- Capital source briefs
- Follow-up cadences

### outreach-drafting
Message writing and communication:
- 3-30-3 rule structure
- Personalization guidelines
- Follow-up sequences
- A/B testing frameworks

### property-valuation
Valuation and underwriting:
- Three approaches (comps, income, replacement cost)
- Pro forma modeling
- Sensitivity analysis
- Investment returns calculation

## Workflows

### Opportunity Identification Flow

```
1. Transaction Scout detects signal
   ↓
2. Buyer Scout validates hot money
   ↓
3. Capital Analyst creates intel brief
   ↓
4. CMO reviews and prioritizes
   ↓
5. Outreach Strategist drafts message
   ↓
6. Relationship initiated
   ↓
7. Deal flows to pipeline
```

### Market Research Flow

```
1. Request submitted (CEO/CTO/CMO)
   ↓
2. Market Researcher assigned
   ↓
3. NERVE queries executed
   ↓
4. Analysis completed (48hr SLA)
   ↓
5. Report delivered
   ↓
6. Data archived
```

## Routines (Recurring Tasks)

| Task | Frequency | Agent | Time |
|------|-----------|-------|------|
| Hot Money Scan | Daily | Buyer Scout | 9:00 AM ET |
| Builder Directory Scan | Weekly | Builder Scout | Tuesday 9 AM |
| Pipeline Review | Weekly | CTO | Monday 10 AM |
| Outreach Metrics | Weekly | CMO | Monday 2 PM |
| Market Report | Monthly | Market Researcher | 1st of month |
| Strategy Review | Quarterly | CEO | First week |

## Key Metrics

### Company Goals
- **Pipeline Value:** $100M target
- **Acquisitions:** $100M in 12 months
- **IRR:** Minimum 15%
- **Conversion:** 10% LOI to close

### Team Metrics
- **Data Freshness:** <24 hours
- **Research Turnaround:** 48 hours
- **Response Rate:** >25%
- **Deal Velocity:** 90 days

## Budget Allocation

Total Monthly Budget: $100,000

| Agent/Team | Monthly Budget |
|------------|----------------|
| CEO | $20,000 |
| CTO | $15,000 |
| CMO | $15,000 |
| Buyer Scout | $10,000 |
| Builder Scout | $10,000 |
| Capital Analyst | $10,000 |
| Market Researcher | $8,000 |
| Outreach Strategist | $8,000 |
| Transaction Scout | $4,000 |

## Customization

### Adding New Markets

1. Update `.paperclip.yaml` with new market parameters
2. Modify `AGENTS.md` files with market-specific instructions
3. Adjust NERVE queries in skills

### Adding New Agent Types

1. Create new `AGENTS.md` with role definition
2. Add `HEARTBEAT.md` with execution checklist
3. Include in `COMPANY.md` includes list
4. Configure adapter in `.paperclip.yaml`

### Modifying Skills

Edit files in `skills/` directory:
- Update routing descriptions
- Add new API endpoints
- Refine methodologies

## Integration with NERVE

This company package integrates with your NERVE (BigDataClaw) instance:

**Required:**
- NERVE API running on port 8000
- API endpoints accessible from Paperclip
- Authentication configured

**Endpoints Used:**
- `GET /api/hotmoney`
- `GET /api/buyers`
- `GET /api/builders`
- `POST /api/research`
- `GET /api/matches/{propertyId}`

## Troubleshooting

### Agents Not Waking
- Check heartbeat configuration in `.paperclip.yaml`
- Verify adapter settings
- Review run logs in Paperclip UI

### NERVE Connection Failed
- Verify `NERVE_BASE_URL` is correct
- Check `NERVE_API_KEY` is set
- Confirm NERVE server is running

### Budget Alerts
- Review cost per run in agent dashboard
- Adjust budgets in `.paperclip.yaml`
- Consider pausing non-critical agents

## Support

- **Paperclip Docs:** https://paperclip.ing/docs
- **Company Spec:** See `docs/companies/companies-spec.md`
- **Heartbeat Protocol:** See `docs/guides/agent-developer/heartbeat-protocol.md`

## License

MIT — See COMPANY.md for attribution
