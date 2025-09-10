# OSSA Platform API Documentation v0.1.8

## API Overview

The OSSA Platform provides a comprehensive REST and GraphQL API for agent management, discovery, and orchestration. All endpoints follow OpenAPI 3.1 specification with RFC7807 Problem Details for error handling.

## Base URLs

| Environment | REST API | GraphQL | WebSocket |
|------------|----------|---------|-----------|
| Production | `https://api.llm.bluefly.io/ossa/v1` | `https://api.llm.bluefly.io/graphql` | `wss://api.llm.bluefly.io/subscriptions` |
| Staging | `https://staging.api.llm.bluefly.io/ossa/v1` | `https://staging.api.llm.bluefly.io/graphql` | `wss://staging.api.llm.bluefly.io/subscriptions` |
| Development | `http://localhost:4000/api/v1` | `http://localhost:4000/graphql` | `ws://localhost:4001/subscriptions` |

## Authentication

### Supported Methods

#### 1. API Key Authentication
```http
GET /api/v1/agents
X-API-Key: ossa_live_sk_1234567890abcdef
```

#### 2. JWT Bearer Token
```http
GET /api/v1/agents
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. OAuth 2.0 Flow
```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
scope=agents:read agents:write
```

#### 4. mTLS (Service-to-Service)
Configure client certificate in TLS handshake for service authentication.

## Core Endpoints

### Health & Status

#### GET /health
**Description**: Platform health check with service status breakdown

**Response Example**:
```json
{
  "status": "healthy",
  "version": "0.1.8",
  "ossa_version": "0.1.8",
  "uptime": 99.95,
  "services": {
    "agent_registry": "healthy",
    "discovery_engine": "healthy",
    "graphql_api": "healthy",
    "compliance_monitor": "healthy"
  },
  "timestamp": "2025-01-26T10:00:00Z"
}
```

#### GET /version
**Description**: Detailed version information

**Response Example**:
```json
{
  "api": "1.0.0",
  "ossa": "0.1.8",
  "platform": "0.1.8+rev2",
  "build": "2025.01.26.1234",
  "commit": "abc123def456"
}
```

### Agent Management

#### GET /agents
**Description**: List all registered agents with filtering and pagination

**Query Parameters**:
- `limit` (integer, 1-100, default: 20): Results per page
- `offset` (integer, default: 0): Pagination offset
- `class` (string): Filter by agent class (general|specialist|workflow|integration)
- `tier` (string): Filter by conformance tier (core|governed|advanced)
- `domain` (string): Filter by domain expertise
- `status` (string): Filter by health status

**Response Example**:
```json
{
  "agents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "semantic-analyzer",
      "version": "1.0.0",
      "description": "Advanced semantic analysis agent",
      "spec": {
        "conformance_tier": "advanced",
        "class": "specialist",
        "capabilities": {
          "primary": ["text_analysis", "entity_extraction"],
          "secondary": ["sentiment_analysis"]
        }
      },
      "status": {
        "health": "healthy",
        "last_seen": "2025-01-26T10:00:00Z",
        "metrics": {
          "requests_per_minute": 150,
          "average_response_time": 45,
          "error_rate": 0.001
        }
      }
    }
  ],
  "total": 93,
  "limit": 20,
  "offset": 0
}
```

#### POST /agents
**Description**: Register a new agent

**Request Body**:
```json
{
  "name": "custom-agent",
  "version": "1.0.0",
  "description": "Custom specialized agent",
  "endpoint": "https://agent.example.com/api",
  "spec": {
    "conformance_tier": "advanced",
    "class": "specialist",
    "category": "assistant",
    "capabilities": {
      "primary": ["data_processing", "analysis"],
      "secondary": ["reporting"]
    },
    "protocols": [
      {"name": "openapi", "version": "3.1.0", "required": true},
      {"name": "mcp", "version": "2024-11-05", "required": false}
    ],
    "endpoints": {
      "health": "/health",
      "capabilities": "/capabilities",
      "api": "/api"
    }
  }
}
```

**Response**: 201 Created with agent details

#### GET /agents/{agentId}
**Description**: Get detailed information about a specific agent

**Path Parameters**:
- `agentId` (string, UUID): Agent identifier

**Response**: Agent object with full specification

#### PUT /agents/{agentId}
**Description**: Update agent configuration

**Request Body**: Partial agent specification to update

**Response**: 200 OK with updated agent

#### DELETE /agents/{agentId}
**Description**: Unregister an agent

**Response**: 204 No Content

### Discovery

#### GET /discover
**Description**: UADP-compatible agent discovery by capabilities

**Query Parameters**:
- `capabilities[]` (array): Required capabilities
- `domain` (string): Domain expertise filter
- `tier` (string): Minimum conformance tier
- `limit` (integer): Maximum results

**Response Example**:
```json
{
  "agents": [
    {
      "id": "agent-uuid",
      "name": "matching-agent",
      "score": 0.95,
      "capabilities_matched": ["text_analysis", "nlp"],
      "capabilities_additional": ["sentiment_analysis"]
    }
  ],
  "query": {
    "capabilities": ["text_analysis", "nlp"],
    "domain": "specialist",
    "tier": "advanced"
  },
  "total": 5
}
```

### Metrics & Analytics

#### GET /metrics
**Description**: Platform-wide metrics and analytics

**Query Parameters**:
- `timeframe` (string): Time window (1h|6h|24h|7d|30d)
- `aggregation` (string): Aggregation level (minute|hour|day)

**Response Example**:
```json
{
  "timestamp": "2025-01-26T10:00:00Z",
  "timeframe": "24h",
  "agents": {
    "total": 93,
    "active": 87,
    "by_tier": {
      "core": 20,
      "governed": 35,
      "advanced": 38
    }
  },
  "requests": {
    "total": 1250000,
    "success_rate": 99.95,
    "average_response_time": 47.3,
    "by_endpoint": {
      "/agents": 450000,
      "/discover": 300000,
      "/graphql": 500000
    }
  },
  "errors": [
    {"code": "RATE_LIMIT_EXCEEDED", "count": 125},
    {"code": "AGENT_NOT_FOUND", "count": 89}
  ]
}
```

## GraphQL API

### Endpoint
```
POST /graphql
```

### Schema Overview

```graphql
type Query {
  agent(id: ID!): Agent
  agents(filter: AgentFilter, limit: Int, offset: Int): AgentConnection!
  discover(capabilities: [String!]!, tier: Tier): [Agent!]!
  metrics(timeframe: Timeframe!): PlatformMetrics!
}

type Mutation {
  registerAgent(input: RegisterAgentInput!): Agent!
  updateAgent(id: ID!, input: UpdateAgentInput!): Agent!
  unregisterAgent(id: ID!): Boolean!
}

type Subscription {
  agentStatusChanged(agentId: ID): AgentStatus!
  metricsUpdate(interval: Int!): PlatformMetrics!
}
```

### Query Examples

#### Get Agent Details
```graphql
query GetAgent($id: ID!) {
  agent(id: $id) {
    id
    name
    version
    spec {
      conformanceTier
      capabilities {
        primary
        secondary
      }
    }
    status {
      health
      lastSeen
      metrics {
        requestsPerMinute
        averageResponseTime
      }
    }
  }
}
```

#### Discover Agents
```graphql
query DiscoverAgents($capabilities: [String!]!) {
  discover(capabilities: $capabilities, tier: ADVANCED) {
    id
    name
    spec {
      capabilities {
        primary
      }
    }
  }
}
```

### Subscriptions

#### Real-time Status Updates
```graphql
subscription AgentStatus($agentId: ID) {
  agentStatusChanged(agentId: $agentId) {
    agentId
    health
    timestamp
    metrics {
      requestsPerMinute
      errorRate
    }
  }
}
```

## Rate Limiting

### Limits by Tier

| Tier | Requests/Hour | Burst | GraphQL Complexity |
|------|--------------|-------|-------------------|
| Free | 1,000 | 50/min | 1,000 |
| Basic | 10,000 | 500/min | 5,000 |
| Pro | 100,000 | 5,000/min | 10,000 |
| Enterprise | Unlimited | Custom | Unlimited |

### Headers

Rate limit information in response headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1706266800
```

## Error Handling

### RFC7807 Problem Details

All errors follow RFC7807 Problem Details format:

```json
{
  "type": "https://api.llm.bluefly.io/problems/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "API rate limit of 1000 requests per hour exceeded",
  "instance": "/api/v1/agents",
  "traceId": "abc123-def456-ghi789",
  "errors": {
    "limit": ["1000"],
    "window": ["3600"],
    "retry_after": ["300"]
  }
}
```

### Common Error Codes

| Status | Type | Description |
|--------|------|-------------|
| 400 | `invalid-request` | Malformed request syntax |
| 401 | `unauthorized` | Missing or invalid authentication |
| 403 | `forbidden` | Insufficient permissions |
| 404 | `not-found` | Resource not found |
| 409 | `conflict` | Resource already exists |
| 429 | `rate-limit-exceeded` | Too many requests |
| 500 | `internal-error` | Server error |
| 503 | `service-unavailable` | Temporary unavailability |

## Webhooks

### Configuration

Register webhook endpoints for event notifications:

```json
POST /webhooks
{
  "url": "https://your-app.com/webhooks/ossa",
  "events": ["agent.registered", "agent.status_changed"],
  "secret": "webhook_secret_key"
}
```

### Event Types

- `agent.registered` - New agent registered
- `agent.updated` - Agent configuration updated
- `agent.unregistered` - Agent removed
- `agent.status_changed` - Health status change
- `discovery.match_found` - Discovery match
- `compliance.violation` - Compliance issue detected

### Payload Verification

Verify webhook signatures:
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

if (signature !== request.headers['x-ossa-signature']) {
  throw new Error('Invalid signature');
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { OSSAClient } from '@bluefly/ossa-sdk';

const client = new OSSAClient({
  apiKey: process.env.OSSA_API_KEY,
  environment: 'production'
});

// List agents
const agents = await client.agents.list({
  tier: 'advanced',
  limit: 50
});

// Discover by capability
const matches = await client.discover({
  capabilities: ['text_analysis', 'nlp']
});
```

### Python
```python
from ossa_sdk import OSSAClient

client = OSSAClient(
    api_key=os.environ['OSSA_API_KEY'],
    environment='production'
)

# Register agent
agent = client.agents.register({
    'name': 'python-agent',
    'version': '1.0.0',
    'spec': {
        'conformance_tier': 'core',
        'class': 'general'
    }
})
```

## Performance Guidelines

### Best Practices

1. **Use pagination** for large result sets
2. **Cache discovery results** for 5 minutes
3. **Implement exponential backoff** for retries
4. **Use GraphQL field selection** to minimize payload
5. **Subscribe to updates** instead of polling
6. **Batch operations** when possible

### Response Time Targets

- Health check: <10ms
- Agent list: <50ms
- Discovery: <100ms
- GraphQL queries: <100ms
- Mutations: <200ms

## Migration Guide

### From v0.1.7 to v0.1.8

Breaking changes:
- `GET /agents` now requires pagination parameters
- Agent spec `framework_support` renamed to `protocols`
- Discovery endpoint path changed from `/api/discover` to `/discover`

Migration steps:
1. Update client libraries to latest version
2. Add pagination to agent list calls
3. Update agent registration payloads
4. Test discovery with new endpoint

## OpenAPI Validation

Validate the OpenAPI specification:
```bash
npx @redocly/openapi-cli lint __REBUILD/openapi.yml --fail-on-error | cat
```

Generate ReDoc HTML documentation:
```bash
npx redoc-cli bundle __REBUILD/openapi.yml --output __REBUILD/openapi.html
```

## API Operations Inventory

### Complete Operations List
The OSSA platform exposes the following RESTful and GraphQL operations:

| Method | Path | Operation | Auth Required | Description |
|--------|------|-----------|---------------|-------------|
| GET | `/health` | Health Check | No | Platform health status with service breakdown |
| GET | `/version` | Version Info | No | API and platform version details |
| GET | `/agents` | List Agents | Optional | Paginated list of registered agents |
| POST | `/agents` | Register Agent | Yes | Register new OSSA-compliant agent |
| GET | `/agents/{agentId}` | Get Agent | Optional | Retrieve specific agent details |
| PUT | `/agents/{agentId}` | Update Agent | Yes | Modify agent configuration |
| DELETE | `/agents/{agentId}` | Delete Agent | Yes | Unregister agent from platform |
| GET | `/discover` | Discover Agents | No | UADP capability-based discovery |
| GET | `/metrics` | Platform Metrics | Yes | Analytics and performance data |
| POST | `/graphql` | GraphQL Endpoint | Optional | Query/Mutation/Subscription endpoint |

### Operation Details

#### Health & Monitoring Operations
- **GET /health**: Returns comprehensive health status including uptime, service states, and readiness
- **GET /version**: Provides version information for API, OSSA spec, platform, build, and commit hash
- **GET /metrics**: Delivers platform-wide metrics with configurable timeframes and aggregation levels

#### Agent Management Operations
- **GET /agents**: Supports filtering by class, tier, domain, and status with pagination
- **POST /agents**: Registers agents with full specification including capabilities and protocols
- **GET /agents/{agentId}**: Returns complete agent specification with current status
- **PUT /agents/{agentId}**: Allows partial updates to agent configuration
- **DELETE /agents/{agentId}**: Soft deletes agent with audit trail preservation

#### Discovery Operations
- **GET /discover**: Implements UADP v0.1.8 protocol for semantic capability matching
- Supports multi-dimensional filtering by capabilities, domain, and tier
- Returns scored matches with confidence levels

#### GraphQL Operations
- **POST /graphql**: Unified endpoint for all GraphQL operations
- Supports queries for flexible data fetching
- Mutations for state changes
- Subscriptions for real-time updates via WebSocket

### API Coverage Metrics
- **Total Operations**: 10 REST + GraphQL
- **Authenticated**: 60% require authentication
- **Public**: 40% available without auth
- **Real-time**: GraphQL subscriptions enabled
- **Versioned**: All endpoints support v1 versioning