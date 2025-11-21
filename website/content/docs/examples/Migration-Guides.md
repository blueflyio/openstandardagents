---
title: "Migration Guides"
---

# Migration Guides

Migrate agents from existing frameworks to OSSA format.

## Available Migration Guides

### LangChain → OSSA

**Location**: [examples/migration-guides/from-langchain-to-ossa.yaml](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/blob/main/examples/migration-guides/from-langchain-to-ossa.yaml)

**Covers**:
- Simple LangChain agents
- Agents with custom tools
- Multi-agent systems
- ReAct agents

**Key Differences**:
- LangChain: Code-based (Python)
- OSSA: Declarative (YAML/JSON)
- LangChain: Framework-specific
- OSSA: Framework-agnostic

### Anthropic SDK → OSSA

**Status**: Coming soon

**Will Cover**:
- Anthropic SDK agent structure
- Tool definitions
- Message handling
- Migration patterns

### MCP-Only Agents → OSSA

**Status**: Coming soon

**Will Cover**:
- MCP server integration
- Tool exposure
- Protocol bridging

### Custom Framework → OSSA

**General Approach**:

1. **Map Agent Structure**
   - Identify agent components
   - Map to OSSA format
   - Define capabilities

2. **Define Tools**
   - List available tools
   - Map to OSSA tool types
   - Configure endpoints

3. **Configure LLM**
   - Identify LLM provider
   - Map model settings
   - Set parameters

4. **Add Observability**
   - Configure tracing
   - Set up metrics
   - Enable logging

5. **Validate**
   - Use OSSA CLI
   - Fix validation errors
   - Test functionality

## Migration Checklist

### Pre-Migration

- [ ] Inventory existing agents
- [ ] Identify framework dependencies
- [ ] Document current capabilities
- [ ] Plan migration order

### Migration

- [ ] Convert agent structure
- [ ] Map tools/capabilities
- [ ] Configure LLM settings
- [ ] Add observability
- [ ] Set constraints

### Post-Migration

- [ ] Validate with OSSA CLI
- [ ] Test functionality
- [ ] Compare behavior
- [ ] Update documentation
- [ ] Deploy and monitor

## Migration Tools

### OSSA CLI

```bash
# Migrate agent between versions
ossa migrate agent.yaml --target-version 0.2.2
```

### Manual Migration

1. Use migration guide examples
2. Follow step-by-step instructions
3. Validate at each step
4. Test thoroughly

## Common Migration Patterns

### Pattern 1: Simple Agent

**Before** (Framework-specific):
```python
# Framework code
agent = create_agent(llm, tools)
```

**After** (OSSA):
```yaml
apiVersion: ossa/v0.2.2
kind: Agent
spec:
  role: Agent description
  llm: { ... }
  tools: [ ... ]
```

### Pattern 2: Agent with Tools

**Before**:
```python
tools = [Tool1(), Tool2()]
agent = create_agent(llm, tools)
```

**After**:
```yaml
spec:
  tools:
    - type: function
      name: tool1
    - type: http
      name: tool2
      endpoint: https://api.example.com
```

### Pattern 3: Multi-Agent System

**Before**:
```python
orchestrator = create_orchestrator()
worker1 = create_worker()
worker2 = create_worker()
```

**After**:
```yaml
# orchestrator.ossa.yaml
spec:
  tools:
    - type: http
      name: invoke_worker
      endpoint: http://worker:8080/api

# worker.ossa.yaml
spec:
  role: Worker agent
  # ...
```

## Validation

### Validate Migrated Agent

```bash
ossa validate migrated-agent.ossa.yaml --verbose
```

### Compare Behavior

1. Run original agent with test inputs
2. Run OSSA agent with same inputs
3. Compare outputs
4. Verify functionality

## Troubleshooting

### Common Issues

1. **Missing Fields**: Check schema reference
2. **Invalid Tool Types**: Use supported types
3. **LLM Provider**: Verify provider support
4. **Tool Configuration**: Check endpoint/auth config

### Getting Help

- [GitLab Issues](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues)
- [Documentation](/docs/specification)
- [Examples](/docs/examples)

## Related

- [Getting Started](/docs/getting-started/hello-world)
- [Schema Reference](/docs/schema-reference)
- [Integration Patterns](Integration-Patterns)

