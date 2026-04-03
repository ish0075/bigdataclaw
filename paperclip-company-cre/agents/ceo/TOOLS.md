# TOOLS.md — CEO Tools and Capabilities

## Core Paperclip API

### Identity & Context
- `GET /api/agents/me` — Your identity, budget, chain of command
- `GET /api/agents/me/inbox-lite` — Compact assignment list

### Issue Management
- `POST /api/issues/{id}/checkout` — Claim work (REQUIRED before doing work)
- `PATCH /api/issues/{id}` — Update status, priority, assignee
- `POST /api/issues/{id}/comments` — Add comments
- `GET /api/issues/{id}/heartbeat-context` — Compact issue context
- `POST /api/companies/{id}/issues` — Create subtasks

### Approvals
- `GET /api/approvals/{id}` — Review pending approvals
- `GET /api/approvals/{id}/issues` — Linked issues

### Dashboard & Reporting
- `GET /api/companies/{id}/dashboard` — Company metrics and pipeline
- `GET /api/companies/{id}/issues?q=search` — Search issues

### Agent Management
- Use `paperclip-create-agent` skill for hiring
- `GET /api/companies/{id}/agents` — List team
- `PATCH /api/agents/{id}` — Update agent config

## Skills Available

### paperclip-nerve-gateway
Interact with NERVE API for CRE data:
- Query hot money leads
- Search buyers and builders
- Get property research
- Access market intelligence

### cre-research
Standard procedures for commercial real estate research:
- Market analysis frameworks
- Comparable property research
- Financial modeling guidelines

### paperclip-create-agent
Hiring workflow:
- Define new agent roles
- Configure adapters
- Submit for approval

### para-memory-files
Memory management:
- Store daily notes
- Extract facts to knowledge graph
- Weekly synthesis

## Environment Variables

Available in every heartbeat:
- `PAPERCLIP_AGENT_ID` — Your agent ID
- `PAPERCLIP_COMPANY_ID` — Company ID
- `PAPERCLIP_API_URL` — Paperclip API base
- `PAPERCLIP_API_KEY` — Auth token
- `PAPERCLIP_RUN_ID` — Current run ID (include in mutation headers)

Optional wake context:
- `PAPERCLIP_TASK_ID` — Triggering task
- `PAPERCLIP_WAKE_REASON` — Why you were woken
- `PAPERCLIP_APPROVAL_ID` — Pending approval

## Decision Templates

### LOI Go/No-Go Decision
```markdown
## Decision: [Property Address]

**Recommendation:** [GO / NO-GO / CONDITIONAL]

**Key Metrics:**
- Projected IRR: [X]%
- Cap Rate: [X]%
- Equity Required: $[X]
- Timeline: [X] days

**Rationale:**
- [Bullet points]

**Conditions (if applicable):**
- [List conditions]

**Next Steps:**
- [Owner and action]
```

### Hiring Decision
```markdown
## Hiring Decision: [Role Name]

**Decision:** [APPROVE / REJECT / MODIFY]

**Role:** [Description]
**Reports to:** [Manager]
**Budget Impact:** $[X]/month

**Rationale:**
- [Why this role is needed]

**Modified Terms (if applicable):**
- [Changes from original request]
```

## Escalation Triggers

Escalate to board when:
- Budget overruns > 20%
- Strategic pivot required
- Team capacity crisis
- Major deal at risk
- Compliance/legal issues

## External Integrations

- **NERVE Platform**: Primary data source for CRE intelligence
- **Paperclip UI**: http://localhost:5173/paperclip-companies/{companyId}
- **Email**: For board communications (via human operator)
