# AIFlow Framework Integration with OSSA

## Overview

AIFlow is a Python-based social agent framework that enables personality-driven, emotionally intelligent AI agents for autonomous social media content generation. This integration demonstrates how AIFlow agents are wrapped in OSSA 1.0 manifests for Kubernetes orchestration and deployment through agent-buildkit.

For complete integration analysis, see: [agent-buildkit AIFlow Integration Guide](https://github.com/blueflyio/openstandardagents/wiki/AIFlow-Integration-with-OSSA-BuildKit-and-K-Agent)

## Core Components

### OSSA Manifest

**Location**: [agent-buildkit/examples/aiflow-integration/social-agent-aiflow.ossa.yaml](https://github.com/blueflyio/openstandardagents/blob/development/examples/aiflow-integration/social-agent-aiflow.ossa.yaml)

The manifest defines the agent's identity, runtime configuration, capabilities, and deployment requirements. It conforms to OSSA 1.0 specification.

**Key Manifest Sections**:

- **Agent Identity**: `social-agent-aiflow`, version 1.0.0, role: chat
- **Runtime**: Docker image `aiflow/agent:1.0.0`, Python 3.12+, resource requirements
- **Capabilities**: `generate_post`, `generate_response` with defined schemas
- **Dependencies**: Required integration with `agent-brain` for cognitive functions
- **Environment**: Required secrets for Anthropic API, Twitter API, Telegram Bot, PostgreSQL

### OpenAPI Specification

**Location**: [agent-buildkit/openapi/aiflow-agent.openapi.yml](https://github.com/blueflyio/openstandardagents/blob/development/openapi/aiflow-agent.openapi.yml)

The OpenAPI 3.1 specification defines the REST API interface for the AIFlow agent, including:
- FastAPI bridge endpoints for AIFlow Sia runtime
- Request/response schemas for all capabilities
- Kubernetes metadata extensions (x-k-agent) for orchestration
- Health check endpoints and observability metrics

### OSSA Schema

**Location**: [OSSA/spec/v1.0/ossa-1.0.schema.json](https://github.com/blueflyio/openstandardagents/blob/development/spec/v1.0/ossa-1.0.schema.json)

JSON Schema definition for OSSA 1.0 manifest validation. All agent manifests must conform to this schema.

## Validation

### OSSA Manifest Validation

Validate the manifest against OSSA 1.0 schema:

```yaml
ossa validate examples/aiflow-integration/social-agent-aiflow.ossa.yaml
```

This checks:
- Schema compliance against OSSA 1.0 specification
- Required fields and type correctness
- Capability schema definitions
- Dependency declarations
- Environment variable definitions

### OpenAPI Specification Validation

Validate OpenAPI spec with strict mode and K-Agent metadata checks:

```yaml
buildkit openapi validate --spec openapi/aiflow-agent.openapi.yml --strict
```

This validates:
- OpenAPI 3.1 syntax and semantics
- x-k-agent extension metadata for Kubernetes
- Endpoint schemas match OSSA capability definitions
- Health check endpoint compliance

## Deployment

Deploy via agent-buildkit orchestration:

```yaml
buildkit orchestrate deploy --manifest examples/aiflow-integration/social-agent-aiflow.ossa.yaml
```

This generates Kubernetes manifests and deploys the agent with:
- Rolling deployment strategy
- Horizontal Pod Autoscaling (HPA)
- Health checks and readiness probes
- Service account and RBAC configuration
- ConfigMap for character definitions
- Persistent volume for memory database

## Integration Architecture

1. **OSSA Manifest** → Defines agent structure and requirements
2. **OpenAPI Spec** → REST API contract with K8s metadata
3. **FastAPI Bridge** → Wraps AIFlow Sia runtime in REST API
4. **BuildKit Deployment** → Generates and applies K8s manifests
5. **Runtime Orchestration** → Kubernetes manages agent lifecycle

## Resources

- **AIFlow Repository**: https://github.com/AIFlow-agent/AIFlow-Agent
- **OSSA Project**: [openapi-ai-agents-standard](https://github.com/blueflyio/openstandardagents)
- **Integration Guide**: [agent-buildkit Wiki](https://github.com/blueflyio/openstandardagents/wiki/AIFlow-Integration-with-OSSA-BuildKit-and-K-Agent)
- **OSSA Specification Schema**: [OSSA 1.0 Schema](https://github.com/blueflyio/openstandardagents/blob/development/spec/v1.0/ossa-1.0.schema.json)
- **Example Manifest**: [social-agent-aiflow.ossa.yaml](https://github.com/blueflyio/openstandardagents/blob/development/examples/aiflow-integration/social-agent-aiflow.ossa.yaml)
- **OpenAPI Spec**: [aiflow-agent.openapi.yml](https://github.com/blueflyio/openstandardagents/blob/development/openapi/aiflow-agent.openapi.yml)

