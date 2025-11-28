# agent.capabilities

**Type**: `string`
**Required**: Yes

## Description

The agent.capabilities field

## Why This Field Exists

Define what the agent can do, enabling capability-based routing and discovery

## How to Use

List all capabilities with input/output schemas and descriptions

## Where It's Used

Used by orchestrators to route tasks and by registry for discovery

## Examples

```yaml
agent.capabilities: process_data
```

```yaml
agent.capabilities: validate_compliance
```

```yaml
agent.capabilities: generate_report
```

## Validation

```bash
ossa validate agent.ossa.yaml
```

## Related Fields

- [agent.tools](./agent-tools.md)
- [agent.role](./agent-role.md)

## Related Documentation

- [defining-capabilities](../guides/defining-capabilities.md)

