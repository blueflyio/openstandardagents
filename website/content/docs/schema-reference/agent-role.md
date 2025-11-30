# agent.role

**Type**: `string`
**Required**: Yes

## Description

The agent.role field

## Why This Field Exists

Classify agents by their function in the system for routing and orchestration

## How to Use

Choose from predefined roles or use custom roles

## Where It's Used

Used for agent discovery, filtering, and orchestration patterns

## Examples

```yaml
agent.role: worker
```

```yaml
agent.role: orchestrator
```

```yaml
agent.role: compliance
```

```yaml
agent.role: monitor
```

## Validation

```bash
ossa validate agent.ossa.yaml
```

## Related Fields

- [agent.capabilities](./agent-capabilities.md)
- [agent.taxonomy](./agent-taxonomy.md)

## Related Documentation

- [multi-agent-systems](../architecture/multi-agent-systems.md)

