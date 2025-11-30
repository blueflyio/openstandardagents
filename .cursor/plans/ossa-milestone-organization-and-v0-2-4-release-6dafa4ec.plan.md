<!-- 6dafa4ec-9743-4ced-ba80-9a9b0ed7bd06 5a59e316-a66c-420b-9757-7f356aefc6d1 -->
# OSSA Agent Folder Structure Standard

## Overview

Define a simple, standard folder structure convention for organizing OSSA agents in projects. Similar to how OpenAPI defines where spec files go, OSSA defines where agent manifests go. Tools can then discover agents by scanning these standard locations.

## Standard Definition

### Folder Structure Convention

```
project-root/
├── .agents/                    # Project-level agents (version controlled)
│   └── agent-name/            # Each agent in its own folder
│       ├── agent.ossa.yaml    # Required: OSSA manifest (or agent.yml)
│       ├── README.md          # Recommended: Agent documentation
│       └── data/              # Optional: Agent-specific data files
│
└── modules/                    # Example: Drupal modules
    └── custom-module/
        └── .agents/           # Module-specific agents
            └── module-agent/
                ├── agent.ossa.yaml
                └── README.md
```

### Agent Folder Contents

**Required:**

- `agent.ossa.yaml` or `agent.yml` - OSSA manifest file

**Recommended:**

- `README.md` - What the agent does, how to use it

**Optional:**

- `data/` - JSON schemas, example data, configuration files
- `tests/` - Agent-specific tests
- `examples/` - Usage examples

### Workspace Discovery (Optional)

For workspace-level orchestration:

```
project-root/
└── .agents-workspace/         # Workspace registry (NOT version controlled)
    └── registry.json          # Auto-generated agent index
```

## Implementation Plan

### Phase 1: Document the Standard

1. **Create agent folder structure spec**

   - File: `docs/agent-folder-structure.md`
   - Define required vs optional files
   - Document naming conventions
   - Keep it simple - just the convention

2. **Update Project Structure docs**

   - File: `website/content/docs/core-concepts/Project-Structure.md`
   - Add agent folder structure section
   - Show Drupal-like ecosystem example
   - Explain discovery pattern (tools scan for `.agents/` folders)

### Phase 2: Create Multi-Ecosystem Examples

1. **Drupal example**

   - File: `examples/drupal/module-with-agents/`
   - Show module with `.agents/` folder
   - Demonstrate discovery pattern

2. **WordPress example**

   - File: `examples/wordpress/plugin-with-agents/`
   - Show plugin with `.agents/` folder
   - WordPress-specific agent patterns

3. **Laravel example**

   - File: `examples/laravel/package-with-agents/`
   - Show Laravel package with `.agents/` folder
   - Service provider integration

4. **React/Next.js example**

   - File: `examples/react/component-with-agents/`
   - Show React component library with `.agents/` folder
   - Component-level agents

5. **Python package example**

   - File: `examples/python/package-with-agents/`
   - Show Python package with `.agents/` folder
   - Package distribution pattern

6. **Node.js/npm example**

   - File: `examples/nodejs/package-with-agents/`
   - Show npm package with `.agents/` folder
   - Package.json integration

7. **Monorepo example**

   - File: `examples/monorepo/workspace-agents/`
   - Show workspace-level `.agents-workspace/` with multiple packages
   - Cross-package agent discovery

### Phase 3: Documentation

1. **Workspace Discovery guide**

   - File: `website/content/docs/core-concepts/Workspace-Discovery.md`
   - Explain the standard (not implementation)
   - Show examples across ecosystems
   - Document how tools discover agents

2. **Ecosystem-specific guides**

   - File: `website/content/docs/ecosystems/drupal-agents.md`
   - File: `website/content/docs/ecosystems/wordpress-agents.md`
   - File: `website/content/docs/ecosystems/laravel-agents.md`
   - File: `website/content/docs/ecosystems/react-agents.md`
   - File: `website/content/docs/ecosystems/python-agents.md`
   - File: `website/content/docs/ecosystems/nodejs-agents.md`
   - File: `website/content/docs/ecosystems/monorepo-agents.md`

3. **Best practices guide**

   - File: `website/content/docs/guides/agent-organization.md`
   - When to use project-level vs module-level agents
   - Naming conventions
   - Versioning strategies

### Phase 4: Playground Enhancements

1. **Agent Discovery Visualizer**

   - Add to playground: Visual tree of discovered agents
   - Show `.agents/` folder structure
   - Display agent metadata (name, capabilities, taxonomy)

2. **Workspace Structure Viewer**

   - Add to playground: Interactive workspace explorer
   - Show hierarchical agent organization
   - Filter by ecosystem, domain, capability

3. **Agent Capability Browser**

   - Add to playground: Browse agents by capability
   - Search by taxonomy (domain, subdomain)
   - Show agent relationships

4. **Discovery Simulator**

   - Add to playground: Simulate agent discovery
   - Upload workspace structure
   - See discovered agents and registry

### Phase 5: Update Existing Examples

1. **Update .gitlab/agents/**

   - Ensure all agents follow folder structure
   - Add README.md to each agent if missing
   - Show proper organization

## v0.2.4 Features That Support This

- **Taxonomy** - Agents can be categorized for discovery (domain, subdomain)
- **State Management** - Workspace orchestrator can manage discovered agents
- **Transport Metadata** - Agents can communicate via standard protocols
- **Security Scopes** - Fine-grained permissions for workspace access

## Files to Create/Modify

### New Files

- `docs/agent-folder-structure.md` - Standard specification
- `website/content/docs/core-concepts/Workspace-Discovery.md` - User guide
- `examples/drupal/module-with-agents/` - Drupal example
- `examples/wordpress/plugin-with-agents/` - WordPress example
- `examples/laravel/package-with-agents/` - Laravel example
- `examples/react/component-with-agents/` - React example
- `examples/python/package-with-agents/` - Python example
- `examples/nodejs/package-with-agents/` - Node.js example
- `examples/monorepo/workspace-agents/` - Monorepo example
- `website/content/docs/ecosystems/*.md` - Ecosystem-specific guides
- `website/content/docs/guides/agent-organization.md` - Best practices

### Modified Files

- `website/content/docs/core-concepts/Project-Structure.md` - Add agent folder section
- `.gitlab/agents/*/README.md` - Ensure all agents have READMEs
- `website/app/playground/page.tsx` - Add discovery visualizer, workspace viewer, capability browser

### To-dos

- [x] Audit all website pages and documentation for v0.2.4 updates
- [x] Update all version references from v0.2.3 to v0.2.4 across website
- [x] Update schema page to show v0.2.4 schema and examples
- [x] Update specification page with v0.2.4 features
- [x] Update getting started guides with v0.2.4 examples
- [x] Update migration guides for v0.2.4
- [x] Update all examples to use v0.2.4 apiVersion
- [x] Build out missing documentation for v0.2.4 features