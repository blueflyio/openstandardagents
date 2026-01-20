# LangChain to OSSA Migration Guide

Step-by-step guide for migrating LangChain agents to OSSA.

## Step 1: Analyze LangChain Agent

Identify:
- Agent type (conversational, tool-using, etc.)
- LLM configuration
- Tools used
- Memory configuration

## Step 2: Create OSSA Manifest

Use the migrate command:

```bash
ossa migrate langchain_agent.py --from langchain --output agent.ossa.yaml
```

## Step 3: Validate Conversion

```bash
ossa validate agent.ossa.yaml
```

## Step 4: Enhance with OSSA Features

Add taxonomy, constraints, and other OSSA-specific features:

```yaml
spec:
  taxonomy:
    domain: development
    maturity: stable
    deploymentPattern: serverless
  constraints:
    cost:
      maxTokensPerDay: 100000
```

## Step 5: Deploy to Multiple Platforms

```bash
ossa build agent.ossa.yaml --platform all
```

## Code Comparison

### LangChain (Before)
```python
from langchain.agents import AgentExecutor
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")
agent = AgentExecutor(...)
```

### OSSA (After)
```yaml
spec:
  llm:
    provider: openai
    model: gpt-4
  role: "Agent description"
```

## Benefits

1. **Platform Agnostic**: Deploy to any platform
2. **Standardized**: Consistent format across projects
3. **Extensible**: Add OSSA-specific features
4. **Versioned**: Track agent versions
