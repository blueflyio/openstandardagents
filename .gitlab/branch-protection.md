# Release Branch Protection

## Overview
Release branches (`release/v*.x`) are protected from deletion to ensure they remain available for:
- Hotfixes
- Patch releases
- Historical reference
- CI/CD pipeline references

## Protection Rules

### GitLab Project Settings
1. Go to: Settings → Repository → Protected branches
2. Add pattern: `release/v*`
3. Settings:
   - ✅ Allowed to merge: Maintainers
   - ✅ Allowed to push: Maintainers
   - ❌ Allow force push: OFF
   - ❌ Allow deletion: OFF (CRITICAL)

### CI/CD Protection
The `protect:release-branches` job automatically:
- Protects release branches on first push (uses `$CI_COMMIT_BRANCH` - dynamic)
- Ensures MRs don't delete release branches (uses `$CI_MERGE_REQUEST_IID` - dynamic)
- Runs before all other jobs
- Works for ALL `release/v*` branches (not hardcoded)

## MR Settings
When creating MRs from release branches:
- **ALWAYS uncheck** "Delete source branch"
- Or use API with `remove_source_branch: false`

## Manual Protection
```bash
# Protect a release branch via API (replace BRANCH_NAME with actual branch)
curl -X POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"name\": \"release/vX.Y.x\",
    \"allow_force_push\": false,
    \"allowed_to_merge\": [{\"access_level\": 40}],
    \"allowed_to_push\": [{\"access_level\": 40}]
  }" \
  "https://gitlab.com/api/v4/projects/PROJECT_ID/protected_branches"
```
