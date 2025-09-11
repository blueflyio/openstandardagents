# OSSA Platform API Reference v0.1.8

## Overview

The Open Standards for Scalable Agents (OSSA) v0.1.8 provides a comprehensive platform API for agent registration, discovery, orchestration, and management. This API includes GraphQL endpoints, UADP-compatible discovery, and enterprise features with ISO 42001 and NIST AI RMF compliance.

## Base URLs

```
# Production
https://api.llm.bluefly.io/ossa/v1

# Development  
http://localhost:4000/api/v1

# Docker Gateway
http://localhost:3000/api
```

## Authentication

The OSSA Platform API supports multiple authentication methods:

### API Key Authentication
```bash
X-API-Key: your-api-key
```

### Bearer Token Authentication
```bash
Authorization: Bearer <jwt-token>
```

### Development Keys
- **Development**: `dev-key`
- **Testing**: `test-key`
- **Local Gateway**: No authentication required

## Core Platform Endpoints

### Platform Health

**GET** `/health`

OSSA v0.1.8 compliant health check with detailed service status.

**Response:**
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
    "orchestration": "healthy",
    "monitoring": "healthy"
  },
  "timestamp": "2025-01-26T10:00:00Z"
}
```

### Version Information

**GET** `/version`

Get detailed platform version information.

**Response:**
```json
{
  "api": "0.1.8",
  "ossa": "0.1.8", 
  "platform": "0.1.8+rev2",
  "build": "20250126-1000",
  "commit": "a1b2c3d"
}
```

## Agent Registry API

### List Agents

**GET** `/agents`

Get all registered agents with filtering and pagination.

**Query Parameters:**
- `limit` (integer, 1-100, default: 20) - Results per page
- `offset` (integer, default: 0) - Pagination offset  
- `class` (string) - Filter by agent class: general, specialist, workflow, integration
- `tier` (string) - Filter by conformance tier: core, governed, advanced

**Response:**
```json
{
  "agents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "example-agent",
      "version": "1.0.0",
      "description": "Example OSSA v0.1.8 agent",
      "spec": {
        "conformance_tier": "advanced",
        "class": "specialist",
        "category": "assistant",
        "capabilities": {
          "primary": ["analysis", "reporting"],
          "secondary": ["optimization"]
        },
        "protocols": [
          {
            "name": "openapi",
            "version": "3.1.0",
            "required": true,
            "extensions": ["x-ossa-advanced"]
          }
        ],
        "endpoints": {
          "health": "/health",
          "capabilities": "/capabilities",
          "discover": "/discover"
        }
      },
      "status": {
        "health": "healthy",
        "last_seen": "2025-01-26T10:00:00Z",
        "metrics": {
          "requests_per_minute": 45.2,
          "average_response_time": 120.5,
          "error_rate": 0.01
        }
      },
      "registered_at": "2025-01-26T09:00:00Z",
      "updated_at": "2025-01-26T09:30:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### Register Agent

**POST** `/agents`

Register a new OSSA v0.1.8 compliant agent.

**Request Body:**
```json
{
  "name": "my-agent",
  "version": "1.0.0",
  "description": "My OSSA agent",
  "endpoint": "http://localhost:3000",
  "spec": {
    "conformance_tier": "advanced",
    "class": "specialist", 
    "category": "assistant",
    "capabilities": {
      "primary": ["analysis", "reporting"],
      "secondary": ["optimization"]
    },
    "protocols": [
      {
        "name": "openapi",
        "version": "3.1.0",
        "required": true
      }
    ],
    "endpoints": {
      "health": "/health",
      "capabilities": "/capabilities"
    }
  }
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-agent",
  "version": "1.0.0",
  "status": {
    "health": "unknown",
    "last_seen": null
  },
  "registered_at": "2025-01-26T10:00:00Z"
}
```

### Get Agent Details

**GET** `/agents/{agentId}`

Get detailed information about a specific agent.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "example-agent",
  "version": "1.0.0",
  "spec": {
    "conformance_tier": "advanced",
    "class": "specialist"
  },
  "status": {
    "health": "healthy",
    "last_seen": "2025-01-26T10:00:00Z"
  }
}
```

### Update Agent

**PUT** `/agents/{agentId}`

Update an existing agent registration.

**Request Body:**
```json
{
  "version": "1.0.1",
  "description": "Updated description",
  "endpoint": "http://localhost:3001"
}
```

### Unregister Agent

**DELETE** `/agents/{agentId}`

Remove an agent from the registry.

**Response:** `204 No Content`

## Universal Agent Discovery Protocol (UADP)

### Discover Agents

**GET** `/discover`

UADP-compatible agent discovery by capabilities.

**Query Parameters:**
- `capabilities` (array) - Required capabilities
- `domain` (string) - Target domain
- `tier` (string) - Conformance tier filter

**Example:**
```
GET /discover?capabilities=analysis,reporting&domain=finance&tier=advanced
```

**Response:**
```json
{
  "agents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "finance-analyst",
      "capabilities": ["analysis", "reporting", "risk_assessment"],
      "endpoints": {
        "health": "http://localhost:3000/health",
        "capabilities": "http://localhost:3000/capabilities"
      }
    }
  ],
  "query": {
    "capabilities": ["analysis", "reporting"],
    "domain": "finance",
    "tier": "advanced"
  },
  "total": 1
}
```

## GraphQL API

### GraphQL Endpoint

**POST** `/graphql`

Execute GraphQL queries, mutations, and subscriptions.

**Request Body:**
```json
{
  "query": "query GetAgents { agents { id name version status { health } } }",
  "variables": {},
  "operationName": "GetAgents"
}
```

**Response:**
```json
{
  "data": {
    "agents": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "example-agent", 
        "version": "1.0.0",
        "status": {
          "health": "healthy"
        }
      }
    ]
  }
}
```

### GraphQL Schema Example

```graphql
type Agent {
  id: ID!
  name: String!
  version: String!
  spec: AgentSpec!
  status: AgentStatus!
  registeredAt: DateTime!
}

type AgentSpec {
  conformanceTier: ConformanceTier!
  class: AgentClass!
  capabilities: Capabilities!
  protocols: [Protocol!]!
}

type Query {
  agents(limit: Int, offset: Int): [Agent!]!
  agent(id: ID!): Agent
  discoverAgents(capabilities: [String!]): [Agent!]!
}

type Mutation {
  registerAgent(input: AgentRegistrationInput!): Agent!
  updateAgent(id: ID!, input: AgentUpdateInput!): Agent!
  unregisterAgent(id: ID!): Boolean!
}

type Subscription {
  agentStatusChanged(id: ID): Agent!
  agentRegistered: Agent!
}
```

## Platform Analytics

### Get Metrics

**GET** `/metrics`

Get comprehensive platform analytics and metrics.

**Query Parameters:**
- `timeframe` (string) - Time period: 1h, 6h, 24h, 7d, 30d (default: 24h)

**Response:**
```json
{
  "timestamp": "2025-01-26T10:00:00Z",
  "timeframe": "24h",
  "agents": {
    "total": 150,
    "active": 142,
    "by_tier": {
      "core": 45,
      "governed": 67,
      "advanced": 38
    }
  },
  "requests": {
    "total": 12500,
    "success_rate": 99.2,
    "average_response_time": 125.4
  },
  "errors": [
    {
      "code": "AGENT_UNREACHABLE",
      "message": "Agent health check failed",
      "count": 23
    }
  ]
}
```

## CLI Integration

### OSSA CLI Commands

The OSSA v0.1.8 CLI provides comprehensive API integration:

```bash
# Agent Management
ossa create my-agent --tier=advanced --domain=finance
ossa validate ./my-agent
ossa list --format=table
ossa upgrade ./my-agent

# Discovery
ossa discovery init
ossa discovery register ./my-agent  
ossa discovery find --capabilities=analysis
ossa discovery health

# Services
ossa services start
ossa services status
ossa services stop

# API Operations
ossa api agents list
ossa api agents create my-agent
ossa api discover --capabilities=analysis,reporting
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Bad Request",
  "details": {
    "field": "capabilities",
    "message": "At least one capability is required"
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (agent already exists)
- `500` - Internal Server Error

## Rate Limiting

- **Default**: 1000 requests per hour
- **Burst**: 100 requests per minute
- **GraphQL**: 50 queries per minute
- **Discovery**: 200 requests per hour

**Rate limit headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Compliance Features

### Enterprise Compliance

OSSA v0.1.8 includes enterprise-grade compliance features:

- **ISO 42001:2023** - AI Management Systems
- **NIST AI RMF 1.0** - AI Risk Management Framework
- **EU AI Act 2024** - European AI regulation compliance
- **SOC 2 Type II** - Security compliance controls

### Audit Trail

All API operations are logged with:
- Request/response details
- User authentication context  
- Timestamp and duration
- Compliance framework validation

## Performance Targets

- **Agent Discovery**: <50ms for 1000+ agents
- **API Response Time**: <100ms (95th percentile)
- **Availability**: 99.9% uptime SLA
- **Error Rate**: <0.1% threshold

## Docker Deployment

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  ossa-platform:
    image: ossa/platform:0.1.8
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - OSSA_VERSION=0.1.8
      - DATABASE_URL=postgresql://user:pass@db:5432/ossa
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:4000/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  ossa-gateway:
    image: ossa/gateway:0.1.8  
    ports:
      - "3000:3000"
    environment:
      - OSSA_PLATFORM_URL=http://ossa-platform:4000
    depends_on:
      - ossa-platform
```

## OpenAPI Specification

The complete OpenAPI 3.1 specification is available at:
- **Production**: https://api.llm.bluefly.io/ossa/v1/openapi.json
- **Development**: http://localhost:4000/api/v1/openapi.json
- **Repository**: [src/api/openapi.yaml](../../src/api/openapi.yaml)

## Examples

### Complete Agent Registration Flow

```bash
# 1. Check platform health
curl -H "X-API-Key: dev-key" http://localhost:4000/api/v1/health

# 2. Register new agent
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key" \
  -d '{
    "name": "analytics-agent",
    "version": "1.0.0",
    "endpoint": "http://localhost:3001",
    "spec": {
      "conformance_tier": "advanced",
      "class": "specialist",
      "capabilities": {
        "primary": ["data_analysis", "reporting"]
      },
      "protocols": [
        {"name": "openapi", "version": "3.1.0", "required": true}
      ]
    }
  }' \
  http://localhost:4000/api/v1/agents

# 3. Discover similar agents  
curl -H "X-API-Key: dev-key" \
  "http://localhost:4000/api/v1/discover?capabilities=data_analysis,reporting"

# 4. Get agent metrics
curl -H "X-API-Key: dev-key" \
  http://localhost:4000/api/v1/metrics?timeframe=1h
```

### GraphQL Query Example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key" \
  -d '{
    "query": "query { agents(limit: 5) { id name version spec { conformanceTier class } status { health } } }"
  }' \
  http://localhost:4000/api/v1/graphql
```

## Support

- **Documentation**: [OSSA Documentation](../README.md)
- **CLI Reference**: [CLI Usage Guide](../reference/cli/CLI_USAGE.md)
- **Migration Guide**: [v0.1.1 to v0.1.8 Migration](../MIGRATION_GUIDE.md)
- **GitHub Issues**: [OSSA Issues](https://github.com/bluefly-ai/ossa-standard/issues)