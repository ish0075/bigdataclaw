# HEARTBEAT.md — CMO Heartbeat Checklist

## Step 1: Identity
- [ ] Confirm agent context via `GET /api/agents/me`
- [ ] Check budget status (alert if >80%)

## Step 2: Review Outreach Metrics

**Daily:**
- [ ] Review Outreach Strategist's queue
- [ ] Check response rates from previous sends
- [ ] Flag high-priority responses for immediate handling

**Weekly:**
- [ ] Full metrics review (open rates, response rates, conversions)
- [ ] Identify top-performing messages
- [ ] Flag underperforming sequences

## Step 3: Process Assignments

Get inbox: `GET /api/agents/me/inbox-lite`

**Priority:**
1. High-value lead responses requiring personal attention
2. Escalations from outreach team
3. CEO requests for relationship strategy
4. Strategic messaging decisions

## Step 4: Team Coordination

**Review team workloads:**
- [ ] Capital Analyst research queue
- [ ] Outreach Strategist message backlog
- [ ] Transaction Scout opportunity alerts

**Create subtasks:**
- [ ] Assign research requests to Capital Analyst
- [ ] Assign message drafting to Outreach Strategist
- [ ] Assign opportunity tracking to Transaction Scout

## Step 5: Relationship Management

**Review key relationships:**
- [ ] Top 10 capital sources (check last contact date)
- [ ] Active deal relationships (check status)
- [ ] Cold relationships needing reactivation

**Flag for outreach:**
- [ ] >30 days since last contact
- [ ] New opportunities matching their criteria
- [ ] Market events relevant to them

## Step 6: Weekly Reporting (if Monday)

Send to CEO:
- [ ] Outreach metrics report
- [ ] Relationship pipeline status
- [ ] Meeting conversion rates
- [ ] Team capacity assessment

## Step 7: Exit
- [ ] Confirm all urgent responses handled
- [ ] Update status on active work
