# OSSA Getting Started Examples

Learn OSSA step-by-step with these progressively complex examples.

## Prerequisites

```bash
npm install -g @bluefly/ossa-cli
```

## Examples

| # | File | Concepts | Time |
|---|------|----------|------|
| 01 | [minimal-agent](01-minimal-agent.ossa.yaml) | `kind: Agent`, `role`, `llm` | 2 min |
| 02 | [agent-with-tools](02-agent-with-tools.ossa.yaml) | `tools`, MCP, function | 5 min |
| 03 | [agent-with-safety](03-agent-with-safety.ossa.yaml) | `safety`, `autonomy`, `observability` | 10 min |
| 04 | [agent-with-messaging](04-agent-with-messaging.ossa.yaml) | A2A, pub/sub, commands | 10 min |
| 05 | [workflow-composition](05-workflow-composition.ossa.yaml) | `kind: Workflow`, steps, error handling | 15 min |

## Quick Start

```bash
# Validate an example
ossa validate 01-minimal-agent.ossa.yaml

# Run interactively (requires LLM API key)
export ANTHROPIC_API_KEY=your-key
ossa run 01-minimal-agent.ossa.yaml --input "Hello, how can you help me?"

# Export to framework
ossa export 02-agent-with-tools.ossa.yaml --format langchain
```

## Learning Path

```
01-minimal → Understand the basics (Agent, role, llm)
     ↓
02-tools → Add capabilities (MCP, functions)
     ↓
03-safety → Production readiness (guardrails, PII, rate limits)
     ↓
04-messaging → Agent-to-agent communication (A2A, pub/sub)
     ↓
05-workflow → Orchestration (compose agents + tasks)
```

## Environment Variables

All examples use environment variables for portability:

```bash
# Required
export LLM_PROVIDER=anthropic  # or openai, google, etc.
export LLM_MODEL=claude-sonnet-4-20250514

# For tools
export GITHUB_TOKEN=your-github-token

# For observability
export OTEL_ENDPOINT=http://localhost:4317
```

## Next Steps

- [Full Examples](../agent-manifests/) - Real-world agent definitions
- [Framework Adapters](../adapters/) - LangChain, CrewAI, AutoGen
- [Schema Reference](../../spec/v0.3.0/) - Complete OSSA specification
