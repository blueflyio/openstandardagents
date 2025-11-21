# OSSA Agent Folder Structure Standard

## Overview

This document defines the standard folder structure convention for organizing OSSA agents in projects. Similar to how OpenAPI defines where spec files go (`openapi.yaml`, `swagger.json`), OSSA defines where agent manifests go (`.agents/` folders).

**This is a standard, not an implementation.** Tools and runtimes implement discovery by scanning for these standard locations.

## Standard Convention

### Project-Level Agents

```
project-root/
└── .agents/                    # Project-level agents (version controlled)
    └── agent-name/            # Each agent in its own folder
        ├── agent.ossa.yaml    # Required: OSSA manifest
        ├── README.md          # Recommended: Agent documentation
        └── data/              # Optional: Agent-specific data files
```

### Module/Component-Level Agents

For projects with modules, packages, or components (Drupal modules, npm packages, Python packages, etc.):

```
project-root/
├── .agents/                    # Project-level agents
│   └── project-agent/
│       └── agent.ossa.yaml
└── modules/                    # Example: Drupal modules
    └── custom-module/
        └── .agents/           # Module-specific agents
            └── module-agent/
                ├── agent.ossa.yaml
                └── README.md
```

### Workspace-Level Discovery (Optional)

For workspace-level orchestration and discovery:

```
project-root/
└── .agents-workspace/         # Workspace registry (NOT version controlled)
    └── registry.json          # Auto-generated agent index
```

## Agent Folder Contents

### Required Files

- **`agent.ossa.yaml`** or **`agent.yml`** - OSSA manifest file
  - Must be valid OSSA v0.2.4+ manifest
  - Contains agent metadata, spec, tools, etc.

### Recommended Files

- **`README.md`** - Agent documentation
  - What the agent does
  - How to use it
  - Capabilities and examples
  - Configuration requirements

### Optional Files/Folders

- **`data/`** - Agent-specific data files
  - JSON schemas
  - Example data
  - Configuration templates
  - Reference files

- **`tests/`** - Agent-specific tests
  - Unit tests
  - Integration tests
  - Validation tests

- **`examples/`** - Usage examples
  - Example requests
  - Sample workflows
  - Integration patterns

- **`.env.example`** - Environment variable template
  - Required environment variables
  - Example values (no secrets)

## Naming Conventions

### Folder Names

- Use kebab-case: `my-agent`, `data-processor`, `customer-support`
- DNS-1123 compatible (for Kubernetes compatibility)
- Lowercase letters, numbers, and hyphens only
- Must start and end with alphanumeric character
- Maximum 253 characters

### Manifest File Names

- Preferred: `agent.ossa.yaml`
- Alternative: `agent.yml`
- Tools should check for both

## Discovery Pattern

Tools discover agents by:

1. Scanning for `.agents/` folders (recursively or at specific levels)
2. Looking for `agent.ossa.yaml` or `agent.yml` files within those folders
3. Validating manifests against OSSA schema
4. Building registry/index of discovered agents

### Discovery Scope

- **Project-level**: Scan `project-root/.agents/`
- **Module-level**: Scan `modules/*/.agents/`, `packages/*/.agents/`, etc.
- **Workspace-level**: Scan entire workspace for all `.agents/` folders

## Version Control

- **`.agents/`** - ✅ **Version controlled** (commit to git)
  - Agent definitions are source code
  - Shareable across teams
  - Reproducible deployments

- **`.agents-workspace/`** - ❌ **NOT version controlled** (add to `.gitignore`)
  - Runtime data, logs, state
  - Environment-specific
  - May contain secrets

## Examples

### Simple Project

```
my-project/
├── .agents/
│   └── support-agent/
│       ├── agent.ossa.yaml
│       └── README.md
└── src/
```

### Drupal Module

```
drupal-site/
├── .agents/
│   └── site-agent/
│       └── agent.ossa.yaml
└── modules/
    └── custom/
        └── my-module/
            └── .agents/
                └── module-agent/
                    ├── agent.ossa.yaml
                    └── README.md
```

### npm Package

```
my-package/
├── .agents/
│   └── package-agent/
│       ├── agent.ossa.yaml
│       ├── README.md
│       └── data/
│           └── schemas/
└── package.json
```

### Monorepo

```
monorepo/
├── .agents-workspace/
│   └── registry.json
├── packages/
│   ├── package-a/
│   │   └── .agents/
│   │       └── agent-a/
│   │           └── agent.ossa.yaml
│   └── package-b/
│       └── .agents/
│           └── agent-b/
│               └── agent.ossa.yaml
└── .agents/
    └── workspace-orchestrator/
        └── agent.ossa.yaml
```

## v0.2.4 Features That Support This

- **Taxonomy** - Agents can be categorized for discovery (domain, subdomain, capabilities)
- **State Management** - Workspace orchestrator can manage discovered agents
- **Transport Metadata** - Agents can communicate via standard protocols
- **Security Scopes** - Fine-grained permissions for workspace access

## Tool Implementation Notes

Tools implementing discovery should:

1. **Respect project structure** - Don't require specific layouts
2. **Support both file names** - Check for both `agent.ossa.yaml` and `agent.yml`
3. **Validate manifests** - Use OSSA schema validation
4. **Handle errors gracefully** - Invalid manifests shouldn't break discovery
5. **Cache results** - Build registry/index for performance
6. **Support wildcard versions** - Handle `ossa/v0.2.x` in apiVersion

## Related Documentation

- [OSSA Specification](../spec/v0.2.4/README.md)
- [Project Structure Guide](../website/content/docs/core-concepts/Project-Structure.md)
- [Workspace Discovery](../website/content/docs/core-concepts/Workspace-Discovery.md)

