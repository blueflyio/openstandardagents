# OSSA v0.3.0 - Quick Reference Card

## Unified LLM Block (Copy-Paste Ready)

```yaml
llm:
  provider: ${LLM_PROVIDER:-anthropic}
  model: ${LLM_MODEL:-claude-sonnet}
  profile: ${LLM_PROFILE:-balanced}
  temperature: ${LLM_TEMPERATURE:-0.1}
  maxTokens: ${LLM_MAX_TOKENS:-16000}
  topP: ${LLM_TOP_P:-0.9}
  
  fallback_models:
    - provider: ${LLM_FALLBACK_PROVIDER_1:-openai}
      model: ${LLM_FALLBACK_MODEL_1:-gpt-4o}
      condition: on_error
    - provider: ${LLM_FALLBACK_PROVIDER_2:-google}
      model: ${LLM_FALLBACK_MODEL_2:-gemini-2.0-flash}
      condition: on_rate_limit
  
  retry_config:
    max_attempts: ${LLM_RETRY_ATTEMPTS:-3}
    backoff_strategy: ${LLM_BACKOFF_STRATEGY:-exponential}
```

## Execution Profiles

```yaml
execution_profile:
  default: ${LLM_PROFILE:-balanced}
  profiles:
    fast:
      maxTokens: 4000
      temperature: 0.0
    balanced:
      maxTokens: 16000
      temperature: 0.1
    deep:
      maxTokens: 32000
      temperature: 0.2
      reasoning_enabled: true
    safe:
      temperature: 0.0
      validation_required: true
```

## Runtime Declaration

```yaml
runtime:
  type: ${AGENT_RUNTIME:-unified}
  supports:
    - google-a2a
    - gitlab-duo
    - ossa-mesh
    - mcp
    - local-execution
  scheduling:
    strategy: ${AGENT_SCHEDULING:-fair}
    priority: ${AGENT_PRIORITY:-normal}
```

## Capabilities (A2A Format)

```yaml
capabilities:
  - name: my_capability
    type: action
    runtime: llm
    description: "What this does"
    input_schema:
      type: object
      required: [param1]
      properties:
        param1:
          type: string
```

## Functions (OpenAI Format)

```yaml
functions:
  - name: my_function
    description: "What this does"
    parameters:
      type: object
      properties:
        param1:
          type: string
      required: [param1]
```

## Extensions

```yaml
extensions:
  - type: http
    name: my-service
    endpoint: ${MY_SERVICE_URL}
    credentials_ref: MY_SERVICE_TOKEN
```

## Environment Variables

```bash
# Primary LLM
export LLM_PROVIDER=anthropic
export LLM_MODEL=claude-sonnet-4
export LLM_PROFILE=balanced

# Fallbacks
export LLM_FALLBACK_PROVIDER_1=openai
export LLM_FALLBACK_MODEL_1=gpt-4o

# Runtime
export AGENT_RUNTIME=unified
export AGENT_SCHEDULING=fair
export AGENT_PRIORITY=normal
```

## Commands

```bash
# Migrate all agents
./scripts/migrate-to-unified-llm.sh

# Generate new agent
./scripts/generate-agent.sh my-agent worker

# Validate
ossa validate examples/

# Run with profile
LLM_PROFILE=deep ossa run agent.yaml
```

## Profile Selection Guide

| Use Case | Profile | Tokens | Temp | Cost |
|----------|---------|--------|------|------|
| Triage | fast | 4K | 0.0 | $ |
| General | balanced | 16K | 0.1 | $$ |
| Analysis | deep | 32K | 0.2 | $$$ |
| Compliance | safe | 16K | 0.0 | $$ |

## Migration Checklist

- [ ] Run `./scripts/migrate-to-unified-llm.sh`
- [ ] Add CI rule to `.gitlab-ci.yml`
- [ ] Update environment variables
- [ ] Test with `ossa validate`
- [ ] Deploy to staging
- [ ] Monitor performance
- [ ] Roll out to production

## CI Rule (Add to .gitlab-ci.yml)

```yaml
include:
  - local: .gitlab/ci/validate-no-hardcoded-models.yml
```

## Complete Example

See: `examples/unified/security-scanner.ossa.yaml`

## Documentation

- Schema: `spec/v0.3.0/UNIFIED-SCHEMA.md`
- Guide: `docs/UNIFIED-AGENT-PLATFORM.md`
- Summary: `IMPLEMENTATION-SUMMARY.md`
