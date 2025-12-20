# Coordinator Agent Reference Implementation

This example demonstrates a multi-agent coordinator using the `@ossa/runtime` SDK.

## Overview

The coordinator agent orchestrates complex tasks by delegating work to specialized agents. It demonstrates:

- Multi-agent system architecture
- Task routing and delegation
- Parallel task execution
- Agent registry and discovery
- Load balancing and availability tracking

## Capabilities

### 1. `delegate_task`
Delegate a task to the most appropriate specialized agent.

**Input:**
```json
{
  "taskType": "process",
  "input": { "items": [1, 2, 3] },
  "preferredAgent": "data-processor"
}
```

**Output:**
```json
{
  "agentId": "data-processor",
  "taskType": "process",
  "success": true,
  "result": { "processed": true, "items": 3 },
  "executionTime": 150
}
```

### 2. `delegate_parallel`
Delegate multiple tasks to different agents in parallel.

**Input:**
```json
{
  "tasks": [
    { "taskType": "process", "input": {...} },
    { "taskType": "analyze", "input": {...} },
    { "taskType": "notify", "input": {...} }
  ]
}
```

**Output:**
```json
{
  "results": [
    { "agentId": "data-processor", "success": true, ... },
    { "agentId": "analytics-engine", "success": true, ... },
    { "agentId": "notification-service", "success": true, ... }
  ]
}
```

### 3. `get_stats`
Get coordinator statistics and health information.

**Output:**
```json
{
  "totalAgents": 3,
  "availableAgents": 3,
  "busyAgents": 0,
  "capabilities": ["process", "analyze", "notify"]
}
```

### 4. `list_agents`
List all registered agents and their capabilities.

**Output:**
```json
{
  "agents": [
    {
      "id": "data-processor",
      "role": "Process and analyze data",
      "capabilities": ["process"],
      "status": "available"
    }
  ]
}
```

## Architecture

```
Coordinator Agent
├── Agent Registry
│   ├── Data Processor Agent
│   ├── Analytics Agent
│   └── Notification Agent
├── Task Router (find best agent)
├── Load Balancer (availability tracking)
└── Execution Manager (parallel/sequential)
```

## Task Routing

The coordinator uses intelligent routing:

1. **Capability matching**: Find agents with required capability
2. **Availability check**: Only route to available agents
3. **Preferred agent**: Honor agent preferences if specified
4. **Load balancing**: Track agent status (available/busy)

## Example Flow

```typescript
import { createCoordinatorAgent } from './index.js';

// Create coordinator
const coordinator = await createCoordinatorAgent();

// Register specialized agents
coordinator.registerAgent(dataAgent, ['process', 'transform']);
coordinator.registerAgent(analyticsAgent, ['analyze', 'report']);

// Delegate complex task
const result = await coordinator.execute('delegate_parallel', {
  tasks: [
    { taskType: 'process', input: { data: [...] } },
    { taskType: 'analyze', input: { dataset: 'sales' } }
  ]
});
```

## Running the Example

```bash
cd examples/coordinator-agent
npm install
npm run build
node dist/index.js
```

## Production Considerations

This is a reference implementation. For production use:

1. **Service discovery** for dynamic agent registration
2. **Health checks** and automatic failover
3. **Circuit breakers** for failing agents
4. **Advanced routing** (priority, affinity, resource-based)
5. **Queue management** for overloaded agents
6. **Distributed coordination** across multiple machines
7. **Metrics and monitoring** for agent performance
8. **Agent lifecycle management** (start, stop, restart)
9. **Security** (authentication, authorization between agents)
10. **Message bus** for async communication (NATS, RabbitMQ)

## Multi-Agent Patterns

### 1. Delegation Pattern
Coordinator delegates tasks to specialized agents.

### 2. Pipeline Pattern
Chain agents together in sequence (output → input).

### 3. Fan-out/Fan-in Pattern
Parallel execution with result aggregation.

### 4. Supervisor Pattern
Monitor agent health and restart on failure.

## Related Examples

- **RAG Agent**: Specialized agent for document search
- **Workflow Agent**: Orchestrate multi-step processes
- **Coordinator Agent**: Multi-agent task delegation (this example)
