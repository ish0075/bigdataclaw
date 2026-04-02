# Lender Matcher Agent Skill

## Agent Role
Matches commercial real estate properties with appropriate debt financing sources.

## Current Capabilities
- Asset class-based matching
- Loan size filtering
- Lender database queries

## Enhancement Skills to Add

### 1. CMBS Maturity Tracker
**Skill:** `cmbs_maturity_monitor`
- **Data Sources:**
  - Trepp CMBS data
  - KBRA reports
  - Servicer announcements
- **Metrics:**
  - 2026 maturity wall ($76.6B)
  - Property-specific maturity dates
  - Special servicing flags
- **Output:** Distressed lender opportunities
- **Use Case:** Properties with 2026 maturities = motivated sellers

### 2. Lender Criteria Database
**Skill:** `lender_criteria_api`
- **Data Points per Lender:**
  - Current LTV limits
  - Rate ranges
  - Asset class preferences
  - Geographic restrictions
  - Min/max loan sizes
- **Lenders to Track:**
  - Big 6 banks (RBC, TD, Scotia, BMO, CIBC, NBC)
  - Life cos (Manulife, Sun Life, Canada Life)
  - CMBS conduit lenders
  - Private lenders (KingSett, Firm, Torchlight)
  - MICs (financial, alternative)

### 3. Rate & Spread Monitor
**Skill:** `rate_tracker`
- **Track:**
  - Prime rate changes
  - Bond yield trends
  - CMBS spread movements
  - B-20 guideline updates
- **Output:** Current financing environment score

### 4. Construction Lender Specialist
**Skill:** `construction_lender_finder`
- **For:** Development sites, value-add, major reno
- **Lenders:**
  - Construction specialists (KingSett, Inveracity)
  - Balance sheet lenders
  - JV equity providers
- **Criteria:**
  - Experience requirements
  - Pre-leasing thresholds
  - Equity requirements

### 5. Distressed Debt Opportunities
**Skill:** `distressed_debt_scan`
- **Signals:**
  - Loans in special servicing
  - NPL (non-performing loan) sales
  - Workout situations
- **Opportunities:**
  - Discounted note purchases
  - Rescue financing
  - DIP (debtor in possession) lending

## Lender Match Score

```python
match_score = (
    asset_class_fit * 0.25 +
    loan_size_fit * 0.25 +
    geographic_fit * 0.15 +
    ltv_capacity * 0.15 +
    rate_competitiveness * 0.10 +
    speed_to_close * 0.10
)
```

## Quick Actions
```python
lenders = agent.match_lenders({
    "property": bayshore_mall,
    "loan_amount": 180000000,  # 60% of $300M
    "asset_class": "retail",
    "skills": ["cmbs_track", "criteria_api", "rate_monitor"],
    "urgency": "high"  # For quick close
})
```

## Lender Contact List

| Lender Type | Examples | Contact Strategy |
|-------------|----------|------------------|
| Big Banks | RBC, TD | Relationship managers |
| Private Equity | KingSett, Crestpoint | Direct principals |
| Life Cos | Manulife, Sun Life | Origination teams |
| CMBS | Various conduits | Broker channels |
| Construction | Inveracity, KingSett | Development specialists |

## File Location
`agents/skills/lender_matcher_skill.md`
