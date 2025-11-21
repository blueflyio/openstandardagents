# Monorepo with OSSA Agents

This example demonstrates how to organize OSSA agents within a monorepo using the standard `.agents/` folder structure and workspace-level orchestration.

## Structure

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

## Agent Examples

- **package-a/agent-a** - Example agent from package-a
- **package-b/agent-b** - Example agent from package-b
- **workspace-orchestrator** - Coordinates all agents in the workspace

## Usage

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

### Route Tasks

```typescript
// Use orchestrator to route tasks
const orchestrator = await loadOrchestrator();
const result = await orchestrator.routeTask(task, {
  requiredCapabilities: ['example-capability-a'],
});
```

## Related

- [OSSA Monorepo Integration Guide](../../../../website/content/docs/ecosystems/monorepo-agents.md)
- [Workspace Discovery](../../../../website/content/docs/core-concepts/Workspace-Discovery.md)

