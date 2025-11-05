# Agent Migration Audit to OSSA v0.2.2

## Summary

- **Total agent files found**: 70 `.ossa.yaml` files
- **Current formats**:
  - v1.0 format (ossaVersion: '1.0' with agent: {}) - Most common
  - v0.1.8/0.1.9 format - Mixed
  - Custom formats - Some Drupal agents
- **Target format**: OSSA v0.2.2 (apiVersion: ossa/v1, kind: Agent, metadata, spec)

## Key Agent Files by Repository

### agent-buildkit

- `.agents/social-agent-aiflow.ossa.yaml` - v1.0
- `agents/review-agents/*.ossa.yaml` - v1.0 (7 files)
- `agents/executive-agents/master-architect.ossa.yaml` - v1.0
- `examples/aiflow-integration/social-agent-aiflow.ossa.yaml` - v1.0

### agent-protocol

- `.agents/agent-protocol.ossa.yaml` - v1.0
- `ossa-agents/agent-brain.yml` - v1.0

### common_npm packages

- agent-brain - v1.0
- agent-chat - v1.0
- agent-docker - v1.0
- agent-mesh - v1.0 (multiple agents)
- agent-protocol - v1.0
- agent-router - v1.0
- agent-tracer - v1.0
- workflow-engine - v1.0
- agentic-flows - v1.0
- compliance-engine - v1.0
- doc-engine - v1.0
- foundation-bridge - Custom v0.1.3
- rfp-automation - v1.0
- studio-ui - v1.0

### models

- civicpolicy_model - Mixed
- gov-rfp_model - Mixed

## Migration Priority

### Phase 1: Core agents

1. agent-protocol (MCP integration)
2. agent-brain (memory/intelligence)
3. agent-router (gateway)
4. agent-chat (conversation)

### Phase 2: Orchestration agents

5. workflow-engine
6. agentic-flows
7. agent-mesh

### Phase 3: transformations

8. agent-buildkit examples
9. Models
10. Drupal integration agents

## Framework Integration Requirements

### Buildkit

- Runtime deployment
- Health checks
- Resource limits

### kagent

- Kubernetes-native configuration
- Service discovery
- Pod scheduling

### librachat

- MCP tool exposure
- Action definitions
- Tool schemas

### Drupal

- Module integration
- Entity mapping
- Field configurations
