---
title: "LLM Configuration"
description: "Language model provider and parameter configuration"
weight: 3
---

# LLM Configuration Object

The `llm` object in `spec.llm` configures the language model provider and generation parameters for the agent.

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `provider` | string (enum) | **Yes** | LLM provider: `openai`, `anthropic`, `google`, `azure`, `ollama`, or `custom` |
| `model` | string | **Yes** | Model identifier (provider-specific). Examples: `gpt-4o`, `claude-3-5-sonnet-20241022`, `gemini-pro` |
| `temperature` | number | No | Sampling temperature for response generation. Range: 0-2. Default varies by provider |
| `maxTokens` | integer | No | Maximum tokens per request. Minimum: 1. Default varies by model |
| `topP` | number | No | Nucleus sampling parameter. Range: 0-1. Alternative to temperature |
| `frequencyPenalty` | number | No | Frequency penalty for token generation. Range: -2 to 2. Reduces repetition |
| `presencePenalty` | number | No | Presence penalty for token generation. Range: -2 to 2. Encourages topic diversity |

## Provider-Specific Models

### OpenAI

```yaml
llm:
  provider: openai
  model: gpt-4o                    # Latest GPT-4 Omni
  # model: gpt-4o-mini             # Efficient GPT-4 Omni
  # model: gpt-4-turbo             # GPT-4 Turbo
  # model: gpt-3.5-turbo           # GPT-3.5 Turbo
  temperature: 0.7
  maxTokens: 4096
  topP: 0.9
  frequencyPenalty: 0.0
  presencePenalty: 0.0
```

**Common OpenAI models:**
- `gpt-4o` - Most capable, multimodal
- `gpt-4o-mini` - Fast and cost-effective
- `gpt-4-turbo` - High capability with vision
- `gpt-4` - Original GPT-4
- `gpt-3.5-turbo` - Fast, economical

### Anthropic

```yaml
llm:
  provider: anthropic
  model: claude-3-5-sonnet-20241022
  # model: claude-3-5-haiku-20241022
  # model: claude-3-opus-20240229
  # model: claude-3-sonnet-20240229
  # model: claude-3-haiku-20240307
  temperature: 1.0
  maxTokens: 8192
```

**Common Anthropic models:**
- `claude-3-5-sonnet-20241022` - Latest Sonnet (highest intelligence)
- `claude-3-5-haiku-20241022` - Latest Haiku (fastest)
- `claude-3-opus-20240229` - Most capable Claude 3
- `claude-3-sonnet-20240229` - Balanced performance
- `claude-3-haiku-20240307` - Fastest, most economical

**Note:** Anthropic uses `maxTokens` for output tokens only. Input + output must be within model context window (200K tokens for Claude 3.5).

### Google

```yaml
llm:
  provider: google
  model: gemini-1.5-pro
  # model: gemini-1.5-flash
  # model: gemini-pro
  temperature: 0.9
  maxTokens: 8192
  topP: 0.95
```

**Common Google models:**
- `gemini-1.5-pro` - Most capable Gemini 1.5
- `gemini-1.5-flash` - Fast multimodal model
- `gemini-pro` - Production-ready Gemini Pro

### Azure OpenAI

```yaml
llm:
  provider: azure
  model: gpt-4                     # Deployment name in Azure
  temperature: 0.7
  maxTokens: 4096
```

**Note:** For Azure OpenAI, `model` is your deployment name, not the base model name.

### Ollama (Local/Self-Hosted)

```yaml
llm:
  provider: ollama
  model: llama3.1:70b
  # model: mixtral:8x7b
  # model: codellama:34b
  # model: mistral:7b
  temperature: 0.8
  maxTokens: 4096
```

**Common Ollama models:**
- `llama3.1:70b` - Meta's Llama 3.1 70B
- `llama3.1:8b` - Smaller, faster Llama 3.1
- `mixtral:8x7b` - Mistral's mixture of experts
- `codellama:34b` - Code-specialized model
- `mistral:7b` - Efficient general purpose

### Custom Provider

```yaml
llm:
  provider: custom
  model: my-fine-tuned-model
  temperature: 0.5
  maxTokens: 2048
```

Use `custom` for:
- Self-hosted models
- Fine-tuned models
- Custom model endpoints
- Alternative providers

Platform-specific configuration goes in `extensions`:

```yaml
llm:
  provider: custom
  model: my-model

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

**Use cases:**
```yaml
# Code generation - deterministic
llm:
  provider: anthropic
  model: claude-3-5-sonnet-20241022
  temperature: 0.2

# Creative writing - more varied
llm:
  provider: openai
  model: gpt-4o
  temperature: 1.0

# Data extraction - very consistent
llm:
  provider: anthropic
  model: claude-3-haiku-20240307
  temperature: 0.0
```

### maxTokens

Maximum tokens in the response (output only for most providers).

- **Type:** Positive integer
- **Constraints:** Model-dependent
- **Consider:** Cost per token varies by model

**Examples:**
```yaml
# Short responses (chat, Q&A)
llm:
  maxTokens: 512

# Medium responses (summaries, explanations)
llm:
  maxTokens: 2048

# Long responses (documentation, articles)
llm:
  maxTokens: 8192

# Maximum for Claude 3.5 Sonnet
llm:
  maxTokens: 8192
```

### topP (Nucleus Sampling)

Alternative to temperature. Considers tokens with top P probability mass.

- **Range:** 0.0 to 1.0
- **0.1:** Very focused, only highly probable tokens
- **0.5:** Moderate diversity
- **0.9-1.0:** High diversity, includes less likely tokens

**Best practice:** Use either `temperature` OR `topP`, not both.

```yaml
# Focused responses
llm:
  topP: 0.1

# Balanced (common default)
llm:
  topP: 0.9

# Maximum diversity
llm:
  topP: 1.0
```

### frequencyPenalty

Reduces likelihood of repeating tokens based on frequency.

- **Range:** -2.0 to 2.0
- **Positive values:** Reduce repetition
- **Negative values:** Increase repetition (rare use case)
- **0.0:** No penalty (default)

```yaml
# Reduce repetitive phrasing
llm:
  frequencyPenalty: 0.5

# Strongly avoid repetition
llm:
  frequencyPenalty: 1.5
```

### presencePenalty

Reduces likelihood of repeating topics/concepts.

- **Range:** -2.0 to 2.0
- **Positive values:** Encourage topic diversity
- **Negative values:** Allow topic repetition (rare use case)
- **0.0:** No penalty (default)

```yaml
# Encourage covering new topics
llm:
  presencePenalty: 0.6

# Strongly push for topic diversity
llm:
  presencePenalty: 1.2
```

## Common Configurations

### Code Generation

```yaml
llm:
  provider: anthropic
  model: claude-3-5-sonnet-20241022
  temperature: 0.2
  maxTokens: 8192
```

### Data Analysis

```yaml
llm:
  provider: openai
  model: gpt-4o
  temperature: 0.3
  maxTokens: 4096
  frequencyPenalty: 0.5
```

### Customer Support

```yaml
llm:
  provider: anthropic
  model: claude-3-5-haiku-20241022
  temperature: 0.7
  maxTokens: 1024
```

### Creative Writing

```yaml
llm:
  provider: openai
  model: gpt-4o
  temperature: 1.0
  maxTokens: 4096
  presencePenalty: 0.6
```

### Document Extraction

```yaml
llm:
  provider: anthropic
  model: claude-3-haiku-20240307
  temperature: 0.0
  maxTokens: 2048
```

### Multi-modal Analysis

```yaml
llm:
  provider: google
  model: gemini-1.5-pro
  temperature: 0.5
  maxTokens: 8192
```

### Cost-Optimized

```yaml
llm:
  provider: anthropic
  model: claude-3-5-haiku-20241022
  temperature: 0.5
  maxTokens: 1024
```

### Maximum Performance

```yaml
llm:
  provider: anthropic
  model: claude-3-5-sonnet-20241022
  temperature: 0.3
  maxTokens: 8192
```

## Complete Example

```yaml
apiVersion: ossa/v0.2.x
kind: Agent
metadata:
  name: technical-writer
  version: 1.0.0
spec:
  role: |
    You are a technical documentation specialist.
    Create clear, accurate, and well-structured documentation.

  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.4
    maxTokens: 8192
    frequencyPenalty: 0.3
    presencePenalty: 0.2

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
llm:
  provider: anthropic
  model: claude-3-5-sonnet-20241022
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

## Validation

Required fields:
- `provider` - Must be one of: `openai`, `anthropic`, `google`, `azure`, `ollama`, `custom`
- `model` - Non-empty string

Optional field constraints:
- `temperature`: 0 ≤ value ≤ 2
- `maxTokens`: value ≥ 1
- `topP`: 0 ≤ value ≤ 1
- `frequencyPenalty`: -2 ≤ value ≤ 2
- `presencePenalty`: -2 ≤ value ≤ 2

## Related Objects

- [Agent Spec](./agent-spec.md) - Parent object containing LLM config
- [Constraints](./constraints.md) - Cost and performance limits
- [Extensions](./extensions/) - Provider-specific features
- [Anthropic Extension](./extensions/anthropic.md) - Claude-specific config
- [OpenAI Agents Extension](./extensions/openai-agents.md) - OpenAI SDK config

## Best Practices

1. **Start conservative** - Use lower temperature (0.2-0.3) for deterministic tasks
2. **Test iteratively** - Adjust temperature in small increments (0.1-0.2)
3. **Monitor costs** - Set `maxTokens` appropriately for your use case
4. **Match model to task** - Use smaller models for simple tasks
5. **Document choices** - Add comments explaining parameter selections
6. **Use constraints** - Set `spec.constraints.cost` to prevent runaway costs
7. **Avoid mixing** - Don't use both `temperature` and `topP` simultaneously
8. **Consider latency** - Smaller models and lower `maxTokens` reduce response time
9. **Plan for failures** - Set reasonable `timeoutSeconds` in constraints
10. **Version carefully** - Document model version changes in `metadata.version`
