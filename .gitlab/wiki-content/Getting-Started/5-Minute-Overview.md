# 5-Minute Overview

Get up to speed on OSSA in 5 minutes.

## What is OSSA?

**OSSA (Open Standard for Scalable Agents)** is like OpenAPI, but for AI agents.

- **OpenAPI** = Standard format for REST APIs
- **OSSA** = Standard format for AI agents

## Why Does This Matter?

### Before OSSA
- Agents built with LangChain couldn't work with Anthropic SDK agents
- Moving agents between teams required rewriting
- No standard way to validate agent correctness
- Framework lock-in everywhere

### With OSSA
- ✅ Agents work across any framework
- ✅ Move agents between teams/organizations easily
- ✅ Validate agents before deployment
- ✅ No vendor lock-in

## Core Concept

OSSA defines agents using a **declarative YAML/JSON format**:

```yaml
apiVersion: ossa/v0.2.2
kind: Agent

metadata:
  name: my-agent
  version: 1.0.0
  description: My first OSSA agent

spec:
  role: You are a helpful assistant
  llm:
    provider: openai
    model: gpt-3.5-turbo
  tools:
    - type: function
      name: greet_user
      description: Greet a user by name
```

## Key Components

| Component | What It Does |
|-----------|--------------|
| **Specification** | JSON Schema that defines the standard |
| **CLI** | Validates and generates agent manifests |
| **Examples** | Reference implementations for learning |
| **agent-buildkit** | Reference implementation with production features |

## What OSSA Is NOT

- ❌ **Not a framework** - It's a standard
- ❌ **Not a runtime** - It's a specification
- ❌ **Not an orchestration tool** - It's a contract definition

## Next Steps

1. **Install OSSA CLI**: `npm install -g @bluefly/open-standards-scalable-agents`
2. **Try the Hello World example**: See [Hello World Tutorial](Hello-World)
3. **Create your first agent**: See [First Agent Creation](First-Agent)
4. **Explore examples**: Check out [Examples & Patterns](../Examples/Getting-Started-Examples)

## Learn More

- [Installation Guide](Installation)
- [Hello World Tutorial](Hello-World)
- [Full Documentation](../Technical/Specification-Deep-Dive)

---

**Time to next level**: ~15 minutes → [Hello World Tutorial](Hello-World)

