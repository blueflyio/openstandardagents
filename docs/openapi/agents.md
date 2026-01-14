# Agent Registry API

The Agent Registry API provides complete lifecycle management for OSSA agents, including registration, discovery, updates, and retirement.

## Overview

The registry serves as the central catalog for all agents in your OSSA platform. It enables:

- **Agent Registration** - Register new agents with manifests
- **Discovery** - Find agents by capabilities, taxonomies, or metadata
- **Version Management** - Track multiple versions of agents
- **Health Monitoring** - Monitor agent status and availability
- **Metadata Management** - Update labels, annotations, and descriptions

## Endpoints

### List Agents

Retrieve a paginated list of registered agents.

```http
GET /agents
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search query for agent names and descriptions |
| `type` | string | Filter by agent type (`agent`, `task`, `workflow`) |
| `capability` | string | Filter by capability name |
| `status` | string | Filter by status (`active`, `inactive`, `deprecated`) |
| `limit` | integer | Number of results per page (default: 50, max: 100) |
| `offset` | integer | Pagination offset (default: 0) |

**Example Request:**

```bash
curl "https://api.llm.bluefly.io/ossa/v1/agents?capability=text-generation&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "agents": [
    {
      "id": "agt_abc123",
      "name": "compliance-auditor",
      "version": "1.0.0",
      "type": "agent",
      "status": "active",
      "description": "Enterprise compliance auditor with multi-provider support",
      "capabilities": ["document-analysis", "report-generation"],
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-15T14:30:00Z",
      "metadata": {
        "category": "compliance",
        "domain": "enterprise/governance"
      }
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

**JavaScript/TypeScript:**

```typescript
const response = await fetch(
  'https://api.llm.bluefly.io/ossa/v1/agents?capability=text-generation&limit=10',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log(`Found ${data.total} agents`);
```

**Python:**

```python
import requests

response = requests.get(
    'https://api.llm.bluefly.io/ossa/v1/agents',
    params={
        'capability': 'text-generation',
        'limit': 10
    },
    headers={'Authorization': f'Bearer {token}'}
)

data = response.json()
print(f"Found {data['total']} agents")
```

---

### Register Agent

Register a new agent with the platform.

```http
POST /agents
```

**Request Body:**

Submit a complete OSSA agent manifest in JSON or YAML format.

**Example Request:**

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "ossa/v0.3.0",
    "kind": "Agent",
    "metadata": {
      "name": "document-analyzer",
      "version": "1.0.0",
      "description": "AI-powered document analysis agent",
      "labels": {
        "category": "document-processing",
        "domain": "legal/contracts"
      }
    },
    "spec": {
      "role": "You are a document analyzer. Extract key information from legal documents.",
      "llm": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022",
        "temperature": 0.3
      },
      "tools": [
        {
          "type": "mcp",
          "server": "filesystem",
          "capabilities": ["read_file"]
        }
      ],
      "safety": {
        "content_filtering": {
          "block_pii": true
        },
        "rate_limiting": {
          "requests_per_minute": 100
        }
      }
    }
  }'
```

**Example Response:**

```json
{
  "id": "agt_xyz789",
  "name": "document-analyzer",
  "version": "1.0.0",
  "status": "active",
  "created_at": "2025-12-18T14:00:00Z",
  "registry_url": "https://api.llm.bluefly.io/ossa/v1/agents/agt_xyz789",
  "manifest_url": "https://api.llm.bluefly.io/ossa/v1/agents/agt_xyz789/manifest"
}
```

**JavaScript/TypeScript:**

```typescript
import { AgentManifest } from '@bluefly/ossa-sdk';

const manifest: AgentManifest = {
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: {
    name: 'document-analyzer',
    version: '1.0.0',
    description: 'AI-powered document analysis agent'
  },
  spec: {
    role: 'You are a document analyzer.',
    llm: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022'
    }
  }
};

const response = await fetch('https://api.llm.bluefly.io/ossa/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(manifest)
});

const agent = await response.json();
console.log(`Agent registered: ${agent.id}`);
```

**Python:**

```python
import requests

manifest = {
    'apiVersion': 'ossa/v0.3.0',
    'kind': 'Agent',
    'metadata': {
        'name': 'document-analyzer',
        'version': '1.0.0',
        'description': 'AI-powered document analysis agent'
    },
    'spec': {
        'role': 'You are a document analyzer.',
        'llm': {
            'provider': 'anthropic',
            'model': 'claude-3-5-sonnet-20241022'
        }
    }
}

response = requests.post(
    'https://api.llm.bluefly.io/ossa/v1/agents',
    json=manifest,
    headers={'Authorization': f'Bearer {token}'}
)

agent = response.json()
print(f"Agent registered: {agent['id']}")
```

---

### Get Agent Details

Retrieve complete details for a specific agent.

```http
GET /agents/{agentId}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | Unique agent identifier |

**Example Request:**

```bash
curl https://api.llm.bluefly.io/ossa/v1/agents/agt_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "id": "agt_abc123",
  "name": "compliance-auditor",
  "version": "1.0.0",
  "type": "agent",
  "status": "active",
  "description": "Enterprise compliance auditor",
  "manifest": {
    "apiVersion": "ossa/v0.3.0",
    "kind": "Agent",
    "metadata": {
      "name": "compliance-auditor",
      "version": "1.0.0"
    },
    "spec": {
      "role": "You are a compliance auditor...",
      "llm": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022"
      }
    }
  },
  "health": {
    "status": "healthy",
    "last_check": "2025-12-18T13:55:00Z",
    "uptime": 99.95
  },
  "stats": {
    "total_invocations": 1547,
    "average_latency_ms": 234,
    "success_rate": 99.8
  },
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-15T14:30:00Z"
}
```

**JavaScript/TypeScript:**

```typescript
const response = await fetch(
  `https://api.llm.bluefly.io/ossa/v1/agents/${agentId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const agent = await response.json();
console.log(`Agent: ${agent.name} v${agent.version}`);
console.log(`Status: ${agent.status}`);
console.log(`Health: ${agent.health.status}`);
```

**Python:**

```python
response = requests.get(
    f'https://api.llm.bluefly.io/ossa/v1/agents/{agent_id}',
    headers={'Authorization': f'Bearer {token}'}
)

agent = response.json()
print(f"Agent: {agent['name']} v{agent['version']}")
print(f"Status: {agent['status']}")
print(f"Health: {agent['health']['status']}")
```

---

### Update Agent

Update an existing agent's registration.

```http
PUT /agents/{agentId}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | Unique agent identifier |

**Request Body:**

Complete updated agent manifest.

**Example Request:**

```bash
curl -X PUT https://api.llm.bluefly.io/ossa/v1/agents/agt_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "ossa/v0.3.0",
    "kind": "Agent",
    "metadata": {
      "name": "compliance-auditor",
      "version": "1.1.0",
      "description": "Enhanced compliance auditor with new features"
    },
    "spec": {
      "role": "You are an enhanced compliance auditor...",
      "llm": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022",
        "temperature": 0.2
      }
    }
  }'
```

**Example Response:**

```json
{
  "id": "agt_abc123",
  "name": "compliance-auditor",
  "version": "1.1.0",
  "status": "active",
  "updated_at": "2025-12-18T14:05:00Z",
  "changelog": {
    "version": "1.1.0",
    "changes": [
      "Updated to version 1.1.0",
      "Modified LLM temperature from 0.3 to 0.2"
    ]
  }
}
```

**JavaScript/TypeScript:**

```typescript
const updatedManifest = {
  ...existingManifest,
  metadata: {
    ...existingManifest.metadata,
    version: '1.1.0',
    description: 'Enhanced compliance auditor'
  }
};

const response = await fetch(
  `https://api.llm.bluefly.io/ossa/v1/agents/${agentId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedManifest)
  }
);

const updated = await response.json();
console.log(`Updated to version ${updated.version}`);
```

**Python:**

```python
updated_manifest = {
    **existing_manifest,
    'metadata': {
        **existing_manifest['metadata'],
        'version': '1.1.0',
        'description': 'Enhanced compliance auditor'
    }
}

response = requests.put(
    f'https://api.llm.bluefly.io/ossa/v1/agents/{agent_id}',
    json=updated_manifest,
    headers={'Authorization': f'Bearer {token}'}
)

updated = response.json()
print(f"Updated to version {updated['version']}")
```

---

### Delete Agent

Unregister an agent from the platform.

```http
DELETE /agents/{agentId}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | Unique agent identifier |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `force` | boolean | Force deletion even if agent has active workflows |

**Example Request:**

```bash
curl -X DELETE https://api.llm.bluefly.io/ossa/v1/agents/agt_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```
HTTP/1.1 204 No Content
```

**JavaScript/TypeScript:**

```typescript
const response = await fetch(
  `https://api.llm.bluefly.io/ossa/v1/agents/${agentId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

if (response.status === 204) {
  console.log('Agent successfully deleted');
}
```

**Python:**

```python
response = requests.delete(
    f'https://api.llm.bluefly.io/ossa/v1/agents/{agent_id}',
    headers={'Authorization': f'Bearer {token}'}
)

if response.status_code == 204:
    print('Agent successfully deleted')
```

---

### Get Agent Manifest

Retrieve the raw OSSA manifest for an agent.

```http
GET /agents/{agentId}/manifest
```

**Example Request:**

```bash
curl https://api.llm.bluefly.io/ossa/v1/agents/agt_abc123/manifest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/yaml"
```

**Example Response (YAML):**

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: compliance-auditor
  version: "1.0.0"
  description: Enterprise compliance auditor
spec:
  role: |
    You are a compliance auditor...
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.3
```

---

### Validate Manifest

Validate an agent manifest before registration.

```http
POST /specification/validate
```

**Request Body:**

Agent manifest to validate (JSON or YAML).

**Example Request:**

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/specification/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @agent-manifest.json
```

**Example Response (Valid):**

```json
{
  "valid": true,
  "version": "0.3.0",
  "warnings": [
    {
      "path": "spec.llm.temperature",
      "message": "Temperature value 0.9 is high, consider lower values for production"
    }
  ]
}
```

**Example Response (Invalid):**

```json
{
  "valid": false,
  "errors": [
    {
      "path": "spec.llm.provider",
      "message": "Invalid provider 'unknown'. Must be one of: openai, anthropic, azure, bedrock"
    },
    {
      "path": "metadata.version",
      "message": "Invalid semantic version '1.0'. Must follow format: X.Y.Z"
    }
  ]
}
```

---

## Agent Lifecycle

Agents progress through several states during their lifecycle:

```
┌─────────────┐
│  Pending    │ ← Initial registration
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Active    │ ← Available for use
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Deprecated  │ ← Marked for retirement
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Archived   │ ← Removed from active registry
└─────────────┘
```

### Status Transitions

```bash
# Activate a pending agent
curl -X PATCH https://api.llm.bluefly.io/ossa/v1/agents/agt_abc123/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status": "active"}'

# Deprecate an agent
curl -X PATCH https://api.llm.bluefly.io/ossa/v1/agents/agt_abc123/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status": "deprecated", "reason": "Replaced by v2.0"}'
```

---

## Best Practices

### Versioning

Follow semantic versioning for agents:

- **MAJOR** version for breaking changes
- **MINOR** version for new features
- **PATCH** version for bug fixes

```yaml
metadata:
  version: "2.1.3"  # MAJOR.MINOR.PATCH
```

### Labels and Annotations

Use labels for filtering and organization:

```yaml
metadata:
  labels:
    category: compliance
    domain: enterprise/governance
    environment: production
  annotations:
    ossa.io/maintainer: security-team@company.com
    ossa.io/cost-center: CC-1234
```

### Health Checks

Implement health check endpoints in your agents:

```yaml
spec:
  health:
    check_interval: 60s
    timeout: 5s
    endpoint: /health
```

---

## Error Handling

Common error responses:

### 400 Bad Request - Invalid Manifest

```json
{
  "error": "validation_error",
  "message": "Agent manifest validation failed",
  "details": {
    "errors": [
      {
        "path": "spec.llm.model",
        "message": "Required field missing"
      }
    ]
  }
}
```

### 404 Not Found - Agent Not Found

```json
{
  "error": "not_found",
  "message": "Agent agt_abc123 not found"
}
```

### 409 Conflict - Agent Already Exists

```json
{
  "error": "conflict",
  "message": "Agent with name 'compliance-auditor' and version '1.0.0' already exists"
}
```

---

## Next Steps

- Learn about [Discovery API](discovery.md) for advanced agent search
- Explore [Agent-to-Agent Messaging](messaging.md) for multi-agent coordination
- See [Agent Lifecycle Guide](../guides/agent-lifecycle.md) for complete lifecycle management
- Review [API Examples](../api-reference/examples.md) for more code samples
