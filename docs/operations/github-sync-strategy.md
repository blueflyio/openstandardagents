# GitHub Sync Strategy

## Overview

**GitLab** = Private development (source of truth)  
**GitHub** = Public mirror + community contributions

## Current State

### GitHub Repository
- **URL**: https://github.com/blueflyio/openstandardagents
- **Status**: Public
- **Features Enabled**: Issues ✓, Wiki ✓, Discussions ✓, PRs ✓
- **Current PRs**: 10+ open (mostly Dependabot)

### GitLab Repository
- **URL**: https://gitlab.com/blueflyio/openstandardagents
- **Status**: Private development
- **Features**: Full CI/CD, MRs, Wiki, Issues

## Sync Strategy

### 1. Code Sync (GitLab → GitHub)

**Method**: Automatic push mirror

```yaml
# .gitlab-ci.yml
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

**What syncs**:
- ✅ main branch
- ✅ tags/releases
- ✅ commit history
- ❌ development branch (keep private)
- ❌ feature branches (keep private)

### 2. Pull Requests (GitHub → GitLab)

**Workflow**:

```
GitHub PR → Review → Create GitLab MR → Merge → Sync back to GitHub
```

**Process**:

1. **External contributor opens PR on GitHub**
2. **Bot comments**: "Thanks! We'll review and sync to our internal GitLab"
3. **Maintainer creates GitLab MR** from PR
4. **Review and merge on GitLab**
5. **Changes sync back to GitHub** via mirror
6. **GitHub PR auto-closes** (commit in main)

**Automation Script**:

```bash
#!/bin/bash
# scripts/sync-github-pr.sh

PR_NUMBER=$1
gh pr checkout $PR_NUMBER
git checkout -b github-pr-$PR_NUMBER
git push origin github-pr-$PR_NUMBER

# Create GitLab MR
glab mr create \
  --title "GitHub PR #$PR_NUMBER: $(gh pr view $PR_NUMBER --json title -q .title)" \
  --description "From: https://github.com/blueflyio/openstandardagents/pull/$PR_NUMBER" \
  --source-branch github-pr-$PR_NUMBER \
  --target-branch main
```

### 3. Issues Sync

**Strategy**: Keep separate

- **GitHub Issues**: Community questions, bug reports
- **GitLab Issues**: Internal development, roadmap

**Workflow**:

1. **Community reports issue on GitHub**
2. **Triage**: Is it a bug/feature request?
3. **If actionable**: Create GitLab issue, link back
4. **Close GitHub issue** with: "Tracked internally at gitlab.com/..."

**Automation**:

```yaml
# .github/workflows/issue-triage.yml
name: Issue Triage
on:
  issues:
    types: [opened]
jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - name: Comment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '👋 Thanks for opening an issue! We track development on GitLab. A maintainer will review and create an internal issue if needed.'
            })
```

### 4. Wiki Sync

**Strategy**: One-way GitLab → GitHub

**What to sync**:
- ✅ Public documentation
- ✅ Getting started guides
- ✅ API reference
- ❌ Internal operations docs
- ❌ Private deployment guides

**Automation**:

```bash
#!/bin/bash
# scripts/sync-wiki.sh

# Clone GitLab wiki
git clone https://gitlab.com/blueflyio/openstandardagents.wiki.git gitlab-wiki

# Clone GitHub wiki
git clone https://github.com/blueflyio/openstandardagents.wiki.git github-wiki

# Sync public pages
PUBLIC_PAGES=(
  "Home.md"
  "Getting-Started.md"
  "CLI-Utilities.md"
  "V0.2.6-Release-Notes.md"
)

for page in "${PUBLIC_PAGES[@]}"; do
  cp "gitlab-wiki/$page" "github-wiki/$page"
done

cd github-wiki
git add .
git commit -m "Sync from GitLab wiki"
git push
```

### 5. Releases Sync

**Strategy**: Automatic via tags

**Workflow**:

1. **Create release on GitLab**
2. **Tag syncs to GitHub** (via mirror)
3. **GitHub Actions creates release** from tag

```yaml
# .github/workflows/release.yml
name: Create Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

## Implementation Plan

### Phase 1: Setup (Week 1)

- [ ] Configure GitLab → GitHub mirror
- [ ] Add GitHub token to GitLab CI
- [ ] Test mirror sync
- [ ] Update GitHub README with contribution notice

### Phase 2: PR Workflow (Week 2)

- [ ] Create PR sync script
- [ ] Add GitHub Actions for PR comments
- [ ] Document PR workflow
- [ ] Test with sample PR

### Phase 3: Issue Management (Week 3)

- [ ] Add issue triage automation
- [ ] Create issue templates
- [ ] Document issue workflow
- [ ] Train team on process

### Phase 4: Wiki & Releases (Week 4)

- [ ] Create wiki sync script
- [ ] Setup release automation
- [ ] Test full workflow
- [ ] Document for team

## GitHub Repository Configuration

### Settings to Update

**General**:
- Description: "Open Standard for AI Agents - Public mirror of GitLab repo"
- Website: https://openstandardagents.org
- Topics: `ai`, `agents`, `openapi`, `standard`, `ossa`

**Features**:
- ✅ Issues (for community)
- ✅ Wiki (synced from GitLab)
- ✅ Discussions (for community)
- ✅ Pull Requests (with workflow)

**Branch Protection** (main):
- ✅ Require pull request reviews
- ✅ Require status checks
- ✅ Restrict pushes (mirror only)

### README Notice

Add to top of GitHub README:

```markdown
> **Note**: This is a public mirror of our GitLab repository.
> 
> - **Development**: https://gitlab.com/blueflyio/openstandardagents
> - **Issues**: Report here or on GitLab
> - **Pull Requests**: Welcome! We'll sync to GitLab for review
> - **Documentation**: https://openstandardagents.org
```

## Handling Dependabot PRs

**Current**: 10+ open Dependabot PRs

**Strategy**:

1. **Review on GitHub** (quick security check)
2. **Batch merge** weekly
3. **Sync to GitLab** as single MR
4. **Test on GitLab CI**
5. **Merge and sync back**

**Automation**:

```bash
# scripts/batch-dependabot.sh
gh pr list --label dependencies --json number -q '.[].number' | \
  xargs -I {} gh pr merge {} --auto --squash
```

## Security Considerations

### Secrets Management

- ❌ Never commit secrets to GitHub
- ✅ Use GitLab CI variables for sensitive data
- ✅ GitHub Actions secrets for public workflows
- ✅ Rotate tokens every 90 days

### Private Information

**Keep on GitLab only**:
- Internal deployment configs
- Customer information
- Private API keys
- Team discussions
- Development branches

**Safe for GitHub**:
- Public documentation
- Open source code
- Release notes
- Community discussions

## Monitoring

### Metrics to Track

- Mirror sync status (daily)
- PR response time (< 48 hours)
- Issue triage time (< 24 hours)
- Wiki sync frequency (weekly)
- Community engagement (monthly)

### Alerts

- Mirror sync failure
- PR older than 7 days
- Issue without response > 48 hours

## Team Responsibilities

### Maintainers

- Review GitHub PRs
- Triage GitHub issues
- Sync wiki weekly
- Monitor mirror status

### Contributors

- Can submit PRs on GitHub
- Can open issues on GitHub
- Follow contribution guidelines
- Respect code of conduct

## Documentation

### For Contributors

- `CONTRIBUTING.md` - How to contribute
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template
- `.github/ISSUE_TEMPLATE/` - Issue templates

### For Maintainers

- `docs/operations/github-sync-strategy.md` - This document
- `docs/operations/pr-workflow.md` - PR handling
- `docs/operations/issue-triage.md` - Issue management

## Success Criteria

- ✅ Code syncs automatically within 5 minutes
- ✅ PRs reviewed within 48 hours
- ✅ Issues triaged within 24 hours
- ✅ Wiki updated weekly
- ✅ Zero security incidents
- ✅ Active community engagement

## References

- [GitLab Mirroring](https://docs.gitlab.com/ee/user/project/repository/mirror/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [gh CLI](https://cli.github.com/)
- [glab CLI](https://gitlab.com/gitlab-org/cli)
