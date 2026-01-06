# @ossa/runtime

Reference implementation of the OSSA (Open Standard for Scalable AI Agents) runtime SDK.

## Overview

The `@ossa/runtime` package provides TypeScript implementations for loading, executing, and managing OSSA-compliant agents. It includes:

- **Runtime**: Agent lifecycle management (load, unload, execute)
- **Agent**: Capability registration and execution
- **Manifest Loader**: Load agents from YAML/JSON manifests
- **Capability Registry**: Manage agent capabilities and handlers

## Installation

```bash
npm install @ossa/runtime
```

## Quick Start

```typescript
import { createRuntime } from '@ossa/runtime';

// Create runtime
const runtime = createRuntime();

// Load an agent
const agent = await runtime.loadAgent('./agent-manifest.yaml');

// Register a capability handler
agent.registerCapability(
  {
    name: 'greet',
    description: 'Greet a user',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name']
    },
    output_schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  },
  async (input) => {
    return { message: `Hello, ${input.name}!` };
  }
);

// Execute capability
const result = await agent.execute('greet', { name: 'World' });
console.log(result.data); // { message: 'Hello, World!' }
```

## Core Concepts

### Runtime

The runtime manages the lifecycle of agents:

```typescript
import { createRuntime } from '@ossa/runtime';

const runtime = createRuntime({
  maxAgents: 100,           // Maximum concurrent agents
  defaultTimeout: 30,       // Default execution timeout (seconds)
  enableTracing: true       // Enable execution tracing
});

// Load agents
const agent1 = await runtime.loadAgent('./agent1.yaml');
const agent2 = await runtime.loadAgent('./agent2.yaml');

// Get all agents
const agents = runtime.getAgents();

// Get specific agent
const agent = runtime.getAgent('agent-id');

// Unload agent
runtime.unloadAgent('agent-id');

// Get statistics
const stats = runtime.getStats();
```

### Agent

Agents execute capabilities:

```typescript
import { createAgent } from '@ossa/runtime';

const agent = createAgent(manifest);

// Register capability
agent.registerCapability(capability, handler);

// Execute capability
const result = await agent.execute('capabilityName', input, context);

// Check capabilities
if (agent.hasCapability('search')) {
  const capability = agent.getCapability('search');
}

// Get metadata
const metadata = agent.getMetadata();
```

### Capabilities

Capabilities define what an agent can do:

```typescript
import type { Capability } from '@ossa/runtime';

const searchCapability: Capability = {
  name: 'search',
  description: 'Search documents',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'number', default: 10 }
    },
    required: ['query']
  },
  output_schema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: { type: 'object' }
      }
    }
  },
  timeout_seconds: 5,
  retry_policy: {
    max_attempts: 3,
    backoff: 'exponential'
  }
};
```

### Execution Results

All capability executions return a standard result:

```typescript
interface ExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  executionTime?: number;
  metadata?: Record<string, unknown>;
}
```

## Manifest Formats

### K8s-style (v0.3.0)

```yaml
apiVersion: v0.3.0
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
  description: Example agent
spec:
  role: Document processing
  llm:
    provider: openai
    model: gpt-4
    temperature: 0.7
```

### Legacy (v0.1.9)

```yaml
ossaVersion: 0.1.9
agent:
  id: my-agent
  name: My Agent
  version: 1.0.0
  role: Document processing
  runtime:
    type: docker
  capabilities:
    - name: process
      description: Process documents
      input_schema: {...}
      output_schema: {...}
```

## Examples

See the `/examples` directory for complete reference implementations:

- **RAG Agent** - Retrieval-Augmented Generation with vector search
- **Workflow Agent** - Multi-step workflow orchestration
- **Coordinator Agent** - Multi-agent task delegation

## API Reference

### Runtime

```typescript
class OssaRuntime {
  loadAgent(manifest: string | AgentManifest): Promise<OssaAgent>
  executeCapability(agent: OssaAgent, capability: string, input: unknown): Promise<ExecutionResult>
  getAgent(id: string): OssaAgent | undefined
  getAgents(): Map<string, OssaAgent>
  unloadAgent(id: string): void
  unloadAll(): void
  reloadAgent(id: string, manifest: string | AgentManifest): Promise<OssaAgent>
  getStats(): RuntimeStats
  isAgentLoaded(id: string): boolean
}
```

### Agent

```typescript
class OssaAgent {
  id: string
  manifest: AgentManifest

  execute(capability: string, input: unknown, context?: ExecutionContext): Promise<ExecutionResult>
  registerCapability(capability: Capability, handler: CapabilityHandler): void
  getCapability(name: string): Capability | undefined
  getCapabilities(): Map<string, Capability>
  hasCapability(name: string): boolean
  getMetadata(): AgentMetadata
}
```

### ManifestLoader

```typescript
class ManifestLoader {
  loadFromFile(path: string): Promise<AgentManifest>
  loadFromObject(manifest: unknown): Promise<AgentManifest>
  validate(manifest: AgentManifest): Promise<boolean>
  getAgentId(manifest: AgentManifest): string
  getAgentRole(manifest: AgentManifest): string
  getCapabilities(manifest: AgentManifest): Capability[]
  normalize(manifest: AgentManifest): AgentManifest
}
```

### CapabilityRegistry

```typescript
class CapabilityRegistry {
  register(capability: Capability, handler: CapabilityHandler): void
  get(name: string): Capability | undefined
  getHandler(name: string): CapabilityHandler | undefined
  has(name: string): boolean
  getAll(): Map<string, Capability>
  remove(name: string): boolean
  clear(): void
  validateCapability(capability: Capability): boolean
}
```

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Building

```bash
npm run build         # Build TypeScript
npm run dev           # Watch mode
npm run clean         # Clean dist/
```

## License

Apache-2.0

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Support

- [Documentation](https://openstandardagents.org)
- [Issues](https://github.com/blueflyio/openstandardagents/issues)
- [Discussions](https://github.com/blueflyio/openstandardagents/discussions)
