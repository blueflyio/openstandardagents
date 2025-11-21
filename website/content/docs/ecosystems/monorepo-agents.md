---
title: OSSA Agents in Monorepos
description: How to organize and discover OSSA agents across a monorepo workspace
---

# OSSA Agents in Monorepos

This guide explains how to organize and discover OSSA agents within a monorepo using the standard `.agents/` folder structure and workspace-level orchestration.

## Folder Structure

```
monorepo/
├── .agents-workspace/          # Workspace registry (NOT version controlled)
│   └── registry.json          # Auto-generated agent index
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
        ├── agent.ossa.yaml
        └── README.md
```

## Discovery

Workspace orchestrator scans all packages for agents and builds workspace-level registry. The `.agents-workspace/registry.json` is auto-generated and contains an index of all discovered agents.

### Discover All Agents

```typescript
// In workspace orchestrator
import { discoverAgents } from '@ossa/monorepo';

// Scan all packages
const agents = await discoverAgents({
  rootDir: process.cwd(),
  packages: ['packages/*'],
});

// Build registry
const registry = buildRegistry(agents);
await writeRegistry('.agents-workspace/registry.json', registry);
```

## Using Agents

### Route Tasks

```typescript
// Use orchestrator to route tasks
import { loadOrchestrator } from '@ossa/monorepo';

const orchestrator = await loadOrchestrator();
const result = await orchestrator.routeTask(task, {
  requiredCapabilities: ['process-order', 'validate-payment'],
});
```

### Coordinate Workflows

```typescript
// Coordinate multi-agent workflow
const workflow = await orchestrator.coordinateWorkflow([
  { agent: 'agent-a', task: 'task-1' },
  { agent: 'agent-b', task: 'task-2' },
]);
```

## Example: Workspace Orchestrator

See [examples/monorepo/workspace-agents/.agents/workspace-orchestrator/](../../../../examples/monorepo/workspace-agents/.agents/workspace-orchestrator/) for a complete example.

## Best Practices

- **Use package-level agents** for package-specific functionality
- **Use workspace-level orchestrator** for cross-package coordination
- **Auto-generate registry** in `.agents-workspace/registry.json`
- **Don't commit `.agents-workspace/`** (add to `.gitignore`)
- **Use taxonomy** to enable capability-based discovery

## Related

- [Workspace Discovery](/docs/core-concepts/Workspace-Discovery)
- [Project Structure](/docs/core-concepts/Project-Structure)
- [Example: Monorepo](../../../../examples/monorepo/workspace-agents/)

