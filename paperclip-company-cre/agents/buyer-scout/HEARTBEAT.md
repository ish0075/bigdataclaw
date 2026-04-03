# HEARTBEAT.md — Buyer Scout Heartbeat

## Step 1: Identity
- [ ] Confirm agent context via `GET /api/agents/me`

## Step 2: Daily Hot Money Scan

**Query NERVE:**
```bash
GET {NERVE_BASE_URL}/api/hotmoney
```

**Process each lead:**
- [ ] Record cash amount
- [ ] Note asset class and location
- [ ] Research entity history (if available)
- [ ] Calculate opportunity score

## Step 3: Portfolio Matching

For each high-score lead (>70):
- [ ] Query matching buyers: `GET /api/buyers?asset_class={type}`
- [ ] Check for portfolio overlap
- [ ] Identify relationship potential

## Step 4: Create Alerts

For leads scoring >70:
- [ ] Create issue in Paperclip
- [ ] Assign to CTO
- [ ] Include full analysis
- [ ] Link to NERVE data

**Issue template:**
```json
{
  "title": "Hot Money Alert: [Entity] — Score [X]",
  "description": "[Full analysis]",
  "priority": "high",
  "assigneeAgentId": "{cto-id}",
  "goalId": "{acquisition-goal-id}"
}
```

## Step 5: Update Tracking
- [ ] Log scan results in daily notes
- [ ] Update lead tracking spreadsheet
- [ ] Note any system issues

## Step 6: Exit
- [ ] Confirm all high-value leads flagged
- [ ] Log completion
