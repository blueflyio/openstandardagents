# ossa init

**Purpose**: Initialize a new OSSA project

## Synopsis

```bash
ossa init [options]
```

## Description

Initialize a new OSSA project

## Options

- `--name <name>` - Project name
- `--template <template>` - Project template: minimal, full, enterprise
- `--typescript` - Use TypeScript
- `--git` - Initialize git repository

## Examples

```bash
ossa init
```

```bash
ossa init --name my-agent-project
```

```bash
ossa init --template enterprise --typescript
```

```bash
ossa init --git
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
