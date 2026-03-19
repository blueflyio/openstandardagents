---
name: ide-supercharger-ref
description: "IDE power tools — BuildKit integration, MCP servers, workspace management, debug workflows."
triggers:
  - pattern: "ide|cursor|vscode|code.*server|workspace"
    priority: critical
  - pattern: "mcp.*server|mcp.*config|debug|terminal"
    priority: high
  - pattern: "snippet|shortcut|productivity|workflow"
    priority: medium
allowed-tools:
  - Read
  - Bash
---

# IDE & Developer Tools Reference

## IDE Setup

### Cursor (Primary)
MCP config: `~/.cursor/mcp.json`
```json
{
  "mcpServers": {
    "bluefly-mcp": {
      "transport": "sse",
      "url": "https://mcp.blueflyagents.com/sse"
    },
    "bluefly-gkg": {
      "transport": "sse",
      "url": "https://gkg.blueflyagents.com/sse"
    },
    "wikis": {
      "command": "node",
      "args": ["${HOME}/.mcp/wikis-mcp-server/index.js"]
    }
  }
}
```

### VS Code (Code Server on NAS)
- **URL**: https://code.blueflyagents.com (port 8080 on NAS)
- **Use**: Remote editing when away from workstation
- Extensions: ESLint, Prettier, GitLens, PHP Intelephense, Drupal syntax

### Claude Code
- Plugins loaded from `.claude/plugins/`
- This plugin: `bluefly-agent-platform`
- Skills, commands, agents, hooks all active

## MCP Servers (3 Active)

### bluefly-mcp (Platform MCP)
- **Transport**: SSE
- **URL**: https://mcp.blueflyagents.com/sse
- **Capabilities**: Agent spawn, fleet status, service health, pipeline operations
- **Tools**: `spawn_agent`, `fleet_status`, `service_health`, `pipeline_run`, `observe_metrics`

### bluefly-gkg (Knowledge Graph)
- **Transport**: SSE
- **URL**: https://gkg.blueflyagents.com/sse
- **Capabilities**: Semantic search, entity lookup, relationship traversal
- **Tools**: `search`, `get_entity`, `traverse`, `related_entities`

### wikis (Local Wiki Server)
- **Transport**: stdio (local Node.js)
- **Command**: `node ${HOME}/.mcp/wikis-mcp-server/index.js`
- **Capabilities**: Wiki search across all 63 repos, page CRUD
- **Tools**: `wiki_search`, `wiki_read`, `wiki_list`

## Workspace Structure

```
~/Sites/blueflyio/                  → Root workspace
├── agent-buildkit/                 → CLI repo
├── platform-agents/                → Agent manifests
├── common_npm/                     → 18 TypeScript packages
│   ├── agent-router/
│   ├── agent-mesh/
│   ├── agent-brain/
│   ├── agent-tracer/
│   ├── agent-docker/
│   ├── agent-tailscale/
│   ├── agent-protocol/
│   ├── workflow-engine/
│   ├── foundation-bridge/
│   ├── compliance-engine/
│   ├── agentic-flows/
│   ├── studio-ui/
│   └── ... (18 total)
├── all_drupal_custom/              → Drupal custom code
├── demo_llm-platform/              → Drupal DDEV site
├── gitlab_components/              → CI/CD components
├── security-policies/              → Cedar policies
├── api-schema-registry/            → API schemas
├── WIKIs/                          → Local wiki clones
├── .worktrees/                     → Git worktrees
│   └── 2026-02-23/
│       ├── agent-buildkit/
│       │   └── 123-fix-router/
│       └── platform-agents/
│           └── 456-add-scanner/
└── config/                         → Local config
    ├── cloudflare/
    └── tailscale/
```

## BuildKit Integration

BuildKit is the primary CLI — use before writing custom scripts:

```bash
# Quick status
buildkit workspace status
buildkit workspace status --risk-analysis

# Agent operations
buildkit agents list
buildkit agents spawn vulnerability-scanner

# Fleet management
buildkit fleet status
buildkit fleet pulse --watch

# Optimization check
buildkit golden optimize
```

## Debug Workflows

### Agent Not Responding
```bash
# 1. Check health
curl -sk https://{agent}.blueflyagents.com/health

# 2. Check K8s pod
kubectl get pods -n bluefly-agents -l app={agent}
kubectl logs -n bluefly-agents -l app={agent} --tail=100

# 3. Check mesh routing
curl https://mesh.blueflyagents.com/api/routes | jq '.[] | select(.agent=="{agent}")'

# 4. Check Cloudflare tunnel
kubectl logs -n cloudflared -l app=cloudflared --tail=50 | grep {agent}

# 5. Check A2A telemetry
curl "https://a2a-collector.blueflyagents.com/api/events?agent={agent}&window=1h"
```

### Pipeline Failure
```bash
# 1. Get pipeline status
glab ci status
buildkit gitlab pipeline status

# 2. View failing job log
glab ci trace

# 3. Check for SoD violations
curl "https://compliance.blueflyagents.com/api/audit?type=gate_decision&status=deny&window=1h"

# 4. Retry if transient
glab ci retry
```

### Drupal Issues
```bash
# 1. Check logs
cd demo_llm-platform && ddev drush watchdog-show --count=50

# 2. Rebuild cache
ddev drush cr

# 3. Check config status
ddev drush cst

# 4. Re-sync custom code
buildkit drupal sync

# 5. Update database
ddev drush updb
```

## Worktree Management

```bash
# Create for new work
DATE=$(date +%Y-%m-%d)
cd project-name && git fetch origin
git worktree add ../.worktrees/$DATE/project-name/{issue#}-{slug} {issue#}-{slug}

# List active worktrees
git worktree list

# Clean stale worktrees
buildkit workspace worktree cleanup
# or manually:
git worktree prune

# Remove specific worktree
git worktree remove ../.worktrees/2026-02-20/agent-buildkit/123-old-branch
```

## Environment Variables

| Variable | Purpose | Where Set |
|----------|---------|-----------|
| `GITLAB_TOKEN` | GitLab API access | Shell profile / CI |
| `GRAFANA_TOKEN` | Grafana API access | Shell profile |
| `MINIO_ACCESS_KEY` | MinIO S3 access | Shell profile |
| `MINIO_SECRET_KEY` | MinIO S3 secret | Shell profile |
| `TAILSCALE_AUTHKEY` | Tailscale join key | CI variables |
| `VAST_API_KEY` | Vast.ai GPU access | CI variables |
| `LITELLM_API_KEY` | LLM gateway access | CI variables |
| `BUILDKIT_CONFIG` | BuildKit config path | `~/.config/buildkit/config.yaml` |
