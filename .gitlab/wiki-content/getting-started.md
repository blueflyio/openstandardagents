<!--
OSSA Getting Started Guide
Purpose: Quick start guide for new users
Audience: Developers new to OSSA
Educational Focus: Fast path to first agent
-->

# Getting Started

## What You'll Learn

- Install OSSA CLI
- Create your first agent
- Validate and generate types
- Understand core concepts

## Prerequisites

- Node.js 18+ installed
- Basic JSON knowledge
- Text editor or IDE

## Installation

### NPM (Recommended)

```bash
npm install -g @bluefly/openstandardagents
```

### Verify Installation

```bash
ossa --version
# Output: 0.2.6
```

## Your First Agent

### 1. Create Agent Definition

Create `my-agent.json`:

```json
{
  "ossa": "0.3.0",
  "agent": {
    "name": "hello-agent",
    "version": "1.0.0",
    "description": "My first OSSA agent",
    "role": "worker",
    "capabilities": [
      {
        "name": "greet",
        "type": "query",
        "description": "Greet a user",
        "input": {
          "type": "object",
          "required": ["name"],
          "properties": {
            "name": { "type": "string" }
          }
        },
        "output": {
          "type": "object",
          "required": ["greeting"],
          "properties": {
            "greeting": { "type": "string" }
          }
        }
      }
    ]
  }
}
```

### 2. Validate

```bash
ossa validate my-agent.json
# Output: ✅ Valid OSSA agent definition (v0.3.0)
```

### 3. Generate Types

```bash
ossa generate types my-agent.json --output ./types
# Output: Generated types/my-agent.types.ts
```

### 4. Implement

```typescript
import { GreetInput, GreetOutput } from './types/my-agent.types';

async function greet(input: GreetInput): Promise<GreetOutput> {
  return {
    greeting: `Hello, ${input.name}!`
  };
}

// Test it
const result = await greet({ name: "World" });
console.log(result.greeting); // "Hello, World!"
```

## Core Concepts

### Agent
A self-contained unit that performs specific tasks.

### Capability
What an agent can do (e.g., "answer questions", "process data").

### Schema
JSON Schema defining input/output structure.

### Validation
Ensuring agent definitions are correct and complete.

## CLI Commands

```bash
# Validate agent
ossa validate agent.json

# Generate TypeScript types
ossa generate types agent.json

# Migrate to new version
ossa migrate agent.json --to 0.2.6

# Create from template
ossa create worker --name my-agent
```

## Next Steps

1. **Learn More** - Read [Why OSSA?](why-ossa.md)
2. **Deep Dive** - Explore [Specification](specification/overview.md)
3. **Best Practices** - Follow [Best Practices](guides/best-practices.md)
4. **Tutorials** - Try [Tutorials](guides/tutorials.md)

## Quick Links

- [API Documentation](api.md)
- [Architecture](architecture.md)
- [Troubleshooting](troubleshooting.md)
- [Contributing](contributing.md)

## Need Help?

- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Discussions**: [Community](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Email**: team@bluefly.io

---

**Remember**: OSSA is a **standard**, not a framework. It defines how to describe agents, not how to build them.
