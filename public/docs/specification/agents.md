# OSSA Agent Reference Implementation

Reference implementations and examples for OSSA 1.0 compliant agents.

---

## Overview

This document provides reference implementations for all supported agent roles in the OSSA 1.0 specification. These examples demonstrate proper structure, required fields, and best practices for building OSSA-compliant agents.

---

## Agent Roles

OSSA 1.0 defines ten standardized agent roles:

1. **Compliance** - Regulatory and standards validation
2. **Chat** - Conversational interaction
3. **Orchestration** - Multi-agent workflow coordination
4. **Audit** - Security and compliance auditing
5. **Workflow** - Business process automation
6. **Monitoring** - System observation and metrics
7. **Data Processing** - ETL and analytics
8. **Integration** - External system connectivity
9. **Development** - Developer tools and code assistance
10. **Custom** - Domain-specific functionality

---

## Reference Implementation: Compliance Agent

```yaml
ossaVersion: "1.0"
agent:
  id: compliance-scanner
  name: FedRAMP Compliance Scanner
  version: 1.0.0
  description: Automated FedRAMP compliance validation and reporting
  role: compliance

  runtime:
    type: docker
    image: ossa/compliance-scanner:1.0.0
    resources:
      limits:
        cpu: "2"
        memory: "4Gi"
      requests:
        cpu: "1"
        memory: "2Gi"

  capabilities:
    - name: scan_fedramp
      description: Scan system configuration against FedRAMP controls
      inputs:
        type: object
        required: ["system_config"]
        properties:
          system_config:
            type: object
            description: System configuration to analyze
          baseline:
            type: string
            enum: ["low", "moderate", "high"]
            default: "moderate"
      outputs:
        type: object
        required: ["compliant", "findings", "score"]
        properties:
          compliant:
            type: boolean
          findings:
            type: array
            items:
              type: object
              properties:
                control_id:
                  type: string
                severity:
                  type: string
                  enum: ["critical", "high", "medium", "low"]
                description:
                  type: string
                remediation:
                  type: string
          score:
            type: number
            minimum: 0
            maximum: 100

  security:
    authentication: oauth2
    authorization: rbac
    compliance:
      - fedramp
      - fisma
      - nist-800-53

  monitoring:
    healthCheck:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    metrics:
      enabled: true
      port: 9090
      path: /metrics
```

---

## Reference Implementation: Chat Agent

```yaml
ossaVersion: "1.0"
agent:
  id: support-chatbot
  name: Customer Support Chatbot
  version: 1.0.0
  description: AI-powered customer support chatbot with context awareness
  role: chat

  runtime:
    type: k8s
    image: ossa/support-chatbot:1.0.0
    replicas: 3
    resources:
      limits:
        cpu: "1"
        memory: "2Gi"
      requests:
        cpu: "500m"
        memory: "1Gi"

  capabilities:
    - name: chat
      description: Process chat messages and generate responses
      inputs:
        type: object
        required: ["message"]
        properties:
          message:
            type: string
            description: User message
          context:
            type: object
            description: Conversation context
          user_id:
            type: string
            description: User identifier
      outputs:
        type: object
        required: ["response"]
        properties:
          response:
            type: string
            description: Bot response
          intent:
            type: string
            description: Detected intent
          confidence:
            type: number
            minimum: 0
            maximum: 1
          actions:
            type: array
            items:
              type: string

    - name: escalate
      description: Escalate conversation to human agent
      inputs:
        type: object
        required: ["conversation_id", "reason"]
        properties:
          conversation_id:
            type: string
          reason:
            type: string
      outputs:
        type: object
        properties:
          ticket_id:
            type: string
          estimated_wait_time:
            type: integer

  security:
    authentication: jwt
    authorization: rbac
    compliance:
      - gdpr
      - ccpa

  monitoring:
    healthCheck:
      httpGet:
        path: /health
        port: 8080
    metrics:
      enabled: true
      port: 9090
```

---

## Reference Implementation: Orchestration Agent

```yaml
ossaVersion: "1.0"
agent:
  id: workflow-orchestrator
  name: Multi-Agent Workflow Orchestrator
  version: 1.0.0
  description: Coordinate complex multi-agent workflows with dynamic routing
  role: orchestration

  runtime:
    type: k8s
    image: ossa/orchestrator:1.0.0
    replicas: 2
    resources:
      limits:
        cpu: "4"
        memory: "8Gi"
      requests:
        cpu: "2"
        memory: "4Gi"

  capabilities:
    - name: orchestrate_workflow
      description: Execute multi-step workflow across multiple agents
      inputs:
        type: object
        required: ["workflow_definition"]
        properties:
          workflow_definition:
            type: object
            description: Workflow DAG definition
          parameters:
            type: object
            description: Workflow input parameters
          priority:
            type: string
            enum: ["low", "normal", "high", "critical"]
            default: "normal"
      outputs:
        type: object
        required: ["workflow_id", "status"]
        properties:
          workflow_id:
            type: string
          status:
            type: string
            enum: ["pending", "running", "completed", "failed"]
          steps_completed:
            type: integer
          steps_total:
            type: integer
          results:
            type: object

    - name: get_workflow_status
      description: Query workflow execution status
      inputs:
        type: object
        required: ["workflow_id"]
        properties:
          workflow_id:
            type: string
      outputs:
        type: object
        properties:
          status:
            type: string
          progress:
            type: number
          current_step:
            type: string
          error:
            type: string

  security:
    authentication: mtls
    authorization: rbac
    compliance:
      - iso-27001
      - soc-2

  monitoring:
    healthCheck:
      httpGet:
        path: /health
        port: 8080
    metrics:
      enabled: true
      port: 9090
```

---

## Reference Implementation: Data Processing Agent

```yaml
ossaVersion: "1.0"
agent:
  id: etl-processor
  name: ETL Data Processing Agent
  version: 1.0.0
  description: Extract, transform, and load data with schema validation
  role: data_processing

  runtime:
    type: k8s
    image: ossa/etl-processor:1.0.0
    replicas: 5
    resources:
      limits:
        cpu: "4"
        memory: "16Gi"
      requests:
        cpu: "2"
        memory: "8Gi"

  capabilities:
    - name: process_batch
      description: Process batch data transformation
      inputs:
        type: object
        required: ["source", "transformation", "destination"]
        properties:
          source:
            type: object
            properties:
              type:
                type: string
                enum: ["s3", "database", "api", "file"]
              location:
                type: string
              credentials:
                type: object
          transformation:
            type: object
            description: Transformation rules
          destination:
            type: object
            properties:
              type:
                type: string
              location:
                type: string
      outputs:
        type: object
        properties:
          job_id:
            type: string
          records_processed:
            type: integer
          duration_ms:
            type: integer
          errors:
            type: array

  storage:
    - name: temp-storage
      size: "100Gi"
      mountPath: /data
      accessMode: ReadWriteMany

  security:
    authentication: apikey
    authorization: abac
    compliance:
      - gdpr
      - hipaa

  monitoring:
    healthCheck:
      httpGet:
        path: /health
        port: 8080
    metrics:
      enabled: true
      port: 9090
```

---

## Reference Implementation: Monitoring Agent

```yaml
ossaVersion: "1.0"
agent:
  id: system-monitor
  name: System Performance Monitor
  version: 1.0.0
  description: Real-time system performance monitoring and alerting
  role: monitoring

  runtime:
    type: k8s
    image: ossa/monitor:1.0.0
    replicas: 2
    resources:
      limits:
        cpu: "2"
        memory: "4Gi"
      requests:
        cpu: "1"
        memory: "2Gi"

  capabilities:
    - name: collect_metrics
      description: Collect system metrics from monitored services
      inputs:
        type: object
        required: ["targets"]
        properties:
          targets:
            type: array
            items:
              type: string
          interval_seconds:
            type: integer
            default: 60
      outputs:
        type: object
        properties:
          metrics:
            type: object
          timestamp:
            type: string
            format: date-time

    - name: create_alert
      description: Create alert when threshold is exceeded
      inputs:
        type: object
        required: ["metric", "threshold", "condition"]
        properties:
          metric:
            type: string
          threshold:
            type: number
          condition:
            type: string
            enum: ["above", "below", "equals"]
          notification_channels:
            type: array
            items:
              type: string
      outputs:
        type: object
        properties:
          alert_id:
            type: string
          triggered:
            type: boolean

  security:
    authentication: mtls
    authorization: rbac
    compliance:
      - iso-27001

  monitoring:
    healthCheck:
      httpGet:
        path: /health
        port: 8080
    metrics:
      enabled: true
      port: 9090
```

---

## Best Practices

### 1. Capability Design

- Define clear input and output schemas
- Use JSON Schema for validation
- Provide meaningful descriptions
- Specify required vs optional fields

### 2. Resource Specification

- Set realistic resource limits
- Define appropriate requests for scheduling
- Consider peak load requirements
- Plan for horizontal scaling

### 3. Security

- Always specify authentication method
- Use least-privilege authorization
- Declare relevant compliance frameworks
- Implement secure credential management

### 4. Monitoring

- Provide health check endpoints
- Expose Prometheus-compatible metrics
- Implement structured logging
- Define SLOs and SLIs

### 5. Documentation

- Write clear descriptions
- Provide usage examples
- Document error conditions
- Maintain changelog

---

## Validation

All agent manifests must validate against the OSSA 1.0 schema:

```bash
# Validate single agent
ossa validate agent.yml

# Validate directory of agents
ossa validate agents/

# Validation with compliance checks
ossa validate agent.yml --compliance fedramp,iso-27001

# Generate detailed validation report
ossa validate agent.yml --report report.json --verbose
```

---

## Additional Resources

- [OSSA Schema](../../../spec/ossa-1.0.schema.json)
- [Agent Workspace Guide](agents-workspace.md)
- [API Documentation](../../../openapi/)
- [Quick Start Guide](../../../README.md)

---

**OSSA 1.0.0 Reference Implementation**
