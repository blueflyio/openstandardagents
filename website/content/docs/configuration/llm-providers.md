---
title: "LLM Provider Configuration"
description: "Configure LLM providers for OSSA agents - Anthropic, OpenAI, Google, and more"
---

# LLM Provider Configuration

OSSA supports multiple LLM providers through a unified configuration interface.

## Supported Providers

| Provider | Models | Status |
|----------|--------|--------|
| Anthropic | Claude 3.5, Claude 3 Opus/Sonnet/Haiku | Stable |
| OpenAI | GPT-4o, GPT-4 Turbo, GPT-3.5 | Stable |
| Google | Gemini 2.0, Gemini 1.5 | Stable |
| Mistral | Mistral Large, Mixtral | Beta |
| Groq | LLaMA, Mixtral | Beta |

## Configuration

```yaml
apiVersion: ossa/v0.3.2
kind: Agent

spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: ${LLM_TEMPERATURE:-0.1}
    maxTokens: ${LLM_MAX_TOKENS:-16000}

    # Fallback configuration
    fallback_models:
      - provider: openai
        model: gpt-4o
        condition: on_error
      - provider: google
        model: gemini-2.0-flash
        condition: on_rate_limit

    # Retry configuration
    retry_config:
      max_attempts: 3
      backoff_strategy: exponential
      initial_delay_ms: 1000
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | Primary provider | anthropic |
| `LLM_MODEL` | Model name | claude-sonnet-4-20250514 |
| `LLM_TEMPERATURE` | Response randomness | 0.1 |
| `LLM_MAX_TOKENS` | Max output tokens | 16000 |

## Related Documentation

- [Execution Profiles](/docs/runtime/execution-profiles)
- [Environment Variables](/docs/configuration/environment-variables)
