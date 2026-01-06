# API Endpoints Reference

Complete reference of all OSSA platform API endpoints.

## Base URLs

```
Production:   https://api.llm.bluefly.io/ossa/v1
Development:  https://api-dev.llm.bluefly.io/ossa/v1
Local:        http://localhost:3000
```

## Health & Status

### GET /health
Health check endpoint (no authentication required).

**Response:** `200 OK`

### GET /health/ready
Readiness check for load balancers.

**Response:** `200 OK` | `503 Service Unavailable`

### GET /health/live
Liveness check for orchestrators.

**Response:** `200 OK` | `503 Service Unavailable`

---

## Agent Registry

### GET /agents
List all registered agents with pagination and filtering.

**Query Parameters:**
- `search` - Search query
- `type` - Filter by agent type (`agent`, `task`, `workflow`)
- `capability` - Filter by capability name
- `status` - Filter by status (`active`, `inactive`, `deprecated`)
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset

**Response:** `200 OK`

### POST /agents
Register a new agent.

**Body:** Agent manifest (JSON or YAML)

**Response:** `201 Created`

### GET /agents/{agentId}
Get details for a specific agent.

**Path Parameters:**
- `agentId` - Unique agent identifier

**Response:** `200 OK` | `404 Not Found`

### PUT /agents/{agentId}
Update an existing agent registration.

**Path Parameters:**
- `agentId` - Unique agent identifier

**Body:** Updated agent manifest

**Response:** `200 OK` | `404 Not Found`

### DELETE /agents/{agentId}
Unregister an agent.

**Path Parameters:**
- `agentId` - Unique agent identifier

**Query Parameters:**
- `force` - Force deletion (boolean)

**Response:** `204 No Content` | `404 Not Found`

### GET /agents/{agentId}/manifest
Get the raw OSSA manifest for an agent.

**Path Parameters:**
- `agentId` - Unique agent identifier

**Headers:**
- `Accept` - `application/json` or `application/yaml`

**Response:** `200 OK` | `404 Not Found`

### PATCH /agents/{agentId}/status
Update agent status.

**Path Parameters:**
- `agentId` - Unique agent identifier

**Body:**
```json
{
  "status": "active" | "inactive" | "deprecated",
  "reason": "Optional reason"
}
```

**Response:** `200 OK`

---

## Discovery

### GET /discovery/search
Advanced agent discovery with filtering and search.

**Query Parameters:**
- `q` - Natural language search query
- `capability` - Filter by capability (can specify multiple)
- `taxonomy` - Filter by taxonomy path
- `provider` - Filter by LLM provider
- `min_version` - Minimum semantic version
- `max_version` - Maximum semantic version
- `status` - Filter by status
- `labels` - Filter by labels (`key=value` format)
- `sort` - Sort field (`relevance`, `created_at`, `name`)
- `order` - Sort order (`asc`, `desc`)
- `limit` - Results per page
- `offset` - Pagination offset

**Response:** `200 OK`

### GET /discovery/capabilities
List all available capabilities across agents.

**Query Parameters:**
- `category` - Filter by capability category
- `search` - Search capability names

**Response:** `200 OK`

### GET /discovery/similar/{agentId}
Find agents similar to a given agent.

**Path Parameters:**
- `agentId` - Reference agent ID

**Query Parameters:**
- `limit` - Number of similar agents (default: 10)
- `min_similarity` - Minimum similarity score (0.0-1.0)

**Response:** `200 OK`

### POST /discovery/recommend
Get agent recommendations based on requirements.

**Body:**
```json
{
  "use_case": "Description of use case",
  "requirements": {
    "capabilities": ["capability1", "capability2"],
    "max_latency_ms": 5000,
    "budget_per_1k_tokens": 0.05
  },
  "preferences": {
    "provider": "anthropic",
    "language": ["en", "es"]
  }
}
```

**Response:** `200 OK`

### POST /discovery/federated
Search across multiple OSSA registries.

**Body:**
```json
{
  "registries": ["https://registry1.example.com"],
  "query": {},
  "merge_strategy": "best_match"
}
```

**Response:** `200 OK`

---

## Specification

### POST /specification/validate
Validate an agent manifest against OSSA schema.

**Body:** Agent manifest (JSON or YAML)

**Response:** `200 OK`

### GET /specification/taxonomies
Get the complete taxonomy hierarchy.

**Response:** `200 OK`

### GET /specification/schema
Get the OSSA JSON schema.

**Query Parameters:**
- `version` - Schema version (default: latest)

**Response:** `200 OK`

---

## Orchestration

### GET /orchestration/workflows
List all workflows.

**Query Parameters:**
- `limit` - Results per page
- `offset` - Pagination offset
- `status` - Filter by status

**Response:** `200 OK`

### POST /orchestration/workflows
Create a new workflow.

**Body:** Workflow definition

**Response:** `201 Created`

### GET /orchestration/workflows/{workflowId}
Get workflow details.

**Path Parameters:**
- `workflowId` - Unique workflow identifier

**Response:** `200 OK` | `404 Not Found`

### POST /orchestration/workflows/{workflowId}/execute
Execute a workflow.

**Path Parameters:**
- `workflowId` - Unique workflow identifier

**Body:**
```json
{
  "inputs": {},
  "environment": "production",
  "async": true
}
```

**Response:** `202 Accepted` (async) | `200 OK` (sync)

### GET /orchestration/executions/{executionId}
Get workflow execution status.

**Path Parameters:**
- `executionId` - Unique execution identifier

**Response:** `200 OK`

### DELETE /orchestration/executions/{executionId}
Cancel a running execution.

**Path Parameters:**
- `executionId` - Unique execution identifier

**Response:** `204 No Content`

---

## Messaging

### POST /messaging/channels/{channel}/publish
Publish a message to a channel.

**Path Parameters:**
- `channel` - Channel name

**Body:**
```json
{
  "message": {},
  "metadata": {
    "correlation_id": "optional"
  },
  "delivery": {
    "guarantee": "at-least-once",
    "timeout_ms": 5000
  }
}
```

**Response:** `200 OK`

### POST /messaging/subscriptions
Create a subscription.

**Body:**
```json
{
  "agent_id": "agt_abc123",
  "channel": "channel.name",
  "handler": {
    "type": "webhook",
    "url": "https://example.com/webhook"
  }
}
```

**Response:** `201 Created`

### GET /messaging/subscriptions
List subscriptions.

**Query Parameters:**
- `agent_id` - Filter by agent ID
- `channel` - Filter by channel
- `status` - Filter by status

**Response:** `200 OK`

### DELETE /messaging/subscriptions/{subscriptionId}
Delete a subscription.

**Path Parameters:**
- `subscriptionId` - Unique subscription identifier

**Response:** `204 No Content`

### GET /messaging/channels/{channel}/messages
Get message history for a channel.

**Path Parameters:**
- `channel` - Channel name

**Query Parameters:**
- `since` - Timestamp (ISO 8601)
- `until` - Timestamp (ISO 8601)
- `limit` - Maximum messages

**Response:** `200 OK`

### GET /messaging/metrics
Get messaging metrics.

**Query Parameters:**
- `channel` - Filter by channel
- `agent_id` - Filter by agent

**Response:** `200 OK`

### PUT /messaging/channels/{channel}/acl
Update channel access control.

**Path Parameters:**
- `channel` - Channel name

**Body:**
```json
{
  "publish": ["agt_*"],
  "subscribe": ["agt_reporter*"]
}
```

**Response:** `200 OK`

---

## Authentication

### POST /auth/token
Get JWT access token.

**Body:**
```json
{
  "username": "user@example.com",
  "password": "password",
  "scope": "read write"
}
```

**Response:** `200 OK`

### POST /auth/refresh
Refresh access token.

**Body:**
```json
{
  "refresh_token": "token"
}
```

**Response:** `200 OK`

### GET /auth/verify
Verify authentication credentials.

**Response:** `200 OK`

### POST /auth/api-keys
Generate a new API key.

**Body:**
```json
{
  "name": "Production Key",
  "expires_in": 7776000
}
```

**Response:** `201 Created`

### GET /auth/api-keys
List API keys.

**Response:** `200 OK`

### DELETE /auth/api-keys/{keyId}
Revoke an API key.

**Path Parameters:**
- `keyId` - API key identifier

**Response:** `204 No Content`

### PUT /auth/api-keys/{keyId}/restrictions
Update API key restrictions.

**Path Parameters:**
- `keyId` - API key identifier

**Body:**
```json
{
  "allowed_ips": ["203.0.113.0/24"],
  "rate_limit": 1000
}
```

**Response:** `200 OK`

---

## Rate Limits

All endpoints (except `/health*`) are subject to rate limits. See [Authentication](../openapi/authentication.md#rate-limits) for details.

## Versioning

API version is included in the base URL: `/ossa/v1`

Breaking changes will increment the major version: `/ossa/v2`

## See Also

- [Authentication Guide](../openapi/authentication.md)
- [Agent Registry API](../openapi/agents.md)
- [Discovery API](../openapi/discovery.md)
- [Messaging API](../openapi/messaging.md)
- [Error Codes](errors.md)
- [Schemas Reference](schemas.md)
