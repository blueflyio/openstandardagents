# Workflow Agent Reference Implementation

This example demonstrates a workflow automation agent using the `@ossa/runtime` SDK.

## Overview

The workflow agent orchestrates multi-step processes with error handling, retry logic, and conditional branching. It demonstrates:

- Sequential workflow execution
- Step-level retry with exponential backoff
- Error handling and fallback steps
- Workflow state management
- Execution tracking and monitoring

## Capabilities

### 1. `execute_workflow`
Execute a workflow definition with multiple steps.

**Input:**
```json
{
  "workflow": {
    "id": "data-pipeline",
    "name": "Data Pipeline",
    "startStep": "step1",
    "steps": [
      {
        "id": "step1",
        "action": "fetch_data",
        "input": { "url": "..." },
        "retry": { "maxAttempts": 3, "backoffMs": 1000 },
        "onSuccess": "step2",
        "onFailure": "step4"
      }
    ]
  }
}
```

**Output:**
```json
{
  "executionId": "exec-123...",
  "status": "completed",
  "stepResults": {
    "step1": { "status": "completed", "output": {...} }
  }
}
```

### 2. `get_execution`
Get the status of a workflow execution.

**Input:**
```json
{
  "executionId": "exec-123..."
}
```

**Output:**
```json
{
  "executionId": "exec-123...",
  "status": "running",
  "currentStep": "step2",
  "stepResults": {...}
}
```

### 3. `cancel_workflow`
Cancel a running workflow.

**Input:**
```json
{
  "executionId": "exec-123..."
}
```

**Output:**
```json
{
  "cancelled": true
}
```

## Workflow Features

### Retry Logic
Steps can define retry behavior:
```typescript
{
  retry: {
    maxAttempts: 3,
    backoffMs: 1000  // Exponential backoff
  }
}
```

### Conditional Branching
Steps can branch based on success/failure:
```typescript
{
  onSuccess: "step2",  // Next step if successful
  onFailure: "step4"   // Fallback step if failed
}
```

### Step Handlers
Register custom step handlers:
```typescript
engine.registerStepHandler('fetch_data', async (input) => {
  const response = await fetch(input.url);
  return response.json();
});
```

## Usage

```typescript
import { createWorkflowAgent } from './index.js';

// Create agent
const agent = await createWorkflowAgent();

// Execute workflow
const result = await agent.execute('execute_workflow', {
  workflow: {
    id: 'my-workflow',
    name: 'My Workflow',
    startStep: 'step1',
    steps: [...]
  }
});

// Check status
const status = await agent.execute('get_execution', {
  executionId: result.data.executionId
});
```

## Running the Example

```bash
cd examples/workflow-agent
npm install
npm run build
node dist/index.js
```

## Architecture

```
Workflow Agent
├── Workflow Engine
│   ├── Execution State Manager
│   ├── Step Executor (with retry)
│   └── Step Handler Registry
└── Workflow Definition (declarative)
```

## Production Considerations

This is a reference implementation. For production use:

1. **Persistent storage** for workflow state (database)
2. **Distributed execution** for scalability (job queue)
3. **Advanced scheduling** (cron, delayed execution)
4. **Step parallelization** for independent steps
5. **Workflow versioning** and migration
6. **Rich observability** (metrics, tracing, logs)
7. **Workflow UI** for monitoring and management
8. **State machine validation** to prevent cycles
