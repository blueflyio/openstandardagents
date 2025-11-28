# agent.version

**Type**: `string`
**Required**: Yes

## Description

The agent.version field

## Why This Field Exists

Track agent versions for compatibility, rollback, and change management

## How to Use

Use semantic versioning (MAJOR.MINOR.PATCH)

## Where It's Used

Used in registry, deployment manifests, and API responses

## Examples

```yaml
agent.version: 1.0.0
```

```yaml
agent.version: 2.1.3
```

```yaml
agent.version: 0.1.0-beta
```

## Validation

```bash
ossa validate agent.ossa.yaml
```

## Related Fields

- [agent.id](./agent-id.md)
- [ossaVersion](./ossaVersion.md)

## Related Documentation

- [versioning](../guides/versioning.md)

