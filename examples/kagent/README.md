# kAgent Examples

This directory contains example OSSA manifests with kAgent (Kubernetes Agent) extensions for Kubernetes-native deployment.

## Available Examples

### Infrastructure Management
- **k8s-troubleshooter.ossa.yaml** - Kubernetes troubleshooting agent with diagnostic capabilities
- **cost-optimizer.ossa.yaml** - Cost optimization agent for cloud resources

### Security & Compliance
- **security-scanner.ossa.yaml** - Security vulnerability scanning agent
- **compliance-validator.ossa.yaml** - Continuous compliance validation agent

### Documentation
- **documentation-agent.ossa.yaml** - Automated documentation generation agent

## Usage

These manifests demonstrate:
- Kubernetes-native deployment configurations
- Service mesh integration (Istio/Cilium)
- A2A (Agent-to-Agent) protocol configuration
- Guardrails and governance policies
- Resource requirements and scaling

## Validation

Validate any example with:

```bash
ossa validate examples/kagent/<agent-name>.ossa.yaml
```

## More Information

See the [OSSA GitLab Wiki](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis/home) for full documentation.
