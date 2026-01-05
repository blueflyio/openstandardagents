# Unified Agent Gateway

**Version**: 1.0.0

**Single Entry Point for All LLM Platform Agents**

This gateway provides a unified OpenAPI interface for:
- OSSA-compliant agents (validation, deployment, orchestration)
- Drupal llm-platform (content, users, sites, data management)
- Agent Studio (Mac/iOS/CarPlay/VSCode/IDE)
- Agent Chat (Claude Code replacement)
- Langflow/LangChain/K-Agent workflows
- BuildKit (agent lifecycle management)
- GitLab CI/CD orchestration

**Architecture**:
- Protocol: HTTP/REST + gRPC (agent-mesh)
- Auth: API Key + JWT (GitLab SSO)
- Registry: agent-router (service discovery)
- Tracing: Phoenix (all requests)
- Metrics: Prometheus
- Storage: Drupal llm-platform (single source of truth)


## Base URL

- `https://gateway.agent-buildkit.orb.local/api/v1` - Production
- `http://localhost:8080/api/v1` - Local development (Orbstack)

## Authentication

This API requires authentication. See [Authentication Guide](../authentication.md) for details.

## Endpoints

### Create and deploy new agent

```http
POST /agents
```

**Description**: Creates an OSSA-compliant agent and deploys to K8s via Helm.
Registers with agent-router, starts Phoenix tracing.


**Request Body**:

```json
{}
```

**Responses**:

**201**: Agent created and deployed

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/agents" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### List all agents

```http
GET /agents
```

**Parameters**:

- `undefined` (undefined) - No description
- `undefined` (undefined) - No description
- `undefined` (undefined) - No description

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

**Example**:

```bash
curl -X GET "https://api.ossa.dev/agents/{agentId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update agent

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

### Delete agent

```http
DELETE /agents/{agentId}
```

**Parameters**:

- `undefined` (undefined) - No description

**Responses**:

**204**: Agent deleted

**Example**:

```bash
curl -X DELETE "https://api.ossa.dev/agents/{agentId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Execute agent task

```http
POST /agents/{agentId}/execute
```

**Description**: Send task to agent and get response

**Parameters**:

- `undefined` (undefined) - No description

**Request Body**:

```json
{}
```

**Responses**:

**200**: Task executed

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/agents/{agentId}/execute" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Create Drupal content

```http
POST /drupal/content
```

**Description**: Create content node via llm-platform API

**Request Body**:

```json
{}
```

**Responses**:

**201**: Content created

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/drupal/content" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Query Drupal content

```http
GET /drupal/content
```

**Parameters**:

- `type` (query) - No description
- `status` (query) - No description

**Responses**:

**200**: Content list

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/drupal/content" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Drupal user

```http
POST /drupal/users
```

**Request Body**:

```json
{}
```

**Responses**:

**201**: User created

**Example**:

```bash
curl -X POST "https://api.ossa.dev/drupal/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### List users

```http
GET /drupal/users
```

**Responses**:

**200**: User list

**Example**:

```bash
curl -X GET "https://api.ossa.dev/drupal/users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Build new Drupal site

```http
POST /drupal/sites
```

**Description**: Agent creates complete Drupal site with modules/config

**Request Body**:

```json
{}
```

**Responses**:

**202**: Site creation started

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/drupal/sites" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Create workflow

```http
POST /workflows
```

**Description**: Create Langflow or LangChain workflow

**Request Body**:

```json
{}
```

**Responses**:

**201**: Workflow created

**Example**:

```bash
curl -X POST "https://api.ossa.dev/workflows" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### List workflows

```http
GET /workflows
```

**Parameters**:

- `framework` (query) - No description

**Responses**:

**200**: Workflow list

**Example**:

```bash
curl -X GET "https://api.ossa.dev/workflows" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Execute workflow

```http
POST /workflows/{workflowId}/execute
```

**Parameters**:

- `workflowId` (path, required) - No description

**Request Body**:

```json
{}
```

**Responses**:

**200**: Workflow executed

**Example**:

```bash
curl -X POST "https://api.ossa.dev/workflows/{workflowId}/execute" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Create remote coding session

```http
POST /studio/sessions
```

**Description**: Creates coding session accessible from iOS/CarPlay.
Agent continues work when you're away from computer.


**Request Body**:

```json
{}
```

**Responses**:

**201**: Session created

```json
{}
```

**Example**:

```bash
curl -X POST "https://api.ossa.dev/studio/sessions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### List active sessions

```http
GET /studio/sessions
```

**Responses**:

**200**: Active sessions

**Example**:

```bash
curl -X GET "https://api.ossa.dev/studio/sessions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Queue task for agent

```http
POST /studio/sessions/{sessionId}/tasks
```

**Description**: Queue coding task to run while you're mobile

**Parameters**:

- `sessionId` (path, required) - No description

**Request Body**:

```json
{}
```

**Responses**:

**202**: Task queued

**Example**:

```bash
curl -X POST "https://api.ossa.dev/studio/sessions/{sessionId}/tasks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Trigger pipeline for project

```http
POST /gitlab/pipelines
```

**Request Body**:

```json
{}
```

**Responses**:

**202**: Pipeline triggered

**Example**:

```bash
curl -X POST "https://api.ossa.dev/gitlab/pipelines" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

### List pipelines

```http
GET /gitlab/pipelines
```

**Responses**:

**200**: Pipeline list

**Example**:

```bash
curl -X GET "https://api.ossa.dev/gitlab/pipelines" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List available packages

```http
GET /gitlab/packages
```

**Description**: Query package registry

**Parameters**:

- `scope` (query) - No description

**Responses**:

**200**: Package list

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/gitlab/packages" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Discover services

```http
GET /registry/discover
```

**Description**: Query agent-router for available services/agents

**Parameters**:

- `capability` (query) - No description
- `framework` (query) - No description

**Responses**:

**200**: Discovered services

```json
{}
```

**Example**:

```bash
curl -X GET "https://api.ossa.dev/registry/discover" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Related Documentation

- [CLI Reference](../cli-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Authentication Guide](../authentication.md)
