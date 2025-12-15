# GitLab Ultimate Observability Integration

<!-- AUTO-GENERATED: This file is automatically updated by CI/CD -->
<!-- Version: {{VERSION}} -->
<!-- Last Updated: 2025-12-11 -->

This guide documents how to integrate OSSA agents (v{{VERSION}}) with GitLab Ultimate's observability features, enabling comprehensive monitoring, tracing, and performance analysis of your AI agents.

## Overview

GitLab Ultimate provides built-in observability features that can be integrated with OSSA agents to provide:

- **Distributed Tracing**: Track agent interactions and execution flows
- **Error Tracking**: Aggregate and analyze agent failures
- **Performance Monitoring**: Monitor latency, token usage, and costs
- **Security & Audit**: OIDC authentication and comprehensive audit logging

## Prerequisites

- GitLab Ultimate subscription
- OSSA agents deployed in GitLab CI/CD
- Project-level permissions to manage observability settings

## Quick Start

### 1. Enable Observability Features

In your GitLab project:

1. Navigate to **Settings > Monitor > Observability**
2. Enable the following features:
   - Distributed tracing
   - Error tracking
   - Performance monitoring

### 2. Generate Observability Token

Create a project access token with `api` scope:

1. Go to **Settings > Access Tokens**
2. Create a new token named `GITLAB_OBSERVABILITY_TOKEN`
3. Select scopes: `api`, `read_observability`, `write_observability`
4. Save the token securely in CI/CD variables

### 3. Configure GitLab CI/CD Variables

Add these variables to your project or group CI/CD settings:

| Variable | Value | Protected | Masked |
|----------|-------|-----------|---------|
| `GITLAB_OBSERVABILITY_TOKEN` | Your token | Yes | Yes |
| `OTEL_SERVICE_NAME` | `ossa-agents` | No | No |

## GitLab CI/CD Configuration

### Basic Setup

Add this to your `.gitlab-ci.yml`:

```yaml
variables:
  # OpenTelemetry configuration for GitLab
  OTEL_EXPORTER_OTLP_ENDPOINT: "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/observability/v1/traces"
  OTEL_EXPORTER_OTLP_HEADERS: "PRIVATE-TOKEN=${GITLAB_OBSERVABILITY_TOKEN}"
  OTEL_SERVICE_NAME: "ossa-agents"
  OTEL_RESOURCE_ATTRIBUTES: "deployment.environment=${CI_ENVIRONMENT_NAME},service.namespace=llm-platform"

agent-validation:
  stage: test
  script:
    - ossa validate agents/*.yaml
  artifacts:
    reports:
      junit: test-results.xml

agent-execution:
  stage: deploy
  script:
    - ossa run agents/review-agent.yaml --trace
  environment:
    name: production
  artifacts:
    reports:
      dotenv: agent-trace.env
```

### Advanced Configuration with Agent-Specific Tags

```yaml
variables:
  OTEL_EXPORTER_OTLP_ENDPOINT: "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/observability/v1/traces"
  OTEL_EXPORTER_OTLP_HEADERS: "PRIVATE-TOKEN=${GITLAB_OBSERVABILITY_TOKEN}"
  OTEL_SERVICE_NAME: "ossa-agents"

.agent-base:
  before_script:
    - export OTEL_RESOURCE_ATTRIBUTES="deployment.environment=${CI_ENVIRONMENT_NAME},service.namespace=llm-platform,ossa.agent.name=${AGENT_NAME},ossa.agent.version=${AGENT_VERSION}"

code-review-agent:
  extends: .agent-base
  variables:
    AGENT_NAME: "code-review"
    AGENT_VERSION: "1.0.0"
  script:
    - ossa run agents/code-review-agent.yaml --trace
  environment:
    name: production
  artifacts:
    reports:
      dotenv: code-review-trace.env

documentation-agent:
  extends: .agent-base
  variables:
    AGENT_NAME: "documentation"
    AGENT_VERSION: "1.2.0"
  script:
    - ossa run agents/docs-agent.yaml --trace
  environment:
    name: production
  artifacts:
    reports:
      dotenv: docs-trace.env
```

## Feature Integration

### 1. Tracing Integration

#### Automatic Trace Collection

OSSA agents automatically export traces when the `--trace` flag is used:

```bash
ossa run agents/my-agent.yaml --trace
```

This creates spans for:
- Agent initialization
- Tool invocations
- LLM API calls
- Task executions
- Error conditions

#### Viewing Traces in GitLab

1. Navigate to **Monitor > Tracing**
2. Select the service: `ossa-agents`
3. Filter by:
   - Time range
   - Agent name (`ossa.agent.name`)
   - Environment (`deployment.environment`)
   - Operation type

#### Service Map Visualization

The service map automatically shows:
- Agent dependencies
- LLM provider connections
- External tool integrations
- Request flow patterns

### 2. Error Tracking

#### Automatic Error Capture

Errors are automatically captured and grouped when agents:
- Fail validation
- Encounter runtime errors
- Experience LLM API failures
- Timeout or exceed resource limits

#### Error Grouping

GitLab automatically groups errors by:
- Error type
- Stack trace similarity
- Agent name
- Environment

#### Viewing Errors

1. Navigate to **Monitor > Error Tracking**
2. View error details:
   - Frequency and trends
   - Affected users/environments
   - Stack traces
   - Related spans

#### Setting Up Alerts

Create error rate alerts:

1. Go to **Monitor > Alerts**
2. Create a new alert:
   - **Metric**: Error rate
   - **Threshold**: > 5%
   - **Window**: 5 minutes
   - **Notification**: Slack/Email

### 3. Performance Monitoring

#### Metrics Collected

OSSA agents export the following metrics:

| Metric | Description | Unit |
|--------|-------------|------|
| `agent.execution.duration` | Total execution time | milliseconds |
| `agent.llm.tokens.input` | Input tokens consumed | count |
| `agent.llm.tokens.output` | Output tokens generated | count |
| `agent.llm.cost` | Estimated cost | USD |
| `agent.tool.invocations` | Tool call count | count |
| `agent.tool.duration` | Tool execution time | milliseconds |

#### Creating Dashboards

1. Navigate to **Monitor > Dashboards**
2. Create a new dashboard
3. Add panels for:

**Latency Tracking**:
```promql
histogram_quantile(0.95,
  rate(agent_execution_duration_bucket[5m])
)
```

**Token Usage**:
```promql
sum(rate(agent_llm_tokens_input[5m])) by (agent_name)
```

**Cost Attribution**:
```promql
sum(rate(agent_llm_cost[1h])) by (agent_name, environment)
```

#### Performance Optimization

Use the performance data to:
- Identify slow agents
- Optimize token usage
- Reduce costs
- Improve user experience

### 4. Security & Compliance

#### OIDC Authentication

Enable OIDC for agent authentication:

```yaml
# .gitlab-ci.yml
variables:
  OIDC_TOKEN_ENDPOINT: "${CI_API_V4_URL}/oauth/token"

agent-execution:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  script:
    - ossa run agents/secure-agent.yaml --auth-token $GITLAB_OIDC_TOKEN
```

#### Secret Management

Store sensitive data in GitLab CI/CD variables:

```yaml
variables:
  # Use masked variables for secrets
  ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
  OPENAI_API_KEY: ${OPENAI_API_KEY}
```

Best practices:
- Mark secrets as **Masked** and **Protected**
- Use project/group variables for shared secrets
- Rotate tokens regularly
- Use OIDC tokens when possible

#### Audit Logging

All agent activities are logged:

1. Navigate to **Security & Compliance > Audit Events**
2. Filter by:
   - User/Service account
   - Action type
   - Date range

Audit events include:
- Agent executions
- Configuration changes
- Secret access
- API calls

## Troubleshooting

### Traces Not Appearing

**Issue**: Traces don't show up in GitLab

**Solutions**:
1. Verify `GITLAB_OBSERVABILITY_TOKEN` is set correctly
2. Check token has required scopes: `api`, `write_observability`
3. Ensure `OTEL_EXPORTER_OTLP_ENDPOINT` uses correct project ID
4. Verify observability is enabled in project settings
5. Check agent is run with `--trace` flag

### Authentication Errors

**Issue**: `401 Unauthorized` when exporting traces

**Solutions**:
1. Regenerate observability token
2. Verify token is not expired
3. Check token scope includes `write_observability`
4. Ensure variable is properly masked in CI/CD settings

### High Costs

**Issue**: Unexpected LLM costs

**Solutions**:
1. Review token usage dashboard
2. Identify agents with highest consumption
3. Optimize prompts for efficiency
4. Set up cost alerts
5. Implement token limits in agent configs

### Performance Issues

**Issue**: Slow agent execution

**Solutions**:
1. Check latency dashboard for bottlenecks
2. Review slow traces for specific operations
3. Optimize tool execution
4. Reduce unnecessary LLM calls
5. Use caching where appropriate

## Examples

See the [GitLab CI/CD template](../../examples/observability/gitlab-ci-template.yml) for a complete working example.

## Additional Resources

- [GitLab Observability Documentation](https://docs.gitlab.com/ee/operations/tracing.html)
- [OpenTelemetry Configuration](https://opentelemetry.io/docs/reference/specification/)
- [OSSA Tracing Guide](../spec/v0.3.0/observability.md)
- [Parent Epic](https://gitlab.com/groups/blueflyio/-/epics/10)

## Support

For issues or questions:
- Create an issue: https://gitlab.com/blueflyio/openstandardagents/-/issues
- Email: team@bluefly.io
