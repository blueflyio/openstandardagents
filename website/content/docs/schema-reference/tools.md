---
title: "Tools"
description: "Tool and capability definitions for agent integrations"
weight: 4
---

# Tools Object

The `tools` array in `spec.tools` defines capabilities and integrations available to the agent. Each tool provides access to external systems, APIs, or functions.

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `type` | string (enum) | **Yes** | Tool integration type: `mcp`, `kubernetes`, `http`, `grpc`, `function`, or `custom` |
| `name` | string | No | Tool name/identifier. Required for `function` and `custom` types |
| `server` | string | No | MCP server name. Required when `type: mcp` |
| `namespace` | string | No | Kubernetes namespace. Used with `type: kubernetes` or `type: mcp` |
| `endpoint` | string (URI) | No | HTTP/gRPC endpoint. Required when `type: http` or `type: grpc` |
| `capabilities` | array[string] | No | Specific capabilities/operations from this tool |
| `config` | object | No | Tool-specific configuration. Free-form JSON object |
| `auth` | [Auth](#auth-object) | No | Authentication configuration |

## Auth Object

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `type` | string (enum) | No | Auth type: `bearer`, `oauth2`, `mtls`, `apikey`, or `none` |
| `credentials` | string | No | Reference to secret/credential (NOT the actual secret value) |

## Tool Types

### MCP (Model Context Protocol)

MCP is the preferred integration method for OSSA agents. MCP servers provide standardized tool interfaces.

```yaml
tools:
  - type: mcp
    server: filesystem
    capabilities:
      - read_file
      - write_file
      - list_directory
      - search_files

  - type: mcp
    server: git
    capabilities:
      - git_diff
      - git_log
      - git_status
      - git_blame

  - type: mcp
    server: postgres
    namespace: databases
    capabilities:
      - query
      - get_schema
    config:
      database: analytics
      read_only: true
    auth:
      type: apikey
      credentials: SECRET_REF_POSTGRES_KEY
```

**Common MCP servers:**
- `filesystem` - File operations
- `git` - Git repository operations
- `github` - GitHub API integration
- `gitlab` - GitLab API integration
- `postgres` - PostgreSQL database
- `sqlite` - SQLite database
- `redis` - Redis key-value store
- `slack` - Slack API
- `jira` - Jira API
- `confluence` - Confluence API

See [MCP Extension](./extensions/mcp.md) for server configuration.

### Kubernetes

Direct access to Kubernetes API resources.

```yaml
tools:
  - type: kubernetes
    namespace: production
    capabilities:
      - get_pods
      - get_deployments
      - get_services
      - describe_pod
    config:
      cluster: prod-cluster
      context: prod-context
    auth:
      type: bearer
      credentials: SECRET_REF_K8S_TOKEN

  - type: kubernetes
    namespace: monitoring
    capabilities:
      - get_pods
      - get_logs
    config:
      read_only: true
```

**Common capabilities:**
- `get_pods`, `get_deployments`, `get_services`
- `describe_pod`, `describe_deployment`
- `get_logs`, `exec_pod`
- `scale_deployment`
- `apply_manifest`, `delete_resource`

**Security note:** Always use `read_only: true` in config unless write access is required.

### HTTP API

RESTful or GraphQL HTTP endpoints.

```yaml
tools:
  - type: http
    name: github-api
    endpoint: https://api.github.com
    capabilities:
      - create_issue
      - list_pull_requests
      - get_repository
    auth:
      type: bearer
      credentials: SECRET_REF_GITHUB_TOKEN
    config:
      rate_limit: 5000
      timeout: 30

  - type: http
    name: internal-analytics
    endpoint: https://analytics.internal.example.com/api/v1
    capabilities:
      - query_metrics
      - get_dashboard
    auth:
      type: oauth2
      credentials: SECRET_REF_OAUTH_CLIENT
    config:
      retry_attempts: 3
```

### gRPC

gRPC service endpoints.

```yaml
tools:
  - type: grpc
    name: recommendation-engine
    endpoint: grpc://recommendations.example.com:9090
    capabilities:
      - get_recommendations
      - update_preferences
    auth:
      type: mtls
      credentials: SECRET_REF_GRPC_CERT
    config:
      timeout: 10
      max_message_size: 4194304

  - type: grpc
    name: data-pipeline
    endpoint: grpc://pipeline.internal:50051
    capabilities:
      - trigger_job
      - get_job_status
    auth:
      type: none
```

### Function

Platform-specific function calls. Implementation varies by deployment platform.

```yaml
tools:
  - type: function
    name: send_email
    capabilities:
      - compose
      - send
      - validate_address
    config:
      smtp_server: smtp.example.com
      from_address: agent@example.com
    auth:
      type: apikey
      credentials: SECRET_REF_SMTP_KEY

  - type: function
    name: analyze_sentiment
    capabilities:
      - analyze_text
      - batch_analyze
    config:
      model: sentiment-v2
      threshold: 0.7
```

### Custom

Framework or platform-specific tools.

```yaml
tools:
  - type: custom
    name: drupal_content_api
    capabilities:
      - create_node
      - update_node
      - query_entities
    config:
      content_types:
        - article
        - page
      permissions:
        - view_content
        - create_content
```

## Complete Examples

### Code Review Agent

```yaml
spec:
  role: You are a code review specialist.

  tools:
    # Read source code
    - type: mcp
      server: filesystem
      capabilities:
        - read_file
        - list_directory
        - search_files

    # Analyze git history
    - type: mcp
      server: git
      capabilities:
        - git_diff
        - git_log
        - git_blame

    # GitHub integration
    - type: http
      name: github-api
      endpoint: https://api.github.com
      capabilities:
        - get_pull_request
        - list_files
        - create_review_comment
      auth:
        type: bearer
        credentials: SECRET_REF_GITHUB_TOKEN

    # Static analysis
    - type: http
      name: sonarqube
      endpoint: https://sonarqube.example.com/api
      capabilities:
        - analyze_code
        - get_issues
      auth:
        type: apikey
        credentials: SECRET_REF_SONARQUBE_KEY
```

### DevOps Troubleshooting Agent

```yaml
spec:
  role: You are a Kubernetes troubleshooting expert.

  tools:
    # Kubernetes access
    - type: kubernetes
      namespace: production
      capabilities:
        - get_pods
        - get_logs
        - describe_pod
        - get_events
      config:
        read_only: true
      auth:
        type: bearer
        credentials: SECRET_REF_K8S_PROD_TOKEN

    # Metrics
    - type: http
      name: prometheus
      endpoint: https://prometheus.example.com
      capabilities:
        - query
        - query_range
      config:
        timeout: 30

    # Logs
    - type: http
      name: loki
      endpoint: https://loki.example.com
      capabilities:
        - query_logs
        - label_values

    # Alert on-call
    - type: http
      name: pagerduty
      endpoint: https://api.pagerduty.com
      capabilities:
        - get_incidents
        - create_incident
        - update_incident
      auth:
        type: bearer
        credentials: SECRET_REF_PAGERDUTY_TOKEN
```

### Data Analysis Agent

```yaml
spec:
  role: You are a data analyst assistant.

  tools:
    # Primary database
    - type: mcp
      server: postgres
      namespace: analytics
      capabilities:
        - query
        - get_schema
        - explain_query
      config:
        database: warehouse
        read_only: true
        query_timeout: 60
      auth:
        type: apikey
        credentials: SECRET_REF_POSTGRES_KEY

    # Cache layer
    - type: mcp
      server: redis
      capabilities:
        - get
        - set
        - delete
      config:
        ttl: 3600

    # Visualization API
    - type: http
      name: metabase
      endpoint: https://metabase.example.com/api
      capabilities:
        - create_question
        - get_dashboard
        - export_csv
      auth:
        type: apikey
        credentials: SECRET_REF_METABASE_KEY
```

### Customer Support Agent

```yaml
spec:
  role: You are a customer support specialist.

  tools:
    # CRM
    - type: http
      name: salesforce
      endpoint: https://example.salesforce.com/services/data/v58.0
      capabilities:
        - search_accounts
        - get_case
        - create_case
        - update_case
      auth:
        type: oauth2
        credentials: SECRET_REF_SALESFORCE_OAUTH

    # Knowledge base
    - type: mcp
      server: confluence
      capabilities:
        - search_pages
        - get_page_content
      config:
        space: SUPPORT

    # Ticketing
    - type: http
      name: zendesk
      endpoint: https://example.zendesk.com/api/v2
      capabilities:
        - search_tickets
        - create_ticket
        - update_ticket
        - add_comment
      auth:
        type: apikey
        credentials: SECRET_REF_ZENDESK_KEY

    # Communication
    - type: function
      name: send_email
      capabilities:
        - compose
        - send
    - type: function
      name: send_sms
      capabilities:
        - send
      config:
        provider: twilio
      auth:
        type: apikey
        credentials: SECRET_REF_TWILIO_KEY
```

## Capabilities

The `capabilities` array lists specific operations available from the tool. This enables:

1. **Granular permissions** - Limit agent to specific operations
2. **Documentation** - Self-documenting tool usage
3. **Routing** - Map agent needs to tool capabilities
4. **Validation** - Ensure required capabilities are available

```yaml
tools:
  # Full access
  - type: mcp
    server: filesystem
    capabilities:
      - read_file
      - write_file
      - list_directory
      - search_files
      - delete_file

  # Read-only access
  - type: mcp
    server: filesystem
    capabilities:
      - read_file
      - list_directory
      - search_files
```

If `capabilities` is omitted, all tool operations are available (subject to `auth` and `autonomy` constraints).

## Configuration

The `config` object provides tool-specific settings. Structure varies by tool type.

```yaml
tools:
  - type: mcp
    server: postgres
    config:
      database: analytics
      read_only: true
      query_timeout: 60
      max_rows: 10000
      pool_size: 10

  - type: http
    name: external-api
    endpoint: https://api.example.com
    config:
      timeout: 30
      retry_attempts: 3
      retry_delay: 1000
      rate_limit: 1000
      headers:
        User-Agent: OSSA-Agent/1.0
        Accept: application/json
```

## Authentication

The `auth` object configures authentication. **Never include actual credentials** - use secret references.

### Bearer Token

```yaml
auth:
  type: bearer
  credentials: SECRET_REF_API_TOKEN
```

### OAuth2

```yaml
auth:
  type: oauth2
  credentials: SECRET_REF_OAUTH_CLIENT
```

Platform-specific OAuth2 config goes in tool `config`:

```yaml
auth:
  type: oauth2
  credentials: SECRET_REF_OAUTH
config:
  oauth:
    token_url: https://oauth.example.com/token
    scopes:
      - read:data
      - write:data
```

### mTLS (Mutual TLS)

```yaml
auth:
  type: mtls
  credentials: SECRET_REF_TLS_CERT
```

### API Key

```yaml
auth:
  type: apikey
  credentials: SECRET_REF_API_KEY
```

Key placement (header/query) is configured in tool `config`:

```yaml
auth:
  type: apikey
  credentials: SECRET_REF_KEY
config:
  api_key_header: X-API-Key
  # OR
  api_key_param: apikey
```

### No Authentication

```yaml
auth:
  type: none
```

## Secret References

All credential values in `auth.credentials` are **references** to secrets managed by the deployment platform:

```yaml
# ❌ NEVER do this
auth:
  credentials: "ghp_abc123xyz789"

# ✅ Always use references
auth:
  credentials: SECRET_REF_GITHUB_TOKEN
```

**Secret management varies by platform:**

- **Kubernetes:** Kubernetes Secrets or external secret managers
- **Docker:** Docker Secrets or environment variables
- **Cloud:** AWS Secrets Manager, GCP Secret Manager, Azure Key Vault
- **BuildKit:** Token files in `~/.tokens/`

See platform documentation for secret reference format.

## Best Practices

1. **Principle of least privilege** - Grant minimum required capabilities
2. **Read-only by default** - Use `read_only: true` unless write access is needed
3. **Explicit capabilities** - List specific capabilities rather than granting all
4. **Separate concerns** - Use different tools for read vs. write operations
5. **Timeout configuration** - Set reasonable timeouts in `config`
6. **Secret references** - Never hardcode credentials
7. **Namespace isolation** - Use namespaces for multi-tenant deployments
8. **Error handling** - Configure retry logic in `config`
9. **Rate limiting** - Respect API rate limits in `config`
10. **Audit logging** - Enable logging for sensitive tool access

## Validation

Required fields by tool type:

| Tool Type | Required Fields |
|-----------|----------------|
| `mcp` | `type`, `server` |
| `kubernetes` | `type` |
| `http` | `type`, `endpoint` |
| `grpc` | `type`, `endpoint` |
| `function` | `type`, `name` |
| `custom` | `type`, `name` |

## Related Objects

- [Agent Spec](./agent-spec.md) - Parent object containing tools
- [Autonomy](./autonomy.md) - Action permissions for tools
- [MCP Extension](./extensions/mcp.md) - MCP server configuration
- [Constraints](./constraints.md) - Performance and cost limits

## See Also

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Kubernetes API](https://kubernetes.io/docs/reference/)
- [Example Agents](/docs/examples/)
