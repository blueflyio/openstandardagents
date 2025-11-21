# React Component with OSSA Agents

This example demonstrates how to organize OSSA agents within a React component library using the standard `.agents/` folder structure.

## Structure

```
my-component/
├── .agents/                    # Component-specific agents
│   └── component-agent/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── Component.tsx
└── index.ts
```

## Discovery

Next.js can scan `components/*/.agents/` and `app/*/.agents/` to discover component-level agents. The OSSA React integration automatically discovers and registers agents.

## Agent Example

See `.agents/component-agent/` for a complete example of a component interaction agent.

## Usage

### Enable Agent Discovery

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

### Use Agent in Component

```typescript
// In Component.tsx
import { useAgent } from '@ossa/react';

export function MyComponent() {
  const agent = useAgent('component-agent', 'my-component');
  
  const handleSubmit = async (data) => {
    const isValid = await agent.validateForm(data);
    if (isValid) {
      await agent.processInput(data);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Related

- [OSSA React Integration Guide](../../../../website/content/docs/ecosystems/react-agents.md)
- [Workspace Discovery](../../../../website/content/docs/core-concepts/Workspace-Discovery.md)

