---
title: "Runtime Integration"
description: "Technical guide for integrating OSSA agents with runtime environments"
weight: 2
---

# Runtime Integration

This guide covers integrating OSSA agents with runtime environments, including agent-buildkit, Kubernetes, Docker, and serverless platforms.

## Overview

OSSA agents are runtime-agnostic. The same agent manifest can be deployed to:

- Kubernetes (via agent-buildkit)
- Docker containers
- Serverless functions (AWS Lambda, Google Cloud Functions)
- On-premise infrastructure

## Agent-BuildKit Integration

### Installation

```bash
npm install @bluefly/agent-buildkit
```

### Basic Integration

```typescript
import { AgentRuntime } from '@bluefly/agent-buildkit';
import fs from 'fs';
import yaml from 'js-yaml';

// Load agent manifest
const manifest = yaml.load(
  fs.readFileSync('agent.ossa.yaml', 'utf8')
);

// Initialize runtime
const runtime = new AgentRuntime({
  manifest,
  openApiSpec: './agent-api.openapi.yml'
});

// Start agent
await runtime.start();

// Agent is now listening for requests
```

### Advanced Configuration

```typescript
const runtime = new AgentRuntime({
  manifest,
  openApiSpec: './agent-api.openapi.yml',
  config: {
    llm: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY
    },
    observability: {
      tracing: {
        endpoint: 'http://jaeger:4318'
      },
      metrics: {
        endpoint: 'http://prometheus:9090'
      }
    },
    constraints: {
      maxConcurrentRequests: 10,
      maxTokensPerDay: 100000
    }
  }
});
```

## Kubernetes Deployment

### Agent Manifest ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: data-processor-manifest
data:
  agent.ossa.yaml: |
    apiVersion: ossa/v0.3.1
    kind: Agent
    metadata:
      name: data-processor
    spec:
      # ... agent spec ...
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: data-processor-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: data-processor-agent
  template:
    metadata:
      labels:
        app: data-processor-agent
    spec:
      containers:
      - name: agent
        image: agent-buildkit:latest
        env:
        - name: AGENT_MANIFEST_PATH
          value: /etc/agent/agent.ossa.yaml
        volumeMounts:
        - name: agent-manifest
          mountPath: /etc/agent
        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
      volumes:
      - name: agent-manifest
        configMap:
          name: data-processor-manifest
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY agent.ossa.yaml ./
COPY agent-api.openapi.yml ./
COPY dist/ ./dist/

ENV NODE_ENV=production
ENV AGENT_MANIFEST_PATH=/app/agent.ossa.yaml

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  agent:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OTLP_ENDPOINT=http://jaeger:4318
    ports:
      - "3000:3000"
    depends_on:
      - jaeger
      - prometheus

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "4318:4318"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
```

## Serverless Deployment

### AWS Lambda

```typescript
import { AgentRuntime } from '@bluefly/agent-buildkit';
import { APIGatewayProxyHandler } from 'aws-lambda';

let runtime: AgentRuntime | null = null;

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!runtime) {
    runtime = new AgentRuntime({
      manifest: require('./agent.ossa.yaml'),
      openApiSpec: require('./agent-api.openapi.yml')
    });
    await runtime.start();
  }

  const result = await runtime.handleRequest({
    path: event.path,
    method: event.httpMethod,
    body: event.body,
    headers: event.headers
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

## Observability Integration

### OpenTelemetry Tracing

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('agent-runtime');

async function processRequest(request: Request) {
  return tracer.startActiveSpan('process-request', async (span) => {
    try {
      span.setAttribute('agent.id', manifest.metadata.name);
      span.setAttribute('capability', request.capability);
      
      const result = await agent.execute(request);
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message 
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### Prometheus Metrics

```typescript
import { Counter, Histogram } from 'prom-client';

const requestCounter = new Counter({
  name: 'agent_requests_total',
  help: 'Total number of agent requests',
  labelNames: ['agent_id', 'capability', 'status']
});

const requestDuration = new Histogram({
  name: 'agent_request_duration_seconds',
  help: 'Agent request duration',
  labelNames: ['agent_id', 'capability']
});

async function processRequest(request: Request) {
  const timer = requestDuration.startTimer({
    agent_id: manifest.metadata.name,
    capability: request.capability
  });

  try {
    const result = await agent.execute(request);
    requestCounter.inc({
      agent_id: manifest.metadata.name,
      capability: request.capability,
      status: 'success'
    });
    return result;
  } catch (error) {
    requestCounter.inc({
      agent_id: manifest.metadata.name,
      capability: request.capability,
      status: 'error'
    });
    throw error;
  } finally {
    timer();
  }
}
```

## Error Handling

### Structured Error Responses

```typescript
import { z } from 'zod';

export class AgentError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export function handleError(error: unknown): Response {
  if (error instanceof AgentError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      }
    };
  }

  // Unknown error
  return {
    statusCode: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }
  };
}
```

## Security

### Authentication

```typescript
import { verify } from 'jsonwebtoken';

export async function authenticateRequest(
  headers: Record<string, string>
): Promise<AgentIdentity> {
  const token = headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new AgentError('UNAUTHORIZED', 401, 'Missing authentication token');
  }

  try {
    const payload = verify(token, process.env.JWT_SECRET!);
    return {
      agentId: payload.agentId,
      capabilities: payload.capabilities
    };
  } catch (error) {
    throw new AgentError('UNAUTHORIZED', 401, 'Invalid authentication token');
  }
}
```

## References

- [OSSA Schema Reference](/docs/schema-reference)
- [agent-buildkit Documentation](https://gitlab.com/blueflyio/agent-buildkit)
