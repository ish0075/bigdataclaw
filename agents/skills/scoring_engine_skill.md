# Scoring Engine Agent Skill

## Agent Role
Aggregates all agent outputs and calculates composite match scores (0-100) with weighted factors.

## Current Capabilities
- Multi-factor scoring
- Weighted importance ranking
- Top 20 results ranking

## Enhancement Skills to Add

### 1. Machine Learning Optimizer
**Skill:** `ml_score_optimizer`
- **Training Data:**
  - Historical match outcomes
  - Which matches led to deals
  - Response rates by match type
- **Model:**
  - Feature importance analysis
  - Weight optimization
  - A/B testing framework
- **Output:** Dynamic scoring weights

### 2. Feedback Loop Integration
**Skill:** `outcome_tracker`
- **Track:**
  - Email open rates
  - Meeting scheduled
  - LOI submitted
  - Deal closed
- **Integration:**
  - CRM connectors (Salesforce, HubSpot)
  - Email tracking (Mailtrack, Yesware)
  - Manual outcome entry
- **Output:** Score refinement recommendations

### 3. Confidence Intervals
**Skill:** `confidence_calculator`
- **Factors:**
  - Data freshness
  - Source reliability
  - Missing data penalties
- **Output:** Score range (e.g., 75-85) vs point estimate

### 4. Explainable AI
**Skill:** `score_explainer`
- **Output:**
  - Why this match scored high
  - Key contributing factors
  - Comparison to average
- **Format:** Natural language explanation
- **Example:** "KingSett scored 95 because: fund exit window (30 pts), dark anchor distress (25 pts), recent Ottawa activity (20 pts)..."

### 5. Segmentation Rankings
**Skill:** `segmented_rankings`
- **Segments:**
  - By buyer type (REIT vs PE vs Local)
  - By timeline (immediate vs 6mo vs 12mo)
  - By deal certainty (high/medium/low)
- **Output:** Multiple ranked lists

## Enhanced Scoring Algorithm

```python
def calculate_match_score(entity, property, skills_enabled):
    
    base_scores = {
        'transaction_fit': transaction_scout.score(entity, property),
        'hot_money_rank': hot_money_identifier.score(entity, property),
        'portfolio_fit': portfolio_analyzer.score(entity, property),
        'agent_activity': agent_finder.score(entity, property),
        'lender_match': lender_matcher.score(entity, property)
    }
    
    # Dynamic weights based on ML optimization
    if 'ml_optimizer' in skills_enabled:
        weights = ml_optimizer.get_weights(
            asset_class=property.asset_class,
            region=property.region,
            price=property.price
        )
    else:
        weights = {
            'transaction_fit': 0.20,
            'hot_money_rank': 0.25,
            'portfolio_fit': 0.25,
            'agent_activity': 0.15,
            'lender_match': 0.15
        }
    
    # Calculate weighted score
    composite_score = sum(
        base_scores[key] * weights[key] 
        for key in base_scores
    )
    
    # Add skill-based bonuses
    if 'distress_scan' in skills_enabled:
        distress_bonus = distress_scanner.score(entity, property)
        composite_score += distress_bonus * 0.10
    
    if 'fund_life' in skills_enabled:
        urgency_bonus = fund_life_tracker.score(entity, property)
        composite_score += urgency_bonus * 0.10
    
    # Normalize to 0-100
    final_score = min(100, max(0, composite_score))
    
    # Generate explanation
    if 'explainer' in skills_enabled:
        explanation = score_explainer.generate(
            base_scores, weights, final_score
        )
    else:
        explanation = None
    
    return {
        'score': final_score,
        'breakdown': base_scores,
        'weights': weights,
        'explanation': explanation,
        'confidence': confidence_calculator.get_range(final_score)
    }
```

## Quick Actions
```python
results = engine.score_all_matches({
    "matches": all_matches,
    "property": bayshore_mall,
    "skills": ["ml_optimize", "explain", "confidence"],
    "feedback_loop": True
})
```

## Dashboard Integration

```javascript
// Score visualization
{
  "entity": "KingSett Capital",
  "score": 95,
  "confidence": "90-98",
  "breakdown": {
    "transaction_fit": 85,
    "hot_money": 98,
    "portfolio": 90,
    "distress_bonus": 25
  },
  "explanation": "KingSett is highly likely to respond because they're in fund exit window (2024-2026) and facing dark anchor crisis requiring immediate capital decision.",
  "recommended_action": "Immediate direct outreach to Rob Kumer"
}
```

## File Location
`agents/skills/scoring_engine_skill.md`
