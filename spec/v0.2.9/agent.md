# OSSA Agent Manifest Specification

**Version**: 0.2.9
**Status**: Draft
**Last Updated**: 2025-12-04

This document is the authoritative reference for OSSA agent manifests. All OSSA-compliant agents MUST conform to this specification.

---

## Table of Contents

1. [Overview](#overview)
2. [Manifest Structure](#manifest-structure)
3. [Metadata Section](#metadata-section)
4. [Spec Section](#spec-section)
5. [Agent Types](#agent-types)
6. [Capabilities](#capabilities)
7. [Runtime Configuration](#runtime-configuration)
8. [Triggers](#triggers)
9. [Policies](#policies)
10. [Examples](#examples)
11. [Best Practices](#best-practices)
12. [Anti-Patterns](#anti-patterns)
13. [Migration Guide](#migration-guide)

---

## Overview

### What is an OSSA Agent?

An OSSA agent is a declarative, framework-agnostic specification for AI agents. It defines:

- **Identity**: Who the agent is (name, version, labels)
- **Behavior**: What the agent does (role, reasoning strategy)
- **Capabilities**: What tools and integrations the agent can use
- **Runtime**: How the agent executes (LLM, state, observability)
- **Policies**: Guardrails for safety, security, and reliability

### Manifest Purpose and Lifecycle

The agent manifest serves as:

1. **Contract**: Defines agent behavior for runtime execution
2. **Documentation**: Human-readable specification of agent purpose
3. **Portability**: Enables migration between frameworks (LangChain, CrewAI, AutoGen, etc.)
4. **Compliance**: Enforces regulatory requirements (FedRAMP, HIPAA, SOC2)
5. **Version Control**: Tracks agent evolution with semver

**Lifecycle**:
```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Author   │──▶│ Validate │──▶│ Deploy   │──▶│ Execute  │
│ manifest │   │ schema   │   │ runtime  │   │ agent    │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### Relationship to JSON Schema

Every OSSA manifest MUST validate against the canonical JSON Schema:
- **Schema URL**: `https://openstandardagents.org/schemas/v0.2.9/agent.json`
- **Validation**: Required before deployment
- **Extensions**: Framework-specific extensions are schema-validated

---

## Manifest Structure

All OSSA manifests follow Kubernetes-style resource format:

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: agent-identifier
  version: 1.0.0
spec:
  # Agent specification
```

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `apiVersion` | string | OSSA API version | `ossa/v0.2.9` |
| `kind` | string | Resource type | `Agent` |
| `metadata` | object | Agent metadata | See [Metadata](#metadata-section) |
| `spec` | object | Agent specification | See [Spec](#spec-section) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `extensions` | object | Framework-specific extensions |

---

## Metadata Section

The `metadata` section provides agent identity and classification.

### Required Metadata

#### `name`

**Type**: `string`
**Pattern**: `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`
**Max Length**: 253 characters

**Rules**:
- Lowercase alphanumeric characters only
- Hyphens allowed (not at start/end)
- Kubernetes DNS-1123 subdomain format
- Must be globally unique within namespace

**Examples**:
```yaml
# Valid
metadata:
  name: security-scanner
  name: code-reviewer-v2
  name: doc-generator-123

# Invalid
metadata:
  name: Security_Scanner  # No uppercase or underscores
  name: -agent-name       # Cannot start with hyphen
  name: agent.name        # No dots allowed
```

### Optional Metadata

#### `version`

**Type**: `string`
**Pattern**: Semantic Versioning 2.0.0
**Format**: `MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]`

**Rules**:
- MUST follow semver 2.0.0 specification
- Breaking changes MUST increment MAJOR
- New features MUST increment MINOR
- Bug fixes MUST increment PATCH

**Examples**:
```yaml
metadata:
  version: 1.0.0
  version: 2.1.3-beta.1
  version: 1.0.0+build.2024.12.04
```

#### `description`

**Type**: `string`
**Max Length**: 2000 characters

Human-readable description of agent purpose and capabilities.

**Example**:
```yaml
metadata:
  description: |
    Security vulnerability scanner for Kubernetes clusters.
    Analyzes pod configurations, network policies, and RBAC
    to identify security risks and compliance violations.
```

#### `labels`

**Type**: `object<string, string>`
**Value Max Length**: 63 characters

Key-value pairs for organization and filtering. Used by runtime selectors.

**Example**:
```yaml
metadata:
  labels:
    domain: security
    team: platform
    environment: production
    compliance: fedramp
```

#### `annotations`

**Type**: `object<string, string>`

Arbitrary metadata for tooling. NOT used for filtering.

**Example**:
```yaml
metadata:
  annotations:
    ossa.io/author: platform-team@example.com
    ossa.io/docs: https://docs.example.com/agents/security-scanner
    ossa.io/issue-tracker: https://github.com/org/repo/issues
    buildkit.io/cost-center: security-ops
```

---

## Spec Section

The `spec` section defines agent behavior, capabilities, and runtime configuration.

### Required Spec Fields

#### `role`

**Type**: `string`
**Min Length**: 1

The agent's system prompt describing behavior and capabilities.

**Example**:
```yaml
spec:
  role: |
    You are a security expert specializing in Kubernetes security.
    Your role is to analyze cluster configurations and identify
    security vulnerabilities based on CIS Kubernetes Benchmarks.

    Provide actionable recommendations with remediation steps.
    Prioritize findings by severity (Critical, High, Medium, Low).
```

**Best Practices**:
- Be specific about domain expertise
- Define output format expectations
- Specify tone and communication style
- Include constraints and limitations

### Optional Spec Fields

#### `taxonomy`

**Type**: `object`

Hierarchical classification for agent discovery.

```yaml
spec:
  taxonomy:
    domain: infrastructure      # Primary domain
    subdomain: kubernetes       # Secondary classification
    capability: troubleshooting # Specific function
```

**Common Domains**:
- `infrastructure`: Cloud, Kubernetes, networking
- `security`: Vulnerability scanning, compliance
- `development`: Code review, testing
- `documentation`: Generation, maintenance
- `compliance`: Auditing, reporting

#### `llm`

**Type**: `object`

LLM provider and configuration. See [Runtime Configuration](#runtime-configuration).

#### `tools`

**Type**: `array<Tool>`

Available tools and integrations. See [Capabilities](#capabilities).

#### `autonomy`

**Type**: `object`

Autonomous execution behavior (requires approval, escalation, etc.).

#### `constraints`

**Type**: `object`

Resource limits and execution constraints.

#### `observability`

**Type**: `object`

Logging, tracing, and metrics configuration.

#### `state`

**Type**: `object`

State management (persistent, ephemeral, versioning).

#### `security`

**Type**: `object`

Security policies (authentication, authorization, secrets).

#### `reliability`

**Type**: `object`

Retry policies, circuit breakers, timeouts.

#### `collaboration`

**Type**: `object`

Multi-agent communication and delegation.

#### `safety`

**Type**: `object`

Content filtering, PII redaction, guardrails.

#### `deployment`

**Type**: `object`

Runtime environment requirements.

#### `reasoning`

**Type**: `object`

Reasoning strategy (ReAct, Chain-of-Thought, Tree-of-Thought).

#### `prompts`

**Type**: `object`

Versioned prompt templates.

#### `knowledge_graph`

**Type**: `object`

Knowledge graph integration.

#### `identity`

**Type**: `object`

Identity management (session IDs, instance IDs, trace context).

---

## Agent Types

OSSA supports three agent types based on autonomy and collaboration patterns.

### Worker Agent

**Purpose**: Executes specific tasks with minimal autonomy.

**Characteristics**:
- Single-purpose, focused capability
- Requires human approval for actions
- Stateless or minimal state
- Low complexity

**Use Cases**:
- Code formatting
- Data validation
- Simple transformations
- Query execution

**Example**:
```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: code-formatter
  labels:
    type: worker
spec:
  taxonomy:
    domain: development
    subdomain: code-quality
    capability: formatting
  role: Format code according to project style guides
  autonomy:
    approval_required: false  # Safe, deterministic operation
    max_turns: 1
```

### Orchestrator Agent

**Purpose**: Coordinates multiple agents and complex workflows.

**Characteristics**:
- Multi-agent delegation
- Workflow orchestration
- State management across agents
- Higher autonomy

**Use Cases**:
- Build pipelines
- Security audits
- Complex troubleshooting
- Multi-step deployments

**Example**:
```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: security-orchestrator
  labels:
    type: orchestrator
spec:
  taxonomy:
    domain: security
    subdomain: orchestration
    capability: audit
  role: Orchestrate comprehensive security audits
  collaboration:
    delegation:
      enabled: true
      max_depth: 3
      agents:
        - vulnerability-scanner
        - compliance-checker
        - remediation-planner
```

### Hybrid Agent

**Purpose**: Balances autonomy with human oversight.

**Characteristics**:
- Conditional autonomy
- Escalation workflows
- Approval gates for critical actions
- Context-aware decision making

**Use Cases**:
- Interactive troubleshooting
- Assisted deployments
- Code review with recommendations
- Compliance remediation

**Example**:
```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: deployment-assistant
  labels:
    type: hybrid
spec:
  taxonomy:
    domain: infrastructure
    subdomain: deployment
    capability: assisted-deployment
  role: Assist with production deployments
  autonomy:
    approval_required: true  # Require approval for prod changes
    approval_gates:
      - action: deploy
        approvers:
          - role:platform-admin
      - action: database_migration
        approvers:
          - role:dba
```

---

## Capabilities

Capabilities define tools and integrations available to the agent.

### Tool Types

#### MCP (Model Context Protocol)

Connect to MCP servers for tool discovery and execution.

```yaml
spec:
  tools:
    - type: mcp
      server: filesystem
      namespace: default
      capabilities:
        - name: read_file
          version: "1.0"
        - name: write_file
          version: "1.0"
      auth:
        type: none
```

#### Kubernetes

Interact with Kubernetes API.

```yaml
spec:
  tools:
    - type: kubernetes
      namespace: production
      capabilities:
        - name: get_pods
        - name: describe_pod
        - name: get_logs
      auth:
        type: bearer
        credentials: ${KUBE_TOKEN}  # Reference, not actual secret
```

#### HTTP

Call HTTP APIs.

```yaml
spec:
  tools:
    - type: http
      name: github-api
      endpoint: https://api.github.com
      capabilities:
        - name: create_issue
          version: "2022-11-28"
      auth:
        type: bearer
        credentials: ${GITHUB_TOKEN}
      circuit_breaker:
        enabled: true
        failure_threshold: 5
        timeout_seconds: 60
```

#### gRPC

Call gRPC services.

```yaml
spec:
  tools:
    - type: grpc
      name: audit-service
      endpoint: audit.example.com:443
      capabilities:
        - name: log_event
      auth:
        type: mtls
        credentials: ${MTLS_CERT}
      transport:
        protocol: grpc
        tls:
          enabled: true
```

#### Function

Invoke serverless functions.

```yaml
spec:
  tools:
    - type: function
      name: image-processor
      capabilities:
        - name: resize_image
        - name: convert_format
      config:
        runtime: nodejs20
        memory_mb: 512
        timeout_seconds: 30
```

#### A2A (Agent-to-Agent)

Communicate with other OSSA agents.

```yaml
spec:
  tools:
    - type: a2a
      name: specialist-agent
      capabilities:
        - name: analyze_security
      transport:
        protocol: http
        endpoint: http://specialist-agent.default.svc.cluster.local:8080
```

### Capability Configuration

Each capability can define:

#### Input/Output Schemas

```yaml
capabilities:
  - name: create_ticket
    version: "1.0"
    input_schema:
      type: object
      required: [title, description]
      properties:
        title:
          type: string
        description:
          type: string
        priority:
          type: string
          enum: [low, medium, high, critical]
    output_schema:
      type: object
      properties:
        ticket_id:
          type: string
        url:
          type: string
```

#### Retry Policy

```yaml
capabilities:
  - name: external_api_call
    retry_policy:
      max_attempts: 3
      backoff_strategy: exponential
      initial_delay_ms: 1000
      max_delay_ms: 30000
      retryable_errors:
        - RATE_LIMIT_EXCEEDED
        - SERVICE_UNAVAILABLE
```

#### Error Handling

```yaml
capabilities:
  - name: primary_service
    error_handling:
      fallback_capability: backup_service
      on_error: fallback
      error_mapping:
        CONNECTION_REFUSED: SERVICE_UNAVAILABLE
        TIMEOUT: DEADLINE_EXCEEDED
```

#### Caching

```yaml
capabilities:
  - name: expensive_query
    caching:
      enabled: true
      ttl_seconds: 3600
      cache_key_fields:
        - query_id
        - parameters
      invalidation_strategy: ttl
```

#### Timeouts

```yaml
capabilities:
  - name: long_running_task
    timeout:
      execution_seconds: 300
      connection_seconds: 10
```

#### Compliance Tagging

```yaml
capabilities:
  - name: process_health_data
    compliance_tags:
      - pii
      - phi
      - hipaa
      - gdpr
```

---

## Runtime Configuration

### LLM Configuration

```yaml
spec:
  llm:
    provider: anthropic
    model: claude-3-sonnet-20240229
    temperature: 0.7
    maxTokens: 4096
    topP: 0.9

    # Fallback models
    fallback_models:
      - provider: openai
        model: gpt-4-turbo-preview
      - provider: google
        model: gemini-pro

    # Retry configuration
    retry_config:
      max_attempts: 3
      backoff_strategy: exponential

    # Cost tracking
    cost_tracking:
      enabled: true
      budget_alert_threshold: 100.00
      cost_allocation_tags:
        team: security
        project: cluster-audit
```

### State Management

```yaml
spec:
  state:
    persistence:
      enabled: true
      backend: redis
      encryption:
        enabled: true
        algorithm: AES-256-GCM

    versioning:
      enabled: true
      max_versions: 10

    ttl_seconds: 86400  # 24 hours

    cleanup:
      strategy: age_based
      max_age_days: 30
```

### Observability

```yaml
spec:
  observability:
    logging:
      level: info
      format: json
      destinations:
        - type: stdout
        - type: loki
          endpoint: http://loki:3100

    tracing:
      enabled: true
      exporter: otlp
      endpoint: http://tempo:4317
      sampling_rate: 1.0
      pii_redaction: true

    metrics:
      enabled: true
      exporter: prometheus
      port: 9090
      custom_metrics:
        - name: agent_task_duration_seconds
          type: histogram
        - name: agent_errors_total
          type: counter
```

---

## Triggers

Define when the agent should execute.

### Event Trigger

```yaml
spec:
  triggers:
    - type: event
      source: kubernetes
      filters:
        namespace: production
        resource: pod
        event_type: created
      conditions:
        - field: metadata.labels.app
          operator: equals
          value: web-server
```

### Schedule Trigger

```yaml
spec:
  triggers:
    - type: schedule
      cron: "0 */6 * * *"  # Every 6 hours
      timezone: America/New_York
      jitter_seconds: 300  # Random delay up to 5 minutes
```

### Manual Trigger

```yaml
spec:
  triggers:
    - type: manual
      approval_required: true
      approvers:
        - user:admin@example.com
        - role:platform-lead
```

### Webhook Trigger

```yaml
spec:
  triggers:
    - type: webhook
      endpoint: /api/v1/agents/security-scanner/trigger
      auth:
        type: bearer
        credentials: ${WEBHOOK_SECRET}
      payload_schema:
        type: object
        required: [target_cluster]
        properties:
          target_cluster:
            type: string
```

---

## Policies

Policies define guardrails for agent execution.

### Rate Limiting

```yaml
spec:
  reliability:
    rate_limit:
      enabled: true
      max_requests_per_minute: 60
      max_concurrent_executions: 5
      burst_size: 10
```

### Circuit Breaker

```yaml
spec:
  reliability:
    circuit_breaker:
      enabled: true
      failure_threshold: 5
      success_threshold: 2
      timeout_seconds: 60
      half_open_max_requests: 3
```

### Retry Policy

```yaml
spec:
  reliability:
    retry:
      max_attempts: 3
      backoff_strategy: exponential
      initial_delay_ms: 1000
      max_delay_ms: 30000
      jitter: true
```

### Escalation

```yaml
spec:
  autonomy:
    escalation:
      enabled: true
      triggers:
        - condition: error_rate > 0.1
          action: notify
          recipients:
            - pagerduty:on-call
        - condition: consecutive_failures > 3
          action: disable
          notification:
            - email:ops-team@example.com
```

### Resource Limits

```yaml
spec:
  constraints:
    execution:
      max_duration_seconds: 600
      max_memory_mb: 2048
      max_cpu_millicores: 1000

    output:
      max_tokens: 4096
      max_tool_calls_per_turn: 10
      max_turns: 20
```

---

## Examples

### Example 1: Minimal Worker Agent

Simplest possible OSSA agent for code formatting.

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: code-formatter
  version: 1.0.0
  description: Formats Python code using Black
spec:
  role: Format Python code according to PEP 8 using Black formatter
  llm:
    provider: openai
    model: gpt-4-turbo-preview
    temperature: 0
  tools:
    - type: function
      name: black-formatter
      capabilities:
        - name: format_code
  autonomy:
    approval_required: false
    max_turns: 1
```

### Example 2: Production Orchestrator

Enterprise-grade security orchestrator with full observability.

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: security-orchestrator
  version: 2.1.0
  description: |
    Comprehensive security audit orchestrator for Kubernetes clusters.
    Coordinates vulnerability scanning, compliance checking, and remediation.
  labels:
    domain: security
    team: platform-security
    environment: production
    compliance: fedramp
  annotations:
    ossa.io/author: security-team@example.com
    ossa.io/docs: https://docs.example.com/agents/security-orchestrator
    cost-center: security-ops

spec:
  taxonomy:
    domain: security
    subdomain: orchestration
    capability: comprehensive-audit

  role: |
    You are a security orchestration expert for Kubernetes environments.

    Your responsibilities:
    1. Coordinate vulnerability scanning across all namespaces
    2. Verify compliance with CIS Kubernetes Benchmarks
    3. Identify misconfigurations and security risks
    4. Generate prioritized remediation plans

    Output Format:
    - Executive summary (max 3 paragraphs)
    - Critical findings with immediate action items
    - Detailed findings by severity
    - Remediation roadmap with timeline

    Escalate immediately if:
    - Critical vulnerabilities with public exploits
    - Compliance violations affecting certifications
    - Active security incidents detected

  llm:
    provider: anthropic
    model: claude-3-opus-20240229
    temperature: 0.3
    maxTokens: 8192
    fallback_models:
      - provider: openai
        model: gpt-4-turbo-preview
    retry_config:
      max_attempts: 3
      backoff_strategy: exponential
    cost_tracking:
      enabled: true
      budget_alert_threshold: 500.00
      cost_allocation_tags:
        team: security
        project: k8s-audit

  tools:
    - type: kubernetes
      namespace: "*"
      capabilities:
        - name: list_pods
        - name: get_pod_security_policies
        - name: list_network_policies
        - name: get_rbac_roles
      auth:
        type: bearer
        credentials: ${KUBE_SA_TOKEN}
      circuit_breaker:
        enabled: true
        failure_threshold: 5
        timeout_seconds: 60

    - type: a2a
      name: vulnerability-scanner
      capabilities:
        - name: scan_cluster
      transport:
        protocol: grpc
        endpoint: vuln-scanner.security.svc.cluster.local:8080

    - type: a2a
      name: compliance-checker
      capabilities:
        - name: check_cis_benchmark
      transport:
        protocol: grpc
        endpoint: compliance.security.svc.cluster.local:8080

    - type: http
      name: remediation-tracker
      endpoint: https://api.remediation.example.com
      capabilities:
        - name: create_ticket
        - name: assign_owner
      auth:
        type: bearer
        credentials: ${REMEDIATION_API_KEY}

  collaboration:
    delegation:
      enabled: true
      max_depth: 3
      agents:
        - vulnerability-scanner
        - compliance-checker
        - remediation-planner

  autonomy:
    approval_required: false  # Audit is read-only
    escalation:
      enabled: true
      triggers:
        - condition: critical_findings > 0
          action: notify
          recipients:
            - pagerduty:security-on-call
        - condition: compliance_violations > 10
          action: notify
          recipients:
            - email:security-team@example.com

  observability:
    logging:
      level: info
      format: json
      destinations:
        - type: loki
          endpoint: http://loki.monitoring:3100
    tracing:
      enabled: true
      exporter: otlp
      endpoint: http://tempo.monitoring:4317
      sampling_rate: 1.0
      pii_redaction: true
    metrics:
      enabled: true
      exporter: prometheus
      port: 9090

  state:
    persistence:
      enabled: true
      backend: redis
      encryption:
        enabled: true
        algorithm: AES-256-GCM
    versioning:
      enabled: true
      max_versions: 30
    ttl_seconds: 604800  # 7 days

  security:
    authentication:
      required: true
      methods:
        - mtls
        - oauth2
    authorization:
      rbac:
        enabled: true
        roles:
          - security-auditor
    secrets:
      provider: vault
      path: /secret/agents/security-orchestrator

  reliability:
    retry:
      max_attempts: 3
      backoff_strategy: exponential
      initial_delay_ms: 1000
      max_delay_ms: 30000
    circuit_breaker:
      enabled: true
      failure_threshold: 5
      timeout_seconds: 120
    rate_limit:
      max_requests_per_minute: 30
      max_concurrent_executions: 3

  constraints:
    execution:
      max_duration_seconds: 1800  # 30 minutes
      max_memory_mb: 4096
      max_cpu_millicores: 2000
    output:
      max_tokens: 8192
      max_tool_calls_per_turn: 50
      max_turns: 30

  triggers:
    - type: schedule
      cron: "0 2 * * *"  # Daily at 2 AM
      timezone: UTC
    - type: webhook
      endpoint: /api/v1/agents/security-orchestrator/trigger
      auth:
        type: bearer
        credentials: ${WEBHOOK_SECRET}

  reasoning:
    strategy: react
    options:
      max_iterations: 10
      reflection_enabled: true

  safety:
    content_filtering:
      enabled: true
      blocklist:
        - credentials
        - api_keys
    pii_detection:
      enabled: true
      redact: true
```

### Example 3: Security-Hardened Agent

Agent with comprehensive security controls for regulated environments.

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: hipaa-compliant-agent
  version: 1.0.0
  labels:
    compliance: hipaa
    environment: production
spec:
  role: Process healthcare data in HIPAA-compliant manner

  llm:
    provider: anthropic
    model: claude-3-sonnet-20240229

  tools:
    - type: http
      name: fhir-api
      endpoint: https://fhir.example.com
      capabilities:
        - name: read_patient
          compliance_tags:
            - phi
            - hipaa
      auth:
        type: oauth2
        credentials: ${FHIR_OAUTH_TOKEN}
        scopes:
          - patient.read
      transport:
        tls:
          enabled: true
          min_version: "1.3"
          verify_cert: true

  security:
    authentication:
      required: true
      methods:
        - mtls
    authorization:
      rbac:
        enabled: true
        roles:
          - healthcare-provider
    secrets:
      provider: vault
      path: /secret/hipaa/agents
    audit:
      enabled: true
      log_all_requests: true
      retention_days: 2555  # 7 years

  state:
    persistence:
      enabled: true
      backend: postgres
      encryption:
        enabled: true
        algorithm: AES-256-GCM
        key_management: aws-kms

  observability:
    logging:
      level: info
      pii_redaction: true
    tracing:
      enabled: true
      pii_redaction: true

  safety:
    content_filtering:
      enabled: true
    pii_detection:
      enabled: true
      redact: true
      types:
        - ssn
        - credit_card
        - phone_number

  compliance:
    profiles:
      - hipaa
    audit:
      enabled: true
      retention_days: 2555
```

### Example 4: Multi-Model Agent with Fallbacks

Agent using multiple LLMs with intelligent fallback.

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: resilient-agent
  version: 1.0.0
spec:
  role: High-availability agent with multi-model fallback

  llm:
    # Primary model
    provider: anthropic
    model: claude-3-opus-20240229
    temperature: 0.7
    maxTokens: 4096

    # Fallback chain
    fallback_models:
      - provider: openai
        model: gpt-4-turbo-preview
      - provider: google
        model: gemini-pro
      - provider: anthropic
        model: claude-3-sonnet-20240229

    # Aggressive retry
    retry_config:
      max_attempts: 5
      backoff_strategy: exponential

  reliability:
    circuit_breaker:
      enabled: true
      failure_threshold: 3
      success_threshold: 2
      timeout_seconds: 60
    retry:
      max_attempts: 3
      backoff_strategy: exponential
      jitter: true

  observability:
    metrics:
      enabled: true
      custom_metrics:
        - name: model_fallback_total
          type: counter
          labels:
            - from_model
            - to_model
        - name: model_latency_seconds
          type: histogram
          labels:
            - model
```

### Example 5: Agent with Compliance Profile

Agent configured for FedRAMP Moderate compliance.

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: fedramp-agent
  version: 1.0.0
  labels:
    compliance: fedramp-moderate
    environment: gov-cloud
  annotations:
    fedramp.io/authorization-date: "2024-12-01"
    fedramp.io/package-id: F24xxxxx

spec:
  role: FedRAMP Moderate compliant agent for federal agencies

  llm:
    provider: azure
    model: gpt-4-turbo-usgov
    cost_tracking:
      enabled: true
      cost_allocation_tags:
        agency: dod
        program: modernization

  state:
    persistence:
      enabled: true
      backend: postgres
      encryption:
        enabled: true
        algorithm: AES-256-GCM
        key_management: FIPS-140-2
      storage:
        allowed_regions:
          - us-gov-west-1
          - us-gov-east-1
        data_residency: US

  security:
    authentication:
      required: true
      methods:
        - mtls
        - piv  # PIV/CAC cards
    authorization:
      rbac:
        enabled: true
    secrets:
      provider: aws-secrets-manager
      encryption: FIPS-140-2

  observability:
    logging:
      retention_days: 2555  # 7 years
      immutable: true
      pii_redaction: true
    tracing:
      enabled: true
      pii_redaction: true
    audit:
      enabled: true
      log_all_requests: true
      retention_days: 2555

  compliance:
    profiles:
      - fedramp-moderate
    controls:
      - id: AC-2
        description: Account Management
        status: compliant
      - id: AU-2
        description: Audit Events
        status: compliant
      - id: SC-13
        description: Cryptographic Protection
        status: compliant

  tools:
    - type: http
      name: government-api
      endpoint: https://api.example.gov
      auth:
        type: mtls
        credentials: ${MTLS_CERT}
      transport:
        tls:
          enabled: true
          min_version: "1.2"
          cipher_suites:
            - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
      compliance_tags:
        - fedramp
        - fips-140-2
```

---

## Best Practices

### Naming Conventions

**DO**:
- Use descriptive, purpose-driven names: `security-scanner`, `doc-generator`
- Follow Kubernetes naming (lowercase, hyphens)
- Include version suffix for major versions: `agent-v2`, `scanner-v3`
- Use domain prefixes: `sec-scanner`, `dev-reviewer`

**DON'T**:
- Use generic names: `agent1`, `my-agent`
- Use uppercase or underscores: `Security_Agent`
- Include framework names: `langchain-agent`
- Use dots or special characters: `agent.production`

### Version Management

**DO**:
- Start at `1.0.0` for production releases
- Use `0.x.y` for pre-production
- Increment MAJOR for breaking changes
- Increment MINOR for new features
- Increment PATCH for bug fixes
- Use pre-release tags: `1.0.0-beta.1`, `2.0.0-rc.2`

**DON'T**:
- Skip versions
- Reuse version numbers
- Use arbitrary versioning schemes

### Capability Selection

**DO**:
- Grant minimum required capabilities (principle of least privilege)
- Use capability versioning: `read_file:1.0`
- Document why each capability is needed (in annotations)
- Group related capabilities under single tool
- Use compliance tags for sensitive capabilities

**DON'T**:
- Grant wildcard/admin capabilities unless absolutely required
- Use deprecated capabilities
- Mix unrelated capabilities in one tool

### Error Handling Patterns

**DO**:
- Define retry policies for transient failures
- Use circuit breakers for external dependencies
- Implement fallback capabilities
- Log errors with structured metadata
- Escalate critical errors to humans

**DON'T**:
- Retry indefinitely
- Ignore errors silently
- Retry non-idempotent operations without safeguards
- Expose error details to end users

### Observability

**DO**:
- Enable tracing for all production agents
- Redact PII in logs and traces
- Use structured logging (JSON)
- Define custom metrics for business KPIs
- Set retention policies based on compliance requirements

**DON'T**:
- Log secrets or credentials
- Disable observability in production
- Use plain text logging for sensitive data

### State Management

**DO**:
- Enable encryption for persistent state
- Version state schemas
- Set TTL for ephemeral state
- Use cleanup policies to prevent unbounded growth
- Back up critical state

**DON'T**:
- Store secrets in state
- Use unencrypted state for sensitive data
- Keep state indefinitely without TTL

### Security

**DO**:
- Require authentication for all production agents
- Use RBAC for authorization
- Store secrets in dedicated secret managers (Vault, AWS Secrets Manager)
- Enable audit logging
- Use mTLS for inter-agent communication

**DON'T**:
- Embed secrets in manifests
- Use API keys in plain text
- Disable authentication for "internal" agents
- Store credentials in state or logs

---

## Anti-Patterns

### ❌ Embedding Secrets

**NEVER** embed actual secrets in manifests:

```yaml
# ❌ NEVER DO THIS
spec:
  tools:
    - type: http
      auth:
        credentials: sk-1234567890abcdef  # Actual secret!
```

**✅ Use secret references instead**:

```yaml
spec:
  tools:
    - type: http
      auth:
        credentials: ${GITHUB_TOKEN}  # Reference to secret manager
  security:
    secrets:
      provider: vault
      path: /secret/agents/my-agent
```

### ❌ Overly Broad Capabilities

**NEVER** grant more capabilities than needed:

```yaml
# ❌ NEVER DO THIS
spec:
  tools:
    - type: kubernetes
      namespace: "*"  # All namespaces!
      capabilities:
        - name: "*"  # All operations!
```

**✅ Grant minimum required**:

```yaml
spec:
  tools:
    - type: kubernetes
      namespace: production  # Specific namespace
      capabilities:
        - name: get_pods  # Specific operations
        - name: describe_pod
```

### ❌ Missing Observability

**NEVER** deploy without observability:

```yaml
# ❌ NEVER DO THIS
spec:
  observability:
    logging:
      enabled: false
    tracing:
      enabled: false
    metrics:
      enabled: false
```

**✅ Enable full observability**:

```yaml
spec:
  observability:
    logging:
      level: info
      format: json
    tracing:
      enabled: true
      sampling_rate: 1.0
    metrics:
      enabled: true
```

### ❌ No Error Handling

**NEVER** omit error handling:

```yaml
# ❌ NEVER DO THIS
spec:
  tools:
    - type: http
      name: flaky-api
      # No retry policy, no circuit breaker, no timeout!
```

**✅ Implement comprehensive error handling**:

```yaml
spec:
  tools:
    - type: http
      name: flaky-api
      capabilities:
        - name: call_api
          retry_policy:
            max_attempts: 3
            backoff_strategy: exponential
          timeout:
            execution_seconds: 30
      circuit_breaker:
        enabled: true
        failure_threshold: 5
```

### ❌ Ignoring Compliance

**NEVER** handle regulated data without compliance controls:

```yaml
# ❌ NEVER DO THIS for HIPAA/PII data
spec:
  tools:
    - type: http
      name: patient-api
      # No compliance tags, no PII redaction, no audit logging!
```

**✅ Enable compliance controls**:

```yaml
spec:
  tools:
    - type: http
      name: patient-api
      capabilities:
        - name: read_patient
          compliance_tags:
            - phi
            - hipaa
  safety:
    pii_detection:
      enabled: true
      redact: true
  security:
    audit:
      enabled: true
      retention_days: 2555
  compliance:
    profiles:
      - hipaa
```

### ❌ Unbounded Resource Usage

**NEVER** allow unlimited execution:

```yaml
# ❌ NEVER DO THIS
spec:
  constraints:
    execution:
      max_duration_seconds: 0  # No limit!
      max_turns: 0  # Infinite loops!
```

**✅ Set reasonable limits**:

```yaml
spec:
  constraints:
    execution:
      max_duration_seconds: 600
      max_turns: 20
      max_memory_mb: 2048
```

### ❌ Hardcoded Configuration

**NEVER** hardcode environment-specific values:

```yaml
# ❌ NEVER DO THIS
spec:
  tools:
    - type: http
      endpoint: https://api.production.example.com  # Hardcoded!
```

**✅ Use environment variables or config maps**:

```yaml
spec:
  tools:
    - type: http
      endpoint: ${API_ENDPOINT}
  deployment:
    environment:
      - name: API_ENDPOINT
        valueFrom:
          configMapKeyRef:
            name: agent-config
            key: api_endpoint
```

---

## Migration Guide

### From v0.2.8 to v0.2.9

**Breaking Changes**: None

**New Features**:
1. **Reasoning Strategies**: ReAct, Chain-of-Thought, Tree-of-Thought
2. **Prompt Templates**: Versioned prompt management
3. **Knowledge Graph Integration**: First-class knowledge graph support
4. **agents.md Extension**: OpenAI repository-level agent guidance

**Deprecated Features**:
- None

**Migration Steps**:

#### 1. Update API Version

```yaml
# Before (v0.2.8)
apiVersion: ossa/v0.2.8

# After (v0.2.9)
apiVersion: ossa/v0.2.9
```

#### 2. Add Reasoning Strategy (Optional)

If your agent uses explicit reasoning, define it:

```yaml
spec:
  reasoning:
    strategy: react  # or chain_of_thought, tree_of_thought
    options:
      max_iterations: 10
      reflection_enabled: true
```

#### 3. Migrate to Prompt Templates (Optional)

If you have multiple prompt variants:

```yaml
# Before
spec:
  role: |
    You are a helpful assistant.
    # Embedded prompt

# After
spec:
  role: |
    {{prompt.system}}
  prompts:
    templates:
      - name: system
        version: "1.0"
        content: |
          You are a helpful assistant.
      - name: task
        version: "1.0"
        content: |
          Analyze the following: {{input}}
```

#### 4. Add Knowledge Graph (Optional)

If using knowledge graphs:

```yaml
spec:
  knowledge_graph:
    provider: neo4j
    connection:
      uri: ${NEO4J_URI}
    queries:
      - name: get_related_entities
        cypher: |
          MATCH (e:Entity {id: $entity_id})-[:RELATED_TO]->(r)
          RETURN r
```

#### 5. Add Identity Configuration (Optional)

For multi-agent tracing:

```yaml
spec:
  identity:
    session_id_generation:
      strategy: uuid
    instance_id_generation:
      strategy: hostname
    trace_context:
      propagation: w3c
```

#### 6. Validate Against New Schema

```bash
ossa validate agent.yaml --schema v0.2.9
```

### From v0.2.7 to v0.2.9

Follow v0.2.8 → v0.2.9 migration, then:

**Additional Changes**:
1. Compliance profiles now use `compliance.profiles` instead of `spec.compliance`
2. State encryption now requires explicit algorithm

```yaml
# Before (v0.2.7)
spec:
  compliance: fedramp
  state:
    encryption: true

# After (v0.2.9)
spec:
  compliance:
    profiles:
      - fedramp-moderate
  state:
    persistence:
      encryption:
        enabled: true
        algorithm: AES-256-GCM
```

---

## Validation

To validate an agent manifest:

```bash
# Using OSSA CLI
ossa validate agent.yaml

# Using JSON Schema validator
jsonschema -i agent.yaml \
  https://openstandardagents.org/schemas/v0.2.9/agent.json

# Using kubectl (if deployed to Kubernetes)
kubectl apply --dry-run=client -f agent.yaml
```

**Common Validation Errors**:

1. **Invalid name format**:
   ```
   Error: metadata.name must match pattern ^[a-z0-9]([-a-z0-9]*[a-z0-9])?$
   Fix: Use lowercase, hyphens only
   ```

2. **Invalid semver**:
   ```
   Error: metadata.version must be valid semver
   Fix: Use format MAJOR.MINOR.PATCH (e.g., 1.0.0)
   ```

3. **Missing required fields**:
   ```
   Error: spec.role is required
   Fix: Add role field with agent's system prompt
   ```

---

## Schema References

- **JSON Schema**: `https://openstandardagents.org/schemas/v0.2.9/agent.json`
- **TypeScript Types**: See `types.ts` in this directory
- **Validation CLI**: `npm install -g @bluefly/openstandardagents`

---

## Contributing

To propose changes to this specification:

1. Open an issue: https://gitlab.com/blueflyio/openstandardagents/-/issues
2. Discuss with community
3. Submit merge request with changes to:
   - `spec/v0.2.9/agent.md` (this file)
   - `spec/v0.2.9/ossa-0.2.9.schema.json` (JSON Schema)
   - `spec/v0.2.9/types.ts` (TypeScript definitions)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-04
**Status**: Draft
**Authors**: OSSA Technical Committee
