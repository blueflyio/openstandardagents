# ossa validate

**Purpose**: Validate OSSA agent manifests against the schema

## Synopsis

```bash
ossa validate <path> [options]
```

## Description

Validate OSSA agent manifests against the schema

## Arguments

- `<path>` (required) - Path to agent manifest file or directory

## Options

- `--version <version>` - Specify OSSA version (default: latest)
- `--strict` - Enable strict validation mode
- `--format <format>` - Output format: json, yaml, table (default: table)
- `--verbose` - Show detailed validation errors

## Examples

```bash
ossa validate agent.ossa.yaml
```

```bash
ossa validate ./agents/
```

```bash
ossa validate agent.ossa.yaml --strict
```

```bash
ossa validate agent.ossa.yaml --format json
```

## API Endpoint Connection

This command uses the following API endpoint:
- `POST /api/v1/validate` - [API Reference](../api-reference/index.md)

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - File not found

## Related Commands

- [ossa generate](./ossa-generate.md)
- [ossa migrate](./ossa-migrate.md)
- [ossa run](./ossa-run.md)

## Related Documentation

- [API Reference](../api-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Getting Started](../getting-started/index.md)
