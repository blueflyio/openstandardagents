# OSSA Agent Properties Breakdown

## Overview
OSSA (Open Standards for Scalable Agents) v0.1.9 defines a comprehensive specification for AI agents with four main sections:

```yaml
apiVersion: ossa.io/v0.1.9  # Specification version
kind: Agent                  # Resource type
metadata: {}                 # Agent identity and metadata
spec: {}                    # Agent capabilities and configuration
status: {}                  # Runtime state (optional)
```

## 1. Metadata Properties

### Core Identity
- **name** (required): DNS-1123 compliant name (3-63 chars, lowercase, alphanumeric with hyphens)
- **version** (required): Semantic version (e.g., v1.2.0)
- **description**: Human-readable description (max 500 chars)
- **author**: Creator or organization
- **license**: License identifier (Apache-2.0, MIT, etc.)

### Organization & Discovery
- **labels**: Key-value pairs for categorization
  - `environment`: production, development, staging
  - `classification`: internal, public, restricted
  - `role`: orchestrator, worker, critic, etc.
  - `complexity`: simple, standard, enterprise
- **annotations**: Tool-specific metadata (monitoring, deployment)

### References
- **repository**: Source code URL
- **documentation**: Documentation URL

## 2. Spec Properties

### 2.1 Agent Type Classification
```yaml
type: orchestrator|worker|critic|judge|trainer|governor|monitor|integrator|voice
subtype: specialized-role  # e.g., worker.api, critic.security
```

### 2.2 Capabilities
Defines what the agent can do:

```yaml
capabilities:
  domains:           # Core capability areas
    - nlp
    - vision
    - reasoning
    - data
    - orchestration
    - monitoring
    - security
    - compliance

  operations:        # Specific operations
    - name: process_data
      description: "Process incoming data"
      inputSchema: {}   # JSON Schema
      outputSchema: {}  # JSON Schema
      timeout: 30000    # ms

  inputFormats:      # Supported formats
    - json
    - xml
    - csv

  outputFormats:
    - json
    - html
    - pdf

  tokenEfficiency:   # Token optimization
    strategies:
      - key-based-context
      - delta-prompting
      - compression-support
    compressionRatio: 0.7
```

### 2.3 Protocols
Communication interfaces:

```yaml
protocols:
  supported:
    - name: rest
      version: "1.1"
      endpoint: "https://agent.example.com/api"
      authentication:
        type: oauth2|jwt|api-key|mtls|none
        config: {}
      tls: true

    - name: grpc
      version: "1.0"
      endpoint: "grpc://agent.example.com:9090"

    - name: websocket
      version: "1.0"
      endpoint: "wss://events.example.com/agent"

  preferred: rest
```

### 2.4 Conformance
OSSA compliance levels:

```yaml
conformance:
  level: bronze|silver|gold
  certifications:
    - ISO-42001
    - NIST-AI-RMF
    - SOC2
  auditLogging: true
  feedbackLoop: true      # 360° feedback support
  propsTokens: true       # Props token resolution
  learningSignals: true   # Learning signal processing
```

### 2.5 Performance
Runtime characteristics:

```yaml
performance:
  throughput:
    requestsPerSecond: 1000
    concurrentRequests: 50

  latency:
    p50: 100    # ms
    p95: 200    # ms
    p99: 500    # ms

  limits:
    maxRequestSize: 1048576   # bytes
    maxResponseSize: 5242880  # bytes
    timeout: 30000            # ms
```

### 2.6 Resources
Compute requirements:

```yaml
resources:
  requests:
    cpu: "500m"      # 0.5 CPU cores
    memory: "512Mi"  # 512 MiB RAM
    storage: "1Gi"   # 1 GiB storage

  limits:
    cpu: "2000m"     # 2 CPU cores
    memory: "2Gi"    # 2 GiB RAM
    storage: "10Gi"  # 10 GiB storage
```

### 2.7 Feedback Loop
360° feedback integration:

```yaml
feedbackLoop:
  phase: plan|execute|review|judge|learn|govern
  inputs:
    - user-requirements
    - system-constraints
  outputs:
    - execution-plan
    - performance-metrics
```

### 2.8 Budgets
Resource consumption limits:

```yaml
budgets:
  tokens:
    default: 4000
    maximum: 8000
    strategy: fixed|adaptive|hierarchical

  time:
    default: 30000   # ms
    maximum: 300000  # ms
```

### 2.9 Dependencies
External requirements:

```yaml
dependencies:
  agents:
    - name: data-processor
      version: ">=1.0.0"
      optional: false

  services:
    - name: database
      endpoint: "https://db.example.com"
      healthCheck: "/health"
```

### 2.10 Deployment
Infrastructure configuration:

```yaml
deployment:
  target: local|docker|kubernetes|serverless|edge

  kubernetes:
    enabled: true
    agent:
      name: gitlab-agent
      namespace: production

    security:
      tls:
        enabled: true
      rbac:
        enabled: true

  healthChecks:
    enabled: true
    path: "/health"
    port: 3000
    initialDelaySeconds: 30
    periodSeconds: 10

  scaling:
    enabled: true
    minReplicas: 1
    maxReplicas: 10
    targetCPUUtilization: 80
```

## 3. Status Properties (Runtime)

```yaml
status:
  state: pending|registered|active|suspended|terminated
  health: healthy|degraded|unhealthy|unknown
  lastHeartbeat: "2024-01-20T10:30:00Z"
  registeredAt: "2024-01-01T00:00:00Z"

  metrics:
    requestsHandled: 1000000
    successRate: 0.995
    avgResponseTime: 150  # ms
    tokenUsage: 50000000
```

## Property Hierarchy

```
Agent
├── apiVersion (required)
├── kind (required)
├── metadata (required)
│   ├── name (required)
│   ├── version (required)
│   ├── description
│   ├── author
│   ├── license
│   ├── labels
│   ├── annotations
│   ├── repository
│   └── documentation
├── spec (required)
│   ├── type (required)
│   ├── subtype
│   ├── capabilities (required)
│   │   ├── domains (required)
│   │   ├── operations
│   │   ├── inputFormats
│   │   ├── outputFormats
│   │   └── tokenEfficiency
│   ├── protocols (required)
│   │   ├── supported (required)
│   │   └── preferred
│   ├── conformance (required)
│   │   ├── level (required)
│   │   ├── certifications
│   │   ├── auditLogging
│   │   ├── feedbackLoop
│   │   ├── propsTokens
│   │   └── learningSignals
│   ├── performance
│   │   ├── throughput
│   │   ├── latency
│   │   └── limits
│   ├── resources
│   │   ├── requests
│   │   └── limits
│   ├── feedbackLoop
│   │   ├── phase
│   │   ├── inputs
│   │   └── outputs
│   ├── budgets
│   │   ├── tokens
│   │   └── time
│   ├── dependencies
│   │   ├── agents
│   │   └── services
│   └── deployment
│       ├── target
│       ├── kubernetes
│       ├── healthChecks
│       └── scaling
└── status (optional)
    ├── state
    ├── health
    ├── lastHeartbeat
    ├── registeredAt
    └── metrics
```

## Key Design Principles

1. **Declarative Configuration**: All agent properties are declarative, describing desired state
2. **Extensible Schema**: Uses JSON Schema for validation while allowing extensions
3. **Protocol Agnostic**: Supports multiple communication protocols simultaneously
4. **Resource Aware**: Explicit resource requirements and limits
5. **Compliance Ready**: Built-in support for certifications and audit requirements
6. **Token Efficient**: First-class support for token optimization strategies
7. **Observable**: Comprehensive metrics and health reporting
8. **Scalable**: Auto-scaling and distributed deployment support

## Common Patterns

### Minimal Agent
```yaml
apiVersion: ossa.io/v0.1.9
kind: Agent
metadata:
  name: simple-worker
  version: v1.0.0
spec:
  type: worker
  capabilities:
    domains: [data]
  protocols:
    supported:
      - name: rest
        version: "1.0"
        endpoint: "http://localhost:3000"
  conformance:
    level: bronze
```

### Enterprise Agent
```yaml
apiVersion: ossa.io/v0.1.9
kind: Agent
metadata:
  name: enterprise-orchestrator
  version: v2.1.0
  labels:
    environment: production
    classification: restricted
spec:
  type: orchestrator
  capabilities:
    domains: [orchestration, monitoring, security]
    tokenEfficiency:
      strategies: [compression-support, checkpoint-memos]
  protocols:
    supported:
      - name: rest
        version: "1.1"
        endpoint: "https://api.enterprise.com"
        authentication:
          type: oauth2
        tls: true
  conformance:
    level: gold
    certifications: [ISO-42001, SOC2]
    auditLogging: true
  performance:
    throughput:
      requestsPerSecond: 10000
  resources:
    limits:
      cpu: "4000m"
      memory: "8Gi"
  deployment:
    target: kubernetes
    scaling:
      enabled: true
      maxReplicas: 20
```

## Validation

Use OSSA CLI to validate agent manifests:

```bash
# Validate against schema
ossa validate agent.yaml

# Check conformance level
ossa conformance check agent.yaml

# Test deployment configuration
ossa deploy validate agent.yaml
```