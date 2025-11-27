# ossa gitlab-agent

**Purpose**: Manage GitLab agent integration

## Synopsis

```bash
ossa gitlab-agent [options]
```

## Description

Manage GitLab agent integration

## Options

- `--configure` - Configure GitLab agent
- `--deploy` - Deploy agent to GitLab
- `--status` - Check agent status
- `--logs` - View agent logs

## Examples

```bash
ossa gitlab-agent --configure
```

```bash
ossa gitlab-agent --deploy
```

```bash
ossa gitlab-agent --status
```

```bash
ossa gitlab-agent --logs
```

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - File not found

## Related Commands

- [ossa validate](./ossa-validate.md)
- [ossa generate](./ossa-generate.md)
- [ossa migrate](./ossa-migrate.md)

## Related Documentation

- [API Reference](../api-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Getting Started](../getting-started/index.md)
