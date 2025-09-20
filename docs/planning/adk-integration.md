# ADK Integration Guide for OSSA

## Overview

This guide explains how OSSA (Open Standards for Scalable Agents) integrates with Google's Agent Development Kit (ADK) to provide standardized agent patterns and orchestration capabilities.

## Architecture

### Agent Type Mapping

OSSA agents map to ADK categories as follows:

| OSSA Type | ADK Type | Purpose |
|-----------|----------|---------|
| Worker | LlmAgent | Flexible task execution with LLM reasoning |
| Orchestrator | WorkflowAgent | Deterministic control flow and coordination |
| Critic | LlmAgent | Quality control with LLM evaluation |
| Monitor | CustomAgent | Specialized monitoring and metrics |
| Governor | CustomAgent | Policy enforcement and compliance |

### State Management

ADK's session.state system replaces OSSA's custom context:

- **Persistent State**: `session.state` - Shared across agents
- **Temporary State**: `session.temp` - Cleared after each turn
- **State Interpolation**: `{variable}` syntax in instructions
- **Output Keys**: Automatic state population from agent results

## Quick Start

### 1. Installation

```typescript
import { OSSAADKAdapter, adkAdapter } from '@ossa/adk';
```

### 2. Load OSSA Agents

```typescript
// Load individual agent
const agent = await adkAdapter.loadAgent('.agents/data-processor');

// Load all agents
await adkAdapter.loadAllAgents('.agents');
```

### 3. Execute Agents

```typescript
// Simple execution
const result = await adkAdapter.executeAgent(
  'data-processor',
  { data: inputData }
);

// With session state
const result = await adkAdapter.executeAgent(
  'data-processor',
  { data: inputData },
  'session_123'
);
```

## Orchestration Patterns

### Sequential Pattern

Execute agents one after another, passing output as input:

```typescript
const result = await adkAdapter.executeOrchestration(
  'sequential',
  ['analyzer', 'transformer', 'loader'],
  { data: input }
);
```

### Loop Pattern

Iterate over agents until condition is met:

```typescript
const result = await adkAdapter.executeOrchestration(
  'loop',
  ['fetcher', 'processor'],
  { source: 'api' },
  {
    maxIterations: 10,
    condition: (state) => state.hasMoreData
  }
);
```

### Conditional Pattern

Execute agents based on conditions:

```typescript
const result = await adkAdapter.executeOrchestration(
  'conditional',
  ['validator', 'transformer', 'error-handler'],
  { data: input },
  {
    conditions: [
      (state) => true,  // Always validate
      (state) => state.isValid,  // Transform if valid
      (state) => !state.isValid  // Handle errors if invalid
    ]
  }
);
```

### Parallel Pattern

Execute agents concurrently:

```typescript
const result = await adkAdapter.executeOrchestration(
  'parallel',
  ['analyzer1', 'analyzer2', 'analyzer3'],
  { data: input }
);
```

### Coordinator Pattern

Intelligent task delegation:

```typescript
const result = await adkAdapter.executeOrchestration(
  'coordinator',
  ['coordinator', 'worker1', 'worker2', 'aggregator'],
  { task: complexTask }
);
```

### Dispatcher Pattern

Route to appropriate agent:

```typescript
const result = await adkAdapter.executeOrchestration(
  'dispatcher',
  ['billing', 'technical', 'general'],
  { request: userRequest },
  {
    router: (input, agents) => {
      // Custom routing logic
      if (input.type === 'billing') return agents[0];
      if (input.type === 'technical') return agents[1];
      return agents[2];
    }
  }
);
```

## Agent Configuration

### LlmAgent Configuration

```yaml
type: LlmAgent
config:
  name: analyzer
  model: gemini-2.0-flash
  instruction: |
    Analyze input data
    Store results in {analysis_output}
  output_key: analysis_output
  tools:
    - process_data
    - validate
```

### WorkflowAgent Configuration

```yaml
type: WorkflowAgent
config:
  name: pipeline
  workflow_type: sequential
  sub_agents:
    - fetcher
    - processor
    - validator
```

### CustomAgent Configuration

```yaml
type: CustomAgent
config:
  name: monitor
  custom_type: monitor
  capabilities:
    - metrics-collection
    - alerting
```

## Tool Integration

### Registering Tools

```typescript
import { toolRegistry } from '@ossa/adk';

toolRegistry.registerTool({
  name: 'custom_tool',
  description: 'My custom tool',
  function: async (params) => {
    // Tool implementation
    return result;
  }
});
```

### AgentTools for Delegation

```typescript
// Register agent as tool
toolRegistry.registerAgentTool(agent, 'explicit');

// Use in orchestration
const tools = toolRegistry.getAgentTools();
```

## MCP Integration

### Creating MCP Tools from ADK Agents

```typescript
import { mcpBridge } from '@ossa/adk';

// Create MCP tool from agent
const mcpTool = mcpBridge.createMCPTool('data-processor');

// Create orchestration tool
const orchTool = mcpBridge.createMCPOrchestrationTool('sequential');
```

## State Management

### Session Creation

```typescript
import { sessionManager } from '@ossa/adk';

// Create new session
const session = sessionManager.createSession();

// Update state
sessionManager.updateState(session.id, 'key', 'value');

// Interpolate state in text
const interpolated = sessionManager.interpolateState(
  'Process {data} with {method}',
  session.id
);
```

### State Persistence

```typescript
// Export session
const exported = sessionManager.exportSession(session.id);

// Clean old sessions
const cleaned = sessionManager.cleanupSessions(
  new Date(Date.now() - 3600000)  // 1 hour old
);
```

## Best Practices

### 1. Agent Design

- Use `LlmAgent` for flexible reasoning tasks
- Use `WorkflowAgent` for deterministic flows
- Use `CustomAgent` for specialized functionality

### 2. State Management

- Use output_key for automatic state updates
- Keep persistent state minimal
- Clear temp state between turns

### 3. Tool Selection

- Map capabilities to appropriate tools
- Use AgentTools for delegation
- Implement proper error handling

### 4. Orchestration

- Choose patterns based on task requirements
- Use conditions for flow control
- Implement proper error recovery

### 5. Performance

- Enable parallel execution where possible
- Cache session state for reuse
- Pool agent instances

## Examples

See `/examples/adk-integration/` for complete examples:

- `code-review-workflow.yml`: Multi-agent code review
- `data-pipeline.yml`: Iterative data processing
- `customer-support.yml`: Intelligent routing system

## Migration Guide

### Converting Existing OSSA Agents

1. Update agent manifests with ADK types
2. Replace custom context with session.state
3. Add output_key for state management
4. Update tool registrations

### Before (OSSA):
```yaml
spec:
  type: worker
  context:
    shared: true
```

### After (ADK):
```yaml
spec:
  type: worker
  adk_type: LlmAgent
  output_key: worker_output
```

## Troubleshooting

### Common Issues

1. **State not persisting**: Ensure output_key is set
2. **Tools not available**: Register tools before loading agents
3. **Orchestration failing**: Check agent dependencies
4. **Session conflicts**: Use unique session IDs

### Debug Mode

```typescript
// Enable debug logging
process.env.ADK_DEBUG = 'true';

// Export session for inspection
const state = adkAdapter.getSessionState('session_123');
console.log(state);
```

## API Reference

### OSSAADKAdapter

```typescript
class OSSAADKAdapter {
  loadAgent(agentPath: string): Promise<ADKAgent>
  loadAllAgents(baseDir?: string): Promise<void>
  executeAgent(name: string, input: any, sessionId?: string): Promise<any>
  executeOrchestration(pattern: string, agents: string[], input?: any, options?: any): Promise<any>
  getAgentInfo(name: string): any
  listAgents(): any[]
  getSessionState(sessionId: string): any
  cleanupSessions(olderThanMinutes?: number): number
}
```

### OSSASessionManager

```typescript
class OSSASessionManager {
  createSession(id?: string): ADKSession
  getSession(id: string): ADKSession | undefined
  updateState(sessionId: string, key: string, value: any): void
  updateTempState(sessionId: string, key: string, value: any): void
  clearTempState(sessionId: string): void
  interpolateState(text: string, sessionId: string): string
  cloneSession(sessionId: string): ADKSession
  mergeSessions(targetId: string, sourceIds: string[]): void
  exportSession(sessionId: string): any
  cleanupSessions(olderThan: Date): number
}
```

## Resources

- [Google ADK Documentation](https://github.com/google/genkit)
- [OSSA Specification](https://ossa.dev)
- [Example Workflows](/examples/adk-integration)