---
title: Agent Organization Best Practices
description: Best practices for organizing OSSA agents in projects
---

# Agent Organization Best Practices

This guide covers best practices for organizing OSSA agents in projects, including when to use project-level vs module-level agents, naming conventions, and versioning strategies.

## Project-Level vs Module-Level Agents

### Use Project-Level Agents For

- **Cross-module orchestration** - Agents that coordinate multiple modules
- **Workspace-level functionality** - Agents that operate at the project level
- **Shared utilities** - Agents used by multiple modules
- **Site-wide features** - Agents that provide site-wide functionality

**Location**: `project-root/.agents/`

### Use Module-Level Agents For

- **Module-specific functionality** - Agents that are specific to a module/package
- **Isolated features** - Agents that don't need cross-module coordination
- **Package distribution** - Agents included in distributed packages

**Location**: `modules/*/.agents/`, `packages/*/.agents/`, etc.

## Naming Conventions

### Folder Names

- **Use kebab-case**: `my-agent`, `data-processor`, `customer-support`
- **DNS-1123 compatible**: Lowercase letters, numbers, and hyphens only
- **Must start and end with alphanumeric**: No leading/trailing hyphens
- **Maximum 253 characters**: For Kubernetes compatibility

**Examples:**
- ✅ `order-processor`
- ✅ `customer-support-agent`
- ❌ `OrderProcessor` (use kebab-case)
- ❌ `my_agent` (use hyphens, not underscores)

### Manifest File Names

- **Preferred**: `agent.ossa.yaml`
- **Alternative**: `agent.yml`
- Tools should check for both

## Versioning Strategies

### Agent Manifest Versioning

Use semantic versioning in agent manifests:

```yaml
metadata:
  name: my-agent
  version: 1.2.3  # MAJOR.MINOR.PATCH
```

### Version Compatibility

- **Major version changes**: Breaking changes to agent interface
- **Minor version changes**: New features, backward compatible
- **Patch version changes**: Bug fixes, backward compatible

### OSSA API Version

Use flexible versioning in `apiVersion`:

```yaml
apiVersion: ossa/v0.2.4  # Specific version
apiVersion: ossa/v0.2.x  # Latest patch in 0.2.x
apiVersion: ossa/v0.2    # Latest in 0.2 series
```

## Folder Structure

### Required Files

- **`agent.ossa.yaml`** or **`agent.yml`** - OSSA manifest (required)

### Recommended Files

- **`README.md`** - Agent documentation (recommended)
  - What the agent does
  - How to use it
  - Capabilities and examples
  - Configuration requirements

### Optional Files/Folders

- **`data/`** - Agent-specific data files
  - JSON schemas
  - Example data
  - Configuration templates

- **`tests/`** - Agent-specific tests
  - Unit tests
  - Integration tests
  - Validation tests

- **`examples/`** - Usage examples
  - Example requests
  - Sample workflows
  - Integration patterns

## Taxonomy for Discovery

Use taxonomy to enable capability-based discovery:

```yaml
spec:
  taxonomy:
    domain: e-commerce
    subdomain: order-management
    capabilities:
      - process-order
      - validate-payment
      - send-confirmation
```

### Best Practices

- **Use consistent domain names** across agents
- **Define clear capabilities** for each agent
- **Use subdomains** for fine-grained categorization
- **Document taxonomy** in agent README

## Version Control

### ✅ DO Commit

- **`.agents/`** - Agent definitions are source code
- **`README.md`** - Documentation
- **`data/`** - Reference data and schemas

### ❌ DON'T Commit

- **`.agents-workspace/`** - Runtime data, logs, state
- **Generated files** - Auto-generated registries
- **Secrets** - API keys, tokens, credentials

### .gitignore Example

```gitignore
# OSSA runtime workspace (never commit this!)
.agents-workspace/

# Keep agent definitions (DO commit this)
# .agents/  # <-- NOT ignored, should be committed
```

## Documentation

### Agent README.md Template

```markdown
# Agent Name

## Purpose

Brief description of what the agent does.

## Capabilities

- Capability 1
- Capability 2
- Capability 3

## Usage

### In [Ecosystem]

```[language]
// Example usage
```

### Standalone

```bash
ossa run .agents/agent-name/agent.ossa.yaml --tool tool_name
```

## Tools

- `tool_name` - Description

## Configuration

- **LLM**: Provider and model
- **State**: Storage type and retention
- **Taxonomy**: Domain and capabilities
- **Security**: Auth scopes

## Related

- [Related Documentation](/docs/...)
```

## Examples

See ecosystem-specific examples:

- [Drupal Example](../../../../examples/drupal/module-with-agents/)
- [WordPress Example](../../../../examples/wordpress/plugin-with-agents/)
- [Laravel Example](../../../../examples/laravel/package-with-agents/)
- [React Example](../../../../examples/react/component-with-agents/)
- [Python Example](../../../../examples/python/package-with-agents/)
- [Node.js Example](../../../../examples/nodejs/package-with-agents/)
- [Monorepo Example](../../../../examples/monorepo/workspace-agents/)

## Related

- [Workspace Discovery](/docs/core-concepts/Workspace-Discovery)
- [Project Structure](/docs/core-concepts/Project-Structure)
- [Ecosystem Guides](/docs/ecosystems/)

