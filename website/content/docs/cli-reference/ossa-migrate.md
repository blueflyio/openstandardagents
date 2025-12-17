# ossa migrate

**Purpose**: Migrate agent manifests between OSSA versions

## Synopsis

```bash
ossa migrate <source> [options]
```

## Description

Migrate agent manifests between OSSA versions

## Arguments

- `<source>` (required) - Source manifest file

## Options

- `--from <version>` - Source OSSA version
- `--to <version>` - Target OSSA version (default: latest)
- `--output <path>` - Output file path
- `--dry-run` - Show changes without writing

## Examples

```bash
ossa migrate agent.yaml --from 0.2.8 --to {{OSSA_VERSION}}
```

```bash
ossa migrate agent.yaml --dry-run
```

```bash
ossa migrate agent.yaml --output migrated-agent.yaml
```

## API Endpoint Connection

This command uses the following API endpoint:
- `POST /api/v1/migrate` - [API Reference](../api-reference/index.md)

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - File not found

## Related Commands

- [ossa validate](./ossa-validate.md)
- [ossa generate](./ossa-generate.md)
- [ossa run](./ossa-run.md)

## Related Documentation

- [API Reference](../api-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Getting Started](../getting-started/index.md)
