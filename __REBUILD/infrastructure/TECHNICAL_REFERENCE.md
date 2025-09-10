# OSSA Platform Technical Reference

## System Architecture

### Microservices Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                           │
│                    (Nginx/Traefik/HAProxy)                      │
└─────────────┬──────────────────┬──────────────────┬────────────┘
              │                  │                  │
              ▼                  ▼                  ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │  Gateway API    │ │  Orchestrator   │ │   Monitoring    │
    │   Port: 3100    │ │   Port: 3012    │ │   Port: 3013    │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                   │                   │
    ┌────────▼────────────────────▼──────────────────▼────────┐
    │                    Message Bus (Redis)                   │
    │                      Port: 6382                          │
    └───────────────────────────────────────────────────────┘
             │                   │                   │
    ┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
    │   PostgreSQL    │ │     Qdrant      │ │   Prometheus    │
    │   Port: 5433    │ │   Port: 6335    │ │   Port: 9090    │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Database Schema

### PostgreSQL Tables

```sql
-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('orchestrator', 'worker', 'critic', 'judge', 'trainer', 'governor', 'monitor', 'integrator')),
    version VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'error', 'offline')),
    capabilities JSONB NOT NULL DEFAULT '[]',
    config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP WITH TIME ZONE
);

-- Workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    definition JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deprecated')),
    created_by UUID REFERENCES agents(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, version)
);

-- Executions table
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    context JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    error TEXT,
    retry_count INT DEFAULT 0
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES executions(id),
    agent_id UUID REFERENCES agents(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'assigned', 'running', 'completed', 'failed')),
    priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    input JSONB DEFAULT '{}',
    output JSONB DEFAULT '{}',
    error TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    timeout_seconds INT DEFAULT 300
);

-- Metrics table
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC NOT NULL,
    labels JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_executions_workflow ON executions(workflow_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_tasks_execution ON tasks(execution_id);
CREATE INDEX idx_tasks_agent ON tasks(agent_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_metrics_agent_timestamp ON metrics(agent_id, timestamp DESC);
```

### Redis Key Structure

```typescript
// Key naming convention: {namespace}:{entity}:{id}:{field}

// Agent registry
"ossa:agents:registry" // SET of all agent IDs
"ossa:agent:{agentId}:info" // HASH with agent details
"ossa:agent:{agentId}:status" // STRING with current status
"ossa:agent:{agentId}:heartbeat" // STRING with timestamp, TTL 60s

// Task queue
"ossa:tasks:pending" // LIST of task IDs
"ossa:tasks:priority" // ZSET sorted by priority
"ossa:task:{taskId}:data" // HASH with task details
"ossa:task:{taskId}:lock" // STRING with agent ID, TTL based on timeout

// Workflow state
"ossa:workflow:{workflowId}:state" // HASH with workflow execution state
"ossa:workflow:{workflowId}:steps" // LIST of step IDs
"ossa:workflow:{workflowId}:variables" // HASH with workflow variables

// Metrics buffer
"ossa:metrics:buffer" // LIST of metric entries
"ossa:metrics:aggregates:{metric}:{window}" // HASH with aggregated values

// Session management
"ossa:session:{sessionId}" // HASH with session data, TTL 3600s
"ossa:user:{userId}:sessions" // SET of session IDs

// Rate limiting
"ossa:ratelimit:{clientId}:{endpoint}" // STRING with count, TTL based on window
```

### Qdrant Collections

```typescript
// Collection: agents
{
  name: "agents",
  vectors: {
    size: 768, // Embedding dimension
    distance: "Cosine"
  },
  payload_schema: {
    agent_id: "keyword",
    agent_type: "keyword",
    capabilities: "text[]",
    description: "text",
    version: "keyword"
  }
}

// Collection: workflows
{
  name: "workflows",
  vectors: {
    size: 768,
    distance: "Cosine"
  },
  payload_schema: {
    workflow_id: "keyword",
    name: "text",
    description: "text",
    tags: "keyword[]",
    complexity: "float"
  }
}

// Collection: knowledge
{
  name: "knowledge",
  vectors: {
    size: 1536, // Larger dimension for knowledge
    distance: "Cosine"
  },
  payload_schema: {
    content: "text",
    source: "keyword",
    timestamp: "datetime",
    relevance_score: "float",
    metadata: "json"
  }
}
```

## API Specifications

### OpenAPI 3.1 Schema

```yaml
openapi: 3.1.0
info:
  title: OSSA Platform API
  version: 0.1.9-alpha.1
  description: Open Standards for Scalable Agents

servers:
  - url: http://localhost:3100/api/v1
    description: Development server
  - url: https://api.ossa.io/v1
    description: Production server

paths:
  /agents:
    get:
      summary: List all agents
      parameters:
        - name: type
          in: query
          schema:
            type: string
            enum: [orchestrator, worker, critic, judge, trainer, governor, monitor, integrator]
        - name: status
          in: query
          schema:
            type: string
            enum: [idle, busy, error, offline]
      responses:
        200:
          description: List of agents
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Agent'
    
    post:
      summary: Register new agent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AgentRegistration'
      responses:
        201:
          description: Agent registered
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Agent'

  /agents/{agentId}:
    get:
      summary: Get agent details
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Agent details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Agent'
    
    delete:
      summary: Unregister agent
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Agent unregistered

  /orchestrate:
    post:
      summary: Start orchestration
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OrchestrationRequest'
      responses:
        202:
          description: Orchestration started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrchestrationResponse'

components:
  schemas:
    Agent:
      type: object
      required: [id, name, type, version, status]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        type:
          type: string
          enum: [orchestrator, worker, critic, judge, trainer, governor, monitor, integrator]
        version:
          type: string
        status:
          type: string
          enum: [idle, busy, error, offline]
        capabilities:
          type: array
          items:
            type: string
        config:
          type: object
        metadata:
          type: object
```

## Performance Benchmarks

### Service Latency Targets

| Operation | P50 | P95 | P99 | Max |
|-----------|-----|-----|-----|-----|
| Agent Registration | 10ms | 25ms | 50ms | 100ms |
| Task Assignment | 5ms | 15ms | 30ms | 50ms |
| Workflow Execution Start | 20ms | 50ms | 100ms | 200ms |
| Health Check | 2ms | 5ms | 10ms | 20ms |
| Metrics Query | 15ms | 40ms | 80ms | 150ms |
| Vector Search | 25ms | 60ms | 120ms | 250ms |

### Throughput Targets

```yaml
# Requests per second (RPS) targets
gateway:
  read: 10000  # GET requests
  write: 1000  # POST/PUT/DELETE requests

orchestrator:
  workflows: 100   # Concurrent workflows
  tasks: 1000     # Concurrent tasks

database:
  postgres:
    connections: 100
    queries: 5000
  redis:
    operations: 50000
  qdrant:
    searches: 1000
    inserts: 500
```

### Resource Limits

```yaml
# Container resource specifications
services:
  gateway:
    cpu: 1000m      # 1 CPU core
    memory: 1Gi     # 1 GB RAM
    disk: 10Gi      # 10 GB storage
    
  orchestrator:
    cpu: 2000m      # 2 CPU cores
    memory: 2Gi     # 2 GB RAM
    disk: 20Gi      # 20 GB storage
    
  worker:
    cpu: 500m       # 0.5 CPU core
    memory: 512Mi   # 512 MB RAM
    disk: 5Gi       # 5 GB storage
    
  database:
    cpu: 4000m      # 4 CPU cores
    memory: 8Gi     # 8 GB RAM
    disk: 100Gi     # 100 GB storage
```

## Security Configuration

### Authentication & Authorization

```typescript
// JWT token structure
interface JWTPayload {
  sub: string;        // Subject (user/agent ID)
  iss: string;        // Issuer
  aud: string[];      // Audience
  exp: number;        // Expiration time
  iat: number;        // Issued at
  jti: string;        // JWT ID
  scope: string[];    // Permissions
  type: 'user' | 'agent' | 'service';
}

// Permission model
const PERMISSIONS = {
  'agent:read': 'Read agent information',
  'agent:write': 'Create/update agents',
  'agent:delete': 'Delete agents',
  'workflow:read': 'Read workflows',
  'workflow:write': 'Create/update workflows',
  'workflow:execute': 'Execute workflows',
  'metrics:read': 'Read metrics',
  'admin:all': 'Full administrative access'
};

// Role-based access control
const ROLES = {
  viewer: ['agent:read', 'workflow:read', 'metrics:read'],
  operator: ['agent:read', 'agent:write', 'workflow:read', 'workflow:execute'],
  admin: ['admin:all']
};
```

### TLS Configuration

```yaml
# TLS settings for production
tls:
  enabled: true
  cert_file: /etc/ssl/certs/ossa.crt
  key_file: /etc/ssl/private/ossa.key
  ca_file: /etc/ssl/certs/ca-bundle.crt
  min_version: "1.2"
  cipher_suites:
    - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
    - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
    - TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
    - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
```

### Secrets Management

```bash
# Using environment variables
export OSSA_DB_PASSWORD=$(vault kv get -field=password secret/ossa/db)
export OSSA_JWT_SECRET=$(vault kv get -field=secret secret/ossa/jwt)
export OSSA_API_KEY=$(vault kv get -field=key secret/ossa/api)

# Using Kubernetes secrets
kubectl create secret generic ossa-secrets \
  --from-literal=db-password=$OSSA_DB_PASSWORD \
  --from-literal=jwt-secret=$OSSA_JWT_SECRET \
  --from-literal=api-key=$OSSA_API_KEY
```

## Monitoring & Observability

### Prometheus Metrics

```typescript
// Custom metrics definitions
const metrics = {
  // Counter metrics
  'ossa_requests_total': 'Total number of requests',
  'ossa_errors_total': 'Total number of errors',
  'ossa_tasks_completed_total': 'Total completed tasks',
  
  // Gauge metrics
  'ossa_agents_active': 'Number of active agents',
  'ossa_workflows_running': 'Number of running workflows',
  'ossa_queue_size': 'Current task queue size',
  
  // Histogram metrics
  'ossa_request_duration_seconds': 'Request duration in seconds',
  'ossa_task_duration_seconds': 'Task execution duration',
  'ossa_db_query_duration_seconds': 'Database query duration',
  
  // Summary metrics
  'ossa_workflow_completion_time': 'Workflow completion time summary'
};
```

### Logging Format

```json
{
  "timestamp": "2025-09-10T19:30:00.000Z",
  "level": "info",
  "service": "ossa-gateway",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "span_id": "e29b41d4a716",
  "message": "Request processed",
  "metadata": {
    "method": "POST",
    "path": "/api/v1/orchestrate",
    "status": 202,
    "duration_ms": 45,
    "user_id": "user-123",
    "agent_id": "agent-456"
  }
}
```

### Distributed Tracing

```typescript
// OpenTelemetry configuration
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
  serviceName: 'ossa-platform'
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();
```

## Deployment Patterns

### Blue-Green Deployment

```yaml
# Kubernetes deployment strategy
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-gateway-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ossa-gateway
      version: blue
  template:
    metadata:
      labels:
        app: ossa-gateway
        version: blue
    spec:
      containers:
      - name: gateway
        image: ossa/gateway:0.1.9
        ports:
        - containerPort: 3100
---
apiVersion: v1
kind: Service
metadata:
  name: ossa-gateway
spec:
  selector:
    app: ossa-gateway
    version: blue  # Switch to 'green' for deployment
  ports:
  - port: 3100
    targetPort: 3100
```

### Canary Deployment

```yaml
# Istio VirtualService for canary
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ossa-gateway
spec:
  hosts:
  - ossa-gateway
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: ossa-gateway
        subset: v2
      weight: 100
  - route:
    - destination:
        host: ossa-gateway
        subset: v1
      weight: 90
    - destination:
        host: ossa-gateway
        subset: v2
      weight: 10  # 10% canary traffic
```

### Rolling Update

```bash
# Kubernetes rolling update
kubectl set image deployment/ossa-gateway \
  gateway=ossa/gateway:0.1.10 \
  --record

# Monitor rollout
kubectl rollout status deployment/ossa-gateway

# Rollback if needed
kubectl rollout undo deployment/ossa-gateway
```

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# backup.sh - Automated backup script

# PostgreSQL backup
pg_dump -h localhost -p 5433 -U ossa ossa_isolated \
  | gzip > backup/postgres_$(date +%Y%m%d_%H%M%S).sql.gz

# Redis backup
redis-cli -p 6382 --rdb backup/redis_$(date +%Y%m%d_%H%M%S).rdb

# Qdrant backup
curl -X POST http://localhost:6335/collections/agents/snapshots \
  -H "Content-Type: application/json" \
  -d '{"wait": true}'

# Upload to S3
aws s3 sync backup/ s3://ossa-backups/$(date +%Y%m%d)/
```

### Recovery Procedures

```bash
#!/bin/bash
# restore.sh - Disaster recovery script

# Stop services
docker-compose down

# Restore PostgreSQL
gunzip < backup/postgres_latest.sql.gz | \
  psql -h localhost -p 5433 -U ossa ossa_isolated

# Restore Redis
redis-cli -p 6382 --pipe < backup/redis_latest.rdb

# Restore Qdrant
curl -X PUT http://localhost:6335/collections/agents/snapshots/recovery \
  -H "Content-Type: application/json" \
  -d '{"location": "/snapshots/latest"}'

# Start services
docker-compose up -d

# Verify health
./health-check.sh
```

---

*This technical reference is maintained by the OSSA Platform team.*
*For contributions, please follow the development guidelines.*