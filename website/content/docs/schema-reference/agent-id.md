# agent.id

**Type**: `string`
**Required**: Yes

## Description

The agent.id field

## Why This Field Exists

Unique identifier for agent registration, API routing, and inter-agent communication

## How to Use

Use DNS-1123 subdomain format: lowercase alphanumeric with hyphens, max 63 chars

## Where It's Used

Used in API endpoints (/agents/{id}), Kubernetes resources, and registry URLs

## Examples

```yaml
agent.id: my-agent
```

```yaml
agent.id: data-processor-v2
```

```yaml
agent.id: compliance-checker-prod
```

## Validation

```bash
ossa validate agent.ossa.yaml
```

## Related Fields

- [agent.name](./agent-name.md)
- [agent.version](./agent-version.md)
- [agent.role](./agent-role.md)

## Related Documentation

- [ossa-validate](../cli-reference/ossa-validate.md)
- [core-api](../api-reference/core-api.md)

