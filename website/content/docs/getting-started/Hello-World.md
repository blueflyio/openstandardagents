---
title: "Hello World"
---

# Hello World Tutorial

Create your first OSSA agent in 10 minutes.

## Overview

In this tutorial, you'll:
1. Generate a minimal OSSA agent
2. Understand the agent structure
3. Validate the agent
4. Learn what each field means

## Step 1: Generate Your First Agent

Use the OSSA CLI to generate a chat agent:

```bash
ossa generate chat --name "Hello World Agent" --output hello-world.ossa.yaml
```

This creates a minimal, valid OSSA agent manifest.

## Step 2: Examine the Generated Agent

Open `hello-world.ossa.yaml`:

```yaml
apiVersion: ossa/v0.2.2
kind: Agent

metadata:
  name: hello-world-agent
  version: 0.1.0
  description: Hello World Agent

spec:
  role: |
    You are a helpful chat assistant.
    Answer questions clearly and concisely.
  
  llm:
    provider: openai
    model: gpt-3.5-turbo
    temperature: 0.7
  
  tools: []
```

## Step 3: Understand the Structure

### apiVersion & kind

```yaml
apiVersion: ossa/v0.2.2
kind: Agent
```

- **apiVersion**: OSSA specification version
- **kind**: Resource type (currently only "Agent")

### metadata

```yaml
metadata:
  name: hello-world-agent
  version: 0.1.0
  description: Hello World Agent
```

- **name**: Agent identifier (DNS-1123 format)
- **version**: Semantic version
- **description**: Human-readable description

### spec

```yaml
spec:
  role: |
    You are a helpful chat assistant.
    Answer questions clearly and concisely.
  
  llm:
    provider: openai
    model: gpt-3.5-turbo
    temperature: 0.7
  
  tools: []
```

- **role**: System prompt/instructions for the agent
- **llm**: Language model configuration
- **tools**: Available capabilities (empty for basic chat)

## Step 4: Validate Your Agent

Validate the agent against the OSSA schema:

```bash
ossa validate hello-world.ossa.yaml
```

You should see:

```
✓ Agent manifest is valid OSSA 0.2.2
```

## Step 5: Add a Tool (Optional)

Edit `hello-world.ossa.yaml` to add a greeting tool:

```yaml
spec:
  role: |
    You are a helpful chat assistant.
    Answer questions clearly and concisely.
  
  llm:
    provider: openai
    model: gpt-3.5-turbo
    temperature: 0.7
  
  tools:
    - type: function
      name: greet_user
      description: Generate a personalized greeting
      config:
        handler: greet_handler
```

Validate again:

```bash
ossa validate hello-world.ossa.yaml
```

## Understanding the Complete Example

For a fully annotated example with extensive comments, see:

[examples/getting-started/hello-world-complete.ossa.yaml](https://github.com/blueflyio/openstandardagents/blob/main/examples/getting-started/hello-world-complete.ossa.yaml)

This example includes:
- Detailed comments for every field
- All optional fields explained
- Best practices
- Usage examples

## What You've Learned

✅ OSSA agents are defined in YAML/JSON  
✅ Agents have metadata (name, version, description)  
✅ Agents have a spec (role, LLM, tools)  
✅ OSSA CLI can validate agent correctness  
✅ Tools extend agent capabilities  

## Next Steps

1. ✅ Hello World complete
2. → [First Agent Creation](First-Agent) - Build a real agent
3. → [Examples & Patterns](../Examples/Getting-Started-Examples) - See more examples
4. → [Schema Reference](../Technical/Schema-Reference) - Deep dive into the spec

## Common Questions

**Q: Can I use a different LLM provider?**  
A: Yes! OSSA supports OpenAI, Anthropic, Google, Azure, Ollama, and custom providers.

**Q: What if I don't have tools?**  
A: Tools are optional. A basic chat agent can have an empty tools array.

**Q: How do I deploy this agent?**  
A: OSSA is just a standard. Use agent-buildkit or your own deployment system.

## Related

- [5-Minute Overview](5-Minute-Overview)
- [First Agent Creation](First-Agent)
- [Complete Annotated Example](https://github.com/blueflyio/openstandardagents/blob/main/examples/getting-started/hello-world-complete.ossa.yaml)

