<!--
OSSA Development Guide
Purpose: Guide for developing with OSSA
Audience: Developers building OSSA-compliant systems
Educational Focus: Development workflow and best practices
-->

# Development Guide

## Development Workflow

### 1. Design Agent
Start with agent definition.

```json
{
  "ossa": "0.2.6",
  "agent": {
    "name": "my-agent",
    "version": "1.0.0",
    "description": "Agent description",
    "role": "worker",
    "capabilities": [...]
  }
}
```

### 2. Validate
```bash
ossa validate agent.json --strict
```

### 3. Generate Types
```bash
ossa generate types agent.json --output ./src/types
```

### 4. Implement
```typescript
import { MyAgentTypes } from './types/agent.types';

class MyAgent {
  async execute(input: MyAgentTypes.Input): Promise<MyAgentTypes.Output> {
    // Implementation
  }
}
```

### 5. Test
```typescript
describe('MyAgent', () => {
  it('should execute capability', async () => {
    const agent = new MyAgent();
    const result = await agent.execute(input);
    expect(result).toBeDefined();
  });
});
```

## Local Development

### Watch Mode
```bash
npm run dev
```

### Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Debugging

### Validation Errors
```bash
ossa validate agent.json --format json > errors.json
```

### Type Generation Issues
```bash
ossa generate types agent.json --verbose
```

## Best Practices

1. **Validate Early** - Check definitions during development
2. **Use Types** - Generate and use TypeScript types
3. **Test Thoroughly** - Unit, integration, and E2E tests
4. **Version Carefully** - Follow semantic versioning
5. **Document Well** - Add descriptions to all fields

---

**Next**: [Deployment](deployment.md) for production deployment
