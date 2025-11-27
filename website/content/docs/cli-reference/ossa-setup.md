# ossa setup

**Purpose**: Set up OSSA development environment

## Synopsis

```bash
ossa setup [options]
```

## Description

Set up OSSA development environment

## Options

- `--gitlab` - Configure GitLab integration
- `--kubernetes` - Configure Kubernetes deployment
- `--registry <url>` - Configure agent registry
- `--interactive` - Interactive setup wizard

## Examples

```bash
ossa setup --interactive
```

```bash
ossa setup --gitlab
```

```bash
ossa setup --kubernetes
```

```bash
ossa setup --registry https://registry.ossa.dev
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
