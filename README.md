# OSSA - Open Standard for Software Agents

> **Development happens on [GitLab](https://gitlab.com/blueflyio/ossa/openstandardagents).** This repo is a read-only mirror.
> [Source](https://gitlab.com/blueflyio/ossa/openstandardagents) | [Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues) | [npm](https://www.npmjs.com/package/@bluefly/openstandardagents)

**The infrastructure bridge between agent protocols and deployment platforms.**

OSSA is not a protocol (like MCP or A2A) and not a framework (like LangChain or CrewAI). It's the missing middle layer that translates agent definitions into platform-specific deployments.

**What OSSA does**: Provides a YAML manifest format (like OpenAPI for REST APIs) and exports it to Docker, Kubernetes, LangChain, CrewAI, Claude Skills, and other platforms. One manifest, multiple deployment targets.

**How OSSA complements existing standards**:
- **Consumes MCP** - OSSA manifests can reference MCP servers and tools
- **Builds on A2A** - Supports A2A messaging and agent-to-agent communication
- **Extends protocols** - Adds deployment and packaging layer on top of communication protocols

## 🇺🇸 NIST AI Agent Standards Alignment

OSSA v0.4.6 natively aligns with the [NIST AI Agent Standards Initiative](https://www.nist.gov/caisi/ai-agent-standards-initiative) driven by the Center for AI Standards and Innovation (CAISI) and the Information Technology Laboratory (ITL).

- **Secure Interoperability**: OSSA's `A2AExtension` schema guarantees seamless multi-vendor agent coordination across network boundaries using standardized protocols.
- **Agent Identity & Authorization**: Built-in `AgentIdentity`, `AccessTier`, and `SeparationOfDuties` schemas immediately fulfill ITL's criteria for zero-trust verifiable credentials, semantic role isolation, and self-rotating service accounts.
- **Provable Compliance**: The `metadata.compliance` specification allows agents to cryptographically declare their alignment to Federal and industry governance frameworks directly in their manifest.

## What's New

### OpenAI Agents SDK Export (2026-02-16)

- **New export platform**: `openai-agents-sdk` (22nd platform) — generates runnable `@openai/agents` TypeScript packages from OSSA manifests
- Maps OSSA `spec.personality` to agent instructions, `spec.llm` to model selection, `spec.tools` to function tools, `spec.mcp` to MCPServerStreamableHttp connections, `spec.safety` to guardrails
- Generates: `agent.ts`, `mcp-config.ts`, `guardrails.ts`, `run.ts`, `package.json`, `tsconfig.json`
- Usage: `ossa export --platform openai-agents-sdk agent.ossa.yaml`
- New OSSA extension blocks planned: `openai_agents_sdk`, `openai_responses_api`, `openai_realtime`, `openai_deep_research`
- Supports defining agents once and exporting to both Claude and OpenAI platforms

### Multi-Agent Team Topology (2026-02-17)

- **Team definitions** (`spec.team`): Define coordinated multi-agent teams with 4 team models — lead-teammate, peer-to-peer, hierarchical, swarm
- **Subagent definitions** (`spec.subagents`): Parent-child delegation hierarchies with role-based agents (worker, specialist, reviewer, debugger)
- **8 architecture patterns**: single, swarm, pipeline, graph, hierarchical, reactive, cognitive, lead-teammate
- **Team code generation**: Export team topology to CrewAI (Python), OpenAI Agents SDK (TypeScript), Claude Code (markdown), and npm (TypeScript)
- **`--perfect-agent` CLI flag**: Generate a complete production bundle — AGENTS.md, team scaffolding, CLEAR eval stubs, governance config, observability config, and agent card
- **Team-aware AGENTS.md**: Auto-generated documentation with team topology tables, member roles, coordination strategy, and hierarchy diagrams
- **5 new export platforms**: `openai-agents-sdk` (beta), `a2a` (alpha), `claude-skills` (beta), `mobile-agent` (alpha), `symfony` (alpha) — bringing total to 22

### v0.4.6 (2026-02-19)

**Version Update**:
- Updated all version references from 0.4.5 to 0.4.6
- Package version bumped to 0.4.6

### v0.4.5 (2026-02-10)

**Major Cleanup & Foundation Improvements**:
- 16,574 LOC removed - 47% codebase reduction (35,425 to 18,851 LOC)
- SDK Migration - Anthropic adapter now uses official `@anthropic-ai/sdk` (513 LOC removed, 25.8% reduction)
- Complete Skills Pipeline - Research, generate, export, validate, sync Claude Skills
- Zero Build Errors - Fixed all TypeScript errors, 100% passing tests
- DRY Improvements - Eliminated 99 LOC duplication via BasePackageGenerator
- 19 New Tests - Skills pipeline fully tested (100% passing)

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

## A2A (Agent-to-Agent) Communication

OSSA includes A2A system capabilities that extend the [Model Context Protocol (MCP)](https://spec.modelcontextprotocol.io/) with multi-agent orchestration:

### Core Capabilities

- **Swarm Coordination** - Task decomposition across agent pools with load balancing
- **Service Mesh** - Circuit breaking, health checking, distributed tracing (W3C Trace Context)
- **Task Delegation** - SLA negotiation and monitoring between agents
- **MCP Integration** - Cross-language communication (TypeScript ↔ PHP ↔ Python)
- **Communication Patterns** - Request-reply, broadcast, pub-sub, pipeline coordination

### Implementation Status

A2A services are implemented in TypeScript with full test coverage:
- `SwarmOrchestrator` - Task decomposition, load balancing, consensus building
- `AgentMesh` - Service discovery, routing, circuit breaking, distributed tracing
- `MCPIntegrationService` - MCP server connections, tool discovery, cross-language RPC
- `DelegationService` - SLA negotiation, capability matching, task monitoring

### Example: Swarm Coordination

```typescript
import { SwarmOrchestrator, AgentMesh, DelegationService } from '@bluefly/openstandardagents/a2a';

// Create swarm orchestrator
const swarm = new SwarmOrchestrator({
  maxSize: 100,
  autoScaling: true,
  coordinationStrategy: 'hybrid',
});

// Decompose complex task into agent subtasks
const complexTask = {
  name: 'Build Multi-Agent System',
  requirements: {
    capabilities: ['code-generation', 'testing', 'documentation'],
    minAgents: 3,
  },
  constraints: {
    maxExecutionTime: 3600000, // 1 hour
    requiredSLA: 0.95,
  },
};

const subtasks = swarm.decomposeTask(complexTask);

// Balance load across agent pool
const assignments = swarm.balanceLoad(subtasks, agents);

// Agents coordinate via consensus
const proposals = [/* agent proposals */];
const consensus = await swarm.buildConsensus(proposals);
```

### Example: Agent Mesh

```typescript
import { AgentMesh } from '@bluefly/openstandardagents/a2a';

// Create service mesh for agents
const mesh = new AgentMesh(discoveryConfig, loadBalancingConfig, circuitBreakerConfig);

// Register agents
mesh.registerAgent(agentNode);

// Discover agents by capability
const codeGenerators = mesh.discoverAgents(['code-generation']);

// Route request with load balancing and circuit breaking
const targetAgent = mesh.routeRequest(message);

// Trace distributed calls (W3C Trace Context)
const trace = mesh.traceCall(fromAgent, toAgent, payload);
mesh.completeTrace(trace.traceId, success);
```

### Example: Cross-Language Communication

```typescript
import { MCPIntegrationService } from '@bluefly/openstandardagents/a2a';

const mcpService = new MCPIntegrationService();

// Connect to PHP MCP server (Symfony MCP Bundle)
const phpConnection = await mcpService.connectMCPServer('stdio://symfony-mcp-bundle');

// Discover PHP server capabilities
const tools = await mcpService.discoverTools(phpConnection.id);

// Call PHP tool from TypeScript agent
const result = await mcpService.callTool(phpConnection.id, 'process_data', {
  data: [1, 2, 3, 4, 5],
});

// Expose TypeScript agent as MCP server for Python/PHP consumption
const server = await mcpService.exposeMCPServer(typescriptAgent);
```

### A2A Documentation

- [MCP Specification](https://spec.modelcontextprotocol.io/) - Official Model Context Protocol
- [Symfony MCP Bundle](https://github.com/symfony/mcp-bundle) - Enterprise PHP MCP integration
- [PHP MCP SDK](https://github.com/modelcontextprotocol/php-sdk) - PHP Foundation collaboration

[![npm version](https://badge.fury.io/js/%40bluefly%2Fopenstandardagents.svg)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Install

```bash
npm install -g @bluefly/openstandardagents
```

## Quick Start

```bash
# Create an agent manifest interactively
ossa wizard -o creative-agent-naming.ossa.yaml

# Validate it
ossa validate creative-agent-naming.ossa.yaml

# Export to a platform
ossa export creative-agent-naming.ossa.yaml --platform docker --output ./docker-deploy

# See all export platforms
ossa export --list-platforms
```

## Usage

### Creating an Agent Manifest

Use the interactive wizard to create a new agent manifest:

```bash
ossa wizard -o creative-agent-naming.ossa.yaml
# or without global install:
npx @bluefly/openstandardagents wizard -o creative-agent-naming.ossa.yaml
```

For the full wizard flow (steps 1-10: creation method, basic info, domain, LLM, tools, autonomy, observability, deployment, advanced, token efficiency, separation of duties, review) and the standard folder layout (`.agents/{name}/` with manifest.ossa.yaml), see [What is an Agent](docs/getting-started/what-is-an-agent.md) and [Agent Folder Structure](docs/architecture/agent-folder-structure.md). For a more comprehensive interactive flow, use `ossa agent-wizard`.

Or create one manually following the [manifest format](#manifest-format) below.

### Validating Manifests

Validate your manifest against the JSON Schema:

```bash
ossa validate creative-agent-naming.ossa.yaml
```

For stricter validation with best practices checks:

```bash
ossa lint creative-agent-naming.ossa.yaml
```

### Exporting to Platforms

Export your agent to a specific platform:

```bash
# Docker deployment
ossa export creative-agent-naming.ossa.yaml --platform docker --output ./docker-deploy

# Kubernetes with Kustomize
ossa export creative-agent-naming.ossa.yaml --platform kubernetes --output ./k8s-deploy

# LangChain Python agent
ossa export creative-agent-naming.ossa.yaml --platform langchain --output ./langchain-agent

# CrewAI multi-agent system
ossa export creative-agent-naming.ossa.yaml --platform crewai --output ./crewai-crew

# Claude Skills package
ossa export creative-agent-naming.ossa.yaml --platform agent-skills --output ./skills

# List all available platforms
ossa export --list-platforms
```

### Advanced Options

```bash
# Dry run (preview without creating files)
ossa export creative-agent-naming.ossa.yaml --platform docker --dry-run

# Verbose output for debugging
ossa export creative-agent-naming.ossa.yaml --platform kubernetes --verbose

# Skip validation (use with caution)
ossa export creative-agent-naming.ossa.yaml --platform npm --no-validate

# Create backup before overwriting
ossa export creative-agent-naming.ossa.yaml --platform docker --backup

# Perfect agent bundle (AGENTS.md + team + evals + governance + observability + agent card)
ossa export agent.ossa.yaml --perfect-agent

# Individual perfect agent components
ossa export agent.ossa.yaml --platform npm --include-agents-md --include-team --include-evals
```

### Migrating Between Versions

Upgrade manifests to the latest spec version:

```bash
# Migrate from older version to current
ossa migrate agent.ossa.yaml --to 0.4.6

# List available migration paths
ossa migrate --list
```

### TypeScript SDK Usage

Use OSSA programmatically in your TypeScript projects:

```typescript
import { ValidationService, ManifestRepository } from '@bluefly/openstandardagents';

// Load and validate a manifest
const manifestRepo = new ManifestRepository();
const validationService = new ValidationService();

const manifest = await manifestRepo.load('./agent.ossa.yaml');
const result = await validationService.validate(manifest);

if (result.valid) {
  console.log('✓ Manifest is valid');
} else {
  console.error('Validation errors:', result.errors);
}
```

## Production Status (v0.4.6)

### ✅ Production-Ready (Tested & Documented)

**Core CLI Commands**:
- `ossa validate` - Validate manifests against JSON Schema
- `ossa wizard` - Interactive manifest creation
- `ossa lint` - Best practice checking
- `ossa diff` - Compare two manifests
- `ossa migrate` - Migrate between spec versions
- `ossa generate-gaid` - Global Agent ID generation

**Production Platform Exports** (4 production, 8 beta, 10 alpha — 22 total):
- `langchain` (production) - Python + TypeScript agents (uses @langchain/* SDK v0.3+)
- `mcp` (production) - MCP server for Claude Code (uses @modelcontextprotocol/sdk v1.0+)
- `npm` (production) - TypeScript package with manifest
- `agent-skills` (production) - SKILL.md for Claude Code

**Skills Pipeline** (✅ Complete in v0.4.6):
- `ossa skills research` - Index skills from curated sources (cached locally at ~/.ossa/skills-index.json)
- `ossa skills generate` - Auto-detects input format (OSSA, Oracle Agent Spec, AGENTS.md)
- `ossa skills export` - Package as npm, install to ~/.claude/skills/, publish to registry
- `ossa skills list` - Discover installed Claude Skills
- `ossa skills validate` - Validate SKILL.md structure
- `ossa skills sync` - Bidirectional sync between skill and manifest
- **19 tests** - 100% passing (SkillsResearchService, SkillsGeneratorService, SkillsExportService)

**TypeScript SDK**:
- Validation service (`@bluefly/openstandardagents/validation`)
- Type definitions (`@bluefly/openstandardagents/types`)
- JSON Schema access (`@bluefly/openstandardagents/schema`)

### 🚧 Beta (Functional but needs testing)

- `ossa agents-local` - Local `.agents/` folder management
- `ossa agents-md` - Generate, validate, sync [agents.md](https://agents.md) files (standard: [agentsmd/agents.md](https://github.com/agentsmd/agents.md)); customize via wizard step or `ossa agents-md generate|validate|sync`
- Export to: `crewai`, `drupal`, `claude-code`, `cursor`, `warp`, `anthropic`
- Anthropic runtime adapter uses official `@anthropic-ai/sdk` (v0.4.6 improvement: 513 LOC removed)

### GitLab Agent Examples (Fully Implemented)

Deployed agent manifests in `agents/gitlab/`:
- `mr-reviewer.ossa.yaml` - Merge request code review agent
- `pipeline-auto-fix.ossa.yaml` - CI pipeline failure auto-remediation agent
- `daily-code-scan.ossa.yaml` - Scheduled codebase security and quality scanning agent

### Spec Generation & Enhanced Validation

- `ossa-dev spec generate` - Generates consolidated OSSA spec from source schema files with version metadata
- Enhanced validation includes OpenAPI extension checks, JSON Schema validation, and `$ref` integrity verification across spec files

### Alpha (Experimental)

- Export to: `kagent`, `gitlab-duo`, `docker`, `kubernetes`, `temporal`, `n8n`, `gitlab`
- OpenTelemetry metrics integration
- Agent analytics tracking
- GitLab Catalog integration (convert/list/search/info)
- Agent registry (publish/search)

### Planned

- A2A Agent Card import (P1-1)
- Batch skill generation (P1-2)
- Skill quality scoring (P1-3)
- Full GitLab Catalog push/pull with API integration

## How It Works

OSSA defines a YAML-based manifest format for AI agents (similar to how OpenAPI defines REST APIs). The CLI validates manifests against a JSON Schema and exports them to platform-specific deployment packages.

**The infrastructure bridge layer**:
1. **Define once** - Write a single `agent.ossa.yaml` manifest
2. **Validate** - Check against JSON Schema for correctness
3. **Export** - Generate platform-specific deployment packages (Docker, K8s, LangChain, etc.)
4. **Deploy** - Use platform-native tools to deploy (kubectl, docker-compose, pip install, etc.)

OSSA complements MCP and A2A by adding the packaging and deployment layer they don't provide.

### Manifest Format

```yaml
apiVersion: ossa/v0.4.6
kind: Agent
metadata:
  name: code-reviewer
  version: 1.0.0
  description: AI-powered code review agent
spec:
  role: |
    You are a code review agent that analyzes pull requests
    for bugs, security issues, and style violations.
  llm:
    provider: anthropic
    model: claude-sonnet-4-5-20250929
    temperature: 0.3
    maxTokens: 4096
  tools:
    - name: read_file
      description: Read file contents
    - name: create_comment
      description: Post review comment
  autonomy:
    level: supervised
```

#### Team Manifest Example

```yaml
apiVersion: ossa/v0.4.6
kind: Agent
metadata:
  name: dev-team
  version: 1.0.0
spec:
  role: Lead a fullstack development team
  llm:
    provider: anthropic
    model: claude-opus-4-20250514
  team:
    model: lead-teammate
    lead: lead
    delegateMode: task-list
    members:
      - name: backend-worker
        kind: teammate
        role: Implement backend features
        model: claude-sonnet-4-5-20250929
        tools: [read_file, write_file, bash]
      - name: frontend-worker
        kind: teammate
        role: Implement frontend features
        model: claude-sonnet-4-5-20250929
        tools: [read_file, write_file, bash]
    communication:
      channel: task-list
      consensus: leader-decides
```

### Export Platforms

Export generates complete, runnable project scaffolds:

```bash
ossa export agent.ossa.yaml --platform <platform> --output ./output

# See all platforms and their status
ossa export --list-platforms
```

| Platform | Status | Output | SDK Used | Description |
|----------|--------|--------|----------|-------------|
| `langchain` | production | 6 files | @langchain/* v0.3+ | Python + TypeScript agents, requirements, package.json |
| `mcp` | production | 4 files | @modelcontextprotocol/sdk v1.0+ | MCP server for Claude Code and other clients |
| `npm` | production | 6 files | - | TypeScript package with manifest, README, types |
| `agent-skills` | production | 3 files | - | SKILL.md format for Claude Code |
| `crewai` | beta | 18 files | crewai v0.80+ | Python crew with agents, tasks, tools, tests, examples |
| `drupal` | beta | 3-4 files | - | Manifest package for ai_agents_ossa module |
| `claude-code` | beta | 4 files | - | Claude Code sub-agent manifest |
| `cursor` | beta | 4 files | - | Cursor Cloud Agent manifest |
| `warp` | beta | 4 files | - | Warp terminal agent manifest |
| `anthropic` | beta | 8 files | @anthropic-ai/sdk v0.49+ | Python SDK with FastAPI server scaffold |
| `kagent` | alpha | 10 files | - | kagent.dev CRD bundle with RBAC, NetworkPolicy |
| `gitlab-duo` | alpha | 30+ files | - | GitLab Duo Custom Agent with MCP integration |
| `docker` | alpha | 14 files | - | Dockerfile, docker-compose, scripts, healthchecks |
| `kubernetes` | alpha | ~25 files | - | Kustomize base + overlays (dev/staging/prod) |
| `temporal` | alpha | 1 file | - | Temporal workflow configuration |
| `n8n` | alpha | 1 file | - | n8n workflow JSON export |
| `gitlab` | alpha | 1 file | - | GitLab CI/CD YAML configuration |
| `openai-agents-sdk` | beta | 7 files | @openai/agents | OpenAI Agents SDK TypeScript package |
| `a2a` | alpha | 8 files | - | Agent-to-agent protocol with mesh and delegation |
| `claude-skills` | beta | 3 files | - | Claude Skills format with team support |
| `mobile-agent` | alpha | 1 file | - | Mobile LLM platform export |
| `symfony` | alpha | 1 file | - | Symfony bundle for PHP-based agents |

Every export includes `agent.ossa.yaml` (the source manifest) for provenance.

### Validation

```bash
# Basic validation against JSON Schema
ossa validate agent.ossa.yaml

# Strict mode (warnings become errors)
ossa validate agent.ossa.yaml --strict
```

### Interactive Wizard

```bash
ossa wizard -o agent.ossa.yaml
```

Walks through: identity, role, LLM config, tools, autonomy level, resources, taxonomy, compliance, and token efficiency settings.

## TypeScript SDK

```typescript
import { validateManifest } from '@bluefly/openstandardagents/validation';
import type { OssaAgent } from '@bluefly/openstandardagents/types';

const agent: OssaAgent = {
  apiVersion: 'ossa/v0.4.5',
  kind: 'Agent',
  metadata: { name: 'creative-agent-naming', version: '1.0.0' },
  spec: {
    role: 'Assistant',
    llm: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
  },
};

const result = await validateManifest(agent);
if (result.valid) console.log('Valid manifest');
```

## Spec Features

The OSSA v0.4 schema supports these optional sections:

- **LLM Configuration** - Provider, model, temperature, max tokens, caching
- **Tools** - Named tools with input schemas
- **Autonomy** - Supervised, autonomous, or collaborative modes
- **Token Efficiency** - Prompt caching, context pruning, budget limits
- **Compliance** - SOC2, HIPAA, GDPR, FedRAMP framework declarations
- **A2A Messaging** - Agent-to-agent communication protocol config
- **Taxonomy** - Domain classification and agent type/kind/architecture
- **Observability** - Metrics, logging, tracing configuration
- **Resources** - CPU, memory, storage requirements
- **Team Definitions** - Multi-agent team topology with 4 models (lead-teammate, peer-to-peer, hierarchical, swarm)
- **Subagent Definitions** - Parent-child delegation with role-based agents (worker, specialist, reviewer, debugger)
- **Architecture Patterns** - 8 patterns: single, swarm, pipeline, graph, hierarchical, reactive, cognitive, lead-teammate

All fields are optional. A minimal manifest needs only `apiVersion`, `kind`, `metadata.name`, and `spec.role`.

## How OSSA Complements MCP and A2A

OSSA is designed to work **alongside** existing agent protocols, not replace them:

| Standard | Purpose | OSSA Integration |
|----------|---------|------------------|
| **MCP (Model Context Protocol)** | Tool/context communication | OSSA manifests reference MCP servers in `spec.tools` |
| **A2A (Agent-to-Agent Protocol)** | Inter-agent messaging | OSSA supports A2A config in `spec.a2a` section |
| **Oracle Agent Spec** | Agent capabilities definition | OSSA can import/export to Oracle format |
| **OSSA** | Packaging & deployment | Consumes protocols, exports to platforms |

**Example**: An OSSA manifest can declare that an agent uses MCP tools and A2A messaging, then export that configuration to Docker, Kubernetes, or LangChain deployment packages.

```yaml
apiVersion: ossa/v0.4.6
kind: Agent
metadata:
  name: code-reviewer
spec:
  role: "Code review agent"
  tools:
    - mcp_server: "filesystem"  # References MCP server
      tools: ["read_file", "list_directory"]
  a2a:
    enabled: true               # Supports A2A messaging
    protocols: ["handoff", "delegation"]
```

OSSA doesn't compete with MCP or A2A - it makes them deployable.

## CLI Commands

**Core workflow** (shown in `ossa --help`):
- `ossa wizard` - Interactive manifest creation (full flow)
- `ossa init [name]` - Create new OSSA manifest (interactive or `-y`)
- `ossa validate [path]` - Validate against OSSA schema (optional `--platform`)
- `ossa export [manifest]` - Export to platform (`--platform`, `-o`, `--perfect-agent`, etc.)
- `ossa lint` - Lint manifests
- `ossa diff` - Diff manifests
- `ossa build` - Validate + build for platform
- `ossa migrate` - Migrate manifest to newer OSSA version

**Agent management:** `ossa agents create|list|get`, `ossa agents-local`, `ossa agent-card generate|validate`, `ossa generate-gaid`

**Development:** `ossa generate` (agent|types|zod|manifests|vscode|openapi|all|list|validate|sync), `ossa dev`, `ossa serve`, `ossa run`, `ossa test`

**Distribution:** `ossa publish`, `ossa install`, `ossa update`, `ossa search`

**Deployment:** `ossa deploy`, `ossa status`, `ossa rollback`, `ossa stop`

**Documentation from manifest:** `ossa agents-md` (generate|validate|sync|discover|maintain), `ossa llms-txt` (generate|validate|sync), `ossa docs`

**Skills and templates:** `ossa skills` (list|generate|sync|validate|research|generate-enhanced|export), `ossa template` (list|show|create|validate)

**Tools and capabilities:** `ossa tool` (create|validate|list), `ossa capability`, `ossa manifest`

**Compliance:** `ossa conformance`, `ossa compliance`, `ossa governance`, `ossa contract`

**Workspace (two-tier / UADP-style):** `ossa workspace init|list|discover`, `ossa workspace policy list|check <project>`, `ossa workspace sync`, `ossa workspace publish --registry-url <url>` (POST discovery to a registry API, e.g. mesh)

**Production commands** (examples):
```bash
ossa wizard -o agent.ossa.yaml
ossa validate agent.ossa.yaml
ossa export agent.ossa.yaml --platform docker --output ./docker-deploy
ossa export --list-platforms
ossa lint agent.ossa.yaml
ossa diff old.ossa.yaml new.ossa.yaml
ossa migrate agent.ossa.yaml --to 0.4.6
ossa generate-gaid agent.ossa.yaml
ossa export agent.ossa.yaml --perfect-agent
ossa export agent.ossa.yaml --include-agents-md --include-team --include-evals
```

**Skills pipeline:**
```bash
ossa skills research "drupal" --json
ossa skills generate agent.ossa.yaml
ossa skills generate spec.yaml --format oracle
ossa skills generate AGENTS.md --format agents-md
ossa skills export ./skill-dir [--install|--publish]
ossa skills list
ossa skills validate ./SKILL.md
ossa skills sync
```

**OSSA MCP Server** (10 tools, 5 resources, 4 prompts — stdio transport):

Run `npx ossa-mcp` or add to your MCP client config:
```json
{
  "mcpServers": {
    "ossa": {
      "command": "npx",
      "args": ["ossa-mcp"]
    }
  }
}
```

**Tools:** `ossa_validate`, `ossa_scaffold`, `ossa_generate`, `ossa_publish`, `ossa_list`, `ossa_inspect`, `ossa_convert` (11+ platforms with real SDK refs), `ossa_workspace` (init/discover/status), `ossa_diff` (breaking change detection), `ossa_migrate`.

**Resources:** `ossa://schema/v0.4/agent`, `ossa://template/minimal`, `ossa://template/full`, `ossa://guide/mcp-ossa-a2a`, `ossa://platforms/supported`.

**Prompts:** `create-agent`, `convert-for-platform`, `explain-manifest`, `what-is-ossa`.

**Convert targets:** kagent (v1alpha2), docker, openai, anthropic, langchain, crewai, autogen, semantic-kernel, gitlab-duo, agent-card (universal cross-platform JSON with 12 platform adapters — each with `sdk` npm/pip refs, `config`, and `usage` code snippet).

See [MCP Server Guide](docs/guides/mcp-server.md) for full documentation. Skill: `examples/agent-skills/ossa-agent-authoring/SKILL.md`.

**Beta:** `ossa agents-local`, `ossa agents-md`, `ossa llms-txt`

Use `ossa --help` for the full list.

## Discovery and registry

OSSA defines agents; a **registry** is where agents are listed and queried. You can keep discovery local (workspace only) or publish to a shared registry API.

- **Local:** Run `ossa workspace discover` to scan `.agents/` and update `.agents-workspace/registry/index.yaml`. Use `ossa workspace list` to see agents in this repo.
- **Publish to a registry:** Run `ossa workspace publish --registry-url <base-url>` to POST the same discovery payload to `<base-url>/api/v1/discovery`. Any service that implements that contract (e.g. a mesh discovery API) can store and serve it; others can GET the same URL to list all published agents.
- **CI:** In GitLab CI, include the agents-ci template and set `MESH_URL` (or `AGENT_REGISTRY_URL`). The discover job will then POST to that URL so each pipeline run updates the registry.
- **Contract:** The registry API is a simple HTTP contract: **POST** `/api/v1/discovery` with body `{ source_id, workspace: { name, scanned_at }, projects: [{ name, path, agents }] }` to publish; **GET** `/api/v1/discovery` returns aggregated sources and projects. OSSA and other compatible tools use this same shape.

See [Agents workspace and registry](docs/getting-started/agents-workspace-registry.md) and [Discovery and registry](docs/wiki/Discovery-and-Registry.md) for details. 30+ additional commands (e.g. quickstart, scaffold, import, enhance, registry, migrate-batch, langchain, langflow, workspace, taxonomy, knowledge, audit) are available; run `ossa <command> --help` for any command.

## Honest Status Reporting

OSSA follows a strict status reporting policy:
- **Production** - Tested with >80% coverage, documented, used in production
- **Beta** - Functional but needs more testing or documentation
- **Alpha** - Experimental, may change significantly
- **Planned** - Designed but not yet implemented

All commands and exports report their status via `ossa export --list-platforms` and `ossa --help`. We don't oversell features or claim capabilities we haven't validated.

## Production Options

All mutation commands support:

```bash
--dry-run        # Preview without writing files
--verbose        # Detailed output
--quiet          # Minimal output (for scripts)
--json           # Machine-readable JSON output
--no-color       # CI-friendly (auto-detected)
--force          # Skip confirmations
--backup         # Backup before overwrite
```

## Documentation

- [OSSA CLI Reference](./docs/wiki/OSSA-CLI-Reference.md) - Full CLI command and export-platform reference (canonical for wikis)
- [Discovery and registry](./docs/wiki/Discovery-and-Registry.md) - Workspace discover, publish to registry API, CI, and contract
- [Agents workspace and registry](./docs/getting-started/agents-workspace-registry.md) - `.agents-workspace/` layout, sources, MCP/A2A
- [CHANGELOG](./CHANGELOG.md) - Release history
- [Examples](./examples) - Sample manifests
- [JSON Schema](./spec/v0.4/agent.schema.json) - Full spec
- [GitLab](https://gitlab.com/blueflyio/ossa/openstandardagents) - Source
- [GitHub Mirror](https://github.com/blueflyio/openstandardagents)

**Wiki publishing:** Wiki pages (OSSA-CLI-Reference, Discovery-and-Registry) are published from this repo. Run `npm run wiki:publish` (requires `GITLAB_TOKEN` or `GITLAB_PUSH_TOKEN`). Manifest: `.gitlab/wiki-publish-manifest.json`. To add a page, add an entry there and run the same command. No BuildKit dependency.

## License

Apache-2.0 - see [LICENSE](./LICENSE)
