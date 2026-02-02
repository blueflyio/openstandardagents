# A2A (Agent-to-Agent) Communication Extension

**Version**: 0.3.5
**Status**: Stable
**Protocol**: Production-Ready A2A

## Overview

The A2A extension enables production-ready agent-to-agent communication with service discovery, message routing, task delegation, completion signals, and checkpoint synchronization.

## Features

- **Service Discovery**: DNS, Consul, Kubernetes, Registry-based discovery
- **Message Routing**: Direct, broadcast, round-robin, capability-based routing
- **Task Delegation**: Multi-level delegation with handoff support
- **Completion Signals**: Standardized task completion signaling
- **Checkpoint Sync**: Distributed checkpoint synchronization
- **Authentication**: mTLS, OAuth2, API Key, JWT support
- **Resilience**: Retry policies, circuit breakers, health checks
- **Observability**: Distributed tracing, metrics, logging

## Schema Reference

### Basic A2A Configuration

```yaml
extensions:
  a2a:
    enabled: true
    protocol:
      type: json-rpc
      version: "2.0"
      messageFormat: json
      timeout: 30
    endpoints:
      - agentId: "@security-scanner"
        url: "http://security-scanner:8080/a2a"
        capabilities: ["security-scan", "vulnerability-check"]
        priority: 10
```

### Service Discovery

```yaml
extensions:
  a2a:
    discovery:
      enabled: true
      mechanism: registry
      registryUrl: "https://registry.example.com/agents"
      refreshInterval: 60
      healthCheck:
        enabled: true
        interval: 30
        timeout: 5
        endpoint: "/health"
```

### Routing Configuration

```yaml
extensions:
  a2a:
    routing:
      strategy: capability-based
      defaultAgent: "@fallback-agent"
      routingRules:
        - name: "security-routing"
          condition: "message.type == 'security-scan'"
          target: "@security-scanner"
          priority: 10
        - name: "code-review-routing"
          condition: "message.type == 'code-review'"
          target: "@mr-reviewer"
          priority: 5
```

### Task Delegation

```yaml
extensions:
  a2a:
    delegation:
      enabled: true
      maxDepth: 3
      timeout: 300
      handoff:
        enabled: true
        preserveContext: true
        handoffRules:
          - name: "escalation"
            condition: "signal == 'escalate'"
            target: "@senior-reviewer"
            message: "Escalating to senior reviewer"
```

### Completion Signals

```yaml
extensions:
  a2a:
    completionSignals:
      enabled: true
      signals: ["continue", "complete", "blocked", "escalate", "checkpoint"]
      handlers:
        - signal: escalate
          action: handoff
          target: "@senior-agent"
        - signal: checkpoint
          action: checkpoint
          config:
            storage: agent-brain
```

### Authentication

```yaml
extensions:
  a2a:
    authentication:
      type: mtls
      mtls:
        certPath: "/certs/client.crt"
        keyPath: "/certs/client.key"
        caPath: "/certs/ca.crt"
        verifyPeer: true
```

## Use Cases

### 1. Multi-Agent Code Review System

```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: mr-coordinator
spec:
  extensions:
    a2a:
      enabled: true
      protocol:
        type: json-rpc
        version: "2.0"
      endpoints:
        - agentId: "@security-scanner"
          url: "http://security-scanner:8080/a2a"
          capabilities: ["security-scan"]
        - agentId: "@performance-analyzer"
          url: "http://performance-analyzer:8080/a2a"
          capabilities: ["performance-analysis"]
      routing:
        strategy: capability-based
      delegation:
        enabled: true
        maxDepth: 2
```

### 2. Service Discovery with Kubernetes

```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: distributed-agent
spec:
  extensions:
    a2a:
      enabled: true
      discovery:
        enabled: true
        mechanism: kubernetes
        refreshInterval: 60
      protocol:
        type: grpc
        version: "1.0"
```

## Best Practices

1. **Service Discovery**: Use registry or Kubernetes for dynamic environments
2. **Authentication**: Always use mTLS or OAuth2 in production
3. **Circuit Breakers**: Enable to prevent cascading failures
4. **Health Checks**: Configure for automatic unhealthy agent removal
5. **Delegation Depth**: Keep maxDepth <= 3 to avoid deep chains
6. **Timeouts**: Set appropriate timeouts for agent response times
7. **Observability**: Enable tracing for debugging distributed workflows

## References

- [OSSA v0.3.5 Specification](../../README.md)
- [MCP Extension](../mcp/README.md)
- [Kagent Extension](../kagent/README.md)
