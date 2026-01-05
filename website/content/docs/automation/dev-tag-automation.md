---
title: "Dev Tag Automation"
---

# Dev Tag Automation

## Overview

Automated development tag creation for release branches with semantic versioning.

## How It Works

### Release Branch Flow
```
release/v0.3.x → v0.3.0-dev.1 → v0.3.0-dev.2 → v0.3.0-rc.1 → v0.3.0
```

### Tag Creation Jobs
- **Automatic**: Created on merge to release branch
- **Format**: `v{MAJOR}.{MINOR}.{PATCH}-dev.{NUMBER}`
- **Increment**: Auto-increments dev number

### Tag Naming Convention
- Dev tags: `v0.3.0-dev.1`, `v0.3.0-dev.2`
- RC tags: `v0.3.0-rc.1`, `v0.3.0-rc.2`
- Release tags: `v0.3.0`, `v0.3.1`

### Branch to Tag Mapping
- `release/v0.3.x` → `v0.3.0-dev.*`
- `release/v0.4.x` → `v0.4.0-dev.*`
- Dynamic version detection from branch name

## CI Integration

### Detection Jobs (Read-Only)
- Scan for new commits
- Detect version from branch
- Check existing tags
- Determine next dev number

### Validation Jobs
- Validate tag format
- Check tag uniqueness
- Verify branch association
- Ensure semantic versioning

### Tag Creation Jobs
- Create annotated tag
- Push to repository
- Create GitLab release
- Update changelog

## Environment Variables

### CI_DEPLOY_OSSA Variable
- Controls OSSA deployment
- Values: `true`, `false`
- Default: `false`
- Used for conditional deployment

### Group-Level Variables
- Shared across projects
- Managed in group settings
- Inherited by projects
- Override at project level

### Job-Level Variables
- Scoped to specific jobs
- Override group/project vars
- Used for job-specific config
- Not persisted

## Token Requirements

### Token Types Supported
- Project Access Tokens
- Personal Access Tokens
- CI Job Tokens
- Deploy Tokens

### Token Requirements
- `api` scope (required)
- `write_repository` scope (for tags)
- `read_repository` scope (for validation)

### Troubleshooting

#### Deploy Token Not Working
- Check token permissions
- Verify token scope
- Ensure token is active
- Check token expiration

#### Token Keeps Getting Revoked
- Review token usage
- Check for exposed tokens
- Rotate token immediately
- Update CI/CD variables

#### HTTP Basic: Access denied
- Verify token credentials
- Check project permissions
- Ensure token has correct scope
- Review access logs

## CI Job Reference

### validate:dev-tag
- Validates dev tag format
- Checks tag uniqueness
- Ensures branch association

### create:dev-tag
- Creates dev tag
- Pushes to repository
- Updates release notes

### detect:version
- Detects version from branch
- Finds latest patch version
- Calculates next dev number

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
