# Portfolio Analyzer Agent Skill

## Agent Role
Analyzes buyer portfolios to identify strategic fit and expansion opportunities.

## Current Capabilities
- Matches asset class preferences
- Geographic concentration analysis
- Portfolio gap identification

## Enhancement Skills to Add

### 1. Vacancy Analyzer
**Skill:** `portfolio_vacancy_scan`
- **Data Sources:**
  - Property management websites
  - Leasing availability
  - Broker marketing materials
- **Metrics:**
  - Current vacancy %
  - WALT (Weighted Avg Lease Term)
  - Anchor tenant health
- **Output:** Portfolio stress score
- **Use Case:** Centre on Barton vacancy correction (13% → 4%)

### 2. Debt Maturity Tracker
**Skill:** `debt_maturity_monitor`
- **Data Sources:**
  - CMBS trustee reports
  - News filings
  - Mortgage registration searches
- **Metrics:**
  - Upcoming maturities (12/24/36 months)
  - DSCR trends
  - Refinancing risk
- **Output:** Debt pressure score
- **Use Case:** 2026 CMBS maturity wall ($76.6B)

### 3. ESG/Carbon Analyzer
**Skill:** `esg_portfolio_scan`
- **Metrics:**
  - Building age/efficiency
  - Carbon compliance deadlines
  - Retrofit capex requirements
- **Output:** Sustainability risk score

### 4. Intensification Potential
**Skill:** `densification_analyzer`
- **Data:**
  - Zoning analysis
  - Site coverage ratios
  - Height restrictions
  - Parking ratios
- **Output:** Untapped land value estimate
- **Use Case:** Erin Mills 12.3 acres excess land

## Portfolio Fit Score

```python
fit_score = (
    asset_class_match * 0.25 +
    geographic_fit * 0.20 +
    size_compatibility * 0.15 +
    vacancy_stress * 0.15 +  # Higher stress = more motivated
    debt_pressure * 0.15 +
    intensification_upside * 0.10
)
```

## Quick Actions
```python
portfolio_matches = agent.analyze_portfolios({
    "property": erin_mills,
    "skills": ["vacancy_scan", "debt_track", "densification"],
    "include_stress_signals": True
})
```

## File Location
`agents/skills/portfolio_analyzer_skill.md`
