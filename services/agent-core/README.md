# OSSA Agent Core Service

## Overview

The OSSA Agent Core Service provides a comprehensive agent type system and management framework that bridges agent-forge implementations with the OSSA ecosystem.

## Architecture

### Agent Type Hierarchy

```
BaseAgent (Abstract)
├── TaskAgent - Task execution and scheduling
├── ResearchAgent - Information gathering and analysis
├── TranscriberAgent - Audio/video transcription
├── RouterAgent - Message routing and load balancing
├── SecurityAgent - Authentication and authorization
├── WorkflowAgent - Workflow orchestration
├── MonitorAgent - System monitoring
├── ValidatorAgent - Data validation
├── OptimizerAgent - Performance optimization
├── ClassifierAgent - ML classification
├── PredictorAgent - ML prediction
└── TrainerAgent - ML model training
```

### Key Components

1. **Agent Registry** - Manages registration and discovery of agents
2. **Agent Factory** - Creates and configures agent instances
3. **Base Agent** - Abstract base class with common functionality
4. **Type System** - Comprehensive TypeScript interfaces for all agent types

## API Endpoints

### Agent Management

- `GET /health` - Health check
- `GET /api/v1/agents` - List all agents
- `GET /api/v1/agents/:id` - Get agent by ID
- `POST /api/v1/agents` - Create new agent
- `DELETE /api/v1/agents/:id` - Delete agent
- `GET /api/v1/agents/:id/health` - Get agent health

### Agent Types

- `GET /api/v1/agent-types` - List available types
- `GET /api/v1/agents/type/:type` - Get agents by type

### Task Execution

- `POST /api/v1/agents/:id/execute` - Execute task on agent

### Integration

- `POST /api/v1/integrate/agent-forge` - Import agent-forge agent

## Usage Examples

### Create a Task Agent

```bash
curl -X POST http://localhost:3010/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task",
    "config": {
      "name": "my-task-agent",
      "description": "Handles background tasks",
      "maxConcurrentTasks": 10
    }
  }'
```

### Execute a Task

```bash
curl -X POST http://localhost:3010/api/v1/agents/:agentId/execute \
  -H "Content-Type: application/json" \
  -d '{
    "name": "process-data",
    "type": "data-processing",
    "payload": {
      "input": "data.csv"
    },
    "priority": "high"
  }'
```

### Import Agent from Agent-Forge

```bash
curl -X POST http://localhost:3010/api/v1/integrate/agent-forge \
  -H "Content-Type: application/json" \
  -d '{
    "agentPath": "/path/to/agent-forge/agent.js",
    "agentType": "task"
  }'
```

## Integration with Agent-Forge

The service provides seamless integration with agent-forge agents through:

1. **Agent Wrapper** - Wraps agent-forge agents to be OSSA-compliant
2. **Dynamic Import** - Loads agents at runtime
3. **Type Mapping** - Maps agent-forge agents to OSSA types
4. **Registry Integration** - Registers imported agents

## Development

### Setup

```bash
npm install
npm run build
npm run dev
```

### Testing

```bash
npm test
```

### Environment Variables

```env
PORT=3010
LOG_LEVEL=info
OSSA_GATEWAY_URL=http://localhost:3000
AGENT_FORGE_PATH=/path/to/agent-forge
```

## Agent Type Capabilities

### Task Agent
- Execute tasks
- Schedule tasks
- Cancel tasks
- Get task status

### Research Agent
- Search information
- Analyze data
- Summarize content
- Fact checking

### Transcriber Agent
- Transcribe audio/video
- Detect language
- Speaker diarization
- Generate subtitles

### Router Agent
- Route messages
- Load balancing
- Failover handling
- Broadcast messages

### Security Agent
- Authenticate users
- Authorize access
- Audit events
- Threat detection
- Encryption/Decryption

### Workflow Agent
- Create workflows
- Execute workflows
- Pause/Resume workflows
- Monitor workflow status

## Extending Agent Types

To add a new agent type:

1. Define the interface in `src/types/agent-types.ts`
2. Create the implementation in `src/agents/`
3. Register with factory in `src/index.ts`
4. Update the registry capabilities extraction

Example:

```typescript
// 1. Define interface
export interface CustomAgent extends BaseCapabilities {
  type: AgentType.CUSTOM;
  capabilities: {
    customAction: (input: any) => Promise<any>;
  };
}

// 2. Implement agent
export class CustomAgentImpl extends BaseAgent implements CustomAgent {
  // Implementation
}

// 3. Register
agentFactory.registerAgentType(AgentType.CUSTOM, CustomAgentImpl);
```

## Metrics and Monitoring

Each agent provides:
- Request count
- Average response time
- Error rate
- Last active timestamp
- Uptime
- Memory usage
- CPU usage

Access metrics via: `GET /api/v1/agents/:id/health`

## Security

- JWT authentication (when integrated with OSSA gateway)
- Role-based access control
- Audit logging
- Secure agent isolation

## License

MIT