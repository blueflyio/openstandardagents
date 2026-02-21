# Agents Workspace and Project Registry

This document defines the **`.agents-workspace/`** directory as the **project-level decentralized agent registry**: how to discover all agents in the project and subagents, connect to company/department/team registries via MCP and auth, and use A2A for agent-to-agent communication.

See also [Agent Definition](agent-definition.md) for the distinction between `.agents/` (per-agent runtime) and `.agents-workspace/` (registry and optional transient data).

## Purpose

- **Discovery**: One place to discover every agent available to the project (local agents under `.agents/` plus agents from remote registries).
- **Hierarchy**: Project registry can pull from parent or peer registries (company, department, team) using MCP and authentication.
- **Communication**: After discovery, runtimes resolve an agent's A2A endpoint and use **A2A** for all agent-to-agent traffic.

So: **MCP is used to discover and pull registry data; A2A is used to talk to agents.**

## Directory Structure

```
.agents-workspace/
├── registry.yaml              # Project registry index (local agents, sources, scopes)
├── registry.schema.json       # Optional: use spec/registry/project-registry.schema.json
├── sources/                   # Remote registry connections (MCP + auth config)
│   ├── company.yaml           # Company registry endpoint + auth ref
│   ├── department-eng.yaml
│   ├── team-platform.yaml
│   └── ...
├── cache/                     # Local cache of pulled metadata (optional, .gitignore)
│   └── {source-id}/
│       └── agents.json        # Cached agent list/cards from that source
├── scopes/                    # Scope hierarchy (company > department > team > project)
│   ├── company.json           # Resolved company agents (refs only)
│   ├── department.json
│   ├── team.json
│   └── project.json           # This repo's agents (from .agents/)
└── mcp/                       # MCP server configs for registry discovery
    ├── servers.yaml           # MCP servers used for "list agents" / "get card"
    └── auth/                  # Auth material refs (tokens, certs) – .gitignore
```

## registry.yaml

The project registry index declares local agents and remote registry sources.

| Field | Purpose |
|-------|--------|
| `version` | Format version (e.g. `"1.0"`). |
| `project` | Project identity (name, namespace). |
| `local` | Agents defined in this repo; each entry has `name` and `path` (e.g. `.agents/my-agent`). |
| `sources` | Remote registries to pull from: `id`, `type` (e.g. `mcp`), `endpoint`, `auth` ref, `scope`. |
| `resolution_order` | Order for resolving names when the same agent appears in multiple scopes (e.g. `[project, team, department, company]`; first wins). |

### Example

```yaml
version: "1.0"
project:
  name: my-product
  namespace: acme-team

local:
  - name: my-agent
    path: .agents/my-agent
  - name: worker-x
    path: .agents/worker-x

sources:
  - id: company
    type: mcp
    endpoint: https://agents.acme.com/mcp
    auth: ref:company-token
    scope: company
  - id: department-eng
    type: mcp
    endpoint: https://eng.acme.com/agent-registry/mcp
    auth: ref:dept-token
    scope: department
  - id: team-platform
    type: mcp
    endpoint: https://platform.acme.com/registry/sse
    auth: ref:team-token
    scope: team

resolution_order: [project, team, department, company]
```

## Scopes and Resolution

- **Project**: This repository's agents (from `.agents/`), listed in `registry.yaml` under `local`.
- **Team / Department / Company**: Remote registries; the project registry **pulls** their agent lists (and optionally agent cards) via MCP and merges them.
- **Resolution order**: When the same agent name appears in multiple scopes, `resolution_order` defines which scope wins (e.g. project overrides team over department over company).

## MCP and A2A

- **MCP (for registry)**  
  Each registry (company, department, team, project) can expose MCP methods such as "list agents", "get agent card", "resolve agent by name". The project's `.agents-workspace/sources/*` point at those MCP endpoints; auth (tokens or certs) is configured per source. A registry client (e.g. BuildKit or a small CLI) calls these methods, merges results, and may cache under `.agents-workspace/cache/`.

- **A2A (for communication)**  
  After discovery, runtimes resolve an agent's A2A endpoint (from agent card or manifest). All agent-to-agent traffic (tasks, messages) uses A2A.

## Version Control

- **Version-controlled**: `registry.yaml`, `sources/*.yaml`, optional `registry.schema.json`, and MCP server config (e.g. `mcp/servers.yaml`) so the team can share registry shape and source definitions.
- **Not version-controlled**: `cache/`, `mcp/auth/`, and any transient workspace data (downloaded assets, logs). Add these to `.gitignore`.

## Publishing to a registry API (HTTP)

In addition to MCP-based registry sources, you can **publish** this project's discovery to a shared HTTP registry (e.g. a mesh discovery API). That registry stores and serves the same payload so other clients can list agents without being in the repo.

- **OSSA:** After running `ossa workspace discover`, run `ossa workspace publish --registry-url <base-url>`. This POSTs to `<base-url>/api/v1/discovery` with payload `{ source_id, workspace: { name, scanned_at }, projects }`. Use `--discover` if the local registry file does not exist yet.
- **Contract:** The registry API is a simple HTTP contract:
  - **POST** `/api/v1/discovery` – body: `{ source_id, workspace: { name, scanned_at }, projects: [{ name?, path?, project_path?, project_name?, agents }] }`. Stores this source's discovery (e.g. with a TTL).
  - **GET** `/api/v1/discovery` – returns `{ sources[], projects[], by_source }` (aggregated from all stored sources).
- **CI:** Pipelines can run discover and pass `--registry-url` (or set `MESH_URL` / `AGENT_REGISTRY_URL`) so every run updates the shared registry. See [Discovery and registry](../wiki/Discovery-and-Registry.md) for CI and ownership.

So: local discovery lives in `.agents-workspace/registry/`; publishing pushes that same shape to a registry API; any service that implements the contract can be the registry.

## Related

- [Agent Definition](agent-definition.md) – `.agents/` vs `.agents-workspace/` summary.
- [Agent Folder Structure](../architecture/agent-folder-structure.md) – Per-agent layout under `.agents/{agent-name}/`.
- [What is an Agent](what-is-an-agent.md) – Manifest and wizard.
- [Discovery and registry](../wiki/Discovery-and-Registry.md) – Registry API contract, OSSA publish, CI.
- Research: federated agent registries, MCP/A2A protocols, agent identity (see project whitepapers and Research/agents).
