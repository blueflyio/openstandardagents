# OSSA Agent-to-Agent (A2A) Protocol Specification

**Version**: 0.2.9
**Status**: Draft
**Last Updated**: 2025-12-04

This document defines the Agent-to-Agent (A2A) Protocol for multi-agent communication in OSSA-compliant systems. The A2A protocol enables agents to discover, authenticate, and communicate with each other using standardized message formats and routing patterns.

## 1. Overview

The A2A Protocol provides:
- **Discovery**: Agents advertise capabilities via AgentCard
- **Authentication**: mTLS, JWT bearer tokens, and OIDC
- **Routing**: Direct, broadcast, topic-based, and request/response patterns
- **Task Lifecycle**: Standard states for collaborative work
- **Streaming**: Support for long-running tasks with progress updates
- **Push Notifications**: Real-time event delivery

### Design Principles

1. **Interoperability**: Works across different OSSA runtime implementations
2. **Security**: Authentication and encryption by default
3. **Scalability**: Supports peer-to-peer and hub-spoke topologies
4. **Observability**: Full W3C trace context propagation
5. **Simplicity**: Minimal protocol overhead

---

## 2. Message Envelope Format

All A2A messages MUST use the following envelope structure:

```yaml
# Message Envelope (v0.2.9)
version: "ossa/a2a/v0.2.9"
id: "msg_2kj3h4k2j3h4k"                    # Unique message ID (UUID v7 recommended)
timestamp: "2025-12-04T19:30:00.000Z"      # ISO 8601 timestamp
from: "agent://team-a/code-reviewer"       # Sender agent URI
to: "agent://team-b/code-analyzer"         # Recipient agent URI (or topic)
correlation_id: "req_abc123"               # Groups related messages
reply_to: "agent://team-a/code-reviewer"   # Optional: where to send response
ttl: 300                                   # Time-to-live in seconds
priority: "normal"                         # normal | high | urgent
type: "request"                            # request | response | event | command
payload:
  # Application-specific payload (see sections below)
  action: "analyze_code"
  data:
    repository: "https://github.com/org/repo"
    commit_sha: "abc123"
```

### Envelope Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Protocol version (MUST be `ossa/a2a/v0.2.9`) |
| `id` | string | Yes | Unique message identifier (UUID) |
| `timestamp` | ISO8601 | Yes | Message creation time |
| `from` | URI | Yes | Sender agent URI |
| `to` | URI | Yes | Recipient agent URI or topic |
| `correlation_id` | string | No | Groups request/response pairs |
| `reply_to` | URI | No | Where to send responses |
| `ttl` | integer | No | Time-to-live in seconds (default: 300) |
| `priority` | enum | No | Message priority (default: normal) |
| `type` | enum | Yes | Message type (request/response/event/command) |
| `payload` | object | Yes | Application-specific message content |

### Message Types

```typescript
type MessageType =
  | 'request'    // Expects a response
  | 'response'   // Reply to a request
  | 'event'      // Fire-and-forget notification
  | 'command';   // Imperative action (no response expected)
```

---

## 3. Discovery Mechanism

Agents discover each other through three methods:

### 3.1 Registry-Based Discovery

Agents register with a central registry (e.g., Consul, etcd, OSSA Registry).

```yaml
# Register agent
POST /registry/agents
Content-Type: application/json

{
  "agent_card": {
    "uri": "agent://team-a/code-reviewer",
    "name": "Code Review Agent",
    "version": "1.2.3",
    "capabilities": [
      "code_analysis",
      "security_scanning",
      "style_checking"
    ],
    "endpoints": {
      "http": "https://agents.example.com/code-reviewer",
      "grpc": "grpc://agents.example.com:50051/code-reviewer"
    },
    "transport": ["http", "grpc"],
    "authentication": ["mtls", "bearer"],
    "ossa_version": "0.2.9",
    "metadata": {
      "team": "engineering",
      "environment": "production",
      "region": "us-west-2"
    }
  },
  "ttl": 60  # Re-register every 60 seconds (heartbeat)
}
```

Query registry:

```yaml
# Find agents by capability
GET /registry/agents?capability=code_analysis

# Response
{
  "agents": [
    {
      "uri": "agent://team-a/code-reviewer",
      "capabilities": ["code_analysis", "security_scanning"],
      "endpoints": {
        "http": "https://agents.example.com/code-reviewer"
      },
      "last_heartbeat": "2025-12-04T19:30:00.000Z",
      "status": "healthy"
    }
  ]
}
```

### 3.2 Broadcast Discovery (DNS-SD)

Agents broadcast presence via DNS Service Discovery (RFC 6763).

```bash
# Publish agent via Avahi/Bonjour
dns-sd -R "Code Reviewer" _ossa-agent._tcp local 8080 \
  uri=agent://team-a/code-reviewer \
  version=0.2.9 \
  capabilities=code_analysis,security_scanning

# Discover agents
dns-sd -B _ossa-agent._tcp local
```

**AgentCard via DNS TXT Record**:

```
_ossa-agent._tcp.local.
  PTR code-reviewer.ossa-agent._tcp.local.

code-reviewer._ossa-agent._tcp.local.
  SRV 0 0 8080 agent-host.local.
  TXT "uri=agent://team-a/code-reviewer"
  TXT "version=0.2.9"
  TXT "capabilities=code_analysis,security_scanning"
  TXT "transport=http,grpc"
  TXT "auth=mtls"
```

### 3.3 Multicast Discovery (mDNS)

Agents use multicast DNS for local network discovery.

```yaml
# mDNS announcement packet
type: PTR
name: _ossa-agent._tcp.local
data: code-reviewer._ossa-agent._tcp.local

type: SRV
name: code-reviewer._ossa-agent._tcp.local
priority: 0
weight: 0
port: 8080
target: agent-host.local

type: TXT
name: code-reviewer._ossa-agent._tcp.local
data:
  - "uri=agent://team-a/code-reviewer"
  - "capabilities=code_analysis"
  - "ossa_version=0.2.9"
```

---

## 4. AgentCard Schema

The AgentCard is a self-describing document that advertises agent capabilities.

```typescript
interface AgentCard {
  // Identity
  uri: string;                    // Unique agent URI
  name: string;                   // Human-readable name
  version: string;                // Semantic version
  ossa_version: string;           // OSSA spec version

  // Capabilities
  capabilities: string[];         // Advertised capabilities
  tools?: ToolDescriptor[];       // Available tools
  role?: string;                  // Agent role/specialty

  // Connectivity
  endpoints: {
    http?: string;                // HTTP/REST endpoint
    grpc?: string;                // gRPC endpoint
    websocket?: string;           // WebSocket endpoint
  };
  transport: Transport[];         // Supported transports

  // Security
  authentication: AuthMethod[];   // Supported auth methods
  encryption: EncryptionSpec;     // Encryption requirements

  // Metadata
  metadata?: {
    team?: string;
    environment?: string;
    region?: string;
    [key: string]: unknown;
  };

  // Health
  status?: 'healthy' | 'degraded' | 'unavailable';
  last_heartbeat?: string;        // ISO 8601 timestamp
}

type Transport = 'http' | 'grpc' | 'websocket' | 'mqtt';
type AuthMethod = 'mtls' | 'bearer' | 'oidc' | 'api_key';

interface ToolDescriptor {
  name: string;
  description: string;
  input_schema: JSONSchema;
  output_schema?: JSONSchema;
}

interface EncryptionSpec {
  tls_required: boolean;
  min_tls_version: '1.2' | '1.3';
  cipher_suites?: string[];
}
```

### AgentCard Example

```yaml
uri: "agent://team-a/code-reviewer"
name: "Code Review Agent"
version: "1.2.3"
ossa_version: "0.2.9"

capabilities:
  - code_analysis
  - security_scanning
  - style_checking

tools:
  - name: analyze_code
    description: "Perform static code analysis"
    input_schema:
      type: object
      required: [repository, commit_sha]
      properties:
        repository:
          type: string
          format: uri
        commit_sha:
          type: string
          pattern: "^[0-9a-f]{40}$"

  - name: check_security
    description: "Scan code for security vulnerabilities"
    input_schema:
      type: object
      required: [code]
      properties:
        code:
          type: string

endpoints:
  http: "https://agents.example.com/code-reviewer"
  grpc: "grpc://agents.example.com:50051/code-reviewer"

transport:
  - http
  - grpc

authentication:
  - mtls
  - bearer

encryption:
  tls_required: true
  min_tls_version: "1.3"
  cipher_suites:
    - "TLS_AES_256_GCM_SHA384"
    - "TLS_CHACHA20_POLY1305_SHA256"

metadata:
  team: "engineering"
  environment: "production"
  region: "us-west-2"
  cost_per_request: "$0.05"

status: "healthy"
last_heartbeat: "2025-12-04T19:30:00.000Z"
```

---

## 5. Authentication Methods

### 5.1 Mutual TLS (mTLS)

**Recommended for production**. Both client and server authenticate via X.509 certificates.

```yaml
# Agent manifest with mTLS
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: secure-agent
spec:
  security:
    authentication:
      type: mtls
      certificate:
        path: /etc/ossa/certs/agent.crt
        key_path: /etc/ossa/certs/agent.key
      ca_bundle: /etc/ossa/certs/ca.crt
      verify_client: true
```

**Certificate Requirements**:
- Subject Alternative Name (SAN) MUST include agent URI
- Common Name (CN) SHOULD be agent name
- Certificates MUST be valid (not expired)
- Issuer MUST be trusted CA

**Example Certificate**:

```
Subject: CN=code-reviewer, O=Acme Corp
SAN:
  - URI:agent://team-a/code-reviewer
  - DNS:code-reviewer.agents.example.com
Issuer: CN=OSSA CA, O=Acme Corp
Validity: 2025-01-01 to 2026-01-01
```

### 5.2 Bearer Token (JWT)

Agents authenticate using JWT bearer tokens.

```yaml
# Agent manifest with JWT
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: api-agent
spec:
  security:
    authentication:
      type: bearer
      token_source:
        type: file
        path: /run/secrets/agent-token
      issuer: "https://auth.example.com"
      audience: "ossa-agents"
```

**JWT Claims**:

```json
{
  "iss": "https://auth.example.com",
  "sub": "agent://team-a/code-reviewer",
  "aud": "ossa-agents",
  "exp": 1735939800,
  "iat": 1735936200,
  "capabilities": ["code_analysis", "security_scanning"]
}
```

**HTTP Request with Bearer Token**:

```http
POST /agents/code-analyzer/tasks HTTP/1.1
Host: agents.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "version": "ossa/a2a/v0.2.9",
  "from": "agent://team-a/code-reviewer",
  "to": "agent://team-b/code-analyzer",
  "payload": {...}
}
```

### 5.3 OpenID Connect (OIDC)

Agents use OIDC for federated authentication.

```yaml
# Agent manifest with OIDC
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: oidc-agent
spec:
  security:
    authentication:
      type: oidc
      provider: "https://accounts.google.com"
      client_id: "abc123.apps.googleusercontent.com"
      client_secret:
        secret_ref:
          name: oidc-credentials
          key: client_secret
      scopes:
        - openid
        - profile
        - ossa.agent
```

**OIDC Flow**:

1. Agent requests token from provider
2. Provider returns ID token + access token
3. Agent includes access token in `Authorization` header
4. Recipient validates token with provider's public keys

---

## 6. Routing Patterns

### 6.1 Direct Routing (Point-to-Point)

Agent A sends message directly to Agent B.

```yaml
version: "ossa/a2a/v0.2.9"
id: "msg_abc123"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://team-a/code-reviewer"
to: "agent://team-b/code-analyzer"      # Direct recipient
type: "request"
correlation_id: "req_xyz789"
payload:
  action: "analyze_code"
  data:
    repository: "https://github.com/org/repo"
    commit_sha: "abc123"
```

**Use Case**: Task delegation, peer-to-peer collaboration

### 6.2 Broadcast Routing (Fan-Out)

Agent A sends message to all agents in a group.

```yaml
version: "ossa/a2a/v0.2.9"
id: "msg_broadcast_001"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://orchestrator/main"
to: "broadcast://team-a/*"              # All agents in team-a
type: "event"
payload:
  event: "deployment_started"
  data:
    version: "v1.2.3"
    environment: "production"
```

**Use Case**: Notifications, system-wide announcements

### 6.3 Topic-Based Routing (Pub/Sub)

Agents subscribe to topics and receive matching messages.

```yaml
# Publisher
version: "ossa/a2a/v0.2.9"
id: "msg_topic_001"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://team-a/code-reviewer"
to: "topic://code-reviews"              # Topic name
type: "event"
payload:
  event: "review_completed"
  data:
    pull_request: "https://github.com/org/repo/pull/42"
    status: "approved"
    reviewer: "agent://team-a/code-reviewer"
```

**Subscription Example**:

```yaml
# Agent subscribes to topic
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: notification-agent
spec:
  messaging:
    subscriptions:
      - topic: "topic://code-reviews"
        handler: on_code_review
      - topic: "topic://deployments"
        handler: on_deployment
        filter:
          environment: production
```

**Use Case**: Event-driven architectures, logging/monitoring

### 6.4 Request/Response Pattern

Agent A sends request, Agent B responds with correlation.

```yaml
# Request
version: "ossa/a2a/v0.2.9"
id: "msg_req_001"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://team-a/requester"
to: "agent://team-b/responder"
type: "request"
correlation_id: "conv_abc123"
reply_to: "agent://team-a/requester"
ttl: 30
payload:
  action: "get_analysis"
  params:
    file: "src/main.ts"

---
# Response
version: "ossa/a2a/v0.2.9"
id: "msg_resp_001"
timestamp: "2025-12-04T19:30:15.000Z"
from: "agent://team-b/responder"
to: "agent://team-a/requester"
type: "response"
correlation_id: "conv_abc123"           # Same as request
payload:
  status: "success"
  result:
    issues: []
    quality_score: 95
```

**Use Case**: Synchronous operations, queries

---

## 7. Task Lifecycle

When agents collaborate on tasks, they follow a standard lifecycle:

```
┌─────────────────────────────────────────────────────────────────┐
│                      TASK LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │SUBMITTED │──▶│ ACCEPTED │──▶│ WORKING  │──▶│COMPLETED │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│       │               │              │              │           │
│       │               │              │              │           │
│       │               ▼              ▼              │           │
│       │         ┌──────────┐   ┌──────────┐        │           │
│       └────────▶│ REJECTED │   │  FAILED  │◀───────┘           │
│                 └──────────┘   └──────────┘                     │
│                                     │                           │
│                                     ▼                           │
│                               ┌──────────┐                      │
│                               │CANCELLED │                      │
│                               └──────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Task States

```typescript
type TaskState =
  | 'submitted'   // Task sent to agent
  | 'accepted'    // Agent acknowledged task
  | 'rejected'    // Agent declined task
  | 'working'     // Agent processing task
  | 'completed'   // Task finished successfully
  | 'failed'      // Task failed with error
  | 'cancelled';  // Task cancelled by requester

interface TaskStatus {
  task_id: string;
  state: TaskState;
  progress?: number;          // 0-100
  message?: string;           // Human-readable status
  error?: TaskError;
  started_at?: string;        // ISO 8601
  completed_at?: string;      // ISO 8601
}

interface TaskError {
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
}
```

### Task Submission

```yaml
# Submit task
version: "ossa/a2a/v0.2.9"
id: "msg_task_submit_001"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://team-a/orchestrator"
to: "agent://team-b/worker"
type: "request"
correlation_id: "task_xyz789"
reply_to: "agent://team-a/orchestrator"
payload:
  action: "execute_task"
  task_id: "task_xyz789"
  input:
    operation: "analyze_codebase"
    parameters:
      repository: "https://github.com/org/repo"
      branch: "main"
```

### Task Acceptance

```yaml
# Accept task
version: "ossa/a2a/v0.2.9"
id: "msg_task_accept_001"
timestamp: "2025-12-04T19:30:01.000Z"
from: "agent://team-b/worker"
to: "agent://team-a/orchestrator"
type: "response"
correlation_id: "task_xyz789"
payload:
  status: "accepted"
  task_id: "task_xyz789"
  estimated_duration_seconds: 120
```

### Task Progress Updates (Streaming)

```yaml
# Progress update
version: "ossa/a2a/v0.2.9"
id: "msg_task_progress_001"
timestamp: "2025-12-04T19:30:30.000Z"
from: "agent://team-b/worker"
to: "agent://team-a/orchestrator"
type: "event"
correlation_id: "task_xyz789"
payload:
  event: "task_progress"
  task_id: "task_xyz789"
  state: "working"
  progress: 50
  message: "Analyzed 150/300 files"
```

### Task Completion

```yaml
# Success
version: "ossa/a2a/v0.2.9"
id: "msg_task_complete_001"
timestamp: "2025-12-04T19:32:00.000Z"
from: "agent://team-b/worker"
to: "agent://team-a/orchestrator"
type: "response"
correlation_id: "task_xyz789"
payload:
  status: "completed"
  task_id: "task_xyz789"
  result:
    files_analyzed: 300
    issues_found: 12
    quality_score: 87

---
# Failure
version: "ossa/a2a/v0.2.9"
id: "msg_task_fail_001"
timestamp: "2025-12-04T19:31:30.000Z"
from: "agent://team-b/worker"
to: "agent://team-a/orchestrator"
type: "response"
correlation_id: "task_xyz789"
payload:
  status: "failed"
  task_id: "task_xyz789"
  error:
    code: "REPOSITORY_UNREACHABLE"
    message: "Failed to clone repository"
    details:
      url: "https://github.com/org/repo"
      http_status: 404
    recoverable: true
```

### Task Cancellation

```yaml
# Cancel request
version: "ossa/a2a/v0.2.9"
id: "msg_task_cancel_001"
timestamp: "2025-12-04T19:31:00.000Z"
from: "agent://team-a/orchestrator"
to: "agent://team-b/worker"
type: "command"
correlation_id: "task_xyz789"
payload:
  action: "cancel_task"
  task_id: "task_xyz789"
  reason: "User requested cancellation"

---
# Cancel acknowledgment
version: "ossa/a2a/v0.2.9"
id: "msg_task_cancelled_001"
timestamp: "2025-12-04T19:31:01.000Z"
from: "agent://team-b/worker"
to: "agent://team-a/orchestrator"
type: "response"
correlation_id: "task_xyz789"
payload:
  status: "cancelled"
  task_id: "task_xyz789"
  partial_result:
    files_analyzed: 75
```

---

## 8. Error Handling

### A2A Error Codes

```typescript
type A2AErrorCode =
  // Addressing Errors
  | 'AGENT_NOT_FOUND'         // Recipient agent not found
  | 'AGENT_UNREACHABLE'       // Cannot connect to agent
  | 'TOPIC_NOT_FOUND'         // Topic doesn't exist

  // Authentication Errors
  | 'AUTH_REQUIRED'           // Authentication required
  | 'AUTH_FAILED'             // Authentication failed
  | 'AUTH_EXPIRED'            // Credentials expired
  | 'INSUFFICIENT_PERMISSIONS' // Lacks required permissions

  // Message Errors
  | 'INVALID_MESSAGE'         // Malformed message
  | 'MESSAGE_EXPIRED'         // TTL exceeded
  | 'MESSAGE_TOO_LARGE'       // Payload exceeds limit

  // Task Errors
  | 'TASK_REJECTED'           // Agent rejected task
  | 'TASK_TIMEOUT'            // Task execution timeout
  | 'TASK_CANCELLED'          // Task cancelled by requester

  // Protocol Errors
  | 'UNSUPPORTED_VERSION'     // Protocol version not supported
  | 'UNSUPPORTED_TRANSPORT'   // Transport not supported
  | 'RATE_LIMITED';           // Too many requests

interface A2AError {
  code: A2AErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  retry_after_seconds?: number;
}
```

### Error Response

```yaml
version: "ossa/a2a/v0.2.9"
id: "msg_error_001"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://team-b/worker"
to: "agent://team-a/orchestrator"
type: "response"
correlation_id: "task_xyz789"
payload:
  status: "error"
  error:
    code: "AGENT_UNREACHABLE"
    message: "Cannot connect to code-analyzer agent"
    details:
      target_agent: "agent://team-c/code-analyzer"
      endpoint: "https://agents.example.com/code-analyzer"
      network_error: "Connection timeout after 30s"
    timestamp: "2025-12-04T19:30:00.000Z"
    retry_after_seconds: 60
```

### Retry Strategy

```yaml
# Agent manifest with retry policy
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: resilient-agent
spec:
  messaging:
    retry:
      max_attempts: 3
      backoff: exponential
      initial_delay_ms: 1000
      max_delay_ms: 30000
      retryable_errors:
        - AGENT_UNREACHABLE
        - MESSAGE_TIMEOUT
        - RATE_LIMITED
```

---

## 9. Streaming Support

For long-running tasks, agents can stream progress updates.

### Server-Sent Events (SSE)

```http
GET /agents/worker/tasks/task_xyz789/stream HTTP/1.1
Host: agents.example.com
Accept: text/event-stream

HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

event: progress
data: {"progress": 25, "message": "Analyzing files..."}

event: progress
data: {"progress": 50, "message": "Running security scan..."}

event: progress
data: {"progress": 75, "message": "Generating report..."}

event: completed
data: {"status": "success", "result": {...}}
```

### WebSocket Streaming

```yaml
# Connect to task stream
ws://agents.example.com/agents/worker/tasks/task_xyz789/stream

# Messages from agent
{
  "type": "progress",
  "task_id": "task_xyz789",
  "progress": 33,
  "message": "Processing batch 1/3"
}

{
  "type": "progress",
  "task_id": "task_xyz789",
  "progress": 66,
  "message": "Processing batch 2/3"
}

{
  "type": "completed",
  "task_id": "task_xyz789",
  "status": "success",
  "result": {...}
}
```

### gRPC Streaming

```protobuf
service AgentService {
  rpc ExecuteTask(TaskRequest) returns (stream TaskUpdate);
}

message TaskUpdate {
  string task_id = 1;
  TaskState state = 2;
  int32 progress = 3;
  string message = 4;
  google.protobuf.Struct result = 5;
}
```

---

## 10. Push Notifications

Agents can register webhooks to receive push notifications.

### Webhook Registration

```yaml
# Register webhook
POST /agents/code-reviewer/webhooks
Content-Type: application/json

{
  "url": "https://my-app.example.com/webhooks/agent-events",
  "events": [
    "task.completed",
    "task.failed",
    "agent.status_changed"
  ],
  "authentication": {
    "type": "bearer",
    "token": "secret_webhook_token_xyz"
  },
  "retry_policy": {
    "max_attempts": 5,
    "backoff": "exponential"
  }
}
```

### Webhook Delivery

```http
POST /webhooks/agent-events HTTP/1.1
Host: my-app.example.com
Content-Type: application/json
X-OSSA-Event: task.completed
X-OSSA-Signature: sha256=abc123...
X-OSSA-Delivery: delivery_001

{
  "version": "ossa/a2a/v0.2.9",
  "id": "event_webhook_001",
  "timestamp": "2025-12-04T19:32:00.000Z",
  "from": "agent://team-b/worker",
  "event": "task.completed",
  "payload": {
    "task_id": "task_xyz789",
    "status": "completed",
    "result": {...}
  }
}
```

**Webhook Verification**:

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

---

## 11. Transport Bindings

### 11.1 HTTP/REST Binding

```http
POST /agents/{agent_name}/messages HTTP/1.1
Host: agents.example.com
Content-Type: application/json
Authorization: Bearer {token}

{
  "version": "ossa/a2a/v0.2.9",
  "id": "msg_abc123",
  "from": "agent://sender",
  "to": "agent://receiver",
  "type": "request",
  "payload": {...}
}

---
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "message_id": "msg_abc123",
  "status": "accepted",
  "timestamp": "2025-12-04T19:30:00.000Z"
}
```

### 11.2 gRPC Binding

```protobuf
service AgentMessaging {
  rpc SendMessage(A2AMessage) returns (MessageAck);
  rpc StreamMessages(StreamRequest) returns (stream A2AMessage);
}

message A2AMessage {
  string version = 1;
  string id = 2;
  google.protobuf.Timestamp timestamp = 3;
  string from = 4;
  string to = 5;
  string correlation_id = 6;
  MessageType type = 7;
  google.protobuf.Struct payload = 8;
}
```

### 11.3 MQTT Binding

```yaml
# Publish to agent topic
Topic: ossa/agents/code-reviewer/messages
QoS: 1
Retain: false

Payload:
  version: "ossa/a2a/v0.2.9"
  id: "msg_mqtt_001"
  from: "agent://sender"
  to: "agent://code-reviewer"
  type: "request"
  payload: {...}
```

---

## 12. Observability

### W3C Trace Context Propagation

All A2A messages MUST propagate W3C trace context.

```yaml
version: "ossa/a2a/v0.2.9"
id: "msg_abc123"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://team-a/orchestrator"
to: "agent://team-b/worker"
type: "request"
trace_context:
  traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
  tracestate: "vendor=value"
payload:
  action: "execute_task"
```

**HTTP Headers**:

```http
POST /agents/worker/messages HTTP/1.1
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
tracestate: vendor=value
```

### OpenTelemetry Spans

```typescript
// Sender creates span
const span = tracer.startSpan('a2a.send_message', {
  attributes: {
    'a2a.message_id': 'msg_abc123',
    'a2a.from': 'agent://team-a/orchestrator',
    'a2a.to': 'agent://team-b/worker',
    'a2a.type': 'request',
    'a2a.correlation_id': 'task_xyz789'
  }
});

// Receiver continues trace
const receiverSpan = tracer.startSpan('a2a.receive_message', {
  parent: extractedContext,
  attributes: {
    'a2a.message_id': 'msg_abc123',
    'a2a.processing_time_ms': 1234
  }
});
```

---

## 13. Security Considerations

### Message Signing

Messages SHOULD be signed to prevent tampering.

```yaml
version: "ossa/a2a/v0.2.9"
id: "msg_signed_001"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://team-a/sender"
to: "agent://team-b/receiver"
type: "request"
payload: {...}
signature:
  algorithm: "RS256"
  keyid: "key_abc123"
  value: "base64_signature_here..."
```

### Message Encryption

Sensitive payloads SHOULD be encrypted.

```yaml
version: "ossa/a2a/v0.2.9"
id: "msg_encrypted_001"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://team-a/sender"
to: "agent://team-b/receiver"
type: "request"
payload_encrypted: true
encryption:
  algorithm: "AES-256-GCM"
  key_id: "key_xyz789"
  nonce: "base64_nonce..."
payload: "base64_encrypted_payload..."
```

### Rate Limiting

```yaml
# Agent manifest with rate limiting
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: rate-limited-agent
spec:
  messaging:
    rate_limits:
      - type: per_sender
        requests_per_minute: 60
      - type: global
        requests_per_minute: 1000
      - type: per_topic
        topic: "topic://high-priority"
        requests_per_minute: 10
```

---

## 14. Compliance Requirements

### MUST Requirements

1. Messages MUST include `version`, `id`, `timestamp`, `from`, `to`, `type`, `payload`
2. Agent URIs MUST follow format: `agent://{namespace}/{name}`
3. Timestamps MUST be ISO 8601 format with timezone
4. Message IDs MUST be globally unique (UUID recommended)
5. Correlation IDs MUST match across request/response pairs
6. TTL MUST be honored; expired messages MUST be dropped
7. Authentication MUST be enforced in production environments
8. TLS 1.3+ MUST be used for HTTP/gRPC transports

### SHOULD Requirements

1. Agents SHOULD publish AgentCard on startup
2. Agents SHOULD implement at least one discovery method
3. Agents SHOULD propagate W3C trace context
4. Agents SHOULD sign messages in untrusted networks
5. Agents SHOULD implement exponential backoff for retries
6. Agents SHOULD emit OpenTelemetry spans for all messages

### MAY Requirements

1. Agents MAY support multiple transports
2. Agents MAY implement custom routing logic
3. Agents MAY encrypt message payloads
4. Agents MAY implement priority queuing

---

## 15. Examples

### Example 1: Code Review Workflow

```yaml
# 1. Developer agent requests code review
version: "ossa/a2a/v0.2.9"
id: "msg_001"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://dev/alice-assistant"
to: "agent://code-review/reviewer"
type: "request"
correlation_id: "review_pr_42"
reply_to: "agent://dev/alice-assistant"
payload:
  action: "review_code"
  pull_request: "https://github.com/org/repo/pull/42"
  focus_areas: ["security", "performance"]

---
# 2. Reviewer accepts task
version: "ossa/a2a/v0.2.9"
id: "msg_002"
timestamp: "2025-12-04T19:30:01.000Z"
from: "agent://code-review/reviewer"
to: "agent://dev/alice-assistant"
type: "response"
correlation_id: "review_pr_42"
payload:
  status: "accepted"
  estimated_duration_seconds: 180

---
# 3. Reviewer sends progress
version: "ossa/a2a/v0.2.9"
id: "msg_003"
timestamp: "2025-12-04T19:31:00.000Z"
from: "agent://code-review/reviewer"
to: "agent://dev/alice-assistant"
type: "event"
correlation_id: "review_pr_42"
payload:
  event: "progress"
  progress: 50
  message: "Completed security scan, running performance tests"

---
# 4. Reviewer completes review
version: "ossa/a2a/v0.2.9"
id: "msg_004"
timestamp: "2025-12-04T19:33:00.000Z"
from: "agent://code-review/reviewer"
to: "agent://dev/alice-assistant"
type: "response"
correlation_id: "review_pr_42"
payload:
  status: "completed"
  result:
    overall_score: 85
    security_issues: 2
    performance_concerns: 1
    recommendation: "approve_with_changes"
    comments:
      - line: 42
        message: "Consider using parameterized query to prevent SQL injection"
```

### Example 2: Multi-Agent Orchestration

```yaml
# Orchestrator broadcasts task to worker pool
version: "ossa/a2a/v0.2.9"
id: "msg_orchestrator_001"
timestamp: "2025-12-04T19:30:00.000Z"
from: "agent://orchestrator/main"
to: "broadcast://workers/*"
type: "request"
correlation_id: "batch_job_123"
reply_to: "agent://orchestrator/main"
payload:
  action: "claim_task"
  task_pool: "image_processing"
  max_workers: 5

---
# Worker claims task
version: "ossa/a2a/v0.2.9"
id: "msg_worker_001"
timestamp: "2025-12-04T19:30:01.000Z"
from: "agent://workers/worker-01"
to: "agent://orchestrator/main"
type: "response"
correlation_id: "batch_job_123"
payload:
  status: "claimed"
  worker_id: "worker-01"
  capacity: 10

---
# Orchestrator assigns task
version: "ossa/a2a/v0.2.9"
id: "msg_orchestrator_002"
timestamp: "2025-12-04T19:30:02.000Z"
from: "agent://orchestrator/main"
to: "agent://workers/worker-01"
type: "request"
correlation_id: "task_img_001"
payload:
  action: "process_images"
  images:
    - "s3://bucket/img1.jpg"
    - "s3://bucket/img2.jpg"
  operations: ["resize", "optimize", "watermark"]
```

---

## References

- [OSSA Schema v0.2.9](./ossa-0.2.9.schema.json)
- [Runtime Semantics](./runtime-semantics.md)
- [Semantic Conventions](./semantic-conventions.md)
- [Google A2A Protocol (2024)](https://github.com/google/a2a-protocol)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [CloudEvents Specification](https://cloudevents.io/)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/)
- [RFC 6763: DNS-Based Service Discovery](https://tools.ietf.org/html/rfc6763)
