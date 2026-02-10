# OSSA - Open Standard for Software Agents

> **Development happens on [GitLab](https://gitlab.com/blueflyio/ossa/openstandardagents).** This repo is a read-only mirror.
> [Source](https://gitlab.com/blueflyio/ossa/openstandardagents) | [Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues) | [npm](https://www.npmjs.com/package/@bluefly/openstandardagents)

A specification standard for defining, validating, and exporting AI agent manifests to multiple platforms. One YAML manifest, multiple deployment targets.

OSSA is the infrastructure middle layer for agents - not another protocol, not another framework, but the missing bridge for agent packaging and distribution.

[![npm version](https://badge.fury.io/js/%40bluefly%2Fopenstandardagents.svg)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Install

```bash
npm install -g @bluefly/openstandardagents
```

## Quick Start

```bash
# Create an agent manifest interactively
ossa wizard -o my-agent.ossa.yaml

# Validate it
ossa validate my-agent.ossa.yaml

# Export to a platform
ossa export my-agent.ossa.yaml --platform docker --output ./docker-deploy

# See all export platforms
ossa export --list-platforms
```

## What Works (0.4.5)

These features are tested and production-ready:

- **Validation** - Validate manifests against JSON Schema (`ossa validate`)
- **Export** - 9 platform adapters generating complete project scaffolds:
  - `docker` (14 files), `kubernetes` (~25 files Kustomize), `crewai` (18 files)
  - `langchain` (6 files), `kagent` (10 files CRD bundle), `gitlab-agent` (30+ files)
  - `npm` (6 files), `drupal` (3-4 files), `agent-skills` (SKILL.md)
- **Interactive Wizard** - Guided manifest creation (`ossa wizard`)
- **Lint** - Best practice checking (`ossa lint`)
- **Diff** - Compare two manifests (`ossa diff`)
- **Local Agent Management** - `.agents/` folder management (`ossa agents-local`)
- **8 Runtime Adapters** - Anthropic, OpenAI, Gemini, Bedrock, Ollama, Mistral, Azure, Claude
  - Full SDK integration for chat and tool execution
- **GAID** - Global Agent ID generation (`ossa generate-gaid`)
- **Schema** - JSON Schema validation for OSSA v0.3/v0.4 manifests
- **AGENTS.md Generation** - Generate agents.md standard files (`ossa agents-md`)

## In Progress

Features that exist but need more work:

- **OpenTelemetry Metrics** - Agent observability instrumentation (partial)
- **Analytics** - Agent performance tracking (needs GitLab API integration)
- **Catalog** - GitLab Catalog integration (convert, list, search, info work; push/pull/sync removed)
- **Registry** - Agent registry publish/search (basic implementation)

## Planned

- **Skills Pipeline** - `ossa skills generate/export/research` for Claude Skills
- **Cross-Format Import** - Import from Oracle Agent Spec, agents.md, A2A Agent Cards
- **Catalog Sync** - Full GitLab Catalog push/pull with API integration

## What It Does

OSSA defines a YAML-based manifest format for AI agents (similar to how OpenAPI defines REST APIs). The CLI validates manifests against a JSON Schema and exports them to platform-specific packages.

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
  metadata: { name: 'my-agent', version: '1.0.0' },
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

## CLI Commands

```bash
ossa wizard                  # Interactive manifest builder
ossa validate <manifest>     # Validate against schema
ossa export <manifest> -p <platform> -o <dir>   # Export to platform
ossa export --list-platforms  # Show all platforms with status
ossa lint <manifest>         # Lint for best practices
ossa diff <old> <new>        # Compare two manifests
ossa migrate <manifest> --to 0.4.5  # Migrate between spec versions
ossa migrate <manifest> --list      # List available transforms
ossa generate-gaid <manifest>           # Generate Global Agent ID
ossa agents-local list       # List agents in .agents/ folder
```

Use `ossa --help` for the full command list.

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
