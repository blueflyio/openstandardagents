# OSSA API Documentation

Complete API reference for the Open Standards for Scalable Agents (OSSA) v0.1.9.

## Quick Links

- **[OpenAPI 3.1 Specification](openapi.yml)** - Machine-readable API specification
- **[Interactive API Documentation](openapi.html)** - Swagger UI interface
- **[API Reference Guide](ossa-api-reference.md)** - Human-readable API documentation
- **[Agent Deployment Guide](agent-deployment.md)** - Agent lifecycle management

## API Overview

The OSSA API provides comprehensive endpoints for:

### 🤖 Agent Management
- Create, read, update, delete agents
- Agent lifecycle management (deploy, start, stop, terminate)
- Agent health and status monitoring
- Agent capability discovery

###  Discovery & Registry
- Universal Agent Discovery Protocol (UADP)
- Agent capability matching
- Service mesh integration
- Dynamic agent registration

### 🎛 Orchestration
- Task routing and delegation
- Workflow coordination
- Multi-agent collaboration
- Event-driven orchestration

###  Monitoring & Observability
- Real-time agent metrics
- Performance monitoring
- Audit trail access
- Health check endpoints

### 🔒 Security & Compliance
- Authentication and authorization
- Compliance framework integration
- Audit logging
- Data residency controls

## Authentication

OSSA API uses OAuth 2.1 with PKCE for secure authentication:

```bash
# Get access token
curl -X POST https://api.ossa.dev/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=AUTH_CODE&client_id=YOUR_CLIENT_ID"

# Use token in API calls
curl -X GET https://api.ossa.dev/v1/agents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Base URLs

- **Production**: `https://api.ossa.dev`
- **Staging**: `https://staging-api.ossa.dev`
- **Development**: `http://localhost:3000`

## API Versioning

OSSA uses semantic versioning for API compatibility:

- **Current Version**: `v1` (stable)
- **Beta Version**: `v2-beta` (preview features)
- **Deprecated**: `v0` (legacy, removal planned)

## Common Response Patterns

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": "agent-123",
    "name": "data-processor",
    "status": "running"
  },
  "metadata": {
    "timestamp": "2025-09-18T12:00:00Z",
    "version": "v1"
  }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid agent configuration",
    "details": {
      "field": "capabilities",
      "reason": "required field missing"
    }
  },
  "metadata": {
    "timestamp": "2025-09-18T12:00:00Z",
    "requestId": "req-456"
  }
}
```

## Rate Limiting

API rate limits by tier:

| Tier | Requests/minute | Burst |
|------|----------------|-------|
| Free | 60 | 10 |
| Pro | 600 | 100 |
| Enterprise | 6000 | 1000 |

Rate limit headers:
- `X-RateLimit-Limit` - Requests allowed per window
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Time when rate limit resets

## SDKs and Libraries

### Official SDKs
- **TypeScript/JavaScript**: `@ossa/sdk`
- **Python**: `ossa-python`
- **Go**: `github.com/ossa-dev/go-sdk`
- **Java**: `io.ossa:ossa-java-sdk`

### Community SDKs
- **Rust**: `ossa-rs`
- **C#**: `OSSA.Net`
- **Ruby**: `ossa-ruby`

## Code Examples

### Create an Agent
```typescript
import { OSSAClient } from '@ossa/sdk';

const client = new OSSAClient({
  apiKey: process.env.OSSA_API_KEY,
  baseUrl: 'https://api.ossa.dev'
});

const agent = await client.agents.create({
  name: 'data-processor',
  type: 'worker',
  capabilities: ['data-processing', 'csv-parsing'],
  config: {
    runtime: 'nodejs',
    memory: '512Mi',
    cpu: '200m'
  }
});
```

### Execute Agent Task
```python
from ossa import OSSAClient

client = OSSAClient(api_key=os.environ['OSSA_API_KEY'])

result = client.agents.execute(
    agent_id='agent-123',
    task={
        'input': {'file_url': 'https://example.com/data.csv'},
        'config': {'timeout': 30}
    }
)
```

### Monitor Agent Status
```bash
# Get agent status
curl -X GET https://api.ossa.dev/v1/agents/agent-123/status \
  -H "Authorization: Bearer $OSSA_TOKEN"

# Stream agent logs
curl -X GET https://api.ossa.dev/v1/agents/agent-123/logs?follow=true \
  -H "Authorization: Bearer $OSSA_TOKEN"
```

## Webhooks

OSSA supports webhooks for real-time event notifications:

### Supported Events
- `agent.created` - New agent registered
- `agent.deployed` - Agent successfully deployed
- `agent.failed` - Agent execution failed
- `task.completed` - Task execution completed
- `workflow.started` - Multi-agent workflow initiated

### Webhook Configuration
```json
{
  "url": "https://your-app.com/webhooks/ossa",
  "events": ["agent.created", "task.completed"],
  "secret": "webhook-secret-key",
  "retry_policy": {
    "max_attempts": 3,
    "backoff": "exponential"
  }
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AGENT_NOT_FOUND` | Agent does not exist | 404 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `RATE_LIMITED` | Rate limit exceeded | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily down | 503 |

## Support and Resources

- **[Interactive API Explorer](openapi.html)** - Test API calls in browser
- **[Postman Collection](https://api.ossa.dev/postman)** - Ready-to-use API collection
- **[Status Page](https://status.ossa.dev)** - Service status and incidents
- **[Developer Forum](https://forum.ossa.dev)** - Community support
- **[Enterprise Support](mailto:enterprise@ossa.dev)** - Dedicated support

## Changelog

- **v1.2.0** (2025-09-18) - Added webhook support, improved error handling
- **v1.1.0** (2025-09-01) - OAuth 2.1 authentication, rate limiting
- **v1.0.0** (2025-08-15) - Initial stable release

---

For the complete API specification, see the [OpenAPI 3.1 documentation](openapi.yml) or explore the [interactive API reference](openapi.html).