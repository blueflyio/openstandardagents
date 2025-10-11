# OSSA Specification

**Open Standards for Scalable Agents (OSSA)** - Pure Specification Package

This package contains the pure OSSA specification without any implementation. It provides TypeScript types and JSON schemas for building OSSA-compliant agents and workflows.

## What is OSSA?

OSSA is a specification standard for multi-agent systems, similar to how OpenAPI is a specification standard for REST APIs. It defines:

- Agent manifest format and structure
- Multi-agent workflow definitions
- Capability declaration and discovery
- Conformance levels and validation
- 360° feedback loop execution patterns

## Package Contents

- **TypeScript Types**: Complete type definitions for all OSSA concepts
- **JSON Schemas**: Validation schemas for agent manifests and workflows
- **Constants**: Standard enums and values used in OSSA

## Installation

```bash
npm install @ossa/specification
```

## Usage

### TypeScript Types

```typescript
import { AgentManifest, WorkflowSpec, ConformanceLevel } from '@ossa/specification';

const agentManifest: AgentManifest = {
  apiVersion: '@bluefly/ossa/v0.1.9',
  kind: 'Agent',
  metadata: {
    name: 'my-agent',
    version: '1.0.0'
  },
  spec: {
    type: 'worker',
    capabilities: [],
    configuration: {
      openapi: '/openapi.json',
      baseUrl: 'http://localhost:3000'
    },
    discovery: {
      endpoint: '/capabilities'
    },
    health: {
      endpoint: '/health'
    }
  }
};
```

### JSON Schemas

```typescript
import { agentManifestSchema, workflowSchema } from '@ossa/specification';

// Use with validation libraries like Ajv
const validate = ajv.compile(agentManifestSchema);
const isValid = validate(agentManifest);
```

### Constants

```typescript
import { AGENT_TYPES, CONFORMANCE_LEVELS, FEEDBACK_LOOP_PHASES } from '@ossa/specification';

console.log(AGENT_TYPES); // ['orchestrator', 'worker', 'critic', ...]
```

## Agent Types

OSSA defines 9 standard agent types:

1. **Orchestrator**: Coordinates multi-agent workflows
2. **Worker**: Executes specific tasks and operations
3. **Critic**: Reviews and evaluates outputs
4. **Judge**: Makes decisions and final determinations
5. **Trainer**: Learns from feedback and improves performance
6. **Governor**: Enforces policies and compliance
7. **Monitor**: Observes and reports on system state
8. **Integrator**: Connects external systems and services
9. **Voice**: Handles human interaction and communication

## Conformance Levels

- **Bronze**: Basic agent with manifest and health endpoints
- **Silver**: Adds authentication and authorization
- **Gold**: Includes audit logging and performance metrics
- **Advanced**: Full feedback loop and multi-agent coordination

## Implementation vs Specification

This package contains **only the specification**. For implementation tools, see:

- `@ossa/validator` - Validation and conformance checking
- `agent-buildkit` - Implementation tools and agent runtime

## Contributing

This is a pure specification package. Changes should be:

1. Backward compatible when possible
2. Well-documented with examples
3. Validated against existing implementations
4. Discussed in the OSSA community

## License

MIT License - See LICENSE file for details.

## Links

- [OSSA Documentation](https://ossa.dev)
- [GitHub Repository](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard)
- [Community Discussions](https://ossa.dev/community)