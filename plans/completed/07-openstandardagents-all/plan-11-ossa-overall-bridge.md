# Implementation Plan: OSSA MCP Bridge (NIST Pillar 2)

## Strategic Goal
Implement an active "Bridge" architecture to allow OSSA to broker external Model Context Protocol (MCP) servers locally, satisfying **NIST Pillar 2: Open Source Protocols & Interoperability**. 

By acting as a local proxy, OSSA will force all configured tool calls from local agents through central policy and authorization validations before allowing execution on foreign MCPs (like filesystem, GitHub, or desktop endpoints).

## Proposed Architecture

### 1. The MCP Bridge Service (`src/services/mcp/`)
Create a new isolated service, `McpBridgeService`, inside the core domain to act as the standard MCP client-side router.
- **[NEW]** `src/services/mcp/bridge.service.ts`
  - Implement a proxy controller mapping local tools (e.g. `mcp:filesystem/read_file`) to their respective spawned MCP servers.
  - Automatically detect and merge external configurations (e.g., Cursor's `mcp.json` or Claude Desktop configs) into the active OSSA registry path.
  - Implement `executeTool(agentId, toolName, args)` that intercepts calls, checks OSSA policies, and forwards to the underlying server.

### 2. HTTP Control Plane (`src/api/routes/`)
To support the API-first design pattern of the CLI, we will expose the bridge as standard Express routes.
- **[NEW]** `src/api/routes/mcp.router.ts`
  - `POST /mcp/bridge/import-config`: Accepts raw config strings to merge foreign MCP sources.
  - `POST /mcp/bridge/execute`: Forwards a proxied tool call through the policy boundary.

### 3. CLI Command Integration (`src/cli/commands/`)
Extend the OSSA CLI to provide standard developer tooling to view and connect the bridge.
- **[NEW]** `src/cli/commands/mcp.command.ts`
  - `ossa mcp bridge start` (Future): Spawns the background server proxy if required.
  - `ossa mcp bridge sync <claude|cursor>`: Reads global app-data settings to synchronize their existing MCPs into OSSA seamlessly.

### 4. Dependency Injection
Update `src/di-container.ts` to statically export the `McpBridgeService`.

## User Review Required
> [!IMPORTANT]
> To truly act as an MCP Bridge, OSSA will ultimately need to maintain persistent background connections or utilize an SDK like `@modelcontextprotocol/sdk`. Since we want to stay lean and strictly adhere to "Separation of Duties", I will implement the *control plane* (the service, routing, and CLI configuration importer) in this phase. The actual persistent daemon for live streaming traffic is out of scope for this immediate task, relying instead on demonstrating the config proxying and policy validation logic first.

## Verification Plan

1. **Compilation Check**: `npm run build && npm run test` must pass.
2. **Local Mock Run**: Create a mock dummy `claude_desktop_config.json`, run `ossa mcp bridge sync claude`, and verify that OSSA correctly parses and securely imports the configuration into the central workspace `.agents-workspace/registry`.
