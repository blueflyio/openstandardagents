# Microsoft Agent Framework (AutoGen) Examples

This directory contains OSSA-compliant agent definitions that demonstrate integration with Microsoft's AutoGen framework (v0.4+) and Magentic-One.

## Examples

### 1. autogen-agent.ossa.yaml
Single AutoGen agent configured as a research assistant.

**Features:**
- AutoGen assistant agent type
- Web search capability
- Document summarization
- Report generation
- Session-based state management
- MCP server integration

**Mapping to AutoGen:**
- `extensions.autogen.agent_type: assistant` → AutoGen AssistantAgent
- `extensions.autogen.team_type: round_robin` → AutoGen GroupChat with round_robin
- Tools mapped to AutoGen function calling
- State management via AutoGen's session handling

### 2. autogen-team.ossa.yaml
Multi-agent AutoGen team with orchestration.

**Features:**
- Team coordination (round_robin pattern)
- Multiple sub-agents (research assistant, analyst, writer)
- Shared context via A2A protocol
- Long-running state with Redis
- Termination conditions

**Mapping to AutoGen:**
- `extensions.autogen.team_type: round_robin` → AutoGen GroupChat
- `extensions.autogen.agent_type: orchestrator` → AutoGen OrchestratorAgent
- Sub-agents referenced by name
- Termination conditions mapped to AutoGen's termination logic

## AutoGen Team Types

OSSA supports all AutoGen team patterns:

| OSSA Value | AutoGen Pattern | Description |
|------------|----------------|-------------|
| `round_robin` | GroupChat (round_robin) | Agents take turns in sequence |
| `selector` | GroupChat (selector) | Select agent based on message content |
| `swarm` | SwarmAgent | Parallel agent execution |
| `magentic_one` | Magentic-One | Magentic-One framework pattern |

## AutoGen Agent Types

| OSSA Value | AutoGen Class | Description |
|------------|---------------|-------------|
| `assistant` | AssistantAgent | LLM-powered assistant |
| `orchestrator` | OrchestratorAgent | Coordinates other agents |
| `web_surfer` | WebSurferAgent | Web browsing capabilities |
| `coder` | CoderAgent | Code generation and execution |

## Usage

### Validate Examples

```bash
# Validate single agent
ossa validate examples/microsoft-af/autogen-agent.ossa.yaml

# Validate team configuration
ossa validate examples/microsoft-af/autogen-team.ossa.yaml
```

### Convert to AutoGen

```python
from ossa import load_agent
from autogen import AssistantAgent, GroupChat

# Load OSSA manifest
agent_manifest = load_agent("examples/microsoft-af/autogen-agent.ossa.yaml")

# Convert to AutoGen
autogen_agent = AssistantAgent(
    name=agent_manifest.metadata.name,
    system_message=agent_manifest.spec.role,
    llm_config={
        "model": agent_manifest.spec.llm.model,
        "temperature": agent_manifest.spec.llm.temperature,
    },
    function_map=map_ossa_tools_to_autogen(agent_manifest.spec.tools)
)
```

## Migration from AutoGen

See the migration guide: [Autogen to OSSA Migration](../../docs/migration-guides/autogen-to-ossa.md)

## Related Documentation

- [AutoGen Documentation](https://microsoft.github.io/autogen/)
- [Magentic-One](https://github.com/magentic/magentic)
- [OSSA AutoGen Extension](../../spec/v0.2.4-dev/ossa-0.2.4-dev.schema.json#/definitions/AutoGenExtension)

