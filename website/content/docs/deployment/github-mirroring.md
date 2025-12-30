---
title: "GitHub Mirroring Deployment Guide"
---

# GitHub Mirroring Deployment Guide

## Overview

This guide documents the GitHub mirroring setup for the Open Standard Agents (OSSA) repository. The project uses a **dual-platform strategy** where GitLab serves as the primary development platform, and GitHub acts as a public mirror for broader community access and visibility.

### Why Mirror to GitHub?

- **Broader Reach**: GitHub has a larger developer community and better discoverability
- **Ecosystem Integration**: Many tools and services integrate better with GitHub
- **Redundancy**: Provides backup and alternative access to the repository
- **Community Engagement**: Easier for external contributors to discover and engage
- **Website Hosting**: GitHub Pages serves as the primary website host (openstandardagents.org)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitLab (Primary)                         │
│  - Source of truth for code                                 │
│  - CI/CD pipeline orchestration                             │
│  - Merge requests and code review                           │
│  - Issue tracking and project management                    │
│  - NPM package publishing                                   │
│  - GitLab Pages (backup website)                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Automatic Push Mirror
                   │ (on main branch & tags)
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub (Mirror)                           │
│  - Public repository mirror                                 │
│  - GitHub Actions CI (validation)                           │
│  - GitHub Pages (primary website)                           │
│  - Community engagement                                     │
│  - Release distribution                                     │
│  - CodeQL security scanning                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before setting up GitHub mirroring, ensure you have:

1. **GitLab Repository**: Primary repository on GitLab (gitlab.com/blueflyio/openstandardagents)
2. **GitHub Repository**: Target mirror repository (github.com/blueflyio/openstandardagents)
3. **GitHub Personal Access Token**: With `repo` and `workflow` permissions
4. **GitLab CI/CD Access**: Ability to set CI/CD variables in GitLab project settings

---

## Configuration

### 1. GitHub Personal Access Token Setup

Create a GitHub Personal Access Token (PAT) with the following permissions:

**Token Permissions Required:**
- `repo` - Full control of private repositories
  - `repo:status` - Access commit status
  - `repo_deployment` - Access deployment status
  - `public_repo` - Access public repositories
- `workflow` - Update GitHub Action workflows

**Steps to Create Token:**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set token name: `GitLab Mirror - OSSA`
4. Set expiration: 90 days (recommended) or No expiration (requires periodic rotation)
5. Select scopes: `repo`, `workflow`
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again)

**Security Best Practices:**
- Use a dedicated service account or bot account for mirroring
- Set token expiration and rotate regularly
- Store token securely in GitLab CI/CD variables (masked)
- Never commit tokens to the repository
- Use fine-grained tokens when available (GitHub beta feature)

### 2. GitLab CI/CD Variable Configuration

Add the GitHub token to GitLab CI/CD variables:

**Steps:**

1. Navigate to GitLab project: Settings → CI/CD → Variables
2. Click "Add variable"
3. Configure variable:
   - **Key**: `GITHUB_MIRROR_TOKEN`
   - **Value**: `<your-github-personal-access-token>`
   - **Type**: Variable
   - **Environment scope**: All (default)
   - **Protect variable**: ✅ Yes (recommended - only available to protected branches)
   - **Mask variable**: ✅ Yes (hides value in job logs)
   - **Expand variable reference**: ❌ No
4. Click "Add variable"

**Verification:**

The token is correctly configured when:
- Variable appears in Settings → CI/CD → Variables list
- Value is masked (shows as `[masked]` in logs)
- Mirror job runs successfully without authentication errors

### 3. GitLab CI/CD Mirror Job

The mirror job is defined in `.gitlab-ci.yml` at the `mirror` stage:

```yaml
mirror:github:
  stage: mirror
  image: alpine:latest
  before_script:
    - apk add --no-cache git
    - git config --global user.email "ci@blueflyio.com"
    - git config --global user.name "GitLab CI"
  script:
    - |
      if [ -z "$GITHUB_MIRROR_TOKEN" ]; then
        echo "ℹ️  GITHUB_MIRROR_TOKEN not set - skipping"
        exit 0
      fi

      echo "🔄 Syncing to GitHub..."
      git remote add github https://${GITHUB_MIRROR_TOKEN}@github.com/blueflyio/openstandardagents.git || true
      git push github --all --force || true
      git push github --tags --force || true
      echo "✅ GitHub mirror synced"
  rules:
    - if: $CI_COMMIT_TAG
      when: on_success
    - if: $CI_COMMIT_BRANCH == "main"
      when: on_success
  allow_failure: true
```

**Job Configuration Details:**

| Setting | Value | Purpose |
|---------|-------|---------|
| **Stage** | `mirror` | Runs after release stage |
| **Image** | `alpine:latest` | Minimal Linux image with git |
| **Trigger** | Tags + main branch | Mirrors production code only |
| **Force Push** | Yes | Ensures GitHub matches GitLab exactly |
| **Failure Handling** | `allow_failure: true` | Pipeline succeeds even if mirror fails |

**When Mirror Runs:**

1. **On Git Tags**: When a new version tag is created (e.g., `v0.3.0`)
2. **On Main Branch**: When commits are pushed to the `main` branch
3. **Not on Feature Branches**: Feature branches are not mirrored

**What Gets Mirrored:**

- ✅ All branches (`git push --all`)
- ✅ All tags (`git push --tags`)
- ✅ Commit history
- ✅ Repository metadata
- ❌ GitLab-specific features (CI/CD variables, merge requests, issues)

---

## CI/CD Considerations

### Dual-Pipeline Strategy

The project uses a **dual-pipeline strategy** where GitLab is the primary CI/CD platform, and GitHub provides supplementary validation and deployment.

#### GitLab CI/CD (Primary)

**Stages:**
1. `setup` - Environment preparation
2. `version-detect` - Milestone and version detection
3. `validate` - Code validation, linting, version sync
4. `build` - Build distribution packages
5. `test` - Unit tests, security audits, coverage
6. `quality` - Quality gates
7. `deploy` - Website deployment (manual)
8. `release` - NPM publishing (milestone-gated)
9. `mirror` - GitHub synchronization

**Key Features:**
- **Milestone-Gated Releases**: Requires closed milestone + `ENABLE_RELEASE=true`
- **Dev Tag Management**: Automatic dev tags on development branch
- **Documentation Sync**: Validates version consistency across docs
- **Comprehensive Testing**: Lint, typecheck, unit tests, security audits
- **Manual Website Deployment**: Controlled deployment to GitLab Pages
- **NPM Publishing**: Automated npm publish on release

**Release Gate:**

Releases require **BOTH** conditions:
1. ✅ Milestone must be 100% complete and closed
2. ✅ CI/CD variable `ENABLE_RELEASE` must be set to `"true"`

This allows deploying to main without releasing. Set the variable only when ready to release.

#### GitHub Actions (Mirror)

**Workflows:**

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Validate, lint, test, security audit
   - Build package and website
   - Upload coverage to Codecov
   - Runs on: `push` to main/develop, `pull_request`

2. **Release Workflow** (`.github/workflows/release.yml`)
   - Semantic release (GitHub releases)
   - NPM publishing (backup)
   - GitHub Pages deployment
   - Runs on: `push` to main/develop

3. **CodeQL Workflow** (`.github/workflows/codeql.yml`)
   - Security vulnerability scanning
   - Code quality analysis
   - Runs on: `push`, `pull_request`, weekly schedule

**Key Differences:**

| Feature | GitLab (Primary) | GitHub (Mirror) |
|---------|------------------|-----------------|
| **Purpose** | Source of truth | Public mirror |
| **CI Trigger** | All branches | main/develop only |
| **Release Strategy** | Milestone-gated | Semantic release |
| **NPM Publish** | Primary | Backup/fallback |
| **Website Deploy** | Manual button | Automatic on main |
| **Test Coverage** | Comprehensive | Basic validation |

### Force Push Strategy

The mirror job uses `--force` flags for both branches and tags:

```bash
git push github --all --force
git push github --tags --force
```

**Why Force Push?**

1. **Single Source of Truth**: GitLab is authoritative, GitHub must match exactly
2. **Conflict Resolution**: Prevents divergence between platforms
3. **Tag Updates**: Allows updating existing tags (e.g., fixing release notes)
4. **Simplicity**: No merge conflicts or manual intervention required

**Implications:**

⚠️ **Warning**: Force pushing overwrites GitHub history. This is intentional for mirroring but has consequences:

- **GitHub-only commits are lost**: Any commits made directly to GitHub will be overwritten
- **Pull requests may break**: GitHub PRs should not be used; use GitLab merge requests
- **History rewriting**: If GitLab history is rewritten, GitHub will match
- **Tag updates**: Existing tags can be updated (useful for release notes)

**Best Practices:**

- ✅ Always work on GitLab (primary platform)
- ✅ Use GitLab merge requests for code review
- ✅ Create issues on GitLab, not GitHub
- ❌ Never commit directly to GitHub
- ❌ Never create GitHub pull requests
- ❌ Never manually push to GitHub

### Tag Synchronization

Tags are synchronized automatically when created on GitLab:

**Tag Creation Flow:**

1. **GitLab Release**: Tag created on GitLab (e.g., `v0.3.0`)
2. **CI Pipeline Triggers**: Mirror job runs automatically
3. **GitHub Sync**: Tag pushed to GitHub with `--force`
4. **GitHub Actions**: Release workflow triggers on new tag
5. **GitHub Release**: Semantic release creates GitHub release

**Tag Types:**

- **Production Tags**: `v0.3.0`, `v1.0.0` (semantic versions)
- **Dev Tags**: `0.2.8-dev-1`, `0.2.8-dev-2` (development builds)
- **RC Tags**: `v0.2.8-RC` (release candidates)

**Tag Metadata:**

GitLab tags include comprehensive release information:

```
Release v0.3.0

Milestone - v0.2.8 - Bug Fixes & Documentation
Pipeline - 12345678
Released - 2025-11-25T20:00:00Z
Commit - abc123def456

Documentation
- Schema - https://openstandardagents.org/schema/
- Changelog - https://github.com/blueflyio/openstandardagents/blob/main/CHANGELOG.md
- Migration Guide - https://openstandardagents.org/docs/migration-guides/

npm Package - @bluefly/openstandardagents@0.3.0
GitLab Release - https://gitlab.com/blueflyio/openstandardagents/-/releases/v0.3.0
```

This metadata is preserved when mirrored to GitHub.

---

## Branch Protection Rules

### GitHub Branch Protection

To prevent accidental commits to GitHub and maintain GitLab as the source of truth, configure branch protection rules on GitHub:

**Recommended Settings for `main` Branch:**

1. Navigate to GitHub repository: Settings → Branches → Branch protection rules
2. Click "Add rule" or edit existing rule for `main`
3. Configure protection:

**Branch name pattern**: `main`

**Protect matching branches:**
- ✅ **Require a pull request before merging**
  - Required approvals: 1
  - ❌ Dismiss stale pull request approvals when new commits are pushed
  - ❌ Require review from Code Owners
  - ❌ Restrict who can dismiss pull request reviews
  - ❌ Allow specified actors to bypass required pull requests
  - ❌ Require approval of the most recent reviewable push

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Status checks: `validate`, `lint`, `test`, `build`

- ✅ **Require conversation resolution before merging**

- ✅ **Require signed commits**

- ❌ **Require linear history** (conflicts with mirror force push)

- ✅ **Require deployments to succeed before merging**
  - Environments: `production`

- ❌ **Lock branch** (would prevent mirroring)

- ❌ **Do not allow bypassing the above settings**

- ✅ **Restrict who can push to matching branches**
  - Add: GitLab CI service account or bot account
  - This allows mirror job to push while preventing manual pushes

- ✅ **Allow force pushes**
  - Specify who can force push: GitLab CI service account only
  - Required for mirroring to work

- ✅ **Allow deletions**
  - Specify who can delete: GitLab CI service account only

**Additional Protection for `develop` Branch:**

Apply similar rules to `develop` branch if mirrored:
- Same settings as `main`
- Adjust status checks as needed
- Allow force pushes from GitLab CI only

### GitLab Branch Protection

GitLab branch protection is already configured:

**Main Branch:**
- ✅ Protected branch
- ✅ Merge requests required
- ✅ Merge trains enabled
- ✅ Code owner approval required
- ✅ All discussions must be resolved

**Development Branch:**
- ✅ Protected branch
- ✅ Merge requests required
- ✅ Maintainer approval required

### Interaction Between Platforms

**GitLab Merge Trains + GitHub Protection:**

GitLab merge trains ensure that:
1. All CI checks pass before merge
2. Code is always in a releasable state
3. No merge conflicts on main

GitHub protection ensures that:
1. Mirror is the only way to update GitHub
2. No accidental commits to GitHub
3. Status checks validate mirrored code

**Consistency Guidelines:**

- ✅ Keep branch names consistent (main, develop, feature/*)
- ✅ Use same commit message conventions
- ✅ Apply similar protection rules
- ✅ Maintain same branching strategy
- ❌ Don't create GitHub-specific branches
- ❌ Don't use different versioning schemes

---

## Verification

### How to Verify Mirroring is Working

**1. Check GitLab CI/CD Pipeline:**

```bash
# Navigate to GitLab project
# Go to: CI/CD → Pipelines
# Find latest pipeline on main branch
# Check mirror:github job status
```

**Expected Output:**
```
🔄 Syncing to GitHub...
✅ GitHub mirror synced
```

**2. Compare Commits:**

```bash
# Clone both repositories
git clone https://gitlab.com/blueflyio/openstandardagents.git gitlab-repo
git clone https://github.com/blueflyio/openstandardagents.git github-repo

# Compare latest commits
cd gitlab-repo && git log -1 --oneline
cd ../github-repo && git log -1 --oneline

# Should show same commit hash and message
```

**3. Verify Tags:**

```bash
# List tags on both platforms
cd gitlab-repo && git tag -l | sort
cd ../github-repo && git tag -l | sort

# Should show identical tag lists
```

**4. Check GitHub Actions:**

```bash
# Navigate to GitHub repository
# Go to: Actions tab
# Verify workflows are running successfully
```

**5. Test Website Deployment:**

```bash
# Visit both websites
curl -I https://openstandardagents.org
# Should return 200 OK from GitHub Pages

curl -I https://blueflyio.gitlab.io/openstandardagents
# Should return 200 OK from GitLab Pages
```

### Verification Checklist

- [ ] GitLab mirror job completes successfully
- [ ] Latest commit on GitHub matches GitLab
- [ ] All tags are synchronized
- [ ] GitHub Actions workflows pass
- [ ] Website deploys successfully to GitHub Pages
- [ ] No authentication errors in GitLab CI logs
- [ ] Branch protection rules are active on GitHub
- [ ] Force push is restricted to CI service account

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Failed

**Symptom:**
```
fatal: Authentication failed for 'https://github.com/blueflyio/openstandardagents.git/'
```

**Causes:**
- Token expired or invalid
- Token lacks required permissions
- Token not set in GitLab CI/CD variables

**Solutions:**

1. **Verify token exists:**
   ```bash
   # In GitLab: Settings → CI/CD → Variables
   # Check GITHUB_MIRROR_TOKEN is present and masked
   ```

2. **Check token permissions:**
   - Go to GitHub: Settings → Developer settings → Personal access tokens
   - Verify token has `repo` and `workflow` scopes
   - Regenerate token if needed

3. **Update GitLab variable:**
   - Delete old `GITHUB_MIRROR_TOKEN` variable
   - Create new variable with fresh token
   - Ensure "Masked" is checked

4. **Test token manually:**
   ```bash
   git clone https://${GITHUB_MIRROR_TOKEN}@github.com/blueflyio/openstandardagents.git
   # Should clone successfully
   ```

#### 2. Token Expiration

**Symptom:**
```
remote: Invalid username or password.
fatal: Authentication failed
```

**Prevention:**
- Set calendar reminder 1 week before expiration
- Use longer expiration periods (90 days)
- Consider using GitHub App tokens (no expiration)

**Resolution:**

1. **Generate new token** (see "GitHub Personal Access Token Setup")
2. **Update GitLab variable** with new token
3. **Retry failed pipeline** or push new commit

**Automation:**
```bash
# Add to monitoring/alerting
# Check token expiration date
# Alert 7 days before expiration
```

#### 3. Force Push Rejected

**Symptom:**
```
! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs
```

**Causes:**
- Branch protection prevents force push
- CI service account not in allowed list
- GitHub repository has diverged

**Solutions:**

1. **Check branch protection:**
   - GitHub: Settings → Branches → main
   - Verify "Allow force pushes" is enabled
   - Verify CI service account is in allowed list

2. **Verify CI account permissions:**
   - Ensure token is from account with force push access
   - Check account is repository admin or has force push permission

3. **Manual sync (emergency only):**
   ```bash
   # Clone GitLab repo
   git clone https://github.com/blueflyio/openstandardagents.git
   cd openstandardagents
   
   # Add GitHub remote
   git remote add github https://${GITHUB_MIRROR_TOKEN}@github.com/blueflyio/openstandardagents.git
   
   # Force push
   git push github --all --force
   git push github --tags --force
   ```

#### 4. Mirror Job Skipped

**Symptom:**
```
ℹ️  GITHUB_MIRROR_TOKEN not set - skipping
```

**Causes:**
- Variable not set in GitLab CI/CD
- Variable not available to pipeline (scope issue)
- Variable name mismatch

**Solutions:**

1. **Verify variable name:**
   - Must be exactly `GITHUB_MIRROR_TOKEN`
   - Case-sensitive

2. **Check variable scope:**
   - Environment scope should be "All" or match pipeline environment
   - Protected variable should be enabled if branch is protected

3. **Verify variable in pipeline:**
   ```yaml
   # Add debug step to mirror job
   script:
     - echo "Token set: $([ -n "$GITHUB_MIRROR_TOKEN" ] && echo 'yes' || echo 'no')"
   ```

#### 5. Merge Conflicts on GitHub

**Symptom:**
```
CONFLICT (content): Merge conflict in <file>
```

**Cause:**
- Commits made directly to GitHub (violates workflow)
- Manual changes to GitHub repository

**Solution:**

⚠️ **This should never happen if workflow is followed correctly.**

1. **Identify conflicting commits:**
   ```bash
   git log --oneline --graph --all
   ```

2. **Force sync from GitLab (destructive):**
   ```bash
   git push github --all --force
   git push github --tags --force
   ```

3. **Prevent future conflicts:**
   - Enable branch protection on GitHub
   - Restrict push access to CI service account only
   - Educate team: "Never commit to GitHub directly"

#### 6. Tag Synchronization Issues

**Symptom:**
- Tags missing on GitHub
- Tag points to different commit
- Duplicate tags with different content

**Solutions:**

1. **Verify tag exists on GitLab:**
   ```bash
   git ls-remote --tags https://github.com/blueflyio/openstandardagents.git
   ```

2. **Force sync tags:**
   ```bash
   git push github --tags --force
   ```

3. **Delete and recreate tag (if corrupted):**
   ```bash
   # On GitLab
   git tag -d v0.3.0
   git push origin :refs/tags/v0.3.0
   
   # Recreate tag
   git tag -a v0.2.8 -m "Release v0.3.0"
   git push origin v0.3.0
   
   # Mirror will sync automatically
   ```

#### 7. GitHub Actions Not Triggering

**Symptom:**
- Mirror succeeds but GitHub Actions don't run
- Workflows show "skipped" status

**Causes:**
- Workflow files not present in mirrored branch
- Workflow disabled on GitHub
- Token lacks `workflow` permission

**Solutions:**

1. **Verify workflow files exist:**
   ```bash
   ls -la .github/workflows/
   # Should show: ci.yml, release.yml, codeql.yml
   ```

2. **Check workflow status:**
   - GitHub: Actions tab
   - Verify workflows are enabled (not disabled)

3. **Update token permissions:**
   - Add `workflow` scope to GitHub token
   - Update `GITHUB_MIRROR_TOKEN` in GitLab

4. **Manually trigger workflow:**
   - GitHub: Actions → Select workflow → Run workflow

---

## Maintenance

### Token Rotation

**Recommended Schedule:**
- Rotate tokens every 90 days
- Set calendar reminders
- Document rotation in team runbook

**Rotation Process:**

1. **Generate new token** (see "GitHub Personal Access Token Setup")
2. **Test new token:**
   ```bash
   git clone https://${NEW_TOKEN}@github.com/blueflyio/openstandardagents.git test-clone
   ```
3. **Update GitLab variable:**
   - Settings → CI/CD → Variables
   - Edit `GITHUB_MIRROR_TOKEN`
   - Replace value with new token
4. **Verify mirror job:**
   - Trigger pipeline manually or push commit
   - Check mirror:github job succeeds
5. **Revoke old token:**
   - GitHub: Settings → Developer settings → Personal access tokens
   - Find old token → Revoke

**Automation:**
```bash
# Add to monitoring
# Alert 7 days before token expiration
# Provide rotation instructions in alert
```

### Monitoring

**Key Metrics to Monitor:**

1. **Mirror Job Success Rate**
   - Target: > 99%
   - Alert if: < 95% over 7 days

2. **Sync Latency**
   - Target: < 5 minutes from GitLab commit to GitHub
   - Alert if: > 15 minutes

3. **Token Expiration**
   - Alert: 7 days before expiration
   - Critical: 1 day before expiration

4. **GitHub Actions Status**
   - Target: All workflows passing
   - Alert if: Any workflow failing > 24 hours

**Monitoring Setup:**

```yaml
# Example: GitLab CI monitoring job
monitor:mirror:
  stage: .post
  script:
    - |
      # Check last mirror job status
      LAST_STATUS=$(curl -sS "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/jobs?scope=success&per_page=1" \
        -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" | jq -r '.[0].status')
      
      if [ "$LAST_STATUS" != "success" ]; then
        echo "⚠️  Last mirror job failed"
        # Send alert to monitoring system
      fi
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
  allow_failure: true
```

### Updates and Changes

**When to Update Mirror Configuration:**

1. **Repository Rename**
   - Update GitHub repository URL in `.gitlab-ci.yml`
   - Update documentation references

2. **Organization Change**
   - Update GitHub organization in mirror URL
   - Regenerate token for new organization

3. **Branch Strategy Change**
   - Update mirror job rules to include/exclude branches
   - Update branch protection rules

4. **Token Permissions Change**
   - Regenerate token with new permissions
   - Update GitLab variable
   - Test mirror job

**Change Process:**

1. **Test in development:**
   - Create test repository on GitHub
   - Update mirror URL to test repo
   - Verify mirror works

2. **Update production:**
   - Update `.gitlab-ci.yml` with new configuration
   - Create merge request
   - Review and approve
   - Merge to main

3. **Verify:**
   - Check mirror job succeeds
   - Verify GitHub repository updated
   - Monitor for 24 hours

---

## Security Considerations

### Token Security

**Best Practices:**

1. **Use Dedicated Service Account**
   - Create GitHub bot account (e.g., `ossa-mirror-bot`)
   - Use bot account token for mirroring
   - Limit bot account permissions to minimum required

2. **Token Storage**
   - ✅ Store in GitLab CI/CD variables (masked)
   - ✅ Enable "Protected" flag for production
   - ❌ Never commit to repository
   - ❌ Never log token value
   - ❌ Never share via insecure channels

3. **Token Permissions**
   - Use minimum required scopes (`repo`, `workflow`)
   - Avoid admin or org-level permissions
   - Use fine-grained tokens when available

4. **Token Rotation**
   - Rotate every 90 days minimum
   - Rotate immediately if compromised
   - Document rotation in security runbook

### Access Control

**GitLab:**
- Limit who can edit CI/CD variables (Maintainer role)
- Protect main and develop branches
- Require merge request approvals
- Enable merge trains

**GitHub:**
- Restrict force push to CI service account only
- Enable branch protection on main
- Require status checks before merge
- Enable signed commits

### Audit Logging

**GitLab:**
- Monitor CI/CD job logs for mirror activity
- Track variable changes in audit log
- Alert on failed mirror jobs

**GitHub:**
- Enable audit log for repository
- Monitor force push events
- Track token usage

**Retention:**
- Keep CI/CD logs for 90 days minimum
- Archive audit logs for 1 year
- Comply with organizational retention policies

---

## Related Documentation

- **GitLab CI/CD Pipeline**: `.gitlab-ci.yml` (lines 1089-1109)
- **GitHub Workflows**: `.github/workflows/`
- **Release Process**: `.gitlab/docs/releases/`
- **Infrastructure Documentation**: `.gitlab/docs/infrastructure/`
- **Website Deployment**: `website/README.md`

---

## Support

**Issues:**
- GitLab: https://gitlab.com/blueflyio/openstandardagents/-/issues
- GitHub: https://github.com/blueflyio/openstandardagents/issues

**Documentation:**
- Website: https://openstandardagents.org
- GitLab Wiki: https://github.com/blueflyio/openstandardagents/-/wikis/home

**Contact:**
- Email: support@bluefly.io
- GitLab: @bluefly

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-25  
**Maintained By**: OSSA Platform Team
