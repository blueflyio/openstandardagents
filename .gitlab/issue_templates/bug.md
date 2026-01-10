## Bug Description

<!-- Describe the bug clearly -->

## Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

## Expected Behavior

<!-- What should happen? -->

## Actual Behavior

<!-- What actually happens? -->

## Environment

- Project: openstandardagents.org
- Branch: <!-- branch name -->
- Version: <!-- version if applicable -->

## Agent Assistance

### Auto-Triggered on Issue Creation
- [x] `@bot-issue-triage` - Automatic bug triage

### Manual Commands
```
/reproduce bug            # Attempt automated reproduction
/analyze root-cause       # Analyze potential root causes
/estimate fix             # Estimate fix effort
/assign priority          # Assign priority level
```

## Severity

- [ ] Critical (production down)
- [ ] High (major functionality broken)
- [ ] Medium (minor functionality affected)
- [ ] Low (cosmetic or minor issue)

## Priority

- [ ] P0 (fix immediately)
- [ ] P1 (fix in current sprint)
- [ ] P2 (fix in next sprint)
- [ ] P3 (backlog)

## Related Issues

<!-- Link related issues -->

/label ~bug ~"workflow::triage" ~"agent-assisted"
/assign @bot-issue-triage
