# OSSA Bridge Server

HTTP Bridge Server for OSSA Runtime - Connects Drupal PHP to TypeScript OSSA agents.

## Overview

The OSSA Bridge Server provides a REST API for executing OSSA agents from any language, particularly designed to integrate Drupal PHP with the TypeScript OSSA runtime. It delegates MCP operations to the agent-protocol service while providing HTTP access, caching, tracing, and timeout handling.

## Features

- **Agent Execution API** - Execute OSSA agents via HTTP POST
- **Agent Registry** - List and query available agents
- **OpenTelemetry Tracing** - Distributed tracing for agent execution
- **Result Caching** - Automatic caching of agent results (1 min TTL)
- **Timeout Handling** - Configurable execution timeouts (default 5 min)
- **Health Checks** - Status endpoint for monitoring
- **Error Handling** - Comprehensive error codes and responses

## Architecture

```
┌─────────────────┐
│  Drupal PHP     │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Bridge Server  │ (This package)
│  - Express API  │
│  - Caching      │
│  - Tracing      │
└────────┬────────┘
         │ Delegates to
         ▼
┌─────────────────┐
│ agent-protocol  │
│  - MCP Servers  │
│  - Agent Exec   │
└─────────────────┘
```

### Separation of Duties

- **Bridge Server** (this package): HTTP API, validation, caching, timeouts
- **agent-protocol**: MCP server management, agent execution
- **Drupal Module**: PHP client, queue workers, UI

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit configuration
vim .env
```

## Configuration

Environment variables:

```bash
# Server
BRIDGE_PORT=9090              # HTTP port
BRIDGE_HOST=0.0.0.0          # Bind address
NODE_ENV=development          # Environment

# OSSA
OSSA_REGISTRY_PATH=./agents   # Path to agent registry

# OpenTelemetry (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Usage

### Development

```bash
# Start with hot reload
npm run dev
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

### Docker

```bash
# Build image
docker build -t ossa-bridge-server .

# Run container
docker run -p 9090:9090 \
  -e OSSA_REGISTRY_PATH=/agents \
  -e OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318 \
  ossa-bridge-server
```

## API Reference

### Execute Agent

Execute an OSSA agent with input data.

**Endpoint:** `POST /api/v1/execute`

**Request:**
```json
{
  "agentId": "compliance-checker",
  "input": {
    "policy": "require-approval",
    "resource": "content-123"
  },
  "context": {
    "userId": "user-456",
    "sessionId": "session-789"
  },
  "timeout": 300000
}
```

**Response (Success):**
```json
{
  "success": true,
  "result": {
    "compliant": true,
    "violations": []
  },
  "metadata": {
    "agentId": "compliance-checker",
    "executionTime": 1234,
    "traceId": "abc123def456",
    "timestamp": "2026-02-04T12:00:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "AGENT_EXECUTION_FAILED",
    "message": "Agent execution failed: timeout",
    "details": { ... }
  },
  "metadata": {
    "agentId": "compliance-checker",
    "executionTime": 5000,
    "timestamp": "2026-02-04T12:00:00Z"
  }
}
```

**Error Codes:**
- `AGENT_NOT_FOUND` (404) - Agent does not exist
- `INVALID_INPUT` (400) - Request validation failed
- `TIMEOUT` (504) - Execution timeout exceeded
- `AGENT_EXECUTION_FAILED` (500) - Agent execution error
- `INTERNAL_ERROR` (500) - Unexpected server error

### List Agents

List all available agents in the registry.

**Endpoint:** `GET /api/v1/agents`

**Response:**
```json
{
  "success": true,
  "agents": [
    {
      "agentId": "compliance-checker",
      "name": "Compliance Checker",
      "description": "Validates resources against policies",
      "version": "1.0.0",
      "capabilities": ["policy-check", "audit-log"]
    }
  ],
  "count": 1,
  "timestamp": "2026-02-04T12:00:00Z"
}
```

### Get Agent

Get detailed metadata for a specific agent.

**Endpoint:** `GET /api/v1/agents/:agentId`

**Response:**
```json
{
  "success": true,
  "agent": {
    "agentId": "compliance-checker",
    "name": "Compliance Checker",
    "description": "Validates resources against policies",
    "version": "1.0.0",
    "capabilities": ["policy-check", "audit-log"],
    "inputSchema": { ... },
    "outputSchema": { ... }
  },
  "timestamp": "2026-02-04T12:00:00Z"
}
```

### Health Check

Check server health and component status.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 123456,
  "timestamp": "2026-02-04T12:00:00Z",
  "services": {
    "agentRuntime": "ok",
    "tracing": "ok"
  }
}
```

## Development

### Project Structure

```
bridge-server/
├── src/
│   ├── server.ts           # Express app and startup
│   ├── routes/
│   │   ├── execute.ts      # POST /api/v1/execute
│   │   ├── agents.ts       # GET /api/v1/agents
│   │   └── health.ts       # GET /health
│   ├── services/
│   │   ├── agent-runtime.service.ts  # Agent execution
│   │   └── tracing.service.ts        # OpenTelemetry
│   └── types/
│       └── index.ts        # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Endpoints

1. Create route file in `src/routes/`
2. Import and register in `src/server.ts`
3. Add types in `src/types/index.ts`
4. Update README API reference

### Testing

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

### Debugging

Enable debug logging:

```bash
DEBUG=ossa:* npm run dev
```

View OpenTelemetry traces:

```bash
# Jaeger UI
open http://localhost:16686

# Or query via API
curl http://localhost:16686/api/traces
```

## Integration with agent-protocol

The bridge server delegates MCP operations to the `agent-protocol` service. To implement:

### Option 1: HTTP Integration

```typescript
// In agent-runtime.service.ts
async executeAgentViaProtocol(...) {
  const response = await fetch('http://agent-protocol:8080/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, input, context }),
  });
  return response.json();
}
```

### Option 2: Direct Import

```typescript
import { AgentRuntime } from '@bluefly/agent-protocol';

const runtime = new AgentRuntime();
const result = await runtime.execute(agentId, input);
```

## Monitoring

### Metrics

- Request rate and latency
- Agent execution time
- Cache hit rate
- Error rate by code

### Traces

OpenTelemetry spans:
- `agent.execute` - Full agent execution
- Attributes: `agent.id`, `agent.execution.time_ms`, `agent.result.size`

### Logs

Structured JSON logs:
- Request/response logs
- Error logs with stack traces
- Service health checks

## Deployment

### Docker Compose

```yaml
services:
  bridge-server:
    image: ossa-bridge-server:latest
    ports:
      - "9090:9090"
    environment:
      - OSSA_REGISTRY_PATH=/agents
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318
    volumes:
      - ./agents:/agents:ro
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-bridge-server
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: bridge
        image: ossa-bridge-server:latest
        ports:
        - containerPort: 9090
        env:
        - name: OSSA_REGISTRY_PATH
          value: /agents
        - name: OTEL_EXPORTER_OTLP_ENDPOINT
          value: http://tempo:4318
```

## Troubleshooting

### Tracing not working

```bash
# Check OTLP endpoint
curl http://localhost:4318/v1/traces

# Verify environment variable
echo $OTEL_EXPORTER_OTLP_ENDPOINT

# Check logs
tail -f logs/bridge-server.log
```

### Agent execution timeout

```bash
# Increase timeout in request
curl -X POST http://localhost:9090/api/v1/execute \
  -H 'Content-Type: application/json' \
  -d '{"agentId": "slow-agent", "timeout": 600000}'

# Or set environment variable
export DEFAULT_TIMEOUT=600000
```

### Cache issues

```bash
# Clear cache (requires implementation)
curl -X DELETE http://localhost:9090/api/v1/cache
```

## License

MIT

## Related Projects

- [@bluefly/openstandardagents](../README.md) - Core OSSA TypeScript package
- [agent-protocol](https://gitlab.com/blueflyio/agent-platform/agent-protocol) - MCP server runtime
- [drupal-ossa](https://gitlab.com/blueflyio/openstandardagents-drupal) - Drupal integration module
