# OSSA API - Getting Started Guide

## Overview

The OSSA (Open Standards for Scalable Agents) API provides a comprehensive framework for building, orchestrating, and managing AI agents at scale. This guide will help you get started with the API.

## Prerequisites

- API Key for authentication
- Basic understanding of RESTful APIs
- Familiarity with OpenAPI/Swagger specifications
- Development environment with your preferred language (Python, JavaScript, Go, PHP, etc.)

## Quick Start

### 1. Authentication

All API requests require authentication using an API key:

```bash
curl -H "X-API-Key: your-api-key-here" \
  https://api.ossa.bluefly.io/v1/agents
```

### 2. Create Your First Agent

#### Using cURL

```bash
curl -X POST https://api.ossa.bluefly.io/v1/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "name": "my-first-agent",
    "type": "worker",
    "domains": ["api-design", "testing"],
    "capabilities": {
      "max_concurrent_tasks": 5,
      "supports_streaming": true
    },
    "metadata": {
      "version": "1.0.0",
      "description": "My first OSSA agent"
    }
  }'
```

#### Using Python

```python
import requests

url = "https://api.ossa.bluefly.io/v1/agents"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key-here"
}
payload = {
    "name": "my-first-agent",
    "type": "worker",
    "domains": ["api-design", "testing"],
    "capabilities": {
        "max_concurrent_tasks": 5,
        "supports_streaming": True
    },
    "metadata": {
        "version": "1.0.0",
        "description": "My first OSSA agent"
    }
}

response = requests.post(url, json=payload, headers=headers)
agent = response.json()
print(f"Created agent: {agent['id']}")
```

#### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const createAgent = async () => {
  const response = await axios.post(
    'https://api.ossa.bluefly.io/v1/agents',
    {
      name: 'my-first-agent',
      type: 'worker',
      domains: ['api-design', 'testing'],
      capabilities: {
        max_concurrent_tasks: 5,
        supports_streaming: true
      },
      metadata: {
        version: '1.0.0',
        description: 'My first OSSA agent'
      }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key-here'
      }
    }
  );

  console.log('Created agent:', response.data.id);
  return response.data;
};

createAgent();
```

### 3. List Available Agents

```bash
curl -H "X-API-Key: your-api-key-here" \
  "https://api.ossa.bluefly.io/v1/agents?type=worker&limit=10"
```

### 4. Execute a Task

```bash
curl -X POST https://api.ossa.bluefly.io/v1/agents/{agentId}/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "task": {
      "type": "api-design",
      "input": {
        "specification": "OpenAPI 3.1",
        "service": "User Management API"
      }
    }
  }'
```

## Agent Types

OSSA supports several agent types, each optimized for specific tasks:

### 1. Worker Agents
- Execute specific tasks
- Process data transformations
- Handle API integrations

### 2. Orchestrator Agents
- Coordinate multiple agents
- Manage complex workflows
- Handle task distribution

### 3. Critic Agents
- Validate outputs
- Ensure quality standards
- Perform compliance checks

### 4. Governor Agents
- Enforce policies
- Manage permissions
- Audit operations

### 5. Monitor Agents
- Track system metrics
- Observe agent performance
- Generate reports

## Common Use Cases

### Use Case 1: API Design Workflow

```python
# 1. Create a worker agent for API design
design_agent = create_agent({
    "type": "worker",
    "domains": ["api-design", "openapi"]
})

# 2. Create a critic agent for validation
critic_agent = create_agent({
    "type": "critic",
    "domains": ["api-validation", "security"]
})

# 3. Create an orchestrator to coordinate
orchestrator = create_agent({
    "type": "orchestrator",
    "child_agents": [design_agent["id"], critic_agent["id"]]
})

# 4. Execute the workflow
result = execute_task(orchestrator["id"], {
    "task_type": "api_design_workflow",
    "input": {
        "api_name": "Payment Service",
        "requirements": "RESTful API for payment processing"
    }
})
```

### Use Case 2: Distributed Task Processing

```javascript
// Create multiple worker agents
const workers = await Promise.all([
  createAgent({ type: 'worker', domains: ['data-processing'] }),
  createAgent({ type: 'worker', domains: ['data-processing'] }),
  createAgent({ type: 'worker', domains: ['data-processing'] })
]);

// Create orchestrator for load balancing
const orchestrator = await createAgent({
  type: 'orchestrator',
  child_agents: workers.map(w => w.id),
  strategy: 'round-robin'
});

// Process large dataset
const result = await executeBulkTasks(orchestrator.id, {
  tasks: dataItems.map(item => ({
    type: 'transform',
    input: item
  }))
});
```

## Advanced Features

### Webhooks

Register webhooks to receive real-time notifications:

```bash
curl -X POST https://api.ossa.bluefly.io/v1/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "url": "https://your-app.com/webhook",
    "events": ["agent.created", "task.completed", "task.failed"]
  }'
```

### Streaming Responses

For long-running tasks, use Server-Sent Events (SSE):

```python
import requests

url = f"https://api.ossa.bluefly.io/v1/agents/{agent_id}/execute"
headers = {
    "Accept": "text/event-stream",
    "X-API-Key": "your-api-key-here"
}

with requests.post(url, json=task_data, headers=headers, stream=True) as response:
    for line in response.iter_lines():
        if line:
            event = line.decode('utf-8')
            print(f"Event: {event}")
```

### Batch Operations

Process multiple agents or tasks in a single request:

```bash
curl -X POST https://api.ossa.bluefly.io/v1/agents/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "operations": [
      {
        "method": "POST",
        "path": "/agents",
        "body": { "name": "agent-1", "type": "worker" }
      },
      {
        "method": "POST",
        "path": "/agents",
        "body": { "name": "agent-2", "type": "critic" }
      }
    ]
  }'
```

## Error Handling

All API errors follow the RFC 7807 Problem Details format:

```json
{
  "type": "https://api.ossa.bluefly.io/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Agent type 'invalid-type' is not supported",
  "instance": "/agents/123",
  "errors": [
    {
      "field": "type",
      "message": "Must be one of: worker, orchestrator, critic, governor, monitor"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Free tier**: 100 requests/minute
- **Pro tier**: 1000 requests/minute
- **Enterprise**: Custom limits

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## SDK Support

Official SDKs are available for:

- **Python**: `pip install ossa-sdk`
- **JavaScript/TypeScript**: `npm install @ossa/sdk`
- **Go**: `go get github.com/ossa/go-sdk`
- **PHP**: `composer require ossa/php-sdk`

## Next Steps

1. Explore the [API Reference](/api-docs.html) for detailed endpoint documentation
2. Read the [Agent Specification](/docs/specification/agents.html) guide
3. Check out the [Tutorials](/docs/tutorials/) for advanced use cases
4. Join our [Community](https://gitlab.bluefly.io/llm/ossa) for support

## Need Help?

- 📚 [Full Documentation](https://docs.ossa.bluefly.io)
- 💬 [Community Forum](https://forum.ossa.bluefly.io)
- 🐛 [Report Issues](https://gitlab.bluefly.io/llm/ossa/issues)
- 📧 [Email Support](mailto:ossa@bluefly.io)
