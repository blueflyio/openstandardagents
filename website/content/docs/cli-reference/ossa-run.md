# ossa run

**Purpose**: Run an OSSA agent locally

## Synopsis

```bash
ossa run <manifest> [options]
```

## Description

Run an OSSA agent locally

## Arguments

- `<manifest>` (required) - Path to agent manifest

## Options

- `--env <file>` - Environment variables file
- `--port <port>` - Port to run on (default: 3000)
- `--watch` - Watch for changes and reload
- `--debug` - Enable debug logging

## Examples

```bash
ossa run agent.ossa.yaml
```

```bash
ossa run agent.ossa.yaml --port 8080
```

```bash
ossa run agent.ossa.yaml --watch --debug
```

```bash
ossa run agent.ossa.yaml --env .env.local
```

## API Endpoint Connection

This command uses the following API endpoint:
- `POST /api/v1/agents/{id}/execute` - [API Reference](../api-reference/index.md)

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
