---
name: bluefly-agent-platform
description: Specialized skill for AI assistants working within the Bluefly.io Agent Platform ecosystem. Use when working with OSSA agent manifests, common_npm packages (@bluefly/agent-*), GitLab workflows, BuildKit CLI, Kubernetes infrastructure, or platform-wide tooling. Triggers on platform-agents, agent-buildkit, common_npm, worktrees, GitLab issues/MRs, OSSA compliance, separation of duties, Vast.ai, Tailscale, Cloudflare Tunnel, or BuildKit/MCP/GitLab as primary tools. For Drupal-specific work (modules, themes, recipes, hooks, OSSA-Drupal extension) also use the drupal skill.
---

# Bluefly Agent Platform

Procedural knowledge for working within the Bluefly.io LLM Platform ecosystem.

## Architecture: Three-Tier OSSA

```
Tier 1: platform-agents/         → Agent manifests ONLY (YAML)
Tier 2: common_npm/agent-*       → Infrastructure packages (TypeScript)
Tier 3: gitlab-agent_ossa/       → Platform implementation (Go)
```

## Critical Rules

### NEVER Do
- Touch versions, create tags, or run `npm version`
- Commit to `main` or `release/v*` directly
- Create `.md` files in repos (use GitLab Wiki)
- Create new GitLab issues without searching duplicates first
- Use `any` type in TypeScript
- Create services in `platform-agents` or `agent-buildkit`
- Duplicate code from `common_npm` packages
- Edit `demo_llm-platform/web/` (Composer-managed)
- Run `git init` in container directories (`common_npm/`, `models/`, `all_drupal_custom/`)
- Switch branches in main repos (use worktrees)

### ALWAYS Do
- Use git worktrees: `.worktrees/{date}/{project}/{issue#}-{slug}/`
- Create MRs from GitLab Issue page (not CLI)
- Target MRs to `release/v0.X.x` (never main)
- Import services from `@bluefly/agent-*` packages
- Use BuildKit CLI before writing scripts
- Reference issues in commits: `Refs: #123`
- Run tests before pushing

## Where to Build What

```
Service/Business Logic?
  ├─ Routing/Discovery → @bluefly/agent-router
  ├─ Agent Communication → @bluefly/agent-mesh
  ├─ Vector/Search/RAG → @bluefly/agent-brain
  ├─ Tracing/Observability → @bluefly/agent-tracer
  ├─ Docker/K8s → @bluefly/agent-docker
  ├─ Tailscale/Network → @bluefly/agent-tailscale
  ├─ Workflows/State → @bluefly/workflow-engine
  ├─ MCP/Protocol → @bluefly/agent-protocol
  ├─ LLM Providers → @bluefly/foundation-bridge
  ├─ Compliance/Audit → @bluefly/compliance-engine
  └─ Orchestration → @bluefly/agentic-flows

CLI Command? → agent-buildkit (imports from common_npm)
Agent Definition? → platform-agents/packages/@ossa/
React UI? → @bluefly/studio-ui
CI/CD Pipeline? → gitlab_components
API Schema? → api-schema-registry
Security Policy? → security-policies
Documentation? → technical-docs (GitLab Wiki)
Drupal Code? → all_drupal_custom/ (NEVER llm-platform/web/)
```

## GitLab Workflow

**Branch Flow**: `{issue#}-{slug}` → MR → `release/v0.X.x` → MR → `main` → CI → tag

### Steps
1. Pick existing Issue (close duplicates)
2. Assign to service account, set Milestone, add labels
3. Create MR from Issue page (GitLab UI)
4. GitLab creates branch: `{issue#}-{slug}`
5. Create worktree:
   ```bash
   DATE=$(date +%Y-%m-%d)
   cd project-name && git fetch origin
   git worktree add ../.worktrees/$DATE/project-name/{issue#}-{slug} {issue#}-{slug}
   cd ../.worktrees/$DATE/project-name/{issue#}-{slug}
   ```
6. Make changes, commit with `Refs: #123`, push
7. MR targets `release/v0.X.x`
8. Merge when CI passes + approvals satisfied
9. Promotion: `release/v0.X.x` → MR → `main` → CI → tag

### Branch Naming
- `feature/{issue#}-{slug}` - Features (MUST include issue#)
- `bugfix/{slug}` - Bug fixes
- `hotfix/{slug}` - Critical fixes
- `release/v{major}.{minor}.x` - Release branches
- FORBIDDEN: `development`, `dev`, `master`, `test/*`

## Key Directories

| Path | Type | Purpose |
|------|------|---------|
| `agent-buildkit/` | Git repo | Core CLI orchestration |
| `platform-agents/` | Git repo | OSSA agent manifests ONLY |
| `common_npm/` | Container | 18 TypeScript packages (each is git repo) |
| `all_drupal_custom/` | Container | Drupal modules/themes/recipes |
| `demo_llm-platform/` | Git repo | Drupal platform (DDEV) |
| `.worktrees/` | Active work | `{date}/{project}/{issue-branch}/` |
| `WIKIs/` | Local clone | Project documentation |

## Local ↔ GitLab Mapping

| Local | GitLab |
|-------|--------|
| `agent-buildkit/` | `blueflyio/agent-platform/agent-buildkit` |
| `demo_llm-platform/` | `blueflyio/agent-platform/llm-platform` |
| `platform-agents/` | `blueflyio/platform-agents` |
| `gitlab_components/` | `blueflyio/gitlab_components` |
| `technical-docs/` | `blueflyio/agent-platform/technical-docs` |

## Tools (Primary Interfaces)

| Tool | Purpose |
|------|---------|
| **BuildKit CLI** | Agent marketplace, spawn, Drupal sync, workspace status. Use before writing custom scripts. |
| **MCP** | Servers (agent-protocol, agent-brain, agent-router, agent-mesh, gitlab, wikis) configured in `.mcp.json` (project) or `~/.cursor/mcp.json` (Cursor). Building new MCP servers: use **mcp-builder** skill. |
| **GitLab** | Issues, MRs, Wiki. Create MRs from Issue page; target `release/v0.X.x`. No docs in repo. |
| **Claude Code plugins** | Commands and skills via plugins (e.g. ide-supercharger power-tools). |

## Related Skills

| When | Use this skill |
|------|----------------|
| Drupal modules, themes, recipes, hooks, OSSA-Drupal extension, `buildkit drupal sync` | **drupal** |
| Building or designing a new MCP server (TypeScript/Python) | **mcp-builder** |
| Creating or improving a skill, running evals | **skill-creator** |

## BuildKit Commands

```bash
# Agent Marketplace
buildkit agents marketplace list
buildkit agents marketplace validate <agentId>
buildkit agents marketplace sync <agentId>

# Agent Management
buildkit agents list
buildkit agents spawn <agentId>
buildkit agents search --description "task"

# Optimization
buildkit golden optimize          # Check if agents should be used
buildkit workspace status --risk-analysis

# Drupal
buildkit drupal sync              # Sync all_drupal_custom → llm-platform/web
```

## Infrastructure

| Component | Details |
|-----------|---------|
| **Vast.ai** | Instance `29484611` (RTX 4090), scaling in `@bluefly/agent-router` |
| **Cloudflare Tunnel** | ID `f6da7bdf-...`, config `~/.cloudflared/config.yml` |
| **Synology NAS** | `192.168.68.54`, MinIO:9000, webhooks:3001, mesh:3005 |
| **Tailscale** | `tailcf98b3.ts.net`, Mac M4: `100.108.129.7` |

### Endpoints
| Hostname | Service |
|----------|---------|
| `api.blueflyagents.com` | GitLab webhooks (3001) |
| `mesh.blueflyagents.com` | Agent mesh API (3005) |
| `storage.blueflyagents.com` | MinIO S3 (9000) |

## Agent Role Separation

| Agent | Role | Tier | Conflicts With |
|-------|------|------|----------------|
| `vulnerability-scanner` | Analyzer | tier_1_read | Executor, Approver |
| `merge-request-reviewer` | Reviewer | tier_2_write | Executor, Approver |
| `pipeline-remediation` | Executor | tier_3_full | Reviewer, Approver |
| `release-coordinator` | Orchestrator | tier_2_write | Executor (direct) |

**Rule**: Agents cannot review/approve their own work. Executor → Reviewer handoff in same chain is forbidden.

## Port Allocation

| Range | Purpose |
|-------|---------|
| 3000-3015 | Agent services (brain, chat, mesh, router, tracer, etc.) |
| 4000 | LiteLLM gateway |
| 5000-5003 | ML models |
| 5432, 6379, 27017 | PostgreSQL, Redis, MongoDB |
| 6333 | Qdrant vector DB |
| 9090 | Prometheus |

## Drupal Workflow

1. Edit source: `all_drupal_custom/modules/`
2. Run: `buildkit drupal sync`
3. Test in: `demo_llm-platform/`
4. Commit in `all_drupal_custom/` repos
5. **NEVER** edit `demo_llm-platform/web/` directly

## Safety Classifications

- 🟢 **SAFE**: Reading files, running tests, creating worktrees, feature branches
- 🟡 **PROTECTED**: Modifying package.json, CI/CD, creating MRs
- 🔴 **HIGH RISK**: Version fields, git tags, protected branches, production deploys

## References

- **Separation of Duties**: See `references/separation-of-duties.md`
- **Agent Registry**: See `references/agent-registry.md`
- **Package Ownership**: See `references/package-ownership.md`
- **Developer onboarding** (tools, skills, plugins): GitLab Wiki (e.g. developer-experience/onboarding-tools-skills-plugins).

## Version Authority

```
HUMAN (milestone) → CI PIPELINE (semantic-release) → GIT TAG (output)

AI Agents: READ-ONLY for all version information
- Read package.json to understand current version
- NEVER modify version fields
- NEVER create git tags
- NEVER run npm version commands
```
