# Branch Protection Policy

## Main Branch Rules

**CRITICAL**: The `main` branch accepts merges from `development` branch ONLY.

### ✅ Allowed
- Merge requests from `development` branch
- Merges by Maintainers only
- Must pass CI pipeline
- All discussions resolved

### ❌ Prohibited  
- Direct pushes (blocked)
- Force pushes (disabled)
- Merges from feature/bugfix/hotfix branches
- Any branch except `development`

## Workflow

```
feature/* → development → main
```

## Current Settings
- Push access: No one (0)
- Merge access: Maintainers (40)
- Pipeline must succeed
- All discussions must be resolved
- Code owner approval required

⚠️ **Manual verification required**: GitLab Free doesn't enforce source branch restrictions automatically.
