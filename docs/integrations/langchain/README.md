# LangChain Integration Guide

Complete guide for converting and deploying OSSA agents to LangChain.

## Quick Start

### 1. Export OSSA Agent to LangChain

```bash
ossa export agent.ossa.yaml --platform langchain --format python --output agent.py
```

### 2. Install Dependencies

```bash
pip install langchain langchain-openai
```

### 3. Run LangChain Agent

```bash
python agent.py
```

## Conversion Examples

### Basic Agent

**OSSA Manifest** (`agent.ossa.yaml`):
```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: my-agent
spec:
  role: "You are a helpful assistant"
  llm:
    provider: openai
    model: gpt-4
```

**Generated LangChain Code**:
```python
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

llm = ChatOpenAI(model="gpt-4", temperature=0.7)
tools = []
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
])
agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
```

## Tool Integration

OSSA tools are automatically converted to LangChain tools:

```yaml
spec:
  tools:
    - type: mcp
      name: filesystem
      server: filesystem-server
```

Converts to:
```python
tools = [
    Tool(
        name="filesystem",
        description="Filesystem operations",
        func=lambda x: None,  # TODO: Implement
    )
]
```

## Best Practices

1. **Tool Implementation**: Implement tool functions after conversion
2. **Memory**: Add memory for conversational agents
3. **Error Handling**: Add try-catch blocks for production use
4. **Streaming**: Enable streaming for better UX

## Troubleshooting

### Import Errors
```bash
pip install --upgrade langchain langchain-openai
```

### Tool Errors
Ensure tool functions are properly implemented before running.
