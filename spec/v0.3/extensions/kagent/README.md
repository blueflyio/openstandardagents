# Kagent Extension for OSSA v0.3.5

## Overview

The **Kagent extension** provides native integration with **GitLab's Kagent framework** (Kubernetes Agents) for Kubernetes-native agent deployment, management, and orchestration. This extension is **CRITICAL for GitLab adoption** and enables:

- **Kubernetes-Native Deployment**: Deploy agents as Kubernetes resources with full K8s lifecycle management
- **GitLab CI/CD Integration**: Seamless integration with GitLab pipelines and agent registry
- **Service Mesh Integration**: Istio, Linkerd, and Ambient Mesh support
- **Agent-to-Agent Communication**: Secure A2A protocols for multi-agent orchestration
- **Enterprise Guardrails**: Cost limits, compliance, audit logging, and security controls

## Why Kagent is Critical

**Kagent is GitLab's Kubernetes-native agent framework**. For OSSA to be adopted by GitLab and the broader GitLab ecosystem, native Kagent support is **ESSENTIAL**.

### Business Value

- ✅ **GitLab Ecosystem Integration**: Native support for GitLab's agent platform
- ✅ **Kubernetes-Native**: Deploy agents using standard K8s tooling (kubectl, Helm, GitOps)
- ✅ **Enterprise-Ready**: Built-in compliance, security, and audit logging
- ✅ **Service Mesh Ready**: Works with Istio, Linkerd, and Ambient Mesh
- ✅ **GitLab CI/CD**: Seamless integration with GitLab pipelines

## Schema Structure

```yaml
extensions:
  kagent:
    kubernetes:
      namespace: production
      labels:
        app: my-agent
        team: platform
      resourceLimits:
        cpu: 1000m
        memory: 2Gi
    guardrails:
      requireApproval: false
      costLimits:
        maxTokensPerDay: 150000
        maxCostPerDay: 35.0
      allowedActions:
        - kubernetes:get:pods
        - kubernetes:get:logs
      auditLog:
        destination: compliance-engine
        retention: 10years
    a2aConfig:
      enabled: true
      protocol: json-rpc
      endpoints:
        - http://other-agent:8080/a2a
      authentication:
        type: mtls
    meshIntegration:
      enabled: true
      istioIntegration: true
      ambientMesh: true
    gitlabIntegration:
      agentId: agent-123
      projectId: 456
      ciCdIntegration: true
      registryIntegration: true
    monitoring:
      enabled: true
      metrics:
        prometheus: true
        endpoint: /metrics
      tracing:
        provider: opentelemetry
        samplingRate: 0.1
```

## Key Features

### 1. Kubernetes Configuration

Full Kubernetes deployment configuration:

- **Namespace**: Target K8s namespace
- **Labels & Annotations**: K8s metadata
- **Resource Limits**: CPU, memory, ephemeral storage
- **Service Account**: K8s RBAC
- **Node Selectors**: Pod placement
- **Tolerations**: Taint handling
- **Affinity**: Pod/node affinity rules
- **Security Context**: Pod security policies

### 2. Guardrails

Enterprise safety and compliance controls:

- **Approval Requirements**: Human-in-the-loop controls
- **Cost Limits**: Token and cost budgets
- **Allowed/Blocked Actions**: Action whitelist/blacklist
- **Audit Logging**: Compliance evidence collection
- **Compliance Frameworks**: SOC2, HIPAA, FedRAMP, NIST support

### 3. Agent-to-Agent (A2A) Communication

Secure inter-agent communication:

- **Protocols**: JSON-RPC, gRPC, HTTP, WebSocket, NATS
- **Endpoints**: Multi-agent orchestration
- **Authentication**: mTLS, OAuth2, API keys, JWT
- **Retry Policies**: Resilient communication

### 4. Service Mesh Integration

Native service mesh support:

- **Istio**: Full Istio integration
- **Linkerd**: Linkerd service mesh
- **Ambient Mesh**: Sidecarless Istio Ambient Mesh
- **Traffic Policies**: Load balancing, circuit breakers, timeouts

### 5. GitLab Integration

GitLab-specific features:

- **Agent Registry**: GitLab agent registry integration
- **CI/CD Integration**: GitLab pipeline integration
- **Webhooks**: GitLab webhook support
- **Project/Group IDs**: GitLab project/group association

### 6. Monitoring & Observability

Production-ready monitoring:

- **Prometheus Metrics**: Standard K8s metrics
- **Distributed Tracing**: OpenTelemetry, Jaeger, Zipkin
- **Structured Logging**: JSON logs with configurable levels

## Usage Examples

### Basic Kagent Agent

```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: k8s-troubleshooter
spec:
  # ... standard OSSA spec ...
  extensions:
    kagent:
      kubernetes:
        namespace: production
        labels:
          app: k8s-troubleshooter
        resourceLimits:
          cpu: 500m
          memory: 512Mi
      guardrails:
        requireApproval: true
        costLimits:
          maxTokensPerDay: 50000
```

### Enterprise Compliance Agent

```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: compliance-validator
spec:
  # ... standard OSSA spec ...
  extensions:
    kagent:
      kubernetes:
        namespace: compliance
        labels:
          app: compliance-validator
          team: compliance
        annotations:
          compliance.level: critical
        resourceLimits:
          cpu: 1000m
          memory: 2Gi
      guardrails:
        requireApproval: false
        costLimits:
          maxTokensPerDay: 150000
          maxCostPerDay: 35.0
        allowedActions:
          - validate_all_namespaces
          - block_deployments
        auditLog:
          destination: compliance-engine
          retention: 10years
        compliance:
          frameworks:
            - SOC2
            - HIPAA
            - FedRAMP
            - NIST
          evidenceCollection: true
      a2aConfig:
        enabled: true
        protocol: json-rpc
        endpoints:
          - http://security-scanner:8080/a2a
          - http://documentation-agent:8080/a2a
        authentication:
          type: mtls
      meshIntegration:
        enabled: true
        istioIntegration: true
        ambientMesh: true
      gitlabIntegration:
        ciCdIntegration: true
        registryIntegration: true
```

## Migration from Kagent Native Format

### Kagent CRD → OSSA

```bash
# Convert Kagent CRD to OSSA
ossa kagent convert kagent-crd.yaml -o ossa-manifest.yaml

# Validate converted OSSA manifest
ossa validate ossa-manifest.yaml
```

### OSSA → Kagent CRD

```bash
# Generate Kagent CRD from OSSA
ossa kagent generate ossa-manifest.yaml -o kagent-crd.yaml

# Apply to Kubernetes
kubectl apply -f kagent-crd.yaml
```

## Validation

```bash
# Validate Kagent extension
ossa validate --extension kagent agent.yaml

# Validate Kagent-specific features
ossa kagent validate agent.yaml
```

## CLI Commands

```bash
# Convert Kagent CRD to OSSA
ossa kagent convert <kagent-crd> -o <ossa-manifest>

# Generate Kagent CRD from OSSA
ossa kagent generate <ossa-manifest> -o <kagent-crd>

# Validate Kagent extension
ossa kagent validate <manifest>

# Deploy to Kubernetes (via Kagent)
ossa kagent deploy <manifest> --namespace <ns>
```

## Integration with GitLab

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
deploy-agent:
  stage: deploy
  script:
    - ossa kagent generate agent.yaml -o kagent-crd.yaml
    - kubectl apply -f kagent-crd.yaml
  only:
    - main
```

### GitLab Agent Registry

```bash
# Publish agent to GitLab registry
ossa kagent publish agent.yaml --project-id 123

# List agents in GitLab registry
ossa kagent list --project-id 123
```

## Best Practices

1. **Always specify namespace**: Don't rely on default namespace
2. **Set resource limits**: Prevent resource exhaustion
3. **Enable guardrails**: Cost limits and approval requirements
4. **Configure audit logging**: Compliance evidence collection
5. **Use service mesh**: Istio/Ambient Mesh for production
6. **Enable monitoring**: Prometheus metrics and tracing
7. **Secure A2A**: Use mTLS for agent-to-agent communication

## References

- **Kagent Documentation**: https://docs.gitlab.com/ee/user/clusters/agent/
- **Kubernetes Agents**: https://docs.gitlab.com/ee/user/clusters/agent/
- **OSSA Specification**: https://openstandardagents.org
- **Schema**: `spec/v0.3/extensions/kagent/kagent.schema.json`

## Support

- **GitLab Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- **GitHub Discussions**: https://github.com/blueflyio/openstandardagents/discussions
- **Discord**: [OSSA Community](https://discord.gg/openstandardagents)

---

**Kagent support is CRITICAL for GitLab adoption. This extension makes OSSA the standard for GitLab's Kubernetes-native agent platform.**
