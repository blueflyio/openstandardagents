# GitHub Mirroring Deployment Guide

## Overview

This guide explains how to set up automatic mirroring from GitLab (source of truth) to GitHub (public mirror).

## Architecture

```
GitLab (Primary Repository)
    ↓ (automatic push mirror)
GitHub (Read-only Mirror)
```

**Key Principles:**
- GitLab is the single source of truth
- GitHub is read-only for public visibility
- All development happens on GitLab
- Mirror syncs automatically on push

## Prerequisites

- GitLab project admin access
- GitHub organization admin access
- GitHub Personal Access Token (PAT)

## Setup Steps

### 1. Create GitHub Repository

```bash
# Via GitHub CLI
gh repo create blueflyio/openstandardagents --public

# Or via web interface
# https://github.com/organizations/blueflyio/repositories/new
```

### 2. Generate GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Scopes needed:
   - `repo` (full control)
4. Copy token (save securely)

### 3. Configure GitLab Mirror

1. Navigate to: **Settings → Repository → Mirroring repositories**
2. Add mirror:
   - **Git repository URL**: `https://github.com/blueflyio/openstandardagents.git`
   - **Mirror direction**: Push
   - **Authentication**: Username + Password
     - Username: Your GitHub username
     - Password: Personal Access Token from step 2
   - **Mirror only protected branches**: ✓ (recommended)
3. Click "Mirror repository"

### 4. Test Mirror Sync

```bash
# Make a test commit on GitLab
git commit --allow-empty -m "test: verify mirror sync"
git push origin main

# Check GitHub after ~1 minute
# Commit should appear automatically
```

### 5. Configure GitHub Repository

Add README notice:

```markdown
# OSSA - Open Standard for AI Agents

> **Note**: This is a read-only mirror of our GitLab repository.  
> Primary development happens at: https://gitlab.com/blueflyio/openstandardagents

For issues, merge requests, and contributions, please use GitLab.
```

Disable GitHub Issues and PRs:
1. **Settings → General → Features**
2. Uncheck "Issues"
3. Uncheck "Pull Requests"

### 6. Add CI/CD Automation (Optional)

Add to `.gitlab-ci.yml`:

```yaml
mirror:github:
  stage: deploy
  only:
    - main
    - tags
  script:
    - git push --mirror https://${GITHUB_TOKEN}@github.com/blueflyio/openstandardagents.git
  variables:
    GIT_STRATEGY: clone
```

Add `GITHUB_TOKEN` to GitLab CI/CD variables:
- **Settings → CI/CD → Variables**
- Key: `GITHUB_TOKEN`
- Value: GitHub PAT
- Protected: ✓
- Masked: ✓

## Maintenance

### Token Rotation

Rotate GitHub PAT every 90 days:

1. Generate new token on GitHub
2. Update in GitLab mirror settings
3. Update `GITHUB_TOKEN` CI variable
4. Revoke old token

### Monitor Sync Status

Check mirror status:
- **GitLab**: Settings → Repository → Mirroring repositories
- Look for "Last successful update"
- Check for error messages

### Manual Sync

Force sync if needed:

```bash
# From GitLab mirror settings
Click "Update now" button

# Or via CLI
git push --mirror https://github.com/blueflyio/openstandardagents.git
```

## Troubleshooting

### Mirror Sync Fails

**Error**: "Authentication failed"
- Verify GitHub PAT is valid
- Check token has `repo` scope
- Ensure token hasn't expired

**Error**: "Protected branch"
- Disable branch protection on GitHub temporarily
- Or configure mirror to skip protected branches

### Commits Not Appearing

1. Check GitLab mirror status for errors
2. Verify branch is protected (if "mirror protected only" enabled)
3. Check GitHub repository isn't archived
4. Manually trigger sync

### Large Repository Issues

If repository is large (>1GB):
- Use shallow clone in CI: `GIT_DEPTH: 1`
- Consider mirroring only main branch
- Exclude large files with `.gitattributes`

## Security Considerations

- **Never commit tokens**: Use CI/CD variables
- **Rotate regularly**: 90-day maximum
- **Minimum scope**: Only `repo` access needed
- **Monitor access**: Review GitHub audit log
- **Revoke on breach**: Immediately revoke compromised tokens

## Alternative: GitHub Actions

Instead of GitLab mirror, use GitHub Actions:

```yaml
# .github/workflows/sync-from-gitlab.yml
name: Sync from GitLab

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Sync from GitLab
        run: |
          git remote add gitlab https://gitlab.com/blueflyio/openstandardagents.git
          git fetch gitlab
          git push origin --mirror
```

## References

- [GitLab Repository Mirroring](https://docs.gitlab.com/ee/user/project/repository/mirror/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Git Push Mirror](https://git-scm.com/docs/git-push#Documentation/git-push.txt---mirror)
