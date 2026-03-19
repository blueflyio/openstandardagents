# ossa export

**Purpose**: Export agent manifest to different formats

## Synopsis

```bash
ossa export <manifest> [options]
```

## Description

Export agent manifest to different formats

## Arguments

- `<manifest>` (required) - Path to agent manifest

## Options

- `--format <format>` - Export format: json, yaml, openapi, k8s (default: json)
- `--output <path>` - Output file path
- `--pretty` - Pretty print output

## Examples

```bash
ossa export agent.ossa.yaml --format json
```

```bash
ossa export agent.ossa.yaml --format k8s --output deployment.yaml
```

```bash
ossa export agent.ossa.yaml --format openapi --pretty
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
