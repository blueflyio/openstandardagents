# OSSA Agent Registry API

**Version**: 1.0.0

Central registry for OSSA-compliant AI agents.

Similar to Docker Hub for containers or npm for packages, the OSSA Registry provides:
- Agent discovery and search
- Version management
- Compliance certification
- Cryptographic signatures
- Usage analytics

**OpenAPI-First Architecture:**
- This spec drives all types and validation
- Zod schemas generated from this spec
- Complete CRUD operations
- Type-safe throughout


## Base URL

- `https://registry.openstandardagents.org/api/v1` - Production
- `https://staging.registry.openstandardagents.org/api/v1` - Staging
- `http://localhost:3100/api/v1` - Local development

## Authentication

This API requires authentication. See [Authentication Guide](../authentication.md) for details.

## Endpoints

### List all agents

```http
GET /agents
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `namespace` (query) - Filter by namespace
- `certified` (query) - Filter by certification status
- `compliance` (query) - Filter by compliance frameworks

**Responses**:

**200**: List of agents

```json
{}
```

**400**: undefined

**500**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Register new agent

```http
POST /agents
```

**Request Body**:

```json
{}
```

**Responses**:

**201**: Agent created

```json
{}
```

**400**: undefined

**401**: undefined

**409**: undefined

**500**: undefined

**Example**:

```bash
curl -X POST "https://api.ossa.dev/agents" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Get agent details

```http
GET /agents/{namespace}/{name}
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Responses**:

**200**: Agent details

```json
{}
```

**404**: undefined

**500**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents/{namespace}/{name}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update agent

```http
PUT /agents/{namespace}/{name}
```

**Parameters**:

- `undefined` (undefined) - No description
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

**400**: undefined

**401**: undefined

**403**: undefined

**404**: undefined

**500**: undefined

**Example**:

```bash
curl -X PUT "https://api.ossa.dev/agents/{namespace}/{name}" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Delete agent

```http
DELETE /agents/{namespace}/{name}
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Responses**:

**204**: Agent deleted

**401**: undefined

**403**: undefined

**404**: undefined

**500**: undefined

**Example**:

```bash
curl -X DELETE "https://api.ossa.dev/agents/{namespace}/{name}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List agent versions

```http
GET /agents/{namespace}/{name}/versions
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Responses**:

**200**: List of versions

```json
{}
```

**404**: undefined

**500**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents/{namespace}/{name}/versions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Publish new version

```http
POST /agents/{namespace}/{name}/versions
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Request Body**:

**Responses**:

**201**: Version created

```json
{}
```

**400**: undefined

**401**: undefined

**403**: undefined

**409**: undefined

**500**: undefined

**Example**:

```bash
curl -X POST "https://api.ossa.dev/agents/{namespace}/{name}/versions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Get version details

```http
GET /agents/{namespace}/{name}/versions/{version}
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Responses**:

**200**: Version details

```json
{}
```

**404**: undefined

**500**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents/{namespace}/{name}/versions/{version}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Unpublish version

```http
DELETE /agents/{namespace}/{name}/versions/{version}
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Responses**:

**204**: Version deleted

**401**: undefined

**403**: undefined

**404**: undefined

**500**: undefined

**Example**:

```bash
curl -X DELETE "https://api.ossa.dev/agents/{namespace}/{name}/versions/{version}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Download manifest

```http
GET /agents/{namespace}/{name}/versions/{version}/manifest
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Responses**:

**200**: OSSA manifest file

```json
{}
```

**404**: undefined

**500**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents/{namespace}/{name}/versions/{version}/manifest" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search agents

```http
GET /search
```

**Parameters**:

- `q` (query, required) - Search query
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `filters` (query) - No description

**Responses**:

**200**: Search results

```json
{}
```

**400**: undefined

**500**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/search" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List all certifications

```http
GET /certifications
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Responses**:

**200**: List of certifications

```json
{}
```

**500**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/certifications" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Request certification

```http
POST /certifications/{namespace}/{name}/request
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Request Body**:

```json
{}
```

**Responses**:

**201**: Certification request created

```json
{}
```

**400**: undefined

**401**: undefined

**404**: undefined

**500**: undefined

**Example**:

```bash
curl -X POST "https://api.ossa.dev/certifications/{namespace}/{name}/request" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Get agent analytics

```http
GET /analytics/{namespace}/{name}
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `from` (query) - No description
- `to` (query) - No description

**Responses**:

**200**: Analytics data

```json
{}
```

**401**: undefined

**403**: undefined

**404**: undefined

**500**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/analytics/{namespace}/{name}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Related Documentation

- [CLI Reference](../cli-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Authentication Guide](../authentication.md)
