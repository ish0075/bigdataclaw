# SECURITY.md - Host Security & Hardening

> This workspace uses the `healthcheck` skill for security audits.  
> Location: `/usr/lib/node_modules/openclaw/skills/healthcheck/SKILL.md`

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `openclaw security audit` | Basic security scan |
| `openclaw security audit --deep` | Comprehensive audit |
| `openclaw security audit --fix` | Apply safe defaults |
| `openclaw update status` | Check for updates |

---

## Current Posture

| Aspect | Status | Notes |
|--------|--------|-------|
| OS | Linux 6.8.0 | Ubuntu-based |
| OpenClaw | Active | Gateway running |
| Environment | Server/Cloud | iZt4nfj2r0c2bf9cf8v8k4Z |

---

## Security Checklist

### Access Security
- [ ] SSH key-only auth (no passwords)
- [ ] Root login disabled
- [ ] Fail2ban or equivalent active
- [ ] Firewall (ufw/iptables) configured

### System Security
- [ ] Automatic security updates enabled
- [ ] Disk encryption (if applicable)
- [ ] Backup system active
- [ ] Log monitoring configured

### OpenClaw Security
- [ ] Gateway token secured
- [ ] No secrets in environment variables
- [ ] File permissions correct
- [ ] Browser control 2FA enabled (if used)

---

## Run Security Audit

To perform a full security audit:

```bash
# 1. Run deep audit
openclaw security audit --deep

# 2. Check for updates
openclaw update status

# 3. Review cron jobs
openclaw cron list
```

Or ask me: *"Run a security audit on my system"* — I'll use the healthcheck skill.

---

## Periodic Security Schedule

Recommended cadence:

| Check | Frequency | Command |
|-------|-----------|---------|
| Security audit | Weekly | `openclaw security audit` |
| Update check | Daily | `openclaw update status` |
| Deep audit | Monthly | `openclaw security audit --deep` |

---

## Incident Response

If security issue detected:
1. Document in `memory/YYYY-MM-DD.md`
2. Assess severity (critical/high/medium/low)
3. Apply fixes or escalate to Jamie
4. Re-run audit to verify

---

*Last reviewed: March 21, 2026*
