# OSSA MCP Server Guide

The OSSA MCP Server exposes the full OSSA toolkit via the Model Context Protocol. Any MCP-compatible client (Claude, Cursor, VS Code, etc.) can use these tools to create, validate, convert, and manage OSSA agents.

## Quick Start

```bash
# Install
npm install -g @bluefly/openstandardagents

# Run as MCP server (stdio transport)
npx ossa-mcp

# Or add to your MCP client config:
{
  "mcpServers": {
    "ossa": {
      "command": "npx",
      "args": ["ossa-mcp"]
    }
  }
}
```

## Tools (10)

| Tool | Description |
|------|-------------|
| `ossa_validate` | Validate manifest against OSSA v0.4 schema (strict mode, platform checks) |
| `ossa_scaffold` | Scaffold new agent directory (manifest, prompts/, tools/, AGENTS.md) |
| `ossa_generate` | Generate .well-known/agent-card.json for A2A discovery |
| `ossa_publish` | Publish to registry (dry-run or live) |
| `ossa_list` | Discover agents in workspace (summary, detailed, or JSON) |
| `ossa_inspect` | Deep-inspect manifest (semver, file size, validation, capabilities) |
| `ossa_convert` | Convert to 11+ platforms (see below) |
| `ossa_workspace` | Manage workspace (init, discover, status) |
| `ossa_diff` | Compare two manifests (changes, breaking changes, compatibility) |
| `ossa_migrate` | Migrate manifest to newer OSSA version |

## Convert Targets (11+)

| Target | Platform | SDK (npm) | SDK (pip) |
|--------|----------|-----------|-----------|
| `kagent` | kagent.dev (K8s) | - | - |
| `docker` | Docker Compose | - | - |
| `openai` | OpenAI Assistants | `openai` | `openai` |
| `anthropic` | Anthropic Claude | `@anthropic-ai/sdk` | `anthropic` |
| `langchain` | LangChain | `langchain` | `langchain` |
| `crewai` | CrewAI | - | `crewai` |
| `autogen` | Microsoft AutoGen | - | `autogen-agentchat` |
| `semantic-kernel` | Microsoft Semantic Kernel | `semantic-kernel` | `semantic-kernel` |
| `gitlab-duo` | GitLab Duo | - | - |
| `agent-card` | **Universal** (all platforms) | all | all |
| `a2a` | Same as agent-card | all | all |

### The Agent Card (Universal Format)

`target: agent-card` generates a comprehensive cross-platform JSON that includes:

- **OSSA contract**: identity, role, capabilities, autonomy, safety, access
- **A2A discovery**: skills, capabilities, input/output modes
- **MCP tools**: tool definitions with input schemas
- **12 platform adapters** each with:
  - `sdk`: npm and pip package names + docs URL
  - `config`: ready-to-use configuration for that platform
  - `usage`: code snippet showing how to use it

Platforms in adapters: OpenAI, Anthropic, Google GenAI, LangChain, LangFlow, CrewAI, AutoGen, Semantic Kernel, LlamaIndex, DSPy, kagent, GitLab Duo.

## Resources (5)

| URI | Description |
|-----|-------------|
| `ossa://schema/v0.4/agent` | JSON Schema for validation |
| `ossa://template/minimal` | Minimal manifest (copy-paste starter) |
| `ossa://template/full` | Complete manifest with all sections |
| `ossa://guide/mcp-ossa-a2a` | How OSSA bridges MCP and A2A |
| `ossa://platforms/supported` | All platforms with SDK references |

## Prompts (4)

| Prompt | Description |
|--------|-------------|
| `create-agent` | Create a new agent from a description |
| `convert-for-platform` | Convert manifest to a target platform |
| `explain-manifest` | Explain what a manifest does in plain language |
| `what-is-ossa` | Explain OSSA and the MCP → OSSA → A2A stack |

## Architecture: MCP → OSSA → A2A

```
┌─────────────────────────────────────┐
│         A2A (Communication)          │
│   How agents talk to each other      │
│   Skills, Tasks, Agent Cards         │
├─────────────────────────────────────┤
│         OSSA (Contract)              │
│   What the agent IS                  │
│   Identity, Capabilities, Governance │
│   Safety, Autonomy, Deployment       │
├─────────────────────────────────────┤
│         MCP (Tools)                  │
│   What the agent CAN DO             │
│   Servers, Resources, Prompts        │
└─────────────────────────────────────┘
```

- **MCP** defines tools (what agents CAN DO)
- **A2A** defines communication (how agents TALK)
- **OSSA** defines the agent contract (what the agent IS)

## Open Source Stack

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP protocol implementation |
| `zod` | Runtime input validation |
| `pino` | Structured JSON logging |
| `fast-glob` | Workspace agent discovery |
| `js-yaml` | YAML parse/serialize |
| `axios` | HTTP client for registry |
| `semver` | Version parsing |

## Testing

```bash
# Run MCP server tests (40 integration tests)
npm run test:mcp

# Run all tests
npm run test:unit
```

## CI/CD

The GitLab CI pipeline includes:
- `validate:manifests-ossa` — validates all manifests
- `validate:agents-discover` — workspace init → discover → list
- `validate:mcp-server` — smoke test MCP server initialization
