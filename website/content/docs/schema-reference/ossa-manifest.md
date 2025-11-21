---
title: "OSSA Manifest"
description: "Root manifest object for OSSA agent definitions"
weight: 1
---

# OSSA Manifest Object

The root object of an OSSA agent manifest. This is the top-level container for all agent configuration.

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `apiVersion` | string | **Yes** | OSSA API version. Must match pattern `ossa/v(0.2.[2-4]\|1)`. Examples: `ossa/v1`, `ossa/v0.2.4`, `ossa/v0.2.3` |
| `kind` | string | **Yes** | Resource type. Currently only `Agent` is supported |
| `metadata` | [Metadata](#metadata-object) | **Yes** | Agent metadata including name, version, labels, and annotations |
| `spec` | [AgentSpec](./agent-spec.md) | **Yes** | Agent specification defining behavior, capabilities, and configuration |
| `extensions` | [Extensions](#extensions-object) | No | Framework-specific extensions for integration with various platforms |

## Metadata Object

Agent metadata for identification and organization.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `name` | string | **Yes** | Agent identifier in DNS-1123 subdomain format (lowercase alphanumeric with hyphens). Max 253 characters. Examples: `code-reviewer`, `data-analyst-01` |
| `version` | string | No | Semantic version (semver 2.0.0). Examples: `1.0.0`, `2.1.3-beta.1` |
| `description` | string | No | Human-readable description of agent purpose and capabilities. Max 2000 characters |
| `labels` | object | No | Key-value labels for organization and filtering. Values max 63 characters |
| `annotations` | object | No | Arbitrary metadata for tooling (not used for filtering). No size limit on values |

### Metadata Examples

**Basic metadata:**
```yaml
metadata:
  name: documentation-agent
  version: 1.2.0
  description: Automated documentation generator for API endpoints
```

**With labels and annotations:**
```yaml
metadata:
  name: security-scanner
  version: 2.0.1
  description: Kubernetes security vulnerability scanner
  labels:
    environment: production
    team: security
    domain: infrastructure
    capability: vulnerability-scanning
  annotations:
    repository: https://github.com/example/security-scanner
    maintainer: security-team@example.com
    documentation: https://docs.example.com/agents/security-scanner
```

## Extensions Object

Framework-specific extensions enable integration with various agent platforms and orchestration frameworks. All extensions are optional.

| Extension | Description | Documentation |
|-----------|-------------|---------------|
| `kagent` | Kubernetes-native agent deployment via kagent.dev | [kagent Extension](./extensions/kagent.md) |
| `buildkit` | Agent BuildKit orchestration and deployment | [BuildKit Extension](./extensions/buildkit.md) |
| `drupal` | Drupal LLM Platform integration | [Drupal Extension](./extensions/drupal.md) |
| `librechat` | LibreChat interface integration | [LibreChat Extension](./extensions/librechat.md) |
| `mcp` | Model Context Protocol server configuration | [MCP Extension](./extensions/mcp.md) |
| `langchain` | LangChain framework integration | [LangChain Extension](./extensions/langchain.md) |
| `crewai` | CrewAI multi-agent framework | [CrewAI Extension](./extensions/crewai.md) |
| `openai_agents` | OpenAI Agents SDK bridge | [OpenAI Agents Extension](./extensions/openai-agents.md) |
| `cursor` | Cursor IDE agent integration | [Cursor Extension](./extensions/cursor.md) |
| `langflow` | Langflow workflow orchestration | [Langflow Extension](./extensions/langflow.md) |
| `autogen` | Microsoft AutoGen framework | [AutoGen Extension](./extensions/autogen.md) |
| `vercel_ai` | Vercel AI SDK (edge/nodejs) | [Vercel AI Extension](./extensions/vercel-ai.md) |
| `llamaindex` | LlamaIndex RAG framework | [LlamaIndex Extension](./extensions/llamaindex.md) |
| `langgraph` | LangGraph state machine framework | [LangGraph Extension](./extensions/langgraph.md) |
| `anthropic` | Anthropic Claude API integration | [Anthropic Extension](./extensions/anthropic.md) |

### Extensions Example

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: multi-platform-agent
  version: 1.0.0
spec:
  # ... agent spec ...
  state:
    mode: session
    storage:
      type: vector-db
      retention: 30d
  tools:
    - type: http
      name: api-service
      transport:
        protocol: http
        streaming: response
        binding: /v1/stream
      auth:
        scopes:
          - read:data
          - execute:query
      compliance_tags:
        - pii
        - gdpr

extensions:
  kagent:
    kubernetes:
      namespace: agents-production
      labels:
        environment: production
    deployment:
      replicas: 3
  google_adk:
    agent_type: llm_agent
    config:
      model: gemini-2.0-flash-exp
      strategy: rolling-update

  buildkit:
    deployment:
      replicas:
        min: 2
        max: 8
    container:
      runtime: docker

  openai_agents:
    enabled: true
    model: gpt-4o
    guardrails:
      enabled: true
      max_tool_calls: 10
      timeout_seconds: 300
```

## Complete Example

```yaml
apiVersion: ossa/v0.2.4
kind: Agent

metadata:
  name: code-quality-analyzer
  version: 2.1.0
  description: |
    Automated code quality analyzer that reviews pull requests,
    identifies security vulnerabilities, checks coding standards,
    and provides actionable improvement recommendations.
  labels:
    domain: development
    subdomain: quality-assurance
    capability: code-analysis
    team: platform-engineering
    environment: production
  annotations:
    repository: https://github.com/example/code-quality-analyzer
    documentation: https://docs.example.com/agents/code-quality-analyzer
    maintainer: platform-team@example.com
    cost-center: engineering-tools
    last-updated: "2024-11-17"

spec:
  taxonomy:
    domain: development
    subdomain: quality-assurance
    capability: static-analysis

  role: |
    You are a senior code quality analyst specializing in:
    - Security vulnerability detection
    - Performance optimization opportunities
    - Code maintainability assessment
    - Best practices enforcement
    - Documentation quality review

    Analyze code with constructive, actionable feedback.

  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.2
    maxTokens: 8192

  tools:
    - type: mcp
      server: filesystem
      capabilities:
        - read_file
        - search_files
    - type: mcp
      server: git
      capabilities:
        - git_diff
        - git_log
        - git_blame
    - type: http
      endpoint: https://api.example.com/static-analysis
      capabilities:
        - run_linter
        - check_complexity

  autonomy:
    level: supervised
    approval_required: false
    allowed_actions:
      - read_code
      - analyze_patterns
      - generate_report
      - post_comment
    blocked_actions:
      - modify_code
      - merge_pr
      - deploy

  constraints:
    cost:
      maxTokensPerDay: 5000000
      maxCostPerDay: 100.0
      currency: USD
    performance:
      maxLatencySeconds: 60
      timeoutSeconds: 300
    resources:
      cpu: "2"
      memory: 4Gi

  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: https://telemetry.example.com/v1/traces
    metrics:
      enabled: true
      exporter: prometheus
      endpoint: https://metrics.example.com
    logging:
      level: info
      format: json

extensions:
  kagent:
    kubernetes:
      namespace: agents-production
      labels:
        cost-center: engineering
    deployment:
      replicas: 2
      strategy: rolling-update

  buildkit:
    deployment:
      replicas:
        min: 1
        max: 5

  openai_agents:
    enabled: false

  anthropic:
    enabled: true
    model: claude-3-5-sonnet-20241022
    max_tokens: 8192
    streaming: true
```

## Validation Rules

### apiVersion Validation
- Must match regex: `^ossa/v(0\.2\.[2-3]|1)(\.0)?(-[a-zA-Z0-9]+)?$`
- Valid examples: `ossa/v1`, `ossa/v0.2.3`, `ossa/v0.2.3`, `ossa/v1.0`
- Invalid examples: `v1`, `ossa/v2`, `ossa/0.2.3`

### kind Validation
- Must be exactly `Agent` (case-sensitive)
- No other resource types currently supported

### metadata.name Validation
- DNS-1123 subdomain format
- Lowercase letters, numbers, and hyphens only
- Must start and end with alphanumeric character
- Maximum 253 characters
- Regex: `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`

Valid names:
- `my-agent`
- `agent-001`
- `data-processor-v2`

Invalid names:
- `MyAgent` (uppercase)
- `-agent` (starts with hyphen)
- `agent_01` (underscore not allowed)

### metadata.version Validation
- Must follow semver 2.0.0 specification
- Format: `MAJOR.MINOR.PATCH[-PRERELEASE][+BUILDMETADATA]`
- Examples: `1.0.0`, `2.1.3-beta.1`, `1.0.0+20240101`

## Related Objects

- [Agent Spec](./agent-spec.md) - The `spec` object
- [LLM Configuration](./llm-config.md) - LLM settings in `spec.llm`
- [Tools](./tools.md) - Tool definitions in `spec.tools`
- [Autonomy](./autonomy.md) - Autonomy settings in `spec.autonomy`
- [Constraints](./constraints.md) - Constraints in `spec.constraints`
- [Observability](./observability.md) - Observability in `spec.observability`
- [Extensions](./extensions/) - Framework-specific extensions

## JSON Schema

The complete JSON Schema is available at:
```
https://openstandardagents.org/schemas/v0.2.3/agent.json
```

Use it for validation and editor autocomplete:
```json
{
  "$schema": "https://openstandardagents.org/schemas/v0.2.3/agent.json",
  "apiVersion": "ossa/v0.2.3",
  "kind": "Agent",
  "metadata": { ... },
  "spec": { ... }
}
```
