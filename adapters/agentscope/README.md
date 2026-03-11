# OSSA-to-AgentScope Adapter

Reads an [OSSA v0.4.6](https://openstandardagents.org) agent manifest (YAML) and instantiates a fully-configured [AgentScope](https://github.com/modelscope/agentscope) agent from it.

## Installation

```bash
pip install agentscope pydantic pyyaml
# For MCP tool support:
pip install agentscope[mcp]
# For Redis memory:
pip install redis
# For SQLAlchemy memory:
pip install aiosqlite sqlalchemy[asyncio]
```

## Quick start

```python
import asyncio
from adapters.agentscope import create_agent_from_manifest

async def main():
    agent = await create_agent_from_manifest("agents/my-agent.ossa.yaml")
    response = agent.reply({"role": "user", "content": "Hello!"})
    print(response)

asyncio.run(main())
```

Or use the adapter class directly for more control:

```python
import asyncio
from adapters.agentscope import OSSAAgentScopeAdapter

async def main():
    adapter = OSSAAgentScopeAdapter("agents/my-agent.ossa.yaml")
    manifest = adapter.load()
    print(f"Agent: {manifest.metadata.name}")

    agent = await adapter.build()

    # Inspect fallback model configs
    for cfg in adapter.get_fallback_configs():
        print(f"Fallback: {cfg['model_type']} / {cfg['model_name']}")

asyncio.run(main())
```

## Mapping reference

### LLM provider to AgentScope model class

| OSSA `spec.llm.provider` | AgentScope model wrapper | Formatter |
|---|---|---|
| `anthropic` | `AnthropicChatWrapper` | `AnthropicFormatter` |
| `openai` | `OpenAIChatWrapper` | `OpenAIFormatter` |
| `gemini` | `GeminiChatWrapper` | `GeminiFormatter` |
| `litellm` | `LiteLLMChatWrapper` | -- |
| `ollama` | `OllamaChatWrapper` | -- |
| `dashscope` | `DashScopeChatWrapper` | -- |
| `zhipuai` | `ZhipuAIChatWrapper` | -- |
| `yi` | `YiChatWrapper` | -- |

### Agent class

| `extensions.agentscope.agent_class` | AgentScope class |
|---|---|
| `ReActAgent` | `agentscope.agents.ReActAgent` |
| `UserAgent` | `agentscope.agents.UserAgent` |
| `DialogAgent` | `agentscope.agents.DialogAgent` |
| `A2AAgent` | `ReActAgent` wrapped by `agentscope.agents.A2AAgent` |
| `RealtimeAgent` | `ReActAgent` (extended) |

### Memory backend

| `extensions.agentscope.memory_backend` | AgentScope class |
|---|---|
| `InMemoryMemory` | Default (built-in) |
| `RedisMemory` | `agentscope.memory.RedisMemory` |
| `AsyncSQLAlchemyMemory` | `agentscope.memory.AsyncSQLAlchemyMemory` |
| `Mem0LongTermMemory` | `agentscope.memory.Mem0LongTermMemory` |

### Tools (MCP)

OSSA `spec.tools` entries with `type: mcp` and HTTP transport are connected via `agentscope.service.mcp.HttpStatelessClient`. Stdio-transport tools are registered as planning-visible stubs that require an external MCP server process.

### A2A protocol

When `extensions.a2a.enabled` is `true` and `agent_card.url` is set, the agent is wrapped with `agentscope.agents.A2AAgent` for Google A2A interoperability.

### Security tier to sandbox

| OSSA `spec.security.tier` | Sandbox | Network | Filesystem | Timeout |
|---|---|---|---|---|
| `open` | off | -- | -- | -- |
| `standard` | on | allowed | allowed | 120s |
| `strict` | on | blocked | allowed | 60s |
| `isolated` | on | blocked | blocked | 30s |

## OSSA manifest example

```yaml
apiVersion: ossa/v0.4.6
kind: Agent
metadata:
  name: my-assistant
  version: 1.0.0
  description: A helpful assistant
spec:
  role: |
    You are a helpful AI assistant.
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7
    maxTokens: 4096
  tools:
    - type: mcp
      name: web-search
      endpoint: https://mcp.example.com/search
      transport:
        protocol: http
extensions:
  agentscope:
    agent_class: ReActAgent
    memory_backend: InMemoryMemory
    max_iters: 10
    verbose: true
  a2a:
    enabled: true
    agent_card:
      name: My Assistant
      url: https://agents.example.com/my-assistant
```

## Environment variables

| Variable | Used for |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic provider API key |
| `OPENAI_API_KEY` | OpenAI provider API key |
| `GOOGLE_API_KEY` | Gemini provider API key |
| `REDIS_URL` | Redis memory backend connection |
| `SQLALCHEMY_DATABASE_URI` | SQLAlchemy memory backend connection |

The adapter also resolves `${VAR:-default}` patterns in the manifest YAML itself, so manifests can reference environment variables for endpoints, tokens, and model names.
