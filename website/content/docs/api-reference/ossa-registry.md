# OSSA Agent Registry API

**Version**: 0.3.3

**REVOLUTIONARY** OSSA Agent Registry - First-of-its-kind for AI agents

Production Architecture:
- OpenAPI-First: Spec drives all implementation
- DRY: Single source of truth for agent metadata
- CRUD: Full agent lifecycle management
- SOLID: Clean interfaces, dependency injection
- Type-Safe: Zod validation + TypeScript

Features:
- Agent discovery and registration
- Version management with semantic versioning
- Cryptographic signature verification
- Compliance certification tracking
- Multi-cloud deployment metadata
- Performance metrics and health scoring

OSSA Compliance: v0.1.9


## Base URL

- `https://registry.openstandardagents.org/api/v1` - Production registry

## Authentication

This API requires authentication. See [Authentication Guide](../authentication.md) for details.

## Endpoints

### List all registered agents

```http
GET /agents
```

**Description**: List all registered agents

**Parameters**:

- `role` (query) - No description
- `certified` (query) - No description
- `cloud` (query) - No description
- `page` (query) - No description
- `limit` (query) - No description

**Responses**:

**200**: List of agents

```json
{}
```

**400**: undefined

**401**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Register a new agent

```http
POST /agents
```

**Description**: Register a new agent

**Request Body**:

```json
{}
```

**Responses**:

**201**: Agent registered

```json
{}
```

**400**: undefined

**401**: undefined

**Example**:

```bash
curl -X POST "https://api.ossa.dev/agents" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Get agent details

```http
GET /agents/{agentId}
```

**Description**: Get agent details

**Parameters**:

- `undefined` (undefined) - No description

**Responses**:

**200**: Agent details

```json
{}
```

**404**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents/{agentId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update agent metadata

```http
PUT /agents/{agentId}
```

**Description**: Update agent metadata

**Parameters**:

- `undefined` (undefined) - No description

**Request Body**:

```json
{}
```

**Responses**:

**200**: Agent updated

```json
{}
```

**404**: undefined

**Example**:

```bash
curl -X PUT "https://api.ossa.dev/agents/{agentId}" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Deprecate an agent

```http
DELETE /agents/{agentId}
```

**Description**: Deprecate an agent

**Parameters**:

- `undefined` (undefined) - No description

**Responses**:

**204**: Agent deprecated

**404**: undefined

**Example**:

```bash
curl -X DELETE "https://api.ossa.dev/agents/{agentId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List agent versions

```http
GET /agents/{agentId}/versions
```

**Description**: List agent versions

**Parameters**:

- `undefined` (undefined) - No description

**Responses**:

**200**: Agent versions

```json
{}
```

**400**: undefined

**404**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents/{agentId}/versions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Publish new agent version

```http
POST /agents/{agentId}/versions
```

**Description**: Publish new agent version

**Parameters**:

- `undefined` (undefined) - No description

**Request Body**:

```json
{}
```

**Responses**:

**201**: Version published

```json
{}
```

**400**: undefined

**404**: undefined

**Example**:

```bash
curl -X POST "https://api.ossa.dev/agents/{agentId}/versions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### List agent certifications

```http
GET /agents/{agentId}/certifications
```

**Description**: List agent certifications

**Parameters**:

- `undefined` (undefined) - No description

**Responses**:

**200**: Certifications

```json
{}
```

**400**: undefined

**404**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents/{agentId}/certifications" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Add certification

```http
POST /agents/{agentId}/certifications
```

**Description**: Add certification

**Parameters**:

- `undefined` (undefined) - No description

**Request Body**:

```json
{}
```

**Responses**:

**201**: Certification added

```json
{}
```

**400**: undefined

**404**: undefined

**Example**:

```bash
curl -X POST "https://api.ossa.dev/agents/{agentId}/certifications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Deploy agent to environment

```http
POST /agents/{agentId}/deploy
```

**Description**: Deploy agent to environment

**Parameters**:

- `undefined` (undefined) - No description

**Request Body**:

```json
{}
```

**Responses**:

**202**: Deployment initiated

```json
{}
```

**400**: undefined

**404**: undefined

**Example**:

```bash
curl -X POST "https://api.ossa.dev/agents/{agentId}/deploy" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Get agent health metrics

```http
GET /agents/{agentId}/health
```

**Description**: Get agent health metrics

**Parameters**:

- `undefined` (undefined) - No description

**Responses**:

**200**: Health metrics

```json
{}
```

**400**: undefined

**404**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents/{agentId}/health" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Validate agent compliance

```http
POST /compliance/validate
```

**Description**: Validate agent compliance

**Request Body**:

```json
{}
```

**Responses**:

**200**: Compliance validation result

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/compliance/validate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Search agents

```http
POST /search
```

**Description**: Search agents

**Request Body**:

```json
{}
```

**Responses**:

**200**: Search results

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/search" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

## Related Documentation

- [CLI Reference](../cli-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Authentication Guide](../authentication.md)
