---
name: buildkit-cli
description: "BuildKit CLI reference — 16 command groups, workflows, configuration, environment variables."
triggers:
  - pattern: "buildkit|bk|cli.*command|agent.*command"
    priority: critical
  - pattern: "workspace.*status|golden.*optimize|marketplace"
    priority: high
  - pattern: "how.*do.*i|what.*command|run.*build"
    priority: medium
allowed-tools:
  - Read
  - Bash
---

# BuildKit CLI

## Overview

`buildkit` (alias `bk`) is the single CLI for all platform operations. It imports from `@bluefly/agent-*` packages — never write shell scripts when BuildKit has a command.

**Package**: `@bluefly/agent-buildkit`
**GitLab**: `blueflyio/agent-platform/agent-buildkit`

## All 16 Command Groups

| Group | Purpose | Example |
|-------|---------|---------|
| `agents` | Agent lifecycle (list, spawn, search, marketplace) | `buildkit agents list` |
| `fleet` | Fleet change control plane | `buildkit fleet status` |
| `deploy` | Service deployment | `buildkit deploy service agents-api` |
| `observe` | Observability (metrics, cost, DORA, traces) | `buildkit observe dora` |
| `gkg` | Global Knowledge Graph queries | `buildkit gkg search "security"` |
| `gitlab` | GitLab operations (issues, MRs, wiki, CI) | `buildkit gitlab mr status` |
| `drupal` | Drupal sync and management | `buildkit drupal sync` |
| `workspace` | Workspace status, risk analysis, cleanup | `buildkit workspace status` |
| `golden` | Optimization recommendations | `buildkit golden optimize` |
| `docker` | Container operations | `buildkit docker build agents-api` |
| `k8s` | Kubernetes operations | `buildkit k8s pods -n bluefly-agents` |
| `tailscale` | Network mesh operations | `buildkit tailscale status` |
| `minio` | Object storage operations | `buildkit minio ls bluefly-artifacts` |
| `config` | Configuration management | `buildkit config show` |
| `init` | Project initialization | `buildkit init agent` |
| `help` | Command help | `buildkit help agents` |

## Common Workflows

### Agent Operations
```bash
# Discover agents
buildkit agents list
buildkit agents search --domain security
buildkit agents search --description "scan vulnerabilities"

# Spawn agent
buildkit agents spawn vulnerability-scanner
buildkit agents spawn --dry-run code-reviewer

# Marketplace
buildkit agents marketplace list
buildkit agents marketplace validate <agentId>
buildkit agents marketplace sync <agentId>
buildkit agents marketplace publish <agentId>
```

### Fleet Operations
```bash
# Status
buildkit fleet status
buildkit fleet status --service agents-api

# Change control
buildkit fleet change describe "Update scanner to v2.1"
buildkit fleet change classify <change-id>
buildkit fleet change approve <change-id>
buildkit fleet change rollout <change-id>

# Recipes
buildkit fleet recipe list
buildkit fleet recipe create --agent vulnerability-scanner --trigger "on:mr"
buildkit fleet recipe apply <recipe-id>

# Monitoring
buildkit fleet pulse --watch
```

### Workspace Operations
```bash
# Status (most used command)
buildkit workspace status
buildkit workspace status --risk-analysis
buildkit workspace status --verbose

# Cleanup
buildkit workspace cleanup           # Remove stale worktrees
buildkit workspace cleanup --dry-run # Preview cleanup

# Golden path optimization
buildkit golden optimize
buildkit golden optimize --scope agents
```

### Drupal Operations
```bash
# Sync custom code to Drupal site
buildkit drupal sync

# Validate Drupal coding standards
buildkit drupal lint

# Generate module scaffold
buildkit drupal module create my_module
```

### GitLab Operations
```bash
# Issues
buildkit gitlab issue list
buildkit gitlab issue create --title "Bug fix" --labels bug

# Merge Requests
buildkit gitlab mr status
buildkit gitlab mr create --fill

# Wiki
buildkit gitlab wiki search "deployment"
buildkit gitlab wiki publish
buildkit gitlab wiki list

# CI/CD
buildkit gitlab pipeline status
buildkit gitlab pipeline trigger
```

### Observability
```bash
# DORA metrics
buildkit observe dora --window 30d

# Cost tracking
buildkit observe cost --today
buildkit observe cost --month
buildkit observe cost --project 30d

# Traces
buildkit observe traces --agent code-reviewer --window 1h

# Alerts
buildkit observe alerts --active
```

## Configuration

### Config File
Location: `~/.buildkit/config.yml` or `$BUILDKIT_CONFIG`

```yaml
gitlab:
  host: https://gitlab.com
  token: ${GITLAB_TOKEN}
platform:
  api: https://agents.blueflyagents.com
  mcp: https://mcp.blueflyagents.com
storage:
  minio:
    endpoint: https://storage.blueflyagents.com
    bucket: bluefly-artifacts
paths:
  worktrees: ../.worktrees
  wikis: /Volumes/AgentPlatform/applications/Wikis
```

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `GITLAB_TOKEN` | GitLab API access |
| `BUILDKIT_CONFIG` | Config file path override |
| `FLEET_BUDGET_DAILY_USD` | Daily fleet spend cap |
| `VAST_BUDGET_HOURLY_USD` | GPU hourly cap |
| `LITELLM_BUDGET_MONTHLY_USD` | LLM API monthly cap |
| `MINIO_ACCESS_KEY` | MinIO credentials |
| `MINIO_SECRET_KEY` | MinIO credentials |

## Worktree Layout

BuildKit manages worktrees at:
```
.worktrees/
└── {YYYY-MM-DD}/
    └── {project-name}/
        └── {issue#}-{slug}/
            └── ... (working copy)
```

```bash
# Create worktree (via BuildKit)
buildkit workspace worktree create --project agent-buildkit --branch 123-fix-bug

# List worktrees
buildkit workspace worktree list

# Clean stale worktrees (>7 days with no uncommitted changes)
buildkit workspace worktree cleanup
```
