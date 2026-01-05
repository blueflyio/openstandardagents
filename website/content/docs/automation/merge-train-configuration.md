---
title: "Merge Train Configuration"
---

# Merge Train Configuration

## Overview

Merge trains enable safe parallel merging of multiple MRs with automatic conflict detection and resolution.

## Configuration

### Enable Merge Trains
```yaml
merge_trains:
  enabled: true
  max_train_size: 5
  conflict_resolution: auto
```

### Train Pipeline
Special pipeline that runs when MR is added to merge train.

```yaml
train:pipeline:
  stage: .pre
  rules:
    - if: $CI_MERGE_REQUEST_TRAIN_ID
  script:
    - echo "Running in merge train"
```

## Auto-Merge Conditions

### Required Conditions
- Pipeline must pass
- At least 1 approval
- All discussions resolved
- No merge conflicts
- Milestone assigned
- Issue linked

### Optional Conditions
- Code owner approval
- Security team approval
- Performance tests pass
- Coverage threshold met

## Failure Handling

### Merge Train Failure
When merge train fails:
1. Remove MR from train
2. Notify author
3. Create follow-up issue
4. Update original MR

### Conflict Resolution
- **Auto**: Automatic conflict resolution
- **Manual**: Require manual resolution
- **Block**: Block merge train on conflicts

## Benefits

- **Parallel Merges**: Multiple MRs merge simultaneously
- **Conflict Detection**: Early conflict detection
- **Safe Merging**: Prevents broken main branch
- **Automation**: Reduces manual intervention

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
