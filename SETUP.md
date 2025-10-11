# OSSA v0.1.9-alpha.1 Complete Setup & Implementation Guide

## Executive Overview

OSSA (Open Standards Scalable Agents) is a specification-first framework that enables interoperable AI agent orchestration. This guide provides comprehensive setup instructions for implementing OSSA in your environment, with specific focus on GitLab-native workflows and Drupal integration.

---

##  Quick Start

```bash
# 1. Clone and setup workspace
git clone https://gitlab.com/bluefly/ossa.git
cd ossa

# 2. Initialize OSSA workspace at LLM root
mkdir -p ../.agent-workspace
cp -r templates/workspace/* ../.agent-workspace/

# 3. Setup project structure
./scripts/init-ossa-project.sh agent_buildkit

# 4. Verify installation
ossa validate workspace
ossa agent discover
```

---

##  Core Architecture

### Workspace Hierarchy

```
[LLM_ROOT]/                              # Your LLM root directory
├── .agent-workspace/                    # Global OSSA workspace (NEVER in projects)
│   ├── registry.yml                    # Global agent registry
│   ├── memory.json                     # Workspace state
│   ├── deployment-manifest.yml         # Deployment configuration
│   ├── data/
│   │   └── artifacts/                  # Shared artifacts by project
│   │       ├── agent_buildkit/
│   │       └── drupal_orchestrator/
│   └── logs/
│       └── agents/                     # Centralized logging
│
└── [projects]/                          # Your OSSA projects
    ├── agent_buildkit/
    │   ├── ossa.config.yaml            # Project OSSA config
    │   └── .agents/                    # Project agents
    └── drupal_orchestrator/
        ├── ossa.config.yaml
        └── .agents/
```

---

##  Installation & Setup

### Prerequisites

```bash
# Required versions
node >= 20.0.0
npm >= 10.0.0
docker >= 24.0.0
kubectl >= 1.28.0 (for K8s deployments)
gitlab-runner >= 16.0.0
```

### Step 1: Initialize Global Workspace

```bash
# Create LLM root workspace
cd /path/to/your/llm/root
mkdir -p .agent-workspace/{agents,compliance,config,data,logs,metrics,monitoring}

# Create workspace manifest
cat > .agent-workspace/workspace.yml << 'EOF'
apiVersion: open-standards-scalable-agents/v0.1.9
kind: WorkspaceManifest
metadata:
  name: global-workspace
  version: "0.1.9-alpha.1"
spec:
  discovery:
    auto_scan: true
    scan_interval: 300
  orchestration:
    mode: distributed
    max_concurrent_workflows: 100
  compliance:
    tier: governed
    audit_interval: 3600
EOF
```

### Step 2: Setup OSSA Project

```bash
# Navigate to your project
cd /path/to/your/project

# Initialize OSSA in your project
mkdir -p .agents/{agents,manifests,schemas,workflows,governance}

# Create project OSSA config
cat > ossa.config.yaml << 'EOF'
apiVersion: open-standards-scalable-agents/v0.1.9
kind: ProjectConfiguration
metadata:
  name: your-project-name
  project_id: "$(uuidgen)"
spec:
  workspace:
    path: "../.agent-workspace"
    artifacts_path: "../.agent-workspace/data/artifacts/your-project-name"
    logs_path: "../.agent-workspace/logs/agents/your-project-name"
  agents:
    base_path: ".agents"
    auto_discover: true
    validation: strict
  registry:
    project: ".agents/registry.yml"
    global: "../.agent-workspace/registry.yml"
EOF

# Create project registry
cat > .agents/registry.yml << 'EOF'
apiVersion: open-standards-scalable-agents/v0.1.9
kind: Registry
metadata:
  name: project-agents
  scope: project
spec:
  agents: []
  discovery:
    enabled: true
    methods: [filesystem, git, uadp]
EOF
```

### Step 3: Create Your First Agent

```bash
# Create agent directory
mkdir -p .agents/agents/example-worker

# Generate agent manifest
cat > .agents/agents/example-worker/agent.yml << 'EOF'
apiVersion: "@bluefly/open-standards-scalable-agents/v0.1.9"
kind: Agent
metadata:
  name: example-worker
  version: "0.1.0"
  namespace: project-namespace
  labels:
    category: worker
    domain: general
spec:
  type: worker
  capabilities:
    domains:
      - text-processing
      - data-validation
    operations:
      - name: process_text
        inputSchema:
          type: object
          properties:
            text: {type: string}
        outputSchema:
          type: object
          properties:
            result: {type: string}
  protocols:
    supported: [ossa, mcp, rest]
    preferred: mcp
  conformance:
    level: core
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
EOF

# Create OpenAPI specification
cat > .agents/agents/example-worker/openapi.yml << 'EOF'
openapi: 3.1.0
info:
  title: Example Worker Agent API
  version: 0.1.0
  x-ossa:
    version: 0.1.9-alpha.1
    conformance_tier: core
paths:
  /agent/execute:
    post:
      operationId: executeTask
      requestBody:
        content:
          application/json:
            schema:
              type: object
      responses:
        '202':
          description: Task accepted
EOF
```

---

##  GitLab Integration

### GitLab CI/CD Pipeline

```yaml
# .gitlab-ci.yml
include:
  - component: gitlab.com/ossa/components/agent-validator@0.1.9
  - component: gitlab.com/ossa/components/mcp-tester@0.1.9
  - component: gitlab.com/ossa/components/security-scanner@0.1.9

variables:
  OSSA_VERSION: "0.1.9-alpha.1"
  WORKSPACE_PATH: "../.agent-workspace"

stages:
  - validate
  - test
  - build
  - deploy
  - monitor

validate:agents:
  stage: validate
  extends: .agent-validator
  variables:
    MANIFEST_PATH: ".agents"
    SCHEMA_VERSION: "0.1.9"

test:mcp:
  stage: test
  extends: .mcp-tester
  variables:
    ENDPOINT: "http://localhost:3000"
    TEST_SUITE: "conformance"

security:scan:
  stage: test
  extends: .security-scanner
  variables:
    SCAN_TYPE: "full"
    THRESHOLD: "medium"

deploy:agents:
  stage: deploy
  script:
    - ossa deploy --manifest deployment-manifest.yml
  environment:
    name: production
  only:
    - main

monitor:compliance:
  stage: monitor
  script:
    - ossa compliance audit --tier governed
  only:
    - schedules
```

### GitLab ML Integration

```yaml
# ML Experiment Tracking
experiments:
  agent_performance:
    tracking_server: "gitlab.com/api/v4/projects/${CI_PROJECT_ID}/ml/mlflow"
    experiment_name: "agent-optimization"
    metrics:
      - accuracy
      - latency
      - resource_usage
```

---

##  Drupal Bridge Configuration

### MCP Bridge Setup

```php
// drupal/modules/custom/ossa_mcp_bridge/src/Controller/McpController.php
<?php

namespace Drupal\ossa_mcp_bridge\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

class McpController extends ControllerBase {

  public function executeAgent($agent_id) {
    $client = \Drupal::service('ossa.mcp_client');

    $request = [
      'jsonrpc' => '2.0',
      'method' => 'tools.execute',
      'params' => [
        'agent_id' => $agent_id,
        'task' => $this->getCurrentTask()
      ],
      'id' => uniqid()
    ];

    $response = $client->send($request);
    return new JsonResponse($response);
  }
}
```

### Drupal Module Configuration

```yaml
# drupal/modules/custom/ossa_bridge/config/install/ossa_bridge.settings.yml
workspace_endpoint: 'http://localhost:8000/api/v1'
mcp_endpoint: 'ws://localhost:3000/mcp'
agent_discovery: true
cache_ttl: 300
protocols:
  - mcp
  - rest
compliance_tier: governed
```

---

##  Running OSSA

### Local Development

```bash
# Start workspace orchestrator
cd .agent-workspace
docker-compose up -d

# Start agent discovery
ossa discovery start --watch

# Launch specific agent
ossa agent start example-worker --debug

# Monitor agents
ossa monitor dashboard
```

### Production Deployment (Kubernetes)

```yaml
# k8s/ossa-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-workspace
  namespace: ossa-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ossa-workspace
  template:
    metadata:
      labels:
        app: ossa-workspace
    spec:
      containers:
      - name: orchestrator
        image: gitlab.com/ossa/orchestrator:0.1.9-alpha.1
        env:
        - name: OSSA_MODE
          value: "production"
        - name: COMPLIANCE_TIER
          value: "governed"
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

---

##  Testing & Validation

### Agent Testing

```bash
# Validate agent manifest
ossa validate agent .agents/agents/example-worker/agent.yml

# Test MCP compliance
ossa test mcp --agent example-worker

# Run integration tests
ossa test integration --workspace ../..agent-workspace

# Performance benchmarking
ossa benchmark --agent example-worker --duration 60s
```

### Compliance Auditing

```bash
# Run compliance audit
ossa compliance audit --tier governed --output report.json

# Check NIST 800-53 compliance
ossa compliance check nist-800-53 --controls AC-2,AU-12,SC-8

# Generate SBOM
ossa sbom generate --format spdx --sign
```

---

##  Monitoring & Observability

### Metrics Collection

```yaml
# prometheus/ossa-metrics.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ossa-agents'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: /metrics

  - job_name: 'ossa-workspace'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: /api/v1/metrics
```

### Dashboard Configuration

```json
// grafana/dashboards/ossa-overview.json
{
  "dashboard": {
    "title": "OSSA Workspace Overview",
    "panels": [
      {
        "title": "Active Agents",
        "targets": [
          {
            "expr": "ossa_agents_active"
          }
        ]
      },
      {
        "title": "Task Throughput",
        "targets": [
          {
            "expr": "rate(ossa_tasks_completed[5m])"
          }
        ]
      }
    ]
  }
}
```

---

##  Security Configuration

### mTLS Setup

```bash
# Generate certificates
ossa security gen-certs --ca-cert ca.pem --ca-key ca-key.pem

# Configure agent TLS
cat > .agents/config/tls.yml << EOF
tls:
  enabled: true
  cert: /certs/agent.pem
  key: /certs/agent-key.pem
  ca: /certs/ca.pem
  verify_mode: VERIFY_PEER
EOF
```

### OPA Policy

```rego
# policies/agent-authorization.rego
package ossa.authz

default allow = false

allow {
    input.agent.type == "worker"
    input.agent.conformance.level == "core"
    input.task.priority <= 5
}

allow {
    input.agent.type == "governor"
    input.agent.conformance.level in ["governed", "advanced"]
}
```

---

##  Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Agent not discovered | Check `ossa.config.yaml` workspace path, ensure relative path to LLM root |
| MCP connection failed | Verify MCP endpoint in agent manifest, check firewall rules |
| Compliance audit fails | Run `ossa compliance fix --auto` to apply automatic fixes |
| GitLab pipeline fails | Ensure GitLab Runner has access to workspace, check component versions |

### Debug Commands

```bash
# Enable debug logging
export OSSA_LOG_LEVEL=debug

# Trace agent communication
ossa trace --agent example-worker --verbose

# Inspect workspace state
ossa workspace inspect --detail

# View agent logs
ossa logs --agent example-worker --follow
```

---

##  Additional Resources

- **Specification**: `standards/v0.1.9-alpha.1/core/specification.md`
- **API Reference**: [https://docs.ossa.io/api](https://docs.ossa.io/api)
- **GitLab Components**: [https://gitlab.com/ossa/components](https://gitlab.com/ossa/components)
- **Examples**: `examples/` directory in the repository
- **Community**: Discord (coming soon)
- **Security**: Report issues to security@ossa.io

---

##  Next Steps

1. **Implement Reference Agents**: Start with the example templates in `examples/`
2. **Configure GitLab CI/CD**: Set up automated testing and deployment
3. **Enable Drupal Bridge**: Install and configure the MCP bridge module
4. **Set Compliance Tier**: Choose core, governed, or advanced based on requirements
5. **Deploy to Production**: Use Kubernetes manifests for scalable deployment

---

This documentation provides a complete setup guide for OSSA v0.1.9-alpha.1. For questions or contributions, please refer to `CONTRIBUTING.md` or open an issue in the GitLab repository.