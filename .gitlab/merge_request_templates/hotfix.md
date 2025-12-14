## :rotating_light: HOTFIX - Expedited Review Required

<!-- This template is for emergency fixes that require immediate attention -->

## Incident Information

| Field | Value |
|-------|-------|
| Severity | `critical` / `high` / `medium` |
| Incident ID | |
| Environment | `production` / `staging` |
| Started | |
| Duration | |

## Impact

- [ ] Complete service outage
- [ ] Partial service degradation
- [ ] Non-critical functionality affected
- [ ] Security vulnerability

## Root Cause

<!-- Brief description of what caused the issue -->

## Fix Description

<!-- What does this fix do? -->

## Changes

```diff
# Key changes
```

## Expedited Agent Review

<!-- All agents process hotfixes with HIGH priority -->

### Required (Expedited)
- [x] `@bot-mr-reviewer` - Expedited code review
- [x] `@bot-gitlab-ci-fixer` - CI validation (if CI changes)

### Priority Commands
```
/review urgent                  - Urgent expedited review
/review security --quick        - Quick security check
/fix pipeline --hotfix          - Hotfix pipeline mode
/validate --quick               - Quick validation
```

## Hotfix Checklist

### Pre-Merge
- [ ] Root cause identified
- [ ] Fix tested locally
- [ ] No unrelated changes included
- [ ] Rollback plan documented

### Security (if security-related)
- [ ] Vulnerability patched
- [ ] No new vulnerabilities introduced
- [ ] CVE documented (if applicable)
- [ ] Security team notified

### Testing
- [ ] Fix resolves the issue
- [ ] No regression introduced
- [ ] Pipeline passes
- [ ] Smoke test completed

### Post-Merge
- [ ] Monitor production after deploy
- [ ] Verify fix in production
- [ ] Update incident ticket
- [ ] Schedule follow-up cleanup MR

## Rollback Plan

### Immediate Rollback
```bash
# If fix causes issues, immediately revert
git revert <commit-sha>
git push origin main
```

### Rollback Triggers
- [ ] Error rate increases
- [ ] New errors appear
- [ ] Performance degradation
- [ ] User reports of issues

## Deployment Plan

| Step | Action | Owner | ETA |
|------|--------|-------|-----|
| 1 | Merge MR | | |
| 2 | Deploy to staging | | |
| 3 | Smoke test staging | | |
| 4 | Deploy to production | | |
| 5 | Monitor production | | |
| 6 | Close incident | | |

## Communication

- [ ] Team notified of hotfix
- [ ] Stakeholders informed
- [ ] Status page updated (if applicable)
- [ ] Post-mortem scheduled

## Follow-up Tasks

<!-- List any technical debt or improvements to address later -->
- [ ]
- [ ]

/label ~hotfix ~critical ~expedited ~needs-review
/assign_reviewer @bot-mr-reviewer
