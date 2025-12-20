# Examples Catalog

Auto-generated catalog of all OSSA agent examples.

**Total Examples**: 19

## Bridges

### Crypto Market Analyst

**Role**: `chat`

OSSA agent with AIFlow-Agent bridge for social crypto analysis

**File**: [`bridges/aiflow-bridge-example.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/bridges/aiflow-bridge-example.yml)

```bash
ossa validate examples/bridges/aiflow-bridge-example.yml
```

### Kubernetes Operations Agent

**Role**: `orchestration`

OSSA agent with kagent.dev bridge for Kubernetes operations

**File**: [`bridges/kagent-bridge-example.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/bridges/kagent-bridge-example.yml)

```bash
ossa validate examples/bridges/kagent-bridge-example.yml
```

## Common_npm

### Agent Router

**Role**: `integration`

Multi-provider LLM gateway with circuit breaker, intelligent routing, and failover.

Features:
- Multi-provider support (OpenAI, Anthropic, Google, etc.)
- Intelligent routing based on model capabilities
- Circuit breaker pattern for fault tolerance
- Request/response caching
- Cost optimization
- Load balancing


**File**: [`common_npm/agent-router.ossa.yaml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/common_npm/agent-router.ossa.yaml)

```bash
ossa validate examples/common_npm/agent-router.ossa.yaml
```

## Drupal

### GitLab ML Recommendation Engine

**Role**: `integration`

AI-powered customer success recommendation agent using RAG (Retrieval-Augmented Generation).

**Pipeline Architecture:**
1. Semantic search in Qdrant for similar successful cases
2. GPT-4 generation with retrieved context
3. Priority ranking based on customer health scores

**Integrates with:**
- GitLabMlRecommendationsService (RAG generation)
- GitLabMlDashboardService (health metrics)
- QdrantVectorService (semantic search)


**File**: [`drupal/gitlab-ml-recommender.ossa.yaml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/drupal/gitlab-ml-recommender.ossa.yaml)

```bash
ossa validate examples/drupal/gitlab-ml-recommender.ossa.yaml
```

## Enterprise

### enterprise-ai-orchestrator

Enterprise-grade AI orchestration platform with multi-model support

**File**: [`enterprise/agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/enterprise/agent.yml)

```bash
ossa validate examples/enterprise/agent.yml
```

## General

### FedRAMP Compliance Scanner

**Role**: `compliance`

Automated FedRAMP compliance scanning agent that validates
infrastructure against FedRAMP Moderate controls.


**File**: [`compliance-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/compliance-agent.yml)

```bash
ossa validate examples/compliance-agent.yml
```

## Kagent

### Kubernetes Troubleshooter

**Role**: `monitoring`

Autonomous Kubernetes cluster troubleshooting agent with diagnostic capabilities

**File**: [`kagent/k8s-troubleshooter-v1.ossa.yaml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/kagent/k8s-troubleshooter-v1.ossa.yaml)

```bash
ossa validate examples/kagent/k8s-troubleshooter-v1.ossa.yaml
```

## Minimal

### hello-world

Minimal OSSA-compliant agent example

**File**: [`minimal/agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/minimal/agent.yml)

```bash
ossa validate examples/minimal/agent.yml
```

## Production

### Document Analyzer

**Role**: `data_processing`

Production document analysis agent with NLP capabilities

**File**: [`production/agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/production/agent.yml)

```bash
ossa validate examples/production/agent.yml
```

## Spec-examples

### API Integration Bridge Agent

**Role**: `integration`

Universal API integration agent that connects external services,
normalizes APIs, and provides unified access layer.


**File**: [`spec-examples/integration-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/integration-agent.yml)

```bash
ossa validate examples/spec-examples/integration-agent.yml
```

### Code Generation & Testing Assistant

**Role**: `development`

AI-powered code generation agent with support for multiple languages,
test generation, and code review capabilities.


**File**: [`spec-examples/development-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/development-agent.yml)

```bash
ossa validate examples/spec-examples/development-agent.yml
```

### Customer Support Chat Agent

**Role**: `chat`

AI-powered customer support agent with natural language understanding,
context retention, and integration with ticketing systems.


**File**: [`spec-examples/chat-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/chat-agent.yml)

```bash
ossa validate examples/spec-examples/chat-agent.yml
```

### Data ETL Processing Agent

**Role**: `data_processing`

High-performance data extraction, transformation, and loading agent
with support for multiple data sources and destinations.


**File**: [`spec-examples/data-processing-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/data-processing-agent.yml)

```bash
ossa validate examples/spec-examples/data-processing-agent.yml
```

### Edge Processing Agent

**Role**: `monitoring`

Lightweight agent optimized for edge deployment with minimal
resource requirements and offline capabilities.


**File**: [`spec-examples/edge-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/edge-agent.yml)

```bash
ossa validate examples/spec-examples/edge-agent.yml
```

### FedRAMP Compliance Scanner

**Role**: `compliance`

Automated compliance scanning agent for FedRAMP Moderate environments.
Scans infrastructure, code, and configurations for security vulnerabilities
and compliance violations.


**File**: [`spec-examples/compliance-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/compliance-agent.yml)

```bash
ossa validate examples/spec-examples/compliance-agent.yml
```

### Security Audit Agent

**Role**: `audit`

Automated security auditing agent that scans infrastructure,
detects vulnerabilities, and generates compliance reports.


**File**: [`spec-examples/audit-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/audit-agent.yml)

```bash
ossa validate examples/spec-examples/audit-agent.yml
```

### Serverless Function Agent

**Role**: `custom`

Serverless agent optimized for AWS Lambda, Google Cloud Functions,
and Azure Functions with auto-scaling and cost optimization.


**File**: [`spec-examples/serverless-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/serverless-agent.yml)

```bash
ossa validate examples/spec-examples/serverless-agent.yml
```

### System Health Monitoring Agent

**Role**: `monitoring`

Continuous system health monitoring with intelligent alerting
and auto-remediation capabilities.


**File**: [`spec-examples/monitoring-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/monitoring-agent.yml)

```bash
ossa validate examples/spec-examples/monitoring-agent.yml
```

### Workflow Orchestration Agent

**Role**: `orchestration`

Advanced workflow orchestration agent that coordinates multi-step processes,
manages agent swarms, and provides intelligent task routing.


**File**: [`spec-examples/workflow-agent.yml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/examples/spec-examples/workflow-agent.yml)

```bash
ossa validate examples/spec-examples/workflow-agent.yml
```

## Usage

```bash
# Validate any example
ossa validate examples/<path>

# Run an example
ossa run examples/<path>
```
