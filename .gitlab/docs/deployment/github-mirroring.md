# GitHub Mirroring Deployment Guide

This guide explains how to set up automated mirroring from GitLab to GitHub for the OSSA project.

## Overview

The OSSA project uses GitLab as the primary repository with automatic mirroring to GitHub for broader community access.

**Primary:** https://gitlab.com/blueflyio/openstandardagents  
**Mirror:** https://github.com/blueflyio/openstandardagents

## Setup Instructions

### 1. Create GitHub Repository

```bash
# On GitHub
1. Create new repository: blueflyio/openstandardagents
2. Set visibility: Public
3. Do NOT initialize with README (will be pushed from GitLab)
```

### 2. Generate GitHub Personal Access Token

```bash
# On GitHub → Settings → Developer settings → Personal access tokens
1. Click "Generate new token (classic)"
2. Name: "GitLab Mirror - OSSA"
3. Scopes: 
   - repo (full control)
   - workflow
4. Generate and copy token
```

### 3. Configure GitLab Mirror

```bash
# On GitLab → Settings → Repository → Mirroring repositories
1. Git repository URL: https://github.com/blueflyio/openstandardagents.git
2. Mirror direction: Push
3. Authentication method: Password
4. Password: <paste GitHub token>
5. Mirror only protected branches: ✓
6. Keep divergent refs: ✓
7. Click "Mirror repository"
```

### 4. Configure Protected Branches

```bash
# On GitLab → Settings → Repository → Protected branches
Protect these branches for mirroring:
- main
- development
- production (if exists)
```

### 5. Test Mirror

```bash
# Push to GitLab main branch
git push origin main

# Verify on GitHub
# Changes should appear within 5 minutes
```

## Automated Mirroring

### GitLab CI/CD Integration

Add to `.gitlab-ci.yml`:

```yaml
mirror:github:
  stage: deploy
  only:
    - main
    - development
  script:
    - echo "Triggering GitHub mirror update"
    - curl -X POST "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/mirror/pull"
  when: on_success
```

### Manual Trigger

```bash
# Via GitLab UI
Settings → Repository → Mirroring repositories → Update now

# Via API
curl -X POST "https://gitlab.com/api/v4/projects/:id/mirror/pull" \
  -H "PRIVATE-TOKEN: <your-token>"
```

## Troubleshooting

### Mirror Not Updating

**Check mirror status:**
```bash
# GitLab → Settings → Repository → Mirroring repositories
# Look for error messages
```

**Common issues:**
- GitHub token expired → Regenerate token
- Protected branch mismatch → Verify branch protection settings
- Rate limiting → Wait and retry

### Divergent Branches

```bash
# If GitHub has diverged from GitLab
1. Delete GitHub repository
2. Recreate and reconfigure mirror
3. Force push from GitLab
```

### Authentication Failures

```bash
# Verify token has correct scopes
# Regenerate token if needed
# Update in GitLab mirror settings
```

## Best Practices

### Branch Strategy

- **main**: Production-ready code (protected, mirrored)
- **development**: Active development (protected, mirrored)
- **feature/***: Feature branches (not mirrored)

### Commit Messages

Use conventional commits for better GitHub changelog:
```
feat: add new feature
fix: resolve bug
docs: update documentation
```

### Release Process

```bash
1. Merge to development
2. Test in development
3. Create MR to main
4. Merge to main
5. Mirror automatically updates GitHub
6. Create GitHub release from tag
```

## Monitoring

### Check Mirror Health

```bash
# GitLab API
curl "https://gitlab.com/api/v4/projects/:id/remote_mirrors" \
  -H "PRIVATE-TOKEN: <token>"
```

### Mirror Logs

```bash
# GitLab → Settings → Repository → Mirroring repositories
# Click on mirror → View logs
```

## Security Considerations

- Store GitHub token in GitLab CI/CD variables (masked)
- Use fine-grained tokens when available
- Rotate tokens every 90 days
- Never commit tokens to repository
- Use separate tokens for different environments

## Maintenance

### Token Rotation

```bash
# Every 90 days:
1. Generate new GitHub token
2. Update GitLab mirror settings
3. Test mirror
4. Revoke old token
```

### Mirror Cleanup

```bash
# Remove old mirrors
GitLab → Settings → Repository → Mirroring repositories → Remove
```

## References

- [GitLab Repository Mirroring](https://docs.gitlab.com/ee/user/project/repository/mirror/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitLab CI/CD Variables](https://docs.gitlab.com/ee/ci/variables/)
