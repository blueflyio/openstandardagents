# OSSA Master API

**Version**: 0.1.9

# OSSA - Open Standards for Scalable Agents

Master API specification for the OSSA platform, providing comprehensive orchestration,
governance, and management capabilities for AI agents following OSSA v0.1.9 standards.

## Key Capabilities
- **Agent Orchestration**: Multi-agent coordination and workflow execution
- **Specification Engine**: Agent manifest validation and certification
- **Registry Services**: Global agent discovery and federation
- **Runtime Management**: Production deployment and lifecycle management
- **Compliance & Governance**: Policy enforcement and audit trails
- **Observability**: Comprehensive monitoring and tracing


## Base URL

- `https://api.llm.bluefly.io/ossa/v1` - Production server
- `https://api-dev.llm.bluefly.io/ossa/v1` - Development server
- `http://localhost:3000` - Local development

## Authentication

This API requires authentication. See [Authentication Guide](../authentication.md) for details.

## Endpoints

### Health check

```http
GET /health
```

**Responses**:

**200**: undefined

**500**: undefined

**503**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/health" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Readiness check

```http
GET /health/ready
```

**Responses**:

**200**: undefined

**500**: undefined

**503**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/health/ready" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Liveness check

```http
GET /health/live
```

**Responses**:

**200**: undefined

**500**: undefined

**503**: undefined

**Example**:

```bash
curl -X GET "https://api.ossa.dev/health/live" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List registered agents

```http
GET /agents
```

**Description**: Query the global agent registry

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `type` (query) - No description
- `capability` (query) - No description
- `status` (query) - No description

**Responses**:

**200**: List of agents

```json
{}
```

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

**201**: Agent registered

```json
{}
```

**400**: undefined

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

### Update agent registration

```http
PUT /agents/{agentId}
```

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

**Example**:

```bash
curl -X PUT "https://api.ossa.dev/agents/{agentId}" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Unregister agent

```http
DELETE /agents/{agentId}
```

**Parameters**:

- `undefined` (undefined) - No description

**Responses**:

**204**: Agent unregistered

**Example**:

```bash
curl -X DELETE "https://api.ossa.dev/agents/{agentId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List workflows

```http
GET /orchestration/workflows
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Responses**:

**200**: List of workflows

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/orchestration/workflows" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create workflow

```http
POST /orchestration/workflows
```

**Request Body**:

```json
{}
```

**Responses**:

**201**: Workflow created

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/orchestration/workflows" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Execute workflow

```http
POST /orchestration/workflows/{workflowId}/execute
```

**Parameters**:

- `workflowId` (path, required) - No description

**Request Body**:

```json
{}
```

**Responses**:

**202**: Workflow execution started

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/orchestration/workflows/{workflowId}/execute" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Get execution status

```http
GET /orchestration/executions/{executionId}
```

**Parameters**:

- `executionId` (path, required) - No description

**Responses**:

**200**: Execution status

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/orchestration/executions/{executionId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Validate agent manifest

```http
POST /specification/validate
```

**Description**: Validate an OSSA agent manifest against the specification

**Request Body**:

```json
{}
```

**Responses**:

**200**: Validation result

```json
{}
```

**400**: undefined

**500**: undefined

**Example**:

```bash
curl -X POST "https://api.ossa.dev/specification/validate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### List agent taxonomies

```http
GET /specification/taxonomies
```

**Responses**:

**200**: Available taxonomies

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/specification/taxonomies" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List capability definitions

```http
GET /specification/capabilities
```

**Parameters**:

- `category` (query) - No description

**Responses**:

**200**: Capability definitions

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/specification/capabilities" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Request certification

```http
POST /certification/request
```

**Request Body**:

```json
{}
```

**Responses**:

**202**: Certification request accepted

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/certification/request" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Get certification status

```http
GET /certification/{certificationId}
```

**Parameters**:

- `certificationId` (path, required) - No description

**Responses**:

**200**: Certification details

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/certification/{certificationId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List governance policies

```http
GET /governance/policies
```

**Responses**:

**200**: Governance policies

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/governance/policies" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get agent compliance status

```http
GET /governance/compliance/{agentId}
```

**Parameters**:

- `undefined` (undefined) - No description

**Responses**:

**200**: Compliance status

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/governance/compliance/{agentId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List federation nodes

```http
GET /federation/nodes
```

**Responses**:

**200**: Federation nodes

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/federation/nodes" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Join federation

```http
POST /federation/join
```

**Request Body**:

```json
{}
```

**Responses**:

**201**: Joined federation

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/federation/join" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Get platform metrics

```http
GET /monitoring/metrics
```

**Responses**:

**200**: Platform metrics

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/monitoring/metrics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get platform events

```http
GET /monitoring/events
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

**Responses**:

**200**: Platform events

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/monitoring/events" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Related Documentation

- [CLI Reference](../cli-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Authentication Guide](../authentication.md)
