# HEARTBEAT.md - Periodic Checks

> Use heartbeats for batched periodic checks. Timing can drift (~30 min is fine).  
> For exact timing, use `cron` instead.

---

## CRE Business Checks (Rotate 2-3x daily)

### Morning Check (09:00-10:00)
- [ ] **Pipeline Review**: Any status changes on active listings?
- [ ] **Hot Money Alerts**: New bigstats.io files to process?
- [ ] **Call List**: Top 5 buyers — any updates needed?

### Afternoon Check (14:00-15:00)
- [ ] **Nanticoke Project**: Crown land lease progress?
- [ ] **CORTEX OS**: Local dev environment status
- [ ] **Memory Maintenance**: Archive old daily notes to MEMORY.md

### Evening Check (17:00-18:00)
- [ ] **Git Status**: Uncommitted changes in workspace?
- [ ] **Next Day Prep**: Priorities for tomorrow

---

## State Tracking

Track check timestamps in `memory/heartbeat-state.json`:

```json
{
  "lastChecks": {
    "pipeline": null,
    "hotMoney": null,
    "nanticoke": null,
    "gitStatus": null,
    "memoryArchive": null
  },
  "alertsSent": [],
  "version": "1.0"
}
```

---

## When to Alert (Not just HEARTBEAT_OK)

Alert Jamie when:
- New whale deal detected (>$10M fresh capital)
- Listing status changes (SPA approved, price drop, etc.)
- Crown land update on Nanticoke
- Git repo has uncommitted changes >24h old
- It's been >8h since last interaction

Stay quiet (HEARTBEAT_OK) when:
- 23:00–08:00 unless urgent
- Nothing changed since last check
- Human is clearly busy

---

## Memory Maintenance (Weekly)

Every 3-4 days during heartbeat:
1. Read recent `memory/YYYY-MM-DD.md` files
2. Distill significant events to MEMORY.md
3. Remove outdated info
4. Update "Last Updated" timestamp

---

## Quick Commands Reference

```bash
# Check git status
cd /root/.openclaw/workspace && git status --short

# List recent memory files
ls -lt memory/ | head -5

# Check for new bigstats files
find . -name "*bigstats*" -mtime -1 2>/dev/null
```
