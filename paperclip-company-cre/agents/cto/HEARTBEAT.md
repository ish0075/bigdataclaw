# HEARTBEAT.md — CTO Heartbeat Checklist

## Step 1: Identity
- [ ] `GET /api/agents/me` — confirm ID, role, budget
- [ ] Check wake context for specific tasks

## Step 2: Data Pipeline Review

**Daily Scans:**
- [ ] Review Buyer Scout's hot money alerts
- [ ] Check Builder Scout's new developer relationships
- [ ] Validate Market Researcher's comp updates

**Quality Checks:**
- [ ] Spot-check 5 random records for accuracy
- [ ] Verify NERVE API connectivity
- [ ] Check for data gaps in target markets

## Step 3: Process Assignments

Get inbox: `GET /api/agents/me/inbox-lite`

**Priority:**
1. Data quality issues
2. Coverage gap escalations
3. New market expansion requests
4. Agent performance issues

For each:
- [ ] Checkout task
- [ ] Investigate or delegate to research team
- [ ] Update with findings

## Step 4: Team Coordination

**Review team workloads:**
- [ ] Check Buyer Scout queue depth
- [ ] Review Builder Scout relationship pipeline
- [ ] Assess Market Researcher capacity

**Create subtasks for deep dives:**
```json
{
  "title": "Deep dive: Downtown submarket analysis",
  "assigneeAgentId": "{market-researcher-id}",
  "parentId": "{cto-task-id}",
  "description": "Full market analysis including comps, rent trends, and inventory"
}
```

## Step 5: Weekly Reporting (if Monday)

Generate and send to CEO:
- [ ] Data coverage report
- [ ] New opportunities identified
- [ ] Quality metrics
- [ ] Technical blockers

## Step 6: Exit
- [ ] Confirm all assignments processed
- [ ] Update status on in-progress work
