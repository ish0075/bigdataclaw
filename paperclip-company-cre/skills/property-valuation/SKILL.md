---
name: property-valuation
description: >
  Property valuation and underwriting methodologies for commercial real estate.
  Use when analyzing property values, creating pro formas, or underwriting deals.
  Provides standardized approaches to CRE valuation.
---

# Property Valuation Skill

Standardized methodologies for commercial real estate valuation and underwriting.

## The Three Approaches

### 1. Comparable Sales Approach

**When to use:** Market has recent comparable sales

**Process:**

**Step 1: Find Comps (3-5 minimum)**
- Same asset class
- Similar size (+/- 25%)
- Same submarket (ideally)
- Recent sales (6-12 months)
- Similar condition/quality

**Step 2: Adjust**
| Factor | Adjustment |
|--------|------------|
| Time | +/- for market changes |
| Size | $/SF adjustment |
| Location | Premium/discount |
| Condition | Renovation cost |
| Terms | Financing assumptions |

**Step 3: Reconcile**
- Weight by similarity
- Consider market direction
- Cross-check with other methods

**Output:**
```
Indicated Value: $X,XXX,XXX
Basis: $XXX/SF (or $XX,XXX/unit)
```

### 2. Income Approach (DCF)

**When to use:** Income-producing properties

**Process:**

**Step 1: Project Income**
```
Year 1-5 projections:
- Rental income (current + market)
- Expense growth (2-3% annually)
- Vacancy (market rate)
```

**Step 2: Calculate NOI**
```
Revenue
- Operating Expenses
- Vacancy/Credit Loss
= NOI
```

**Step 3: Apply Cap Rate or Discount**

**Direct Cap (stabilized):**
```
Value = Stabilized NOI / Cap Rate
```

**DCF (value-add):**
```
PV = Σ (NOI_t / (1+r)^t) + (Exit NOI / (r-g)) / (1+r)^n
```

**Step 4: Select Discount Rate**
- Risk-free rate + spread
- Typical: 8-12% for core, 12-18% for value-add

### 3. Replacement Cost

**When to use:** New construction, special use, insurance

**Calculation:**
```
Land Value
+ Construction Cost ($/SF × SF)
+ Soft Costs (15-20% of hard)
+ Developer Profit (15-20%)
= Replacement Cost
```

## Underwriting Checklist

### Property Analysis
- [ ] Site inspection notes
- [ ] Unit mix and floor plans
- [ ] Condition assessment
- [ ] Environmental issues
- [ ] Zoning/compliance

### Market Analysis
- [ ] Rent comps (3+)
- [ ] Sale comps (3+)
- [ ] Vacancy trends
- [ ] Supply pipeline
- [ ] Employment drivers

### Financial Analysis
- [ ] Current rent roll
- [ ] Historical P&L (3 years)
- [ ] Expense analysis
- [ ] Capex requirements
- [ ] Value-add budget

### Pro Forma Model

**5-Year Projection:**
```
Year    1      2      3      4      5
Revenue $X     $X     $X     $X     $X
Expenses $X    $X     $X     $X     $X
NOI     $X     $X     $X     $X     $X

Exit Cap: X%
Exit Value: $X
```

**Returns:**
- Cash-on-Cash: X%
- IRR: X%
- Equity Multiple: X.x

## Valuation Report Template

```markdown
## Property Valuation: [Property Name]

### Executive Summary
- **Subject:** [Address]
- **Asset Class:** [Type]
- **Indicated Value:** $[Amount] ($[Per Unit or SF])
- **Recommendation:** [Buy/Pass/Conditional]

### Property Description
- [Key details]

### Market Analysis
- [Summary]

### Valuation
| Approach | Value | Weight | Weighted |
|----------|-------|--------|----------|
| Sales Comp | $X | 40% | $X |
| Income | $X | 50% | $X |
| Replacement | $X | 10% | $X |
| **Indicated** | | | **$X** |

### Investment Analysis
- [Key metrics]

### Risks
- [List risks]

### Recommendation
- [Final recommendation]
```

## Quality Standards

Before submitting valuation:
- [ ] 3+ comps for sales approach
- [ ] 5-year DCF for income approach
- [ ] Sensitivity analysis (cap rate +/- 50bps)
- [ ] Risks identified and mitigated
- [ ] Clear buy/pass recommendation
