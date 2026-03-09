# NIST Pillar 2: OSSA MCP Bridge — Technical Implementation Specification

**Status**: Implemented (Phase 2 and Phase 3 complete)  
**Last updated**: 2026-03  
**Authority**: Research doc `06-agent-communication-protocols-mcp-a2a.md` (OSSA three-layer stack); NIST 800-53 / CAISI alignment (Epic 2).

---

## 1. Goal and scope

**Goal**: Define and implement the **OSSA-to-MCP Bridge** so that:

- An OSSA manifest declares which MCP servers an agent requires.
- A runtime provisions those servers at agent startup, configures transports, and monitors health.
- Identity, authorization, and audit align with NIST AI agent expectations (identity, authorization, secure interoperability).

**In scope**:

- Contract between OSSA manifest and MCP bridge (what the manifest declares, what the runtime consumes).
- Bridge runtime behavior: provisioning, transport config, health checks, failover/degradation.
- NIST-relevant controls: agent identity, least privilege (tool-level auth), transmission confidentiality, audit.

**Out of scope** (other epics or existing components):

- A2A bridge, MCP-to-A2A translation, kagent CRD generation.
- OSSA 0.4.6 release mechanics, openstandardagents.org deploy, leaderboard.

---

## 2. Separation of duties (mandatory)

| Concern | Owner | Responsibility |
|--------|--------|----------------|
| **MCP server implementation, bridge runtime, tool auth** | **agent-protocol** | Run MCP servers; implement bridge that reads OSSA-derived config; provision/configure/monitor MCP servers; enforce tool-level ACL by agent identity/tier; expose health. No OSSA schema ownership. |
| **OSSA schema, manifest contract, validation** | **openstandardagents** | Define `capabilities.mcp_servers` (or canonical path, e.g. `integrations.mcp.servers`); schema and validation; export that emits bridge config (server list, transport, env). No MCP server code. |
| **CLI, deploy, spawn** | **agent-buildkit** | Pass manifest path or generated config to agent-protocol where needed; deploy MCP/agent-protocol. No MCP server logic, no schema changes. |

**Rules**:

- agent-protocol MUST NOT define or validate OSSA manifest schema.
- openstandardagents MUST NOT implement MCP servers or bridge runtime.
- agent-buildkit MUST NOT host MCP server or schema logic; it MAY invoke agent-protocol with config derived from OSSA (e.g. via OSSA CLI export).

---

## 3. OSSA manifest contract (spec side)

**Source**: Research doc 4.4 — *"An OSSA manifest's `capabilities.mcp_servers` section declares which MCP servers the agent requires."*

**Canonical path**: To be fixed in OSSA spec (openstandardagents). Options:

- `capabilities.mcp_servers` (array of server declarations), or
- `integrations.mcp.servers` (current type in codebase has `extensions.openai_agents_sdk.mcp_servers` with `label`, `url`).

**Recommended contract for the bridge** (openstandardagents to define and validate):

```yaml
# In OSSA manifest (canonical path TBD in OSSA repo)
capabilities:
  mcp_servers:
    - id: string                  # e.g. gitlab-workflow, filesystem
      transport: stdio | sse | streamable_http
      url?: string                # for sse/streamable_http
      command?: string           # for stdio
      args?: string[]
      env_keys?: string[]        # env vars to pass (e.g. GITLAB_TOKEN)
      allowed_tools?: string[]   # optional allow-list (least privilege)
      denied_tools?: string[]    # optional deny-list
```

- **agent-protocol** consumes a **bridge config** (JSON or YAML) that is **output of OSSA export or a build step**, not the raw manifest. So OSSA owns the shape of the manifest; the bridge consumes a normalized config (server list + transport + auth hints).

---

## 4. Bridge runtime behavior (agent-protocol)

**Responsibilities**:

1. **Provisioning**: At agent startup (or when a session is created), load bridge config; for each declared MCP server, start or connect to the server (stdio subprocess, or SSE/HTTP client).
2. **Transport config**: Configure stdio (command, args, env) or SSE/streamable_http (URL, headers). Env vars (e.g. `GITLAB_TOKEN`) come from a secure store or platform env, not from the manifest.
3. **Health**: Expose health checks for each provisioned MCP server; report unhealthy so orchestrator can restart, fail over, or degrade.
4. **Tool-level authorization**: Before forwarding a tool call to an MCP server, check agent identity/tier against an ACL derived from OSSA access tier (research doc 8.4). Allow/deny per tool name.
5. **Audit**: Log provisioning events, tool calls (agent id, tool name, allow/deny), and health state changes for NIST AU-2 / AU-12.

**NIST-relevant controls**:

| Control | Implementation |
|--------|------------------|
| AC-3 Access Enforcement | Bridge only provisions servers listed in config; tool calls gated by tool-level ACL. |
| AC-6 Least Privilege | `allowed_tools` / `denied_tools` and tier-based TOOL_ACL (research 8.4). |
| SC-8 Transmission Confidentiality | TLS for SSE/HTTP transports; stdio used only for local subprocess. |
| AU-2 / AU-12 Audit | Log tool invocation, agent id, tool name, result (success/deny). |

**Interfaces** (agent-protocol):

- **Input**: Bridge config (file or HTTP) produced from OSSA manifest (by openstandardagents export or buildkit).
- **Output**: MCP endpoint(s) available to the agent; health endpoint for orchestrator/monitoring.

---

## 5. Implementation phases

**Phase 1 — Spec and contract (no code)**  
- Openstandardagents: Define canonical `capabilities.mcp_servers` (or chosen path) in schema; document in OSSA spec; add validation.  
- Document bridge config format (JSON schema) that agent-protocol will consume.  
- Publish this wiki page and any OSSA spec excerpt to GitLab Wiki.

**Phase 2 — Bridge runtime (agent-protocol)**  
- Add a bridge module that: loads bridge config; starts or connects to MCP servers; exposes health; applies tool-level ACL from config; logs for audit.  
- No OSSA schema parsing in agent-protocol; only consume pre-generated bridge config.

**Phase 3 — Integration**  
- openstandardagents: Export or CLI step that emits bridge config from validated manifest.  
- agent-buildkit: Where needed, invoke export and pass config path to agent-protocol (e.g. deploy or spawn).  
- Optional: Drupal/IDE integrations that pass manifest path to a service that runs OSSA export then agent-protocol bridge.

---

## 6. References

- Research: `website/content/research/06-agent-communication-protocols-mcp-a2a.md` (sections 4.4, 5.1, 5.2, 8.1–8.5).
- NIST: `website/content/docs/security-and-compliance/nist-800-53.md`; CAISI/RFI alignment (Epic 2).
- SoD: `architecture/separation-of-duties.md`; AGENTS.md package ownership (agent-protocol = MCP, openstandardagents = spec, agent-buildkit = CLI).

---

## 7. Implemented components (Phase 2 and Phase 3)

### 7.1 agent-protocol (bridge runtime)

- **Config schema**: `src/mcp/bridge/config.schema.ts` — Zod schemas for bridge config and import/execute requests (`MCPBridgeConfigFileSchema`, `BridgeImportConfigRequestSchema`, `BridgeExecuteRequestSchema`).
- **Config loader**: `src/mcp/bridge/config-loader.ts` — Loads `config/mcp-bridge.json` or path from `MCP_BRIDGE_CONFIG_PATH`.
- **Service**: `src/mcp/bridge/mcp-bridge.service.ts` — Load config; `importConfig(config)` (in-memory merge from POST); `executeTool(agentId, toolName, args)` with policy/ACL and optional audit callback; `health()`.
- **HTTP API** (mounted at `/api/v1/mcp/bridge`):
  - `POST /mcp/bridge/execute` — Body: `{ agentId, toolName, arguments? }`. Returns tool result or 403/400.
  - `POST /mcp/bridge/import-config` — Body: `{ config: { agents, mcpServers } }`. Merges config in memory (no file write).
  - `GET /mcp/bridge/health` — Returns `{ status: 'ok'|'degraded', configured }`.
- **Wiring**: Bridge service and routes registered in `src/api/server.ts`.

### 7.2 openstandardagents (config-only CLI)

- **Sync**: `ossa mcp bridge sync <cursor|claude-desktop>` — Reads Cursor/Claude MCP config, merges into `.agents-workspace/registry/mcp-bridge.yaml`. No MCP server or proxy runs in this repo.
- **Push**: `ossa mcp bridge sync cursor --push --endpoint https://mcp.blueflyagents.com` — After sync, builds agent-protocol bridge config (one synthetic agent "default" + all servers) and POSTs to `POST /api/v1/mcp/bridge/import-config`. Env: `MCP_BRIDGE_IMPORT_URL` can replace `--endpoint`.
- **List**: `ossa mcp bridge list` — Lists servers in the OSSA bridge registry.
- **Check**: `ossa mcp bridge check <agentId> <toolName>` — Policy check (serverName/method) against registry.
- **Implementation**: `src/services/mcp/bridge.service.ts` (sync, list, buildAgentProtocolConfig, pushToAgentProtocol); `src/cli/commands/mcp.command.ts` (CLI with --push, --endpoint).

### 7.3 Bridge config shape (agent-protocol)

Consumed by agent-protocol (file or import-config body):

```json
{
  "agents": [
    { "id": "default", "name": "Default", "capabilities": [], "mcpServers": ["gitlab-workflow", "filesystem"] }
  ],
  "mcpServers": {
    "gitlab-workflow": { "name": "gitlab-workflow", "command": "npx", "args": ["-y", "@bluefly/agent-protocol", "gitlab-workflow"], "transport": "stdio" },
    "filesystem": { "name": "filesystem", "url": "https://example.com/mcp/sse", "transport": "sse" }
  }
}
```

### 7.4 Verification

- **Health**: `curl -s https://mcp.blueflyagents.com/api/v1/mcp/bridge/health`
- **Import** (after sync): `ossa mcp bridge sync cursor --push --endpoint https://mcp.blueflyagents.com`
- **Execute** (with valid agent/tool): `curl -s -X POST https://mcp.blueflyagents.com/api/v1/mcp/bridge/execute -H "Content-Type: application/json" -d '{"agentId":"default","toolName":"gitlab-workflow/list_tools","arguments":{}}'`

---

## 8. Approval and next steps

- **Design complete**: This spec is the technical implementation specification for NIST Pillar 2 (OSSA MCP Bridge).
- **Phase 2 and Phase 3 complete**: Bridge runtime in agent-protocol; config-only CLI in openstandardagents with optional push to agent-protocol.
- **Next**: (1) Optional: extend OSSA manifest canonical path (`capabilities.mcp_servers`) and emit bridge config from manifest export. (2) Operate and monitor bridge health in production; tune tool ACL as needed.

---

## 9. Package-first: Oracle and NAS (no git)

Platform is **package-first**. After code is merged to **release** then **main**, CI publishes npm packages to the GitLab registry. On Oracle and NAS you use **npm only**; no git clone, no rsync, no manual copy.

**Flow**

1. Merge feature branches into each repo's **release** branch (e.g. `release/v0.1.x` or `release/v0.4.x` for OSSA), then merge release into **main** via MR. CI runs on main and publishes `@bluefly/*` to the GitLab npm registry.
2. On **Oracle** and **NAS**: install or update CLIs and services from npm. No git operations on those servers.

**Install once (with registry auth)**

- Ensure `GITLAB_REGISTRY_NPM_TOKEN` (or `GITLAB_TOKEN` with `read_package_registry`) is set in platform `.env.local` and that `~/.npmrc` (or env) points the `@bluefly` scope at the GitLab group registry.
- Oracle/NAS: same token in `/opt/agent-platform/.env` (or NAS equivalent); source it before npm.

```bash
npm install -g @bluefly/agent-buildkit @bluefly/agent-protocol
```

- OSSA CLI is on **npmjs** (not GitLab): `npm install -g @bluefly/openstandardagents`.

**Update to latest (after merges and CI publish)**

```bash
npm update -g @bluefly/agent-buildkit @bluefly/agent-protocol
npm update -g @bluefly/openstandardagents   # from npmjs
```

That is the only step needed on Oracle and NAS to get the new bridge and CLI behaviour: **merge to main, then run npm update**. No clone, no pull, no rsync.
