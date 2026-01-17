# OSSA Python SDK Examples

This directory contains comprehensive examples demonstrating the OSSA Python SDK.

## Installation

```bash
# Install with Anthropic Claude support
pip install ossa-sdk[anthropic]

# Or with OpenAI support
pip install ossa-sdk[openai]

# Or with all LLM providers
pip install ossa-sdk[all-providers]
```

## Setup

Set your API keys as environment variables:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

## Examples

### 1. Complete Agent Example (`complete_agent_example.py`)

**Comprehensive showcase of all SDK features:**
- Basic agent execution
- Conversation history management
- Async/concurrent execution
- Error handling
- Multiple LLM providers

**Run it:**
```bash
python examples/complete_agent_example.py
```

**What it demonstrates:**
- ✅ Loading and validating OSSA manifests
- ✅ Running agents with Anthropic Claude
- ✅ Multi-turn conversations with memory
- ✅ Resetting conversation history
- ✅ Async execution with `asyncio`
- ✅ Proper error handling
- ✅ Using OpenAI as provider

### 2. Basic Usage (`basic_usage.py`)

**Simple getting-started examples:**
- Load a manifest from file
- Create and run an agent
- Handle responses

**Run it:**
```bash
python examples/basic_usage.py
```

### 3. Enterprise Quickstart (`enterprise_quickstart.py`)

**Production-ready patterns:**
- Configuration management
- Error handling and retries
- Logging and monitoring
- Cost tracking
- Safety checks

**Run it:**
```bash
python examples/enterprise_quickstart.py
```

## Example Manifests

All examples use in-code YAML manifests for simplicity. In production, you would typically:

```python
from ossa import Agent, load

# Load from file
manifest = load("path/to/agent.yaml")
agent = Agent(manifest, api_key=your_key)

# Run the agent
response = agent.run("Your prompt here")
print(response.content)
```

## Common Patterns

### Pattern 1: Single-Shot Agent

```python
from ossa import Agent, load

manifest = load("calculator-agent.yaml")
agent = Agent(manifest, api_key="sk-...")

response = agent.run("What is 42 * 137?")
print(response.content)
```

### Pattern 2: Conversational Agent

```python
from ossa import Agent, load

manifest = load("chat-agent.yaml")
agent = Agent(manifest, api_key="sk-...")

# Turn 1
response = agent.run("My name is Alice")

# Turn 2 - Agent remembers
response = agent.run("What's my name?")  # "Your name is Alice"
```

### Pattern 3: Async Execution

```python
import asyncio
from ossa import Agent, load

async def main():
    manifest = load("agent.yaml")
    agent = Agent(manifest, api_key="sk-...")

    # Run multiple requests concurrently
    tasks = [
        agent.arun("Question 1"),
        agent.arun("Question 2"),
        agent.arun("Question 3"),
    ]

    responses = await asyncio.gather(*tasks)
    for response in responses:
        print(response.content)

asyncio.run(main())
```

### Pattern 4: Error Handling

```python
from ossa import Agent, load, ConfigurationError, OSSAError

try:
    manifest = load("agent.yaml")
    agent = Agent(manifest, api_key="sk-...")
    response = agent.run("Hello")

except ConfigurationError as e:
    print(f"Configuration error: {e}")
except OSSAError as e:
    print(f"OSSA error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Next Steps

1. **Read the Full Documentation**
   - [Python SDK Guide](https://openstandardagents.org/docs/sdks/python)
   - [OSSA Specification](https://openstandardagents.org/spec)

2. **Explore the SDK**
   - Check out the [source code](../ossa/)
   - Read the [API reference](https://openstandardagents.org/api/python)

3. **Build Your Own Agent**
   - Create an `agent.yaml` manifest
   - Load it with `load("agent.yaml")`
   - Run it with `agent.run()`

4. **Join the Community**
   - [GitHub Issues](https://github.com/bluefly/openstandardagents/issues)
   - [GitLab Discussions](https://gitlab.com/blueflyio/openstandardagents/-/issues)
   - [Documentation](https://openstandardagents.org)

## Troubleshooting

### ImportError: No module named 'anthropic'

Install the provider package:
```bash
pip install ossa-sdk[anthropic]
```

### ConfigurationError: API key missing

Set your environment variable:
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### ValidationError: Manifest invalid

Check your manifest against the schema:
```bash
ossa validate agent.yaml
```

## Support

- **Documentation**: https://openstandardagents.org/docs/sdks/python
- **Issues**: https://gitlab.com/blueflyio/openstandardagents/-/issues
- **Email**: ossa@blueflyio.com
