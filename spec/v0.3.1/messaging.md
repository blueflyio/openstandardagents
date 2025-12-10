# OSSA v0.3.1 Agent-to-Agent Messaging Specification

**Version**: 0.3.1
**Status**: Draft
**Last Updated**: 2025-12-10

## Overview

The Agent-to-Agent Messaging Extension enables standardized communication between OSSA agents across different frameworks (LangChain, CrewAI, Langflow, GitLab Agents, KAgent). This specification defines how agents declare their messaging capabilities, subscribe to events, accept commands, and route messages.

## Design Principles

1. **Declarative, not prescriptive**: The spec defines contracts, not implementations
2. **Framework-agnostic**: Works with any message broker (Kafka, RabbitMQ, Redis, NATS)
3. **Backward compatible**: v0.3.0 agents work without messaging
4. **Composable**: Agents declare capabilities, runtimes wire them together
5. **Observable**: Messaging is first-class in observability (tracing, metrics)
6. **Secure**: Built-in support for auth, encryption, and audit trails

## Core Concepts

### 1. Message Channels

Channels are named communication pathways. Agents publish messages to channels and subscribe to receive messages from channels.

**Channel Naming Convention**:
```
<domain>.<subdomain>.<event_type>
```

Examples:
- `security.vulnerabilities.found`
- `dependency.updates.available`
- `incident.response.triggered`
- `compliance.audit.completed`
- `monitoring.alert.fired`

Rules:
- Lowercase letters and numbers only
- Dot-separated hierarchical structure
- Wildcards (`*`) supported in subscriptions only

### 2. Publishing

Agents declare channels they publish to with schema definitions:

```yaml
spec:
  messaging:
    publishes:
      - channel: security.vulnerabilities
        description: Vulnerability findings from scans
        schema:
          type: object
          properties:
            vulnerability_id: { type: string }
            severity: { enum: [low, medium, high, critical] }
            cve_id: { type: string }
            affected_package: { type: string }
            remediation: { type: string }
          required: [vulnerability_id, severity]
        examples:
          - vulnerability_id: "vuln-123"
            severity: "critical"
            cve_id: "CVE-2024-1234"
            affected_package: "lodash@4.17.20"
            remediation: "Update to lodash@4.17.21"
```

### 3. Subscriptions

Agents declare channels they listen to:

```yaml
spec:
  messaging:
    subscribes:
      - channel: dependency.updates
        description: Dependency update notifications
        handler: process_dependency_update
        filter:
          fields:
            severity: [high, critical]
        priority: high
        maxConcurrency: 5
```

Subscription features:
- **Wildcards**: `security.*` matches `security.vulnerabilities`, `security.alerts`, etc.
- **Filtering**: Filter messages by field values or expressions
- **Priority**: Control processing order
- **Concurrency**: Limit parallel message processing

### 4. Commands (RPC)

Commands provide request-response patterns between agents:

```yaml
spec:
  messaging:
    commands:
      - name: scan_package
        description: Scan a specific package for vulnerabilities
        inputSchema:
          type: object
          properties:
            package_name: { type: string }
            version: { type: string }
          required: [package_name]
        outputSchema:
          type: object
          properties:
            vulnerabilities: { type: array }
            scan_status: { enum: [success, failed] }
        timeoutSeconds: 60
        idempotent: true
```

### 5. Message Envelope

All messages use a standard envelope format:

```json
{
  "id": "msg-uuid-123",
  "timestamp": "2025-12-10T15:30:00Z",
  "source": "security-scanner",
  "channel": "security.vulnerabilities",
  "payload": {
    "vulnerability_id": "vuln-123",
    "severity": "critical",
    "cve_id": "CVE-2024-1234",
    "affected_package": "lodash@4.17.20",
    "remediation": "Update to lodash@4.17.21"
  },
  "metadata": {
    "correlationId": "corr-456",
    "traceId": "trace-789",
    "spanId": "span-abc",
    "priority": "high",
    "ttlSeconds": 3600,
    "retryCount": 0,
    "contentType": "application/json",
    "headers": {
      "x-custom-header": "value"
    }
  }
}
```

### 6. Message Routing

The `MessageRouting` kind defines how messages flow between agents:

```yaml
apiVersion: ossa/v0.3.1
kind: MessageRouting
metadata:
  name: security-workflow
spec:
  rules:
    - source: dependency-healer
      channel: security.vulnerabilities
      targets:
        - security-scanner
        - monitoring-agent
      filter:
        fields:
          severity: [high, critical]
      priority: high

    - source: security-scanner
      channel: incident.response.triggered
      targets:
        - incident-responder
        - compliance-auditor
      priority: critical

  defaultRoute:
    action: dlq

  transforms:
    extract_critical:
      type: jmespath
      expression: "{id: vulnerability_id, severity: severity, package: affected_package}"
```

### 7. Reliability Configuration

Configure message delivery guarantees:

```yaml
spec:
  messaging:
    reliability:
      deliveryGuarantee: at-least-once

      retry:
        maxAttempts: 3
        backoff:
          strategy: exponential
          initialDelayMs: 1000
          maxDelayMs: 30000
          multiplier: 2

      dlq:
        enabled: true
        channel: messaging.dlq
        retentionDays: 30

      ordering:
        guarantee: per-source
        timeoutSeconds: 300

      acknowledgment:
        mode: manual
        timeoutSeconds: 60
```

**Delivery Guarantees**:
- `at-most-once`: Fire and forget (may lose messages)
- `at-least-once`: Retry until acknowledged (may duplicate)
- `exactly-once`: Transactional delivery (requires broker support)

## Schema Definitions

### MessagingExtension

```json
{
  "MessagingExtension": {
    "type": "object",
    "description": "Agent-to-agent messaging configuration",
    "properties": {
      "publishes": {
        "type": "array",
        "items": { "$ref": "#/definitions/PublishedChannel" }
      },
      "subscribes": {
        "type": "array",
        "items": { "$ref": "#/definitions/Subscription" }
      },
      "commands": {
        "type": "array",
        "items": { "$ref": "#/definitions/Command" }
      },
      "reliability": {
        "$ref": "#/definitions/ReliabilityConfig"
      }
    }
  }
}
```

### PublishedChannel

```json
{
  "PublishedChannel": {
    "type": "object",
    "required": ["channel", "schema"],
    "properties": {
      "channel": {
        "type": "string",
        "pattern": "^[a-z0-9]+(?:\\.[a-z0-9]+)*$"
      },
      "description": { "type": "string" },
      "schema": { "$ref": "#/definitions/JSONSchemaDefinition" },
      "examples": {
        "type": "array",
        "items": { "type": "object" }
      },
      "contentType": {
        "type": "string",
        "default": "application/json"
      },
      "tags": {
        "type": "array",
        "items": { "type": "string" }
      }
    }
  }
}
```

### Subscription

```json
{
  "Subscription": {
    "type": "object",
    "required": ["channel"],
    "properties": {
      "channel": {
        "type": "string",
        "pattern": "^[a-z0-9]+(?:\\.[a-z0-9*]+)*$"
      },
      "description": { "type": "string" },
      "schema": { "$ref": "#/definitions/JSONSchemaDefinition" },
      "handler": { "type": "string" },
      "filter": {
        "type": "object",
        "properties": {
          "expression": { "type": "string" },
          "fields": { "type": "object" }
        }
      },
      "priority": {
        "enum": ["low", "normal", "high", "critical"],
        "default": "normal"
      },
      "maxConcurrency": {
        "type": "integer",
        "minimum": 1,
        "default": 1
      }
    }
  }
}
```

### Command

```json
{
  "Command": {
    "type": "object",
    "required": ["name", "inputSchema"],
    "properties": {
      "name": {
        "type": "string",
        "pattern": "^[a-z][a-z0-9_]*$"
      },
      "description": { "type": "string" },
      "inputSchema": { "$ref": "#/definitions/JSONSchemaDefinition" },
      "outputSchema": { "$ref": "#/definitions/JSONSchemaDefinition" },
      "timeoutSeconds": {
        "type": "integer",
        "minimum": 1,
        "maximum": 3600,
        "default": 30
      },
      "idempotent": {
        "type": "boolean",
        "default": false
      },
      "async": {
        "type": "boolean",
        "default": false
      }
    }
  }
}
```

### RoutingRule

```json
{
  "RoutingRule": {
    "type": "object",
    "required": ["source", "channel", "targets"],
    "properties": {
      "id": { "type": "string" },
      "source": { "type": "string" },
      "channel": { "type": "string" },
      "targets": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 1
      },
      "filter": {
        "type": "object",
        "properties": {
          "expression": { "type": "string" },
          "fields": { "type": "object" }
        }
      },
      "transform": { "type": "string" },
      "priority": {
        "enum": ["low", "normal", "high", "critical"],
        "default": "normal"
      },
      "enabled": {
        "type": "boolean",
        "default": true
      }
    }
  }
}
```

## Validation Rules

### Channel Names
- Must match pattern: `^[a-z0-9]+(?:\.[a-z0-9]+)*$`
- Maximum length: 255 characters
- Reserved prefixes: `ossa.`, `system.`, `internal.`

### Message IDs
- Must be UUID v4 format
- Must be unique per source agent

### Schema Validation
- All published messages must validate against declared schema
- Subscriptions with schema must validate incoming messages
- Command inputs/outputs must validate against declared schemas

### Routing Validation
- No circular routes allowed
- All targets must be valid agent names
- Filters must be valid expressions or field mappings

## Observability

### Tracing
Messages carry W3C Trace Context headers:
- `traceId`: Distributed trace identifier
- `spanId`: Current span identifier
- `baggage`: Cross-service context propagation

### Metrics
Standard metrics for messaging:
- `ossa_messages_published_total{agent, channel}`
- `ossa_messages_received_total{agent, channel}`
- `ossa_messages_failed_total{agent, channel, error_type}`
- `ossa_message_latency_seconds{agent, channel}`
- `ossa_dlq_messages_total{agent, channel}`

### Logging
Structured log format for message events:
```json
{
  "level": "info",
  "event": "message_published",
  "agent": "security-scanner",
  "channel": "security.vulnerabilities",
  "message_id": "msg-uuid-123",
  "trace_id": "trace-789",
  "timestamp": "2025-12-10T15:30:00Z"
}
```

## Security Considerations

### Authentication
- Agents must authenticate before publishing/subscribing
- Use service accounts or mTLS for agent identity

### Authorization
- Agents can only publish to declared channels
- Subscriptions require permission grants
- Commands require explicit authorization

### Encryption
- Messages should be encrypted in transit (TLS)
- Sensitive payloads can use field-level encryption
- DLQ messages retain encryption

### Audit Trail
- All message operations are logged
- Routing decisions are traceable
- Failed deliveries include full context

## Migration Guide

### From v0.3.0 to v0.3.1

1. **No breaking changes**: v0.3.0 manifests work without modification
2. **Add messaging**: Optionally add `messaging` section to agents
3. **Add routing**: Create `MessageRouting` resources for multi-agent systems
4. **Update CLI**: Use `ossa validate --check-messaging` for validation

### Example Migration

**Before (v0.3.0)**:
```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: security-scanner
spec:
  role: Scan for security vulnerabilities
```

**After (v0.3.1)**:
```yaml
apiVersion: ossa/v0.3.1
kind: Agent
metadata:
  name: security-scanner
spec:
  role: Scan for security vulnerabilities
  messaging:
    publishes:
      - channel: security.vulnerabilities
        schema:
          type: object
          properties:
            severity: { enum: [low, medium, high, critical] }
    commands:
      - name: scan_package
        inputSchema:
          type: object
          properties:
            package: { type: string }
```

## References

- [OpenAPI Specification](https://spec.openapis.org/)
- [AsyncAPI Specification](https://www.asyncapi.com/)
- [CloudEvents](https://cloudevents.io/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [W3C Baggage](https://www.w3.org/TR/baggage/)
