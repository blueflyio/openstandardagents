# ossa schema

**Purpose**: View and manage OSSA schemas

## Synopsis

```bash
ossa schema [options]
```

## Description

View and manage OSSA schemas

## Options

- `--version <version>` - Schema version (default: latest)
- `--format <format>` - Output format: json, yaml (default: yaml)
- `--field <field>` - Show specific field documentation
- `--list` - List available schema versions

## Examples

```bash
ossa schema
```

```bash
ossa schema --version 0.2.8
```

```bash
ossa schema --field agent.id
```

```bash
ossa schema --list
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
