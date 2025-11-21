---
title: OSSA Agents in React/Next.js
description: How to organize and discover OSSA agents in React components and Next.js apps
---

# OSSA Agents in React/Next.js

This guide explains how to organize and discover OSSA agents within React components and Next.js applications using the standard `.agents/` folder structure.

## Folder Structure

### Component-Level Agents

```
components/my-component/
├── .agents/                    # Component-specific agents
│   └── component-agent/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── Component.tsx
└── index.ts
```

### App-Level Agents

```
nextjs-app/
├── .agents/                    # App-level agents
│   └── app-agent/
│       └── agent.ossa.yaml
├── app/
└── components/
```

## Discovery

Next.js can scan `components/*/.agents/` and `app/*/.agents/` to discover component-level agents. The OSSA React integration automatically discovers and registers agents.

### Enable Discovery

```typescript
// In next.config.js
const { discoverAgents } = require('@ossa/next');

module.exports = {
  // Discover agents from components
  webpack: (config) => {
    discoverAgents('./components');
    return config;
  },
};
```

## Using Agents

### Use Agent in Component

```typescript
// In Component.tsx
import { useAgent } from '@ossa/react';

export function MyComponent() {
  const agent = useAgent('component-agent', 'my-component');
  
  const handleSubmit = async (data) => {
    const result = await agent.processTask(data);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Discover All Component Agents

```typescript
// Discover all agents in components
import { discoverAgents } from '@ossa/react';

const agents = await discoverAgents('./components');
```

## Example: Component Agent

See [examples/react/component-with-agents/.agents/component-agent/](../../../../examples/react/component-with-agents/.agents/component-agent/) for a complete example.

## Best Practices

- **Use component-level agents** for component-specific functionality
- **Use app-level agents** for application-wide orchestration
- **Include README.md** in each agent folder
- **Use taxonomy** to enable capability-based discovery
- **Use React hooks** for agent access

## Related

- [Workspace Discovery](/docs/core-concepts/Workspace-Discovery)
- [Project Structure](/docs/core-concepts/Project-Structure)
- [Example: React Component](../../../../examples/react/component-with-agents/)

