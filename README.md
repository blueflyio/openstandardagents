# OSSA - Open Standard for Software Agents

A specification standard for defining, validating, and exporting AI agent manifests to multiple platforms. One YAML manifest, multiple deployment targets.

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
```

## What It Does

OSSA defines a YAML-based manifest format for AI agents (similar to how OpenAPI defines REST APIs). The CLI validates manifests against a JSON Schema and exports them to platform-specific packages.

### Manifest Format

```yaml
apiVersion: ossa/v0.4.4
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
```

| Platform | Output | Description |
|----------|--------|-------------|
| `docker` | 14 files | Dockerfile, docker-compose, scripts, healthchecks, docs |
| `kubernetes` | ~25 files | Kustomize base + overlays (dev/staging/prod), RBAC, monitoring |
| `crewai` | 18 files | Python crew with agents, tasks, tools, tests, examples |
| `langchain` | 6 files | Python + TypeScript agents, requirements, package.json |
| `kagent` | 10 files | kagent.dev CRD bundle with RBAC, NetworkPolicy |
| `gitlab-agent` | 30+ files | GitLab Duo flows, external agent, CI/CD, Docker |
| `npm` | 6 files | TypeScript package with manifest, README, types |
| `drupal` | 3-4 files | Manifest package for `ai_agents_ossa` module |
| `agent-skills` | 3 files | SKILL.md format for Claude Code and other AI tools |

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
  apiVersion: 'ossa/v0.4.4',
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
ossa lint <manifest>         # Lint for best practices
ossa diff <old> <new>        # Compare two manifests
ossa migrate <manifest> --to <version>  # Migrate between spec versions
ossa generate-gaid <manifest>           # Generate Global Agent ID
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
