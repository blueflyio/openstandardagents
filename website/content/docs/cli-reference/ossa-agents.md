# ossa agents

**Purpose**: Manage OSSA agents

## Synopsis

```bash
ossa agents <action> [options]
```

## Description

Manage OSSA agents

## Arguments

- `<action>` (required) - Action: list, get, create, update, delete

## Options

- `--id <id>` - Agent ID
- `--role <role>` - Filter by role
- `--status <status>` - Filter by status
- `--format <format>` - Output format: json, yaml, table (default: table)

## Examples

```bash
ossa agents list
```

```bash
ossa agents list --role worker
```

```bash
ossa agents get --id my-agent
```

```bash
ossa agents create agent.ossa.yaml
```

```bash
ossa agents delete --id my-agent
```

## API Endpoint Connection

This command uses the following API endpoint:
- `GET /api/v1/agents` - [API Reference](../api-reference/index.md)

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
