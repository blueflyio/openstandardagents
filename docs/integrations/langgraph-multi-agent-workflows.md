# LangGraph Multi-Agent Workflow Support

LangChain exporter now supports generating **LangGraph** code for complex multi-agent workflows from OSSA manifests.

## Overview

LangGraph is a library for building stateful, multi-agent applications with LangChain. It enables:

- **Multi-agent coordination**: Multiple specialized agents working together
- **State management**: Shared state across agent nodes
- **Conditional routing**: Dynamic workflow paths based on state
- **Human-in-the-loop**: Approval checkpoints in workflows
- **Checkpointing**: Save and resume workflow execution

## Automatic Detection

The exporter automatically detects when an OSSA manifest requires LangGraph based on:

1. **Workflow Steps**: Presence of `spec.workflow.steps` with multiple agents
2. **Agent Dependencies**: `spec.dependencies.agents` with multiple dependencies
3. **Multi-agent Tools**: Multiple tools of type `agent`
4. **Approval Requirements**: `spec.autonomy.approval_required` is `true`

## Supported Workflow Patterns

### 1. Sequential Workflow

Agents execute one after another in a chain.

```yaml
spec:
  workflow:
    steps:
      - id: researcher
        kind: Agent
        depends_on: []
      - id: writer
        kind: Agent
        depends_on: [researcher]
      - id: editor
        kind: Agent
        depends_on: [writer]
```

**Generated LangGraph**:
```python
workflow.add_edge("researcher", "writer")
workflow.add_edge("writer", "editor")
workflow.add_edge("editor", END)
```

### 2. Parallel Workflow

Multiple agents execute simultaneously.

```yaml
spec:
  workflow:
    steps:
      - id: coordinator
        kind: Agent
      - id: agent_a
        kind: Agent
        depends_on: [coordinator]
      - id: agent_b
        kind: Agent
        depends_on: [coordinator]
```

**Generated LangGraph**:
```python
workflow.add_edge("coordinator", "agent_a")
workflow.add_edge("coordinator", "agent_b")
```

### 3. Conditional Workflow

Routing based on state conditions.

```yaml
spec:
  workflow:
    steps:
      - id: classifier
        kind: Agent
      - id: handler_a
        kind: Agent
        condition: "category == 'A'"
      - id: handler_b
        kind: Agent
        condition: "category == 'B'"
```

**Generated LangGraph**:
```python
def router(state: AgentState) -> Literal["handler_a", "handler_b", "end"]:
    if should_route_to_handler_a(state):
        return "handler_a"
    elif should_route_to_handler_b(state):
        return "handler_b"
    return "end"

workflow.add_conditional_edges("classifier", router, {
    "handler_a": "handler_a",
    "handler_b": "handler_b",
    "end": END
})
```

### 4. Human-in-the-Loop

Workflow pauses for human approval.

```yaml
spec:
  workflow:
    steps:
      - id: processor
        kind: Agent
  autonomy:
    approval_required: true
```

**Generated LangGraph**:
```python
def human_approval_node(state: AgentState) -> AgentState:
    """Human approval checkpoint"""
    approval = input("Approve? (yes/no): ")
    state["approval_status"] = "approved" if approval == "yes" else "rejected"
    return state

workflow.add_node("human_approval", human_approval_node)
workflow.add_edge("processor", "human_approval")
```

## Generated Files

When multi-agent workflow is detected, the exporter generates:

### Core Files

- **`langgraph.py`** - LangGraph workflow implementation
  - State class definition
  - Agent node functions
  - Router function (if conditional)
  - Workflow builder
  - Execution function

- **`agent.py`** - Standard LangChain agent (for simple invocations)
- **`tools.py`** - Tool implementations
- **`memory.py`** - Memory configuration
- **`server.py`** - FastAPI REST API
- **`requirements.txt`** - Includes `langgraph>=0.0.30`

### Example `langgraph.py` Structure

```python
from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    """Shared state for multi-agent workflow"""
    messages: Annotated[Sequence[BaseMessage], operator.add]
    next: str
    researcher_output: str
    writer_output: str

def researcher_agent(state: AgentState) -> AgentState:
    """Research Agent - Conducts research"""
    # Agent execution logic
    return {"messages": [response], "researcher_output": result}

def writer_agent(state: AgentState) -> AgentState:
    """Writer Agent - Writes content"""
    # Access previous output: state["researcher_output"]
    return {"messages": [response], "writer_output": result}

def create_workflow():
    """Create and compile the workflow"""
    workflow = StateGraph(AgentState)

    workflow.add_node("researcher", researcher_agent)
    workflow.add_node("writer", writer_agent)

    workflow.add_edge("researcher", "writer")
    workflow.add_edge("writer", END)

    workflow.set_entry_point("researcher")

    # Compile with checkpointing
    from langgraph.checkpoint.memory import MemorySaver
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)

def run_workflow(input_text: str, config: dict = None):
    """Execute the workflow"""
    app = create_workflow()
    initial_state = {"messages": [HumanMessage(content=input_text)]}
    config = config or {"configurable": {"thread_id": "default"}}
    return app.invoke(initial_state, config=config)
```

## State Management

### State Fields

The generated `AgentState` TypedDict includes:

- **`messages`**: Message history (annotated with `operator.add`)
- **`next`**: Next agent to route to
- **`{agent_id}_output`**: Output from each agent node
- **`approval_status`**: Approval status (if human-in-the-loop)
- **`human_feedback`**: Human feedback (if human-in-the-loop)

### Accessing State

Each agent node receives the full state and can access outputs from previous agents:

```python
def writer_agent(state: AgentState) -> AgentState:
    messages = state["messages"]
    research = state.get("researcher_output", "")

    # Use research in prompt
    context = f"Based on this research: {research}"
    # ...
```

## Export Options

### Basic Export

```typescript
import { LangChainExporter } from '@bluefly/openstandardagents';

const exporter = new LangChainExporter();
const result = await exporter.export(manifest, {
  includeApi: true,
  includeOpenApi: true,
  includeDocker: true,
});
```

### CLI Export

```bash
buildkit export langchain multi-agent-workflow.ossa.yaml \
  --output ./output \
  --include-api \
  --include-docker
```

## Dependencies

The exporter automatically adds LangGraph to `requirements.txt`:

```txt
# LangGraph (Multi-Agent Workflows)
langgraph>=0.0.30

# LangChain Core
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-core>=0.1.0
```

## Running the Workflow

### Python Script

```bash
cd output/
pip install -r requirements.txt
python langgraph.py
```

### Interactive Execution

```python
from langgraph import run_workflow

# Run workflow
result = run_workflow("Research and write about AI agents")

# Access outputs
print(result["messages"][-1].content)
print(result["researcher_output"])
print(result["writer_output"])
```

### With Checkpointing

```python
# Resume workflow from checkpoint
config = {"configurable": {"thread_id": "session-123"}}
result = run_workflow("Continue the research", config=config)
```

## FastAPI Integration

The generated FastAPI server automatically detects LangGraph workflows:

```bash
uvicorn server:app --reload
```

```bash
curl -X POST http://localhost:8000/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Research and write about quantum computing",
    "config": {"thread_id": "session-456"}
  }'
```

## Examples

### Research and Writing Workflow

Complete example at `examples/multi-agent-research-workflow.ossa.yaml`:

```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: research-workflow
  description: Multi-agent research and writing workflow
spec:
  workflow:
    steps:
      - id: researcher
        name: Research Agent
        kind: Agent
      - id: writer
        name: Writer Agent
        kind: Agent
        depends_on: [researcher]
      - id: critic
        name: Critic Agent
        kind: Agent
        depends_on: [writer]
        condition: "quality_score < 8"
      - id: editor
        name: Editor Agent
        kind: Agent
        depends_on: [writer, critic]
  autonomy:
    approval_required: true
```

Export and run:

```bash
buildkit export langchain examples/multi-agent-research-workflow.ossa.yaml
cd output/
pip install -r requirements.txt
python langgraph.py
```

## Architecture Benefits

### vs. Simple ReAct Agent

| Feature | ReAct Agent | LangGraph Workflow |
|---------|-------------|-------------------|
| Single agent | ✓ | ✗ |
| Multiple specialized agents | ✗ | ✓ |
| State persistence | Limited | Full checkpointing |
| Conditional routing | Tool-based | Native graph edges |
| Human-in-the-loop | Manual | Built-in nodes |
| Subworkflows | ✗ | ✓ |

### When to Use LangGraph

✅ **Use LangGraph when**:
- You have multiple specialized agents
- Agents need to coordinate and share state
- Workflow requires conditional logic
- Human approval is needed
- Long-running workflows need checkpointing

❌ **Use simple agent when**:
- Single agent with tools is sufficient
- No complex coordination needed
- Straightforward request-response pattern

## Testing

Tests are included at `tests/unit/export/langchain/langchain-exporter.test.ts`:

```bash
npm test -- tests/unit/export/langchain/langchain-exporter.test.ts
```

Test cases cover:
- Multi-agent workflow detection
- LangGraph file generation
- State management
- Conditional routing
- Human-in-the-loop workflows
- Dependencies handling

## Troubleshooting

### LangGraph Not Generated

Check that your manifest includes:
1. Multiple workflow steps OR
2. Multiple agent dependencies OR
3. Approval requirements

### State Not Shared

Ensure agents return updated state:

```python
return {
    "messages": [response],
    "agent_output": result["output"],
}
```

### Workflow Not Routing

Check conditional logic in router function and ensure state fields are set correctly.

## Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [OSSA Workflow Specification](/docs/specification/workflow.md)
- [Example Manifests](/examples/)

## Changelog

### v0.4.1
- Initial LangGraph multi-agent workflow support
- Automatic workflow pattern detection
- State management generation
- Human-in-the-loop support
- Conditional routing
- Checkpointing integration
