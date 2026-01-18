# OpenStandardAgents Validator (v0.3.x) - GitLab Agent

**Public Agent**: Any project can use this agent to validate OSSA v0.3.x manifests

## Agent Information

- **Display Name**: OpenStandardAgents Validator (v0.3.x)
- **Managed By**: Bluefly.io / OssA / Open Standard Agents
- **Visibility**: Public - Anyone can view and use
- **Type**: External Agent (Kubernetes-backed)

## What This Agent Does

Validates OSSA v0.3.x manifests including:
- ✅ Schema compliance (apiVersion, kind, metadata, spec)
- ✅ LLM configuration with env var support
- ✅ Capabilities, tools (MCP), and autonomy settings
- ✅ Observability (telemetry, tracing, metrics)
- ✅ Safety guardrails (PII, secrets, prompt injection)
- ✅ Cost tracking and A2A messaging
- ✅ Runtime bindings validation
- ✅ Visibility & access controls

## How to Use (Any Project)

### 1. Trigger via Assign Reviewer

In your GitLab MR, assign the OSSA Validator agent as a reviewer:

```markdown
@blueflyio/ossa/openstandardagents/agent-validator
```

The agent will automatically:
1. Scan your MR for .ossa.yaml files
2. Validate all manifests against v0.3.x schema
3. Post validation results as MR comments
4. Approve if all manifests pass

### 2. Trigger via Mention

In any MR comment:

```markdown
@blueflyio/ossa/openstandardagents/agent-validator validate
```

### 3. Use in CI/CD Pipeline

Add to your `.gitlab-ci.yml`:

```yaml
validate:ossa:
  stage: validate
  image: alpine:latest
  script:
    - apk add --no-cache curl jq
    - |
      curl -X POST "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}/notes" \
        --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
        --data "body=@blueflyio/ossa/openstandardagents/agent-validator validate"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - "**/*.ossa.yaml"
```

## Configuration

The agent uses two environments:

### Local Development (`local/config.yaml`)
- Runs on OrbStack K8s
- Validates manifests locally
- Debug logging enabled

### Production (`production/config.yaml`)
- Runs on GitLab's production K8s
- Handles validation for public projects
- Info-level logging

## For Project Owners

To use this agent in your project, add to `.gitlab-ci.yml`:

```yaml
include:
  - remote: 'https://gitlab.com/blueflyio/ossa/openstandardagents/-/raw/main/.gitlab/agent-k8s/ci-template.yml'

variables:
  OSSA_VALIDATION_ENABLED: "true"
  OSSA_VALIDATION_STRICT: "false"  # Set to "true" to fail on warnings
```

## Agent Capabilities

| Feature | Supported |
|---------|-----------|
| Schema validation | ✅ |
| LLM config validation | ✅ |
| Tool validation (MCP) | ✅ |
| Safety checks | ✅ |
| Cost estimates | ✅ |
| Multi-file validation | ✅ |
| Auto-fix suggestions | ✅ |
| GitLab Duo integration | ✅ |

## Validation Rules

The agent validates:

1. **Required Fields**
   - apiVersion: ossa/v0.3.x
   - kind: Agent|Task|Workflow
   - metadata.name

2. **LLM Configuration**
   - Valid provider (anthropic, openai, azure, google, etc.)
   - Valid model name
   - Environment variable interpolation

3. **Safety Guardrails**
   - PII detection in prompts
   - Secret detection
   - Prompt injection attempts
   - Rate limiting configuration

4. **Observability**
   - Telemetry endpoints
   - Tracing configuration
   - Metrics exporters

5. **Cost Controls**
   - Budget limits
   - Cost thresholds
   - Token limits

## Example Output

```markdown
### OSSA Validation Results

✅ **agent.ossa.yaml**: Valid OSSA v0.3.5 manifest
- Schema: Valid
- LLM Config: anthropic/claude-opus-4 (✅)
- Tools: 3 tools validated
- Safety: Guardrails configured
- Cost: $0.05 estimated per run

⚠️ **workflow.ossa.yaml**: Valid with warnings
- Schema: Valid
- Warning: Consider adding cost_threshold_usd
- Warning: No guardrails configured

❌ **invalid.ossa.yaml**: Validation failed
- Error: Missing required field `metadata.name`
- Error: Invalid apiVersion (expected ossa/v0.3.x)
- Suggestion: Run `ossa migrate invalid.ossa.yaml --to v0.3.5`
```

## Maintenance

Managed by the OSSA core team. Issues and feature requests:
https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
