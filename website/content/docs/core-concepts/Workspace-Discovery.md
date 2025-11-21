---
title: Workspace Agent Discovery
description: How OSSA agents are discovered across projects, modules, and workspaces
---

# Workspace Agent Discovery

OSSA defines a standard folder structure convention that enables tools to discover agents across projects, similar to how package managers discover modules or plugins.

## Overview

Just as OpenAPI defines where spec files go (`openapi.yaml`), OSSA defines where agent manifests go (`.agents/` folders). Tools can then scan these standard locations to discover and register agents.

**This is a standard, not an implementation.** Any tool can implement discovery by scanning for `.agents/` folders and `agent.ossa.yaml` files.

## Standard Folder Convention

### Basic Structure

```
project-root/
├── .agents/                    # Project-level agents (version controlled)
│   └── agent-name/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       ├── README.md          # Recommended: Documentation
│       └── data/              # Optional: Agent data files
└── .agents-workspace/         # Workspace registry (NOT version controlled)
    └── registry.json          # Auto-generated agent index
```

### Multi-Level Discovery

For projects with modules, packages, or components:

```
project-root/
├── .agents/                    # Project-level agents
│   └── project-agent/
│       └── agent.ossa.yaml
└── modules/                    # Example: Drupal modules, npm packages, etc.
    └── custom-module/
        └── .agents/           # Module-specific agents
            └── module-agent/
                ├── agent.ossa.yaml
                └── README.md
```

## Discovery Pattern

### How Tools Discover Agents

1. **Scan for `.agents/` folders**
   - Recursively or at specific directory levels
   - Respect project structure (don't require specific layouts)

2. **Look for manifest files**
   - Check for `agent.ossa.yaml` (preferred)
   - Also check for `agent.yml` (alternative)

3. **Validate manifests**
   - Use OSSA schema validation
   - Handle errors gracefully (invalid manifests don't break discovery)

4. **Build registry**
   - Create index of discovered agents
   - Include metadata: name, capabilities, taxonomy, location

5. **Enable discovery features**
   - Find agents by capability
   - Filter by taxonomy (domain, role)
   - Route tasks to appropriate agents

## Ecosystem Examples

### Drupal

```
drupal-site/
├── .agents/                    # Site-level agents
│   └── site-orchestrator/
│       └── agent.ossa.yaml
└── modules/
    └── custom/
        ├── commerce-module/
        │   └── .agents/
        │       └── order-processor/
        │           ├── agent.ossa.yaml
        │           └── README.md
        └── content-module/
            └── .agents/
                └── content-generator/
                    ├── agent.ossa.yaml
                    └── README.md
```

**Discovery**: Drupal core scans `modules/*/.agents/` to discover module-specific agents. Site-level agents in `.agents/` are always available.

### WordPress

```
wordpress-site/
├── .agents/
│   └── site-agent/
│       └── agent.ossa.yaml
└── wp-content/
    └── plugins/
        └── my-plugin/
            └── .agents/
                └── plugin-agent/
                    ├── agent.ossa.yaml
                    └── README.md
```

**Discovery**: WordPress core scans `wp-content/plugins/*/.agents/` and `wp-content/themes/*/.agents/` to discover plugin/theme agents.

### Laravel

```
laravel-app/
├── .agents/
│   └── app-agent/
│       └── agent.ossa.yaml
└── packages/
    └── my-package/
        └── .agents/
            └── package-agent/
                ├── agent.ossa.yaml
                └── README.md
```

**Discovery**: Laravel service providers can scan `packages/*/.agents/` and register agents via service container.

### React/Next.js

```
nextjs-app/
├── .agents/
│   └── app-agent/
│       └── agent.ossa.yaml
└── components/
    └── my-component/
        └── .agents/
            └── component-agent/
                ├── agent.ossa.yaml
                └── README.md
```

**Discovery**: Next.js can scan `components/*/.agents/` and `app/*/.agents/` to discover component-level agents.

### Python Package

```
python-package/
├── .agents/
│   └── package-agent/
│       └── agent.ossa.yaml
└── my_package/
    └── .agents/
        └── module-agent/
            ├── agent.ossa.yaml
            └── README.md
```

**Discovery**: Python packages can include agents in their distribution, discoverable via `importlib` or package metadata.

### Node.js/npm

```
npm-package/
├── .agents/
│   └── package-agent/
│       └── agent.ossa.yaml
├── src/
└── package.json
```

**Discovery**: npm packages can include `.agents/` in their distribution. Tools scan `node_modules/*/.agents/` to discover package agents.

### Monorepo

```
monorepo/
├── .agents-workspace/
│   └── registry.json          # Workspace-level registry
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

**Discovery**: Workspace orchestrator scans all packages for agents and builds workspace-level registry.

## Using Taxonomy for Discovery

OSSA v0.2.4's taxonomy feature enables capability-based discovery:

```yaml
apiVersion: ossa/v0.2.4
kind: Agent

metadata:
  name: order-processor
  # ...

spec:
  # ... agent spec ...
  
  # Taxonomy enables discovery
  taxonomy:
    domain: e-commerce
    subdomain: order-management
    capabilities:
      - process-order
      - validate-payment
      - send-confirmation
```

**Discovery queries:**
- Find all agents in `e-commerce` domain
- Find agents with `process-order` capability
- Find agents in `order-management` subdomain

## Workspace Orchestrator

A workspace orchestrator agent can:

1. **Discover all agents** in the workspace
2. **Build capability index** from taxonomy
3. **Route tasks** to appropriate agents
4. **Coordinate multi-agent workflows**
5. **Manage agent state** using v0.2.4 state management

Example orchestrator manifest:

```yaml
apiVersion: ossa/v0.2.4
kind: Agent

metadata:
  name: workspace-orchestrator
  description: Coordinates agents across the workspace

spec:
  role: |
    You are a workspace orchestrator that discovers and coordinates
    agents across the project. Route tasks to appropriate agents based
    on their capabilities and taxonomy.
  
  state:
    mode: session
    storage:
      type: kv
      retention: 7d
      config:
        provider: redis
        key_prefix: workspace:agents
  
  tools:
    - type: function
      name: discover_agents
      description: Scan workspace for .agents/ folders and discover agents
    - type: function
      name: find_agent_by_capability
      description: Find agents with specific capabilities
    - type: function
      name: route_task
      description: Route task to appropriate agent
```

## Best Practices

### ✅ DO

- **Use standard folder structure** - `.agents/` at project and module levels
- **Include README.md** - Document what each agent does
- **Use taxonomy** - Enable capability-based discovery
- **Version your manifests** - Use semantic versioning
- **Keep manifests simple** - Required files only, optional structure for organization

### ❌ DON'T

- **Don't require specific layouts** - Tools should adapt to project structure
- **Don't put runtime data in `.agents/`** - Use `.agents-workspace/` instead
- **Don't commit `.agents-workspace/`** - Add to `.gitignore`
- **Don't hardcode paths** - Use relative paths in manifests

## Tool Implementation

Tools implementing discovery should:

1. **Respect project structure** - Don't require specific layouts
2. **Support both file names** - Check for both `agent.ossa.yaml` and `agent.yml`
3. **Validate manifests** - Use OSSA schema validation
4. **Handle errors gracefully** - Invalid manifests shouldn't break discovery
5. **Cache results** - Build registry/index for performance
6. **Support wildcard versions** - Handle `ossa/v0.2.x` in apiVersion

## Related Documentation

- [Agent Folder Structure Standard](/docs/agent-folder-structure)
- [Project Structure](/docs/core-concepts/Project-Structure)
- [Taxonomy Reference](/docs/schema-reference/taxonomy)
- [Ecosystem Guides](/docs/ecosystems/)

