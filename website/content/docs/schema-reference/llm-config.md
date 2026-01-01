---
title: "LLM Configuration"
description: "Unified LLM configuration - runtime-configurable, multi-provider support"
weight: 3
---

# Unified LLM Configuration

The `llm` object in `spec.llm` configures the language model provider and generation parameters for the agent. OSSA v0.3.2 introduces a **unified LLM configuration** that eliminates hardcoded model names and enables runtime model selection.

## Key Features (v0.3.2)

- **Runtime-configurable models** - No hardcoded provider or model names
- **Environment variable substitution** - Configure via `${ENV_VAR:-default}`
- **Fallback models** - Automatic failover to backup providers
- **Retry configuration** - Configurable retry behavior with backoff strategies
- **Cross-platform compatibility** - Works with OSSA, GitLab Duo, Google A2A, and MCP

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `provider` | string | **Yes** | LLM provider name (runtime-configurable via env var) |
| `model` | string | **Yes** | Model identifier (runtime-configurable via env var) |
| `profile` | string (enum) | No | Execution profile: `fast`, `balanced`, `deep`, `safe` |
| `temperature` | number | No | Sampling temperature. Range: 0-2 |
| `maxTokens` | integer | No | Maximum tokens per response |
| `topP` | number | No | Nucleus sampling parameter. Range: 0-1 |
| `fallback_models` | array | No | Fallback model configurations |
| `retry_config` | object | No | Retry behavior configuration |
| `frequencyPenalty` | number | No | Frequency penalty. Range: -2 to 2 |
| `presencePenalty` | number | No | Presence penalty. Range: -2 to 2 |

## Runtime Configuration with Environment Variables

OSSA v0.3.2 supports environment variable substitution for all LLM configuration fields. This enables runtime model selection without code changes.

### Basic Syntax

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: configurable-agent
  version: 1.0.0
spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4}
    temperature: ${LLM_TEMPERATURE:-0.1}
    maxTokens: ${LLM_MAX_TOKENS:-16000}
    topP: ${LLM_TOP_P:-0.9}
```

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `anthropic` | Provider name |
| `LLM_MODEL` | `claude-sonnet` | Model identifier |
| `LLM_PROFILE` | `balanced` | Execution profile |
| `LLM_TEMPERATURE` | `0.1` | Sampling temperature |
| `LLM_MAX_TOKENS` | `16000` | Max tokens |
| `LLM_TOP_P` | `0.9` | Nucleus sampling |
| `LLM_RETRY_ATTEMPTS` | `3` | Max retry attempts |
| `LLM_BACKOFF_STRATEGY` | `exponential` | Backoff strategy |

## Execution Profiles

Profiles provide task-specific optimization compatible with Google A2A:

```yaml
spec:
  llm:
    provider: anthropic
    model: claude-sonnet-4
    profile: ${LLM_PROFILE:-balanced}
```

| Profile | Use Case | Behavior |
|---------|----------|----------|
| `fast` | Quick responses, high throughput | Lower temperature, shorter context |
| `balanced` | General purpose (default) | Moderate settings |
| `deep` | Complex reasoning, analysis | Higher temperature, longer context |
| `safe` | Sensitive content, compliance | Conservative settings, extra validation |

## Fallback Models Configuration

Configure automatic failover when the primary model fails:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: resilient-agent
  version: 1.0.0
spec:
  llm:
    provider: anthropic
    model: claude-sonnet-4
    temperature: 0.3
    maxTokens: 8192

    fallback_models:
      - provider: openai
        model: gpt-4o
        condition: on_error

      - provider: anthropic
        model: claude-haiku-3
        condition: on_rate_limit

      - provider: groq
        model: llama-3.3-70b
        condition: on_timeout
```

### Fallback Conditions

| Condition | Trigger |
|-----------|---------|
| `on_error` | Any error from primary model |
| `on_timeout` | Request timeout exceeded |
| `on_rate_limit` | Rate limit reached |
| `always` | Always use as secondary (load balancing) |

## Retry Configuration

Configure retry behavior for transient failures:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: reliable-agent
  version: 1.0.0
spec:
  llm:
    provider: anthropic
    model: claude-sonnet-4

    retry_config:
      max_attempts: ${LLM_RETRY_ATTEMPTS:-3}
      backoff_strategy: ${LLM_BACKOFF_STRATEGY:-exponential}
```

### Backoff Strategies

| Strategy | Behavior |
|----------|----------|
| `exponential` | Wait times increase exponentially (1s, 2s, 4s, 8s...) |
| `linear` | Wait times increase linearly (1s, 2s, 3s, 4s...) |
| `constant` | Fixed wait time between retries |

## Provider-Specific Models

### Anthropic

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: anthropic-agent
spec:
  llm:
    provider: anthropic
    model: claude-sonnet-4
    # model: claude-haiku-3
    # model: claude-opus-4
    temperature: 0.3
    maxTokens: 8192
```

**Supported models:**
- `claude-sonnet-4` - Latest Claude Sonnet (recommended)
- `claude-haiku-3` - Fastest, most economical
- `claude-opus-4` - Most capable

### OpenAI

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: openai-agent
spec:
  llm:
    provider: openai
    model: gpt-4o
    # model: gpt-4o-mini
    temperature: 0.7
    maxTokens: 4096
```

**Supported models:**
- `gpt-4o` - Most capable, multimodal
- `gpt-4o-mini` - Fast and cost-effective
- `gpt-4-turbo` - High capability with vision

### Google

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: google-agent
spec:
  llm:
    provider: google
    model: gemini-2.0-flash
    # model: gemini-1.5-pro
    temperature: 0.5
    maxTokens: 8192
```

**Supported models:**
- `gemini-2.0-flash` - Latest Gemini Flash
- `gemini-1.5-pro` - Most capable Gemini

### Groq

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: groq-agent
spec:
  llm:
    provider: groq
    model: llama-3.3-70b
    # model: mixtral-8x7b
    temperature: 0.5
    maxTokens: 4096
```

**Supported models:**
- `llama-3.3-70b` - Meta's Llama 3.3 70B
- `mixtral-8x7b` - Mistral mixture of experts

### Ollama (Self-Hosted)

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: ollama-agent
spec:
  llm:
    provider: ollama
    model: llama3.1:70b
    temperature: 0.8
    maxTokens: 4096
```

### AWS Bedrock

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: bedrock-agent
spec:
  llm:
    provider: bedrock
    model: anthropic.claude-3-sonnet-20240229-v1:0
    temperature: 0.3
    maxTokens: 4096
```

### Azure OpenAI

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: azure-agent
spec:
  llm:
    provider: azure
    model: gpt-4                     # Deployment name in Azure
    temperature: 0.7
    maxTokens: 4096
```

**Note:** For Azure OpenAI, `model` is your deployment name, not the base model name.

### Custom Provider

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: custom-agent
spec:
  llm:
    provider: custom
    model: my-fine-tuned-model
    temperature: 0.5
    maxTokens: 2048

extensions:
  custom_provider:
    endpoint: https://llm.example.com/v1
    api_key: SECRET_REF_CUSTOM_LLM
```

## Parameter Details

### temperature

Controls randomness in output generation.

- **Range:** 0.0 to 2.0
- **Lower values (0.0-0.3):** Deterministic, focused, consistent
- **Medium values (0.4-0.9):** Balanced creativity and coherence
- **Higher values (1.0-2.0):** Creative, diverse, less predictable

### maxTokens

Maximum tokens in the response (output only for most providers).

- **Type:** Positive integer
- **Constraints:** Model-dependent
- **Consider:** Cost per token varies by model

### topP (Nucleus Sampling)

Alternative to temperature. Considers tokens with top P probability mass.

- **Range:** 0.0 to 1.0
- **Best practice:** Use either `temperature` OR `topP`, not both

### frequencyPenalty

Reduces likelihood of repeating tokens based on frequency.

- **Range:** -2.0 to 2.0
- **Positive values:** Reduce repetition
- **0.0:** No penalty (default)

### presencePenalty

Reduces likelihood of repeating topics/concepts.

- **Range:** -2.0 to 2.0
- **Positive values:** Encourage topic diversity
- **0.0:** No penalty (default)

## Common Configurations

### Code Generation

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: code-generator
spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4}
    temperature: 0.2
    maxTokens: 8192
    profile: deep

    fallback_models:
      - provider: openai
        model: gpt-4o
        condition: on_error
```

### Customer Support

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: support-agent
spec:
  llm:
    provider: anthropic
    model: claude-haiku-3
    temperature: 0.7
    maxTokens: 1024
    profile: fast

    retry_config:
      max_attempts: 5
      backoff_strategy: linear
```

### Data Analysis

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: analyst
spec:
  llm:
    provider: openai
    model: gpt-4o
    temperature: 0.3
    maxTokens: 4096
    profile: balanced
    frequencyPenalty: 0.5
```

### Multi-Provider Resilience

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: resilient-agent
spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4}
    temperature: 0.3
    maxTokens: 8192

    fallback_models:
      - provider: openai
        model: gpt-4o
        condition: on_error

      - provider: groq
        model: llama-3.3-70b
        condition: on_rate_limit

      - provider: ollama
        model: llama3.1:70b
        condition: on_timeout

    retry_config:
      max_attempts: 3
      backoff_strategy: exponential
```

## Complete Example

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: technical-writer
  version: 1.0.0
spec:
  role: |
    You are a technical documentation specialist.
    Create clear, accurate, and well-structured documentation.

  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4}
    profile: balanced
    temperature: 0.4
    maxTokens: 8192
    topP: 0.9

    fallback_models:
      - provider: openai
        model: gpt-4o
        condition: on_error

    retry_config:
      max_attempts: 3
      backoff_strategy: exponential

  tools:
    - type: mcp
      server: filesystem
      capabilities:
        - read_file
        - write_file

  constraints:
    cost:
      maxTokensPerDay: 10000000
      maxCostPerDay: 150.0
      currency: USD
```

## Provider Extensions

For provider-specific features not covered in the base schema, use extensions:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: extended-agent
spec:
  llm:
    provider: anthropic
    model: claude-sonnet-4
    temperature: 0.3
    maxTokens: 8192

extensions:
  anthropic:
    enabled: true
    streaming: true
    stop_sequences:
      - "\n\nHuman:"
      - "\n\nAssistant:"
```

See [Anthropic Extension](./extensions/anthropic.md) for details.

## Cross-Platform Compatibility

The unified LLM configuration is designed to work across multiple platforms:

| Platform | Compatibility | Notes |
|----------|--------------|-------|
| **OSSA** | Native | Full support |
| **GitLab Duo** | Compatible | Via adapter |
| **Google A2A** | Compatible | Profile mapping |
| **MCP** | Compatible | Tool integration |

## Validation

Required fields:
- `provider` - Non-empty string
- `model` - Non-empty string

Optional field constraints:
- `temperature`: 0 <= value <= 2
- `maxTokens`: value >= 1
- `topP`: 0 <= value <= 1
- `frequencyPenalty`: -2 <= value <= 2
- `presencePenalty`: -2 <= value <= 2
- `profile`: One of `fast`, `balanced`, `deep`, `safe`
- `fallback_models[].condition`: One of `on_error`, `on_timeout`, `on_rate_limit`, `always`
- `retry_config.backoff_strategy`: One of `exponential`, `linear`, `constant`

Validate your configuration:

```bash
ossa validate agent.ossa.yaml
```

## Related Objects

- [Agent Spec](./agent-spec.md) - Parent object containing LLM config
- [Constraints](./constraints.md) - Cost and performance limits
- [Extensions](./extensions/) - Provider-specific features
- [Anthropic Extension](./extensions/anthropic.md) - Claude-specific config
- [OpenAI Agents Extension](./extensions/openai-agents.md) - OpenAI SDK config

## Best Practices

1. **Use environment variables** - Configure `provider` and `model` via env vars for flexibility
2. **Configure fallbacks** - Set up fallback models for production resilience
3. **Enable retries** - Use exponential backoff for transient failures
4. **Match profile to task** - Use `fast` for quick responses, `deep` for analysis
5. **Start conservative** - Use lower temperature (0.2-0.3) for deterministic tasks
6. **Monitor costs** - Set `maxTokens` appropriately and use constraints
7. **Use smaller models** - Use `claude-haiku-3` or `gpt-4o-mini` for simple tasks
8. **Avoid mixing** - Don't use both `temperature` and `topP` simultaneously
9. **Plan for failures** - Configure both fallbacks and retries
10. **Document choices** - Add comments explaining parameter selections
