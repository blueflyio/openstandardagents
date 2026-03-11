# AgentScope ReAct Assistant -- OSSA Example

This example demonstrates an OSSA agent manifest that uses [AgentScope](https://github.com/modelscope/agentscope) as its runtime. It showcases how OSSA's declarative manifest format integrates with AgentScope's `ReActAgent` class, MCP tool servers, the A2A protocol, and Mem0 long-term memory.

## What This Example Shows

- **AgentScope runtime binding** via the `extensions.agentscope` block, specifying `ReActAgent` as the agent class, iteration limits, and memory backend.
- **MCP tool integration** with two tool servers: a graph knowledge base (GKG) and a general web search/content retrieval endpoint.
- **A2A protocol support** exposing the agent as a discoverable service with an agent card and skill declarations.
- **Token efficiency controls** including model cascading (Haiku -> Sonnet -> Opus), adaptive budget allocation, and context compression.
- **Security boundaries** with allow-listed domains, required capabilities, and data classification.

## Manifest Structure

| Section | Purpose |
|---------|---------|
| `metadata` | Identity, labels, publisher info |
| `spec` | Role prompt, LLM config, taxonomy, tools, input/output schema |
| `security` | Tier classification, network policy, data classification |
| `protocols.mcp` | MCP client capabilities (tools, resources) |
| `protocols.a2a` | A2A endpoint, agent card, skills |
| `token_efficiency` | Budget, model cascade routing, serialization profile |
| `extensions.agentscope` | AgentScope-specific: agent class, memory, orchestration, compression |

## How AgentScope Maps to OSSA

The `extensions.agentscope` block is the runtime-specific configuration:

```yaml
extensions:
  agentscope:
    version: "1.0.16"
    agent_class: ReActAgent       # AgentScope agent type
    capabilities: [rag, parallel_tool_calls]
    memory_backend: mem0          # Long-term memory via Mem0
    orchestration: msghub         # AgentScope MsgHub for multi-agent
    max_iters: 10                 # ReAct loop iteration cap
    formatter: anthropic          # Message format for Anthropic models
    compression:
      enable: true
      trigger_threshold: 50000    # Compress context above 50k tokens
      keep_recent: 5              # Always keep last 5 messages
    skill_dirs: [./skills/]       # Local skill modules
```

An OSSA-to-AgentScope adapter would read this manifest and instantiate:

```python
import agentscope
from agentscope.agents import ReActAgent

agentscope.init(model_configs=[{
    "config_name": "anthropic",
    "model_type": "anthropic_chat",
    "model_name": "claude-sonnet-4-20250514",
    "temperature": 0.7,
    "max_tokens": 4096,
    "stream": True,
}])

agent = ReActAgent(
    name="agentscope-react-assistant",
    model_config_name="anthropic",
    sys_prompt=manifest["spec"]["role"],
    tools=loaded_mcp_tools,
    max_iters=10,
)
```

## MCP Tool Integration

The manifest declares two MCP tool servers under `spec.tools`:

1. **knowledge-base** -- Graph knowledge base at `gkg.blueflyagents.com` for codebase analysis and structured queries.
2. **web-search** -- General MCP server at `mcp.blueflyagents.com` for web search and content retrieval.

At runtime, the adapter connects to these SSE endpoints, discovers available tools, and registers them with the AgentScope `ReActAgent` tool list.

## A2A Protocol

The `protocols.a2a` block exposes this agent as an A2A-compatible service:

- **Endpoint**: `https://agents.blueflyagents.com/a2a/react-assistant`
- **Skills**: `question-answering`, `code-analysis`
- **Streaming**: Enabled for real-time responses

Other agents can discover and invoke this agent via the A2A protocol using the published agent card.

## Token Efficiency

The manifest uses a three-tier model cascade to optimize cost:

1. Queries below complexity 0.3 route to `claude-haiku-4-5-20251001` (cheapest).
2. Queries between 0.3 and 0.7 route to `claude-sonnet-4-20250514`.
3. Complex queries above 0.7 route to `claude-opus-4-20250514`.

Context compression triggers at 50k tokens, keeping the 5 most recent messages intact.

## Prerequisites

- AgentScope >= 1.0.16
- Anthropic API key
- Network access to `*.blueflyagents.com`
- (Optional) Mem0 backend for persistent memory

## Related

- [OSSA Specification](https://openstandardagents.org)
- [AgentScope Documentation](https://doc.agentscope.io/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [A2A Protocol](https://google.github.io/A2A/)
