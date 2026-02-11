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

## Revolutionary A2A (Agent-to-Agent) Communication

OSSA includes a comprehensive A2A system that extends the [Model Context Protocol (MCP)](https://spec.modelcontextprotocol.io/) with true multi-agent orchestration capabilities:

### Key Features

- **Swarm Intelligence** - Decompose complex tasks across agent pools with intelligent load balancing
- **Service Mesh** - Circuit breaking, health checking, and distributed tracing for agent reliability
- **Task Delegation** - SLA negotiation and monitoring between agents
- **MCP Integration** - Cross-language communication (TypeScript ↔ PHP ↔ Python)
- **Multiple Patterns** - Request-reply, broadcast, pub-sub, pipeline coordination

### Architectural Inspiration

OSSA's A2A implementation draws inspiration from:
- **Symfony MCP Bundle** - Enterprise-grade MCP integration patterns
- **PHP Foundation MCP SDK** - Collaboration between PHP Foundation and Symfony project for robust MCP support

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
```

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
```

### Migrating Between Versions

Upgrade manifests to the latest spec version:

```bash
# Migrate from older version to current
ossa migrate agent.ossa.yaml --to 0.4.5

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

## Production Status (v0.4.5)

### ✅ Production-Ready (Tested & Documented)

**Core CLI Commands**:
- `ossa validate` - Validate manifests against JSON Schema
- `ossa wizard` - Interactive manifest creation
- `ossa lint` - Best practice checking
- `ossa diff` - Compare two manifests
- `ossa migrate` - Migrate between spec versions
- `ossa generate-gaid` - Global Agent ID generation

**Production Platform Exports** (9 platforms):
- `docker` (14 files) - Dockerfile, docker-compose, healthchecks
- `kubernetes` (~25 files) - Kustomize base + overlays (dev/staging/prod)
- `crewai` (18 files) - Python crew with agents, tasks, tools
- `langchain` (6 files) - Python + TypeScript agents
- `kagent` (10 files) - kagent.dev CRD bundle
- `gitlab-agent` (30+ files) - GitLab Duo flows
- `npm` (6 files) - TypeScript package
- `drupal` (3-4 files) - Drupal module integration
- `agent-skills` (3 files) - SKILL.md for Claude Code

**TypeScript SDK**:
- Validation service (`@bluefly/openstandardagents/validation`)
- Type definitions (`@bluefly/openstandardagents/types`)
- JSON Schema access (`@bluefly/openstandardagents/schema`)

### 🚧 Beta (Functional but needs testing)

- `ossa agents-local` - Local `.agents/` folder management
- `ossa agents-md` - Generate agents.md files
- Runtime adapters (8 providers) - Anthropic, OpenAI, Gemini, Bedrock, Ollama, Mistral, Azure, Claude
- Export to `temporal` (1 file), `n8n` (1 file), `gitlab` (1 file)

### 🧪 Alpha (Experimental)

- OpenTelemetry metrics integration
- Agent analytics tracking
- GitLab Catalog integration (convert/list/search/info)
- Agent registry (publish/search)

### 📋 Planned

- Skills pipeline (`ossa skills generate/export/research`)
- Cross-format import (Oracle Agent Spec, agents.md, A2A Agent Cards)
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
apiVersion: ossa/v0.4.5
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

### Export Platforms

Export generates complete, runnable project scaffolds:

```bash
ossa export agent.ossa.yaml --platform <platform> --output ./output

# See all platforms and their status
ossa export --list-platforms
```

| Platform | Status | Output | Description |
|----------|--------|--------|-------------|
| `docker` | production | 14 files | Dockerfile, docker-compose, scripts, healthchecks, docs |
| `kubernetes` | production | ~25 files | Kustomize base + overlays (dev/staging/prod), RBAC, monitoring |
| `crewai` | production | 18 files | Python crew with agents, tasks, tools, tests, examples |
| `langchain` | production | 6 files | Python + TypeScript agents, requirements, package.json |
| `kagent` | production | 10 files | kagent.dev CRD bundle with RBAC, NetworkPolicy |
| `gitlab-agent` | production | 30+ files | GitLab Duo flows, external agent, CI/CD, Docker |
| `npm` | production | 6 files | TypeScript package with manifest, README, types |
| `drupal` | production | 3-4 files | Manifest package for `ai_agents_ossa` module |
| `agent-skills` | production | 3 files | SKILL.md format for Claude Code and other AI tools |
| `temporal` | beta | 1 file | Temporal workflow configuration |
| `n8n` | beta | 1 file | n8n workflow JSON export |
| `gitlab` | production | 1 file | GitLab CI/CD YAML configuration |

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
apiVersion: ossa/v0.4.5
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

**Production Commands** (Tested & Stable):
```bash
ossa wizard                  # Interactive manifest builder
ossa validate <manifest>     # Validate against schema
ossa export <manifest> -p <platform> -o <dir>   # Export to platform
ossa export --list-platforms  # Show all platforms with status
ossa lint <manifest>         # Lint for best practices
ossa diff <old> <new>        # Compare two manifests
ossa migrate <manifest> --to 0.4.5  # Migrate between spec versions
ossa generate-gaid <manifest>           # Generate Global Agent ID
```

**Beta Commands** (Functional but less tested):
```bash
ossa agents-local list       # List agents in .agents/ folder
ossa agents-md generate      # Generate agents.md files
```

Use `ossa --help` for the full command list.

## Honest Status Reporting

OSSA follows a strict status reporting policy:
- **Production** - Tested with >80% coverage, documented, used in production
- **Beta** - Functional but needs more testing or documentation
- **Alpha** - Experimental, may change significantly
- **Planned** - Not yet implemented

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

- [CHANGELOG](./CHANGELOG.md) - Release history
- [Examples](./examples) - Sample manifests
- [JSON Schema](./spec/v0.4/agent.schema.json) - Full spec
- [GitLab](https://gitlab.com/blueflyio/ossa/openstandardagents) - Source
- [GitHub Mirror](https://github.com/blueflyio/openstandardagents)

## License

Apache-2.0 - see [LICENSE](./LICENSE)
