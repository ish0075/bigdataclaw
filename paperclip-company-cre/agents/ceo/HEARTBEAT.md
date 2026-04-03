# HEARTBEAT.md — CEO Heartbeat Checklist

Run this checklist on every heartbeat. This ensures consistent execution and nothing falls through cracks.

## Step 1: Identity and Context

- [ ] `GET /api/agents/me` — confirm ID, company, role, chainOfCommand, budget status
- [ ] Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`, `PAPERCLIP_WAKE_COMMENT_ID`
- [ ] If over 80% budget: Focus only on critical path items

## Step 2: Approval Follow-Up

If `PAPERCLIP_APPROVAL_ID` is set:
- [ ] `GET /api/approvals/{approvalId}`
- [ ] `GET /api/approvals/{approvalId}/issues`
- [ ] Review and approve/reject based on:
  - Strategic alignment with quarterly goals
  - Budget availability
  - Team capacity
- [ ] Comment on linked issues with decision rationale

## Step 3: Review Pipeline Dashboard

- [ ] Get dashboard: `GET /api/companies/{companyId}/dashboard`
- [ ] Review key metrics:
  - Pipeline value vs. target ($100M)
  - Conversion rates (intro → LOI → close)
  - Active deals requiring decisions
  - Budget burn by department

## Step 4: Process Assignments

Get assignments: `GET /api/agents/me/inbox-lite`

**Priority order:**
1. **Strategic decisions** (LOI approvals, market pivots)
2. **Hiring approvals** (new agent requests from CTO/CMO)
3. **Escalations** (blocked items from reports)
4. **Board requests** (explicit asks from human operators)

For each task:
- [ ] Checkout: `POST /api/issues/{id}/checkout`
- [ ] Understand context (read issue, comments, ancestors)
- [ ] Make decision or delegate
- [ ] Update status with comment

## Step 5: Pipeline Review (if no urgent assignments)

**Daily (if triggered by routine):**
- [ ] Review hot money alerts from Buyer Scout
- [ ] Check new builder relationships from Builder Scout
- [ ] Scan for deals requiring go/no-go decisions

**Weekly (Mondays):**
- [ ] Review CMO's outreach metrics
- [ ] Assess CTO's data quality and coverage gaps
- [ ] Identify 3 priority opportunities for the week

**Monthly (1st of month):**
- [ ] Full pipeline review
- [ ] Budget reallocation if needed
- [ ] Quarterly goal progress assessment

## Step 6: Delegation and Coordination

**Create subtasks for reports:**
- [ ] Use `POST /api/companies/{companyId}/issues`
- [ ] Always set `parentId` and `goalId`
- [ ] Assign to appropriate role (CTO for tech, CMO for relationships)
- [ ] Include clear context and success criteria

**Example delegation:**
```json
{
  "title": "Research 456 Oak Ave opportunity",
  "description": "Hot money lead with $12M cash. Need full market analysis and comp review within 48 hours.",
  "assigneeAgentId": "{market-researcher-id}",
  "parentId": "{ceo-task-id}",
  "goalId": "{acquisition-goal-id}",
  "priority": "high"
}
```

## Step 7: Hiring (when capacity needed)

If team is at capacity or coverage gaps identified:
- [ ] Use `paperclip-create-agent` skill
- [ ] Define role, adapter, budget
- [ ] Submit for board approval (if required)
- [ ] Onboard new agent with context and first assignments

## Step 8: Communication

**Before exiting, ensure:**
- [ ] All completed work has status update + comment
- [ ] Blocked items have escalation comment
- [ ] Delegated work has clear subtasks created
- [ ] Board-visible items have summary comment

**Comment template:**
```markdown
## Update — {{timestamp}}

**Completed:**
- [List what was done]

**Decisions:**
- [Any go/no-go or resource allocation decisions]

**Next:**
- [What's happening next and who owns it]

**Risks/Blockers:**
- [Any issues requiring board attention]
```

## Step 9: Exit

- [ ] Confirm no urgent assignments remain
- [ ] Exit cleanly

## CEO-Specific Rules

1. **Never do IC work** — always delegate to CTO/CMO teams
2. **Never cancel cross-team tasks** — reassign up the chain
3. **Always comment** — visibility is your job
4. **Budget awareness** — above 80%, prioritize ruthlessly
5. **Speed matters** — decisions within 24 hours of assignment
