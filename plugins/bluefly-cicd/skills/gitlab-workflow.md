---
name: gitlab-workflow
description: "GitLab workflow — branch policy, MR process, worktrees, CI/CD, wiki-first docs, forbidden patterns."
triggers:
  - pattern: "gitlab|merge.*request|MR|branch|pipeline|ci"
    priority: critical
  - pattern: "worktree|wiki|issue|milestone|label"
    priority: high
  - pattern: "commit|push|tag|release|deploy"
    priority: medium
allowed-tools:
  - Read
  - Bash
---

# GitLab Workflow

## Source of Truth Rules

| What | Where | NOT Here |
|------|-------|----------|
| Issues & MRs | GitLab | Nowhere else |
| Documentation | GitLab Wiki | `.md` files in repos |
| TODOs | GitLab Issues | Comments, code |
| Discussions | MR threads / Issue comments | Slack, email |

## Branch Flow

```
{issue#}-{slug} → MR → release/v0.X.x → MR → main → CI → tag
```

### Branch Naming
| Pattern | Use |
|---------|-----|
| `feature/{issue#}-{slug}` | Features (MUST include issue#) |
| `bugfix/{slug}` | Bug fixes |
| `hotfix/{slug}` | Critical fixes |
| `release/v{major}.{minor}.x` | Release branches |

### FORBIDDEN Branch Names
`development`, `dev`, `master`, `test/*`

## MR Process (Step by Step)

1. **Find or create Issue** — search for duplicates first
2. **Assign** to service account, set Milestone, add labels
3. **Create MR from Issue page** (GitLab UI, NOT CLI — this auto-creates branch)
4. GitLab creates branch: `{issue#}-{slug}`
5. **Create worktree**:
   ```bash
   DATE=$(date +%Y-%m-%d)
   cd project-name && git fetch origin
   git worktree add ../.worktrees/$DATE/project-name/{issue#}-{slug} {issue#}-{slug}
   cd ../.worktrees/$DATE/project-name/{issue#}-{slug}
   ```
6. Make changes, commit with `Refs: #123`, push
7. MR targets `release/v0.X.x` (NEVER main)
8. Merge when CI passes + approvals satisfied
9. Promotion: `release/v0.X.x` → MR → `main` → CI → tag

## Worktree Rules

| DO | DON'T |
|----|-------|
| `git worktree add` for new work | `git stash` in main repos |
| Work in `.worktrees/{date}/{project}/{branch}/` | `git reset --hard` |
| Clean up stale worktrees weekly | Switch branches in main repos |
| Use `buildkit workspace worktree cleanup` | `git checkout` in main repo dir |

### Worktree Layout
```
.worktrees/
└── 2026-02-23/
    ├── agent-buildkit/
    │   └── 123-fix-router-bug/
    └── platform-agents/
        └── 456-add-new-scanner/
```

## Forbidden in Repos

| Item | Why | Alternative |
|------|-----|-------------|
| `.sh` / `.bash` / `.zsh` files | Shell scripts forbidden | TypeScript services or BuildKit CLI |
| `scripts/` directories | No script dirs | `agent-buildkit` commands or `tmp/` |
| `.md` files (except CHANGELOG) | Docs in Wiki only | GitLab Wiki |
| `docs/` directories | Same as above | GitLab Wiki |

## CI/CD Patterns

### Pipeline Structure
```yaml
stages:
  - validate
  - test
  - build
  - security
  - deploy

include:
  - component: blueflyio/gitlab_components/lint@main
  - component: blueflyio/gitlab_components/test@main
  - component: blueflyio/gitlab_components/security-scan@main
```

### Reusable Components
| Component | Purpose |
|-----------|---------|
| `lint` | ESLint, phpcs, yamllint |
| `test` | Unit + integration tests |
| `security-scan` | SAST, dependency scanning, secret detection |
| `docker-build` | Build + push container images |
| `deploy-k8s` | K8s deployment with rollback |
| `wiki-publish` | Auto-publish wiki updates |

## GitLab Tokens

| Token | Scope | Use |
|-------|-------|-----|
| `GITLAB_TOKEN` | API access | BuildKit CLI, MCP servers |
| `CI_JOB_TOKEN` | Pipeline | CI/CD jobs (auto-provided) |
| `DEPLOY_TOKEN` | Registry | Container/npm registry access |

## Key Commands

```bash
# Via BuildKit (preferred)
buildkit gitlab issue list
buildkit gitlab mr status
buildkit gitlab pipeline status
buildkit gitlab wiki publish
buildkit gitlab wiki search "topic"

# Via glab CLI
glab issue list
glab issue view 123
glab mr create --fill
glab mr list --reviewer @me
glab ci status
glab ci trace
```

## Commit Message Format

```
Short summary (imperative, <72 chars)

Optional longer description explaining the what and why.

Refs: #123
```

- Always include `Refs: #123` linking to the GitLab issue
- Use imperative mood: "Add feature" not "Added feature"
- Keep summary under 72 characters
- Separate summary from body with blank line

## Version Authority

```
HUMAN (milestone) → CI PIPELINE (semantic-release) → GIT TAG (output)
```

AI Agents are READ-ONLY for all version information:
- Read package.json to understand current version
- NEVER modify version fields
- NEVER create git tags
- NEVER run `npm version` commands
