# AI Assistant Instructions

**This file is a pointer. The rules are in AGENTS.md. The bible is OWNERSHIP.md.**

## BEFORE YOU DO ANYTHING

1. **Read [`OWNERSHIP.md`](./OWNERSHIP.md)** — the BIBLE. Platform ownership, separation of duties, authority map, deployed sites, decision tree. If anything changes during your session, UPDATE OWNERSHIP.md.
2. **Read [`AGENTS.md`](./AGENTS.md)** — how to build. Rules, commands, patterns, prohibitions. This is what you follow.
3. **Read [`plans/01-bluefly-platform-map/`](./plans/01-bluefly-platform-map/)** — what exists. Project inventory, service architecture, dependencies.
4. **Read NAS docs** — `/Volumes/AgentPlatform/config/`, `/Volumes/AgentPlatform/applications/Wikis/`, `/Volumes/AgentPlatform/storage/Research/`

If you haven't read 1-3, you WILL duplicate work, break ownership boundaries, or create something that already exists. STOP and read them.

## Paths

- Workspace: `$HOME/Sites/blueflyio` (no hardcoded `/Users/...`)
- NAS Mac mount: `/Volumes/AgentPlatform/`
- NAS SSH: `/volume1/AgentPlatform/`
- Bare repos: `$HOME/Sites/blueflyio/__BARE_REPOS/`
- Worktrees: `$HOME/Sites/blueflyio/worktrees/`
- Plans: `$HOME/Sites/blueflyio/plans/`
- Tokens: `~/.tokens/<service-name>` and `/Volumes/AgentPlatform/config/tokens` (NAS)

## Quick Reference

- [`llms.txt`](./llms.txt) — full platform context (on demand)
- [`ai.json`](./ai.json) — machine-readable service catalog, modules, protocols, access policy, **dependency standards**
- [`.mcp.json`](./.mcp.json) — MCP server configuration
- NAS config: `/Volumes/AgentPlatform/config/AGENTS.md`
- Wikis: `/Volumes/AgentPlatform/applications/Wikis/`

## BuildKit

Install from registry: `npm install -g @bluefly/agent-buildkit` (see wiki BuildKit-Operating-Model). No local clone required for normal use; clone only when developing BuildKit itself.

## Control Primitives

Source of truth: **ai.json → control_primitives** (run order: **control_primitives.run_order**). Full health: `node run-validations.mjs` [--json] (root). Alternative: `ossa workspace validate` if OSSA CLI installed (uses same run_order).

- `node run-validations.mjs` [--json] — run all validators in run_order; single entry for full workspace health
- `node .agents-workspace/validate.mjs` — full workspace health (repos, worktrees, DRY, root files, project layout)
- `node .agents-workspace/validate.mjs --json` — machine-readable
- `node .agents-workspace/validate-deps.mjs` — dependency compliance (ai.json dependency_standards)
- `node .agents-workspace/validate-deps.mjs --fix-report` — npm converge commands
- `node .agents-workspace/validate-project-layout.mjs` — per-project canonical layout (OWNERSHIP.md)
- `node .agents-workspace/scaffold-project-layout.mjs <path>` — create .agents/ and docs/ in one project
- `node .agents-workspace/validate-three-layer.mjs` — OSSA three-layer (workspace_semantics, spec docs, plans/ossa-three-layer/)
- `node .agents-workspace/check-ownership.mjs <service> <concern>` — ownership boundary check
- `node .agents-workspace/workspace-status.mjs` [--json] — read-only status from ai.json
- GKG MCP: `gkg.blueflyagents.com/mcp/sse` — cross-repo code intelligence. **MANDATORY before modifying shared code.**

## Skills packaging (same as agents: build once, all formats and tools)

- **Source**: `worktrees/ai-marketplace/skills/` — each subdir with `SKILL.md` is one skill.
- **Local**: `cd worktrees/ai-marketplace && npm run package:skills` — writes `dist/skills/*.skill` (zip). Uses system `zip`; no Python required.
- **CI**: ai-marketplace pipeline job `package_skills` runs the same script and publishes `dist/skills/*.skill` as artifacts. MR and main/release branches.
- **Consumers**: Cursor, Claude Code, Skills API, marketplace. Single build produces .skill files for all.
- **Authority**: `ai.json` → `control_primitives.package_skills`.
