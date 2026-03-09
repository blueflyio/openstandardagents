---
name: bluefly-platform
description: Use BlueFly Agent Platform config and endpoints. Reads from /Volumes/AgentPlatform/config when mounted; otherwise use workspace config-templates and public URLs.
metadata:
  short-description: Platform config, MCP/GKG URLs, worktrees, BuildKit
triggers:
  - pattern: "worktrees|bare repos|MCP|GKG|bluefly|agent platform"
    priority: high
  - pattern: "config.*NAS|endpoints|Tailscale|oracle"
    priority: medium
---

# BlueFly Platform Context

Use this skill when the user is working in the BlueFly Agent Platform workspace or asks about worktrees, MCP, GKG, A2A, or infrastructure endpoints. Config is authoritative at **/Volumes/AgentPlatform/config** when the NAS volume is mounted; otherwise use workspace `config-templates/` and the public URLs below.

## Config locations

- **NAS config (when mounted):** `/Volumes/AgentPlatform/config`
  - `config.json` – paths, infrastructure, tunnel routes
  - `workspace.json` – workspace and project layout
  - `nas-infrastructure-reference.json` – Tailscale hosts, MCP, GKG, A2A, Grafana, ops dashboard
  - `agents.yaml` – repo guidelines, architecture, OSSA agents
- **User config:** `~/.agent-platform/<project>/config.json` (e.g. agent-buildkit, ide-supercharger)
- **Workspace fallback:** `config-templates/nas-infrastructure-reference.json` in the blueflyio repo

## Public endpoints (no NAS required)

| Service | URL |
|---------|-----|
| MCP (SSE) | https://mcp.blueflyagents.com/api/mcp/sse |
| GKG | https://gkg.blueflyagents.com |
| Agent Mesh | https://mesh.blueflyagents.com |
| Grafana | https://grafana.blueflyagents.com |
| A2A stream | https://dashboard.mcp.blueflyagents.com/a2a/stream or https://a2a-stream.blueflyagents.com/a2a/stream |

## Tailscale (when on VPN)

- **Oracle (primary connector):** oracle-platform.tailcf98b3.ts.net – GKG/MCP local, SSH `opc@oracle-platform.tailcf98b3.ts.net`
- **NAS (backup):** blueflynas.tailcf98b3.ts.net – GKG backup `:27495`, A2A stream `:9001/a2a/stream`
- **Operator console:** bluefly-m4.tailcf98b3.ts.net – mosh + tmux session `a2a`

## Workspace layout (do not get wrong)

- **Bare repos:** `~/Sites/blueflyio/__BARE_REPOS/` – source of truth; create worktrees from here.
- **Worktrees:** `~/Sites/blueflyio/worktrees/` – all worktrees. Safe to remove when every change and stash is pushed and the tree is clean.
- **Testing demos:** `~/Sites/blueflyio/TESTING_DEMOS/` – for testing only.
  - **Modules (git repos):** `TESTING_DEMOS/DEMO_SITE_drupal_testing/web/modules/custom/` – each subdir is a git repo.
  - **Themes (git repos):** `TESTING_DEMOS/DEMO_SITE_drupal_testing/web/themes/custom/` – e.g. `agentic_canvas_theme`.
  - **recipe_onboarding** is a module but for this project it lives in **web/themes/custom/** (not modules/custom). Workflow: push and merge from the recipe_onboarding repo, then pull into `web/themes/custom/` (and into `web/modules/custom/` if you also use it there). Keep themes/custom in sync after merge.
- **Working demos:** `~/Sites/blueflyio/WORKING_DEMOs/` – production-like demos (e.g. Drupal_AgentDash, openstandardagents.org).

## Worktrees and CLI

- **BuildKit:** `buildkit <command> --help` – config, gitlab, flow, worktrees, projects, nas, etc.
- **Setup (one-time):** `buildkit setup` seeds `~/.agent-platform/`

## Ops dashboard (tmux)

When NAS is reachable, A2A live stream in tmux:
- `curl -N http://blueflynas.tailcf98b3.ts.net:9001/a2a/stream | jq -C .`
- Session name: `a2a`; layout from `nas-infrastructure-reference.json` -> `opsDashboard.tmux`

## Rules

- Branch from `release/*` only; never commit to `main` or `release/*` directly.
- No `.sh` scripts; use BuildKit CLI or TypeScript.
- Documentation and TODOs go to GitLab Wiki and Issues, not local markdown in repos.
- NAS is backup; primary services run on the tunnel connector (Oracle). Use public URLs for MCP/GKG when possible.
