# GitLab Ultimate Observability Integration Guide

Complete guide for integrating OSSA agents with GitLab Ultimate's observability features.

## Table of Contents

1. [OpenTelemetry Integration](#opentelemetry-integration)
2. [Distributed Tracing](#distributed-tracing)
3. [Error Tracking](#error-tracking)
4. [Performance Monitoring](#performance-monitoring)
5. [Cost Attribution](#cost-attribution)
6. [Security & Audit Logging](#security--audit-logging)
7. [CI/CD Configuration](#cicd-configuration)
8. [Dashboard Setup](#dashboard-setup)

---

## OpenTelemetry Integration

### Prerequisites

- GitLab Ultimate subscription
- GitLab Observability enabled for your project
- GitLab access token with `api` and `observability` scopes

### Environment Variables

```yaml
# .gitlab-ci.yml
variables:
  # OpenTelemetry Configuration
  OTEL_EXPORTER_OTLP_ENDPOINT: "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/observability/v1/traces"
  OTEL_EXPORTER_OTLP_HEADERS: "PRIVATE-TOKEN=${GITLAB_OBSERVABILITY_TOKEN}"
  OTEL_SERVICE_NAME: "ossa-agents"
  OTEL_RESOURCE_ATTRIBUTES: "deployment.environment=production,service.namespace=llm-platform,ossa.version=v0.3.0"

  # Agent-Specific Attributes
  OTEL_AGENT_NAME: "${AGENT_NAME}"
  OTEL_AGENT_TYPE: "${AGENT_TYPE}"
  OTEL_COST_TRACKING: "true"
```

### Token Setup

```bash
# Create GitLab access token
# Settings → Access Tokens → Create personal access token

# Scopes required:
# - api
# - read_api
# - read_observability
# - write_observability

# Add to CI/CD variables
# Settings → CI/CD → Variables → Add variable
# Key: GITLAB_OBSERVABILITY_TOKEN
# Value: glpat-xxxxxxxxxxxxxxxxxxxx
# Protected: Yes
# Masked: Yes
```

---

## Distributed Tracing

### Agent Manifest Configuration

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: review-agent
  version: "1.0.0"

spec:
  observability:
    tracing:
      enabled: true
      provider: opentelemetry
      endpoint: "${OTEL_EXPORTER_OTLP_ENDPOINT}"
      headers:
        authorization: "Bearer ${GITLAB_OBSERVABILITY_TOKEN}"
      sampling_rate: 1.0  # 100% sampling in dev, 0.1 (10%) in prod

      # Custom trace attributes
      attributes:
        agent.name: "review-agent"
        agent.type: "code-review"
        agent.version: "1.0.0"
        deployment.environment: "${CI_ENVIRONMENT_NAME}"
        git.commit: "${CI_COMMIT_SHA}"
        git.branch: "${CI_COMMIT_BRANCH}"
```

### W3C Baggage for Agent Handoffs

Track context across agent-to-agent interactions:

```yaml
# Agent A creates baggage
spec:
  observability:
    baggage:
      enabled: true
      propagate:
        - user_id
        - session_id
        - request_id
        - parent_agent
        - workflow_id

# Agent B receives baggage
# Automatically extracts context from W3C Baggage header
```

### Viewing Traces

1. Navigate to: **Monitor → Tracing**
2. Filter by service: `ossa-agents`
3. View trace timeline with agent handoffs
4. Inspect span details (LLM calls, tool usage, costs)

---

## Error Tracking

### Configuration

```yaml
spec:
  observability:
    error_tracking:
      enabled: true
      grouping:
        - error.type
        - error.message
        - agent.name
      alerts:
        - condition: "error_rate > 0.05"  # 5% error rate
          action: create_issue
          severity: high
        - condition: "critical_errors > 0"
          action: page_oncall
          severity: critical
```

### Error Grouping

GitLab automatically groups similar errors:
- Same error type (ValidationError, APIError, etc.)
- Same agent and capability
- Similar stack traces

### Viewing Errors

1. Navigate to: **Monitor → Error Tracking**
2. Filter by agent: `review-agent`
3. View error frequency and trends
4. Click error for stack trace and context

---

## Performance Monitoring

### Metrics Collection

```yaml
spec:
  observability:
    metrics:
      enabled: true
      track_costs: true
      track_latency: true
      track_token_usage: true

      # Custom metrics
      custom_labels:
        agent_type: code-review
        llm_provider: anthropic
        model: claude-3-5-sonnet

      # Performance budgets
      latency_threshold_ms: 5000
      cost_threshold_usd: 0.50
```

### Key Metrics Tracked

| Metric | Description | SLO |
|--------|-------------|-----|
| `agent.latency` | End-to-end agent execution time | P95 < 5s |
| `agent.success_rate` | Successful completions / total runs | > 95% |
| `llm.token_usage` | Tokens consumed per run | < 10k |
| `llm.cost_usd` | Cost per agent run | < $0.50 |
| `tool.execution_time` | Individual tool execution time | P95 < 1s |

### Viewing Dashboards

1. Navigate to: **Monitor → Dashboards**
2. Select: `OSSA Agent Performance`
3. View metrics by agent, environment, time range

---

## Cost Attribution

### Per-Agent Cost Tracking

```yaml
spec:
  constraints:
    max_cost_per_run: 2.00  # USD

  observability:
    metrics:
      track_costs: true
      cost_attribution:
        dimension: agent.name
        aggregation: sum
        period: daily

      # Cost breakdown
      breakdown_by:
        - llm_provider
        - model
        - capability
        - environment
```

### Cost Dashboard

Track LLM costs across all agents:

```sql
-- GitLab Observability Query
SELECT
  agent_name,
  llm_provider,
  model,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost_per_run,
  COUNT(*) as num_runs
FROM agent_metrics
WHERE time >= NOW() - INTERVAL '30 days'
GROUP BY agent_name, llm_provider, model
ORDER BY total_cost DESC
```

### Cost Alerts

```yaml
spec:
  observability:
    metrics:
      alerts:
        - name: high_daily_cost
          condition: "sum(cost_usd) > 100"
          window: 1d
          action: create_issue
        - name: cost_per_run_exceeded
          condition: "cost_usd > max_cost_per_run"
          action: fail_pipeline
```

---

## Security & Audit Logging

### OIDC Authentication

Use GitLab CI OIDC tokens instead of long-lived tokens:

```yaml
# .gitlab-ci.yml
run-agent:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  script:
    - |
      # Agent authenticates with OIDC token
      export GITLAB_TOKEN="${GITLAB_OIDC_TOKEN}"
      ossa run agent.yaml --trace
```

### Audit Logging

```yaml
spec:
  observability:
    logging:
      level: info
      structured: true
      format: json

      # Fields to log
      include_fields:
        - timestamp
        - agent.name
        - user.id
        - action
        - resource
        - result
        - duration_ms
        - cost_usd

      # Sensitive data redaction
      redact_fields:
        - api_keys
        - tokens
        - passwords
        - secrets
```

### Viewing Audit Logs

1. Navigate to: **Security & Compliance → Audit Events**
2. Filter by: `service.name = ossa-agents`
3. Search for specific agent actions

---

## CI/CD Configuration

### Complete CI/CD Example

```yaml
# .gitlab-ci.yml
variables:
  NODE_VERSION: "22"
  OTEL_EXPORTER_OTLP_ENDPOINT: "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/observability/v1/traces"
  OTEL_EXPORTER_OTLP_HEADERS: "PRIVATE-TOKEN=${GITLAB_OBSERVABILITY_TOKEN}"
  OTEL_SERVICE_NAME: "ossa-ci"

stages:
  - validate
  - test
  - deploy

validate:agents:
  stage: validate
  image: node:${NODE_VERSION}
  before_script:
    - npm ci
    - npm run build
  script:
    - |
      echo "🔍 Validating OSSA agents with observability..."

      # Validate all agent manifests
      for agent in .gitlab/agents/tasks/*.ossa.yaml; do
        echo "Validating: $agent"
        ossa validate "$agent" --trace
      done

      echo "✅ All agents valid"
  artifacts:
    reports:
      dotenv: trace-context.env
    paths:
      - traces/
    expire_in: 7 days

run:code-review-agent:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - |
      export AGENT_NAME="code-review-agent"
      export OTEL_RESOURCE_ATTRIBUTES="agent.name=${AGENT_NAME},pipeline.id=${CI_PIPELINE_ID},mr.iid=${CI_MERGE_REQUEST_IID}"

      echo "🤖 Running code review agent..."
      ossa run .gitlab/agents/tasks/code-review-agent.ossa.yaml \
        --trace \
        --mr ${CI_MERGE_REQUEST_IID}
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  allow_failure: true
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: ${CI_MERGE_REQUEST_PROJECT_URL}/-/merge_requests/${CI_MERGE_REQUEST_IID}

deploy:release-agent:
  stage: deploy
  image: node:${NODE_VERSION}
  script:
    - |
      export AGENT_NAME="release-agent"
      export OTEL_RESOURCE_ATTRIBUTES="agent.name=${AGENT_NAME},environment=production"

      echo "🚀 Running release agent..."
      ossa run .gitlab/agents/tasks/release-agent.ossa.yaml \
        --trace \
        --version ${CI_COMMIT_TAG}
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
  environment:
    name: production
    url: https://www.npmjs.com/package/@bluefly/openstandardagents
```

---

## Dashboard Setup

### Creating Custom Dashboards

1. Navigate to: **Monitor → Dashboards → New dashboard**
2. Add panels for key metrics
3. Configure queries and visualizations

### Example Dashboard Configuration

```yaml
# dashboard.yaml
title: OSSA Agent Performance
description: Real-time metrics for all OSSA agents
time_range: 24h

panels:
  - title: Agent Success Rate
    type: timeseries
    query: |
      SELECT
        agent_name,
        100 * COUNT(CASE WHEN status = 'success' THEN 1 END) / COUNT(*) as success_rate
      FROM agent_runs
      WHERE time >= NOW() - INTERVAL '24 hours'
      GROUP BY agent_name, time_bucket(5m, time)

  - title: Average Latency by Agent
    type: timeseries
    query: |
      SELECT
        agent_name,
        AVG(duration_ms) as avg_latency_ms
      FROM agent_runs
      WHERE time >= NOW() - INTERVAL '24 hours'
      GROUP BY agent_name, time_bucket(5m, time)

  - title: Cost per Agent (Last 24h)
    type: bar
    query: |
      SELECT
        agent_name,
        SUM(cost_usd) as total_cost_usd
      FROM agent_runs
      WHERE time >= NOW() - INTERVAL '24 hours'
      GROUP BY agent_name
      ORDER BY total_cost_usd DESC

  - title: Error Rate
    type: timeseries
    query: |
      SELECT
        agent_name,
        100 * COUNT(CASE WHEN status = 'error' THEN 1 END) / COUNT(*) as error_rate
      FROM agent_runs
      WHERE time >= NOW() - INTERVAL '24 hours'
      GROUP BY agent_name, time_bucket(5m, time)

  - title: Token Usage
    type: timeseries
    query: |
      SELECT
        agent_name,
        model,
        SUM(tokens_used) as total_tokens
      FROM agent_runs
      WHERE time >= NOW() - INTERVAL '24 hours'
      GROUP BY agent_name, model, time_bucket(1h, time)
```

---

## Troubleshooting

### Common Issues

**Issue**: Traces not appearing in GitLab

**Solution**:
```bash
# Verify OTEL endpoint is reachable
curl -X POST ${OTEL_EXPORTER_OTLP_ENDPOINT} \
  -H "PRIVATE-TOKEN: ${GITLAB_OBSERVABILITY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"test": "trace"}'

# Check token has correct scopes
glab api user --header "PRIVATE-TOKEN: ${GITLAB_OBSERVABILITY_TOKEN}"
```

**Issue**: High agent costs

**Solution**:
- Reduce `temperature` to lower randomness
- Use `max_tokens` constraints
- Cache LLM responses
- Use smaller models for simple tasks
- Implement request deduplication

**Issue**: Agent errors not tracked

**Solution**:
```yaml
# Ensure error tracking enabled
spec:
  observability:
    error_tracking:
      enabled: true
    logging:
      level: error  # Capture all errors
```

---

## Best Practices

1. **Always enable tracing in CI/CD**: Helps debug agent failures
2. **Set cost constraints**: Prevent runaway LLM costs
3. **Use structured logging**: Makes log analysis easier
4. **Monitor error rates**: Set up alerts for >5% error rate
5. **Track token usage**: Optimize prompts to reduce costs
6. **Use OIDC tokens**: More secure than long-lived tokens
7. **Redact sensitive data**: Never log secrets or PII
8. **Create custom dashboards**: Visualize metrics specific to your agents
9. **Set up alerts**: Get notified of failures proactively
10. **Review costs weekly**: Identify expensive agents and optimize

---

## Additional Resources

- [GitLab Observability Documentation](https://docs.gitlab.com/ee/operations/observability/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OSSA Observability Specification](../spec/v0.3.0/observability.md)
- [Agent Best Practices](./BEST-PRACTICES.md)

---

**Need Help?**

- Create an issue: https://gitlab.com/blueflyio/openstandardagents/-/issues
- Slack: #ossa-support
- Email: support@openstandardagents.org
