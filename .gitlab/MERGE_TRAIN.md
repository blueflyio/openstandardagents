# Merge Train Workflow for Milestone Releases

## Overview

Use GitLab's merge trains to ensure clean, sequential merges for milestone releases.

## Workflow

### 1. Development Phase
- All feature MRs target `development` branch
- Assign to milestone (e.g., v0.2.6)
- Ensure pipelines pass

### 2. Add to Merge Train
When ready to merge:
```bash
# In GitLab UI
1. Open MR
2. Click "Set to auto-merge" or "Add to merge train"
3. MR will merge when pipeline passes and no conflicts
```

### 3. Milestone Completion
Once all milestone MRs merged to development:
```bash
# Create release MR
1. development → main
2. Title: "Release v0.2.6"
3. Add milestone
4. Merge when ready
```

## Benefits

- **Sequential merges**: No conflicts between MRs
- **Clean history**: Each MR tested against latest development
- **Automatic**: No manual intervention needed
- **Safe**: Pipeline must pass before merge

## Configuration

Merge trains enabled in project settings:
- ✅ Merge trains enabled
- ✅ Merge pipelines enabled  
- ✅ Only allow merge if pipeline succeeds

## Tips

- **Priority order**: Add MRs to train in dependency order
- **Failed pipelines**: Automatically removed from train
- **Conflicts**: Automatically rebased in train
- **Monitoring**: Check merge train status in MR list

## For Maintainers

To add MR to merge train via API:
```bash
curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/76265294/merge_requests/{mr_iid}/merge_trains"
```

Or use auto-merge:
```bash
curl --request PUT \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --data "merge_when_pipeline_succeeds=true" \
  "https://gitlab.com/api/v4/projects/76265294/merge_requests/{mr_iid}/merge"
```
