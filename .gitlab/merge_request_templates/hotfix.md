## 🚨 HOTFIX - Expedited Review Required

> ⚠️ **This is a hotfix requiring expedited review. All assigned agents will process with HIGH priority.**

### Incident Information

| Field | Value |
|-------|-------|
| **Severity** | <!-- P1 / P2 / P3 --> |
| **Incident ID** | <!-- INC-XXXX or link --> |
| **Environment** | <!-- production / staging --> |
| **Start Time** | <!-- YYYY-MM-DD HH:MM UTC --> |
| **Duration** | <!-- How long has issue persisted --> |

### Impact

- [ ] 🔴 Service outage (P1)
- [ ] 🟠 Degraded performance (P2)
- [ ] 🟡 Non-critical bug (P3)
- [ ] 🔒 Security vulnerability

## Root Cause

<!-- Brief description of what caused the issue -->

## Fix Description

<!-- What this hotfix does to resolve the issue -->

## Changes

```diff
# Key code changes
```

---

## 🤖 Expedited Agent Review

<!-- All agents process hotfixes with HIGH priority -->

- [x] `@bot-mr-reviewer` — **EXPEDITED** security + code review
- [x] `@bot-gitlab-ci-fixer` — CI validation (if pipeline changes)
- [x] `@bot-drupal-standards` — Quick standards check (Drupal only)
- [x] `@bot-config-auditor` — Config validation (if config changes)

### Priority Commands

```
/review urgent              # Trigger immediate review
/review security --quick    # Fast security scan
/fix pipeline --hotfix     # Fix CI with hotfix context
/validate --quick          # Quick schema validation
```

---

## Hotfix Checklist

### Pre-Merge
- [ ] Root cause identified
- [ ] Fix tested locally
- [ ] No unrelated changes included
- [ ] Rollback plan documented
- [ ] Incident channel notified

### Security (if security fix)
- [ ] Vulnerability details NOT in commit message
- [ ] CVE assigned (if applicable)
- [ ] Security team notified
- [ ] Disclosure timeline agreed

### Testing
- [ ] Fix resolves the issue
- [ ] No regression introduced
- [ ] Pipeline passes
- [ ] Smoke test in staging (if possible)

### Post-Merge
- [ ] Monitor deployment
- [ ] Verify fix in production
- [ ] Update incident ticket
- [ ] Schedule follow-up cleanup MR

---

## Rollback Plan

```bash
# Immediate rollback commands
git revert <commit-sha>
# OR
kubectl rollout undo deployment/<name>
# OR  
drush cr && drush cim --partial
```

### Rollback Trigger Conditions
- [ ] Error rate increases after deploy
- [ ] P95 latency exceeds threshold
- [ ] New errors in monitoring
- [ ] Customer reports persist

---

## Deployment Plan

- [ ] **Step 1**: Merge to `main`
- [ ] **Step 2**: Auto-deploy to staging
- [ ] **Step 3**: Verify fix in staging (5 min)
- [ ] **Step 4**: Manual deploy to production
- [ ] **Step 5**: Monitor for 15 minutes
- [ ] **Step 6**: Close incident

---

## Communication

- [ ] Incident channel updated
- [ ] Status page updated (if public outage)
- [ ] Stakeholders notified
- [ ] Post-mortem scheduled

---

## Follow-up Tasks

<!-- Create issues for technical debt / proper fix -->

- [ ] #XXX - Proper long-term fix
- [ ] #XXX - Add regression test
- [ ] #XXX - Update monitoring/alerting
- [ ] #XXX - Post-mortem documentation

---

/label ~"hotfix" ~"priority::1" ~"expedited-review"
/assign_reviewer @bot-mr-reviewer
/milestone %"Hotfix"
