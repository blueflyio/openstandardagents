# ossa generate

**Purpose**: Generate OSSA agent manifests from templates

## Synopsis

```bash
ossa generate <type> [options]
```

## Description

Generate OSSA agent manifests from templates

## Arguments

- `<type>` (required) - Agent type: worker, orchestrator, compliance, chat

## Options

- `--name <name>` - Agent name (default: My Agent)
- `--id <id>` - Agent ID (DNS-1123 format)
- `--output <path>` - Output file path (default: agent.ossa.yaml)
- `--interactive` - Interactive mode with prompts

## Examples

```bash
ossa generate worker --name "Data Processor"
```

```bash
ossa generate orchestrator --id my-orchestrator
```

```bash
ossa generate compliance --interactive
```

```bash
ossa generate chat --output chat-agent.yaml
```

## API Endpoint Connection

This command uses the following API endpoint:
- `POST /api/v1/agents/generate` - [API Reference](../api-reference/index.md)

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - File not found

## Related Commands

- [ossa validate](./ossa-validate.md)
- [ossa migrate](./ossa-migrate.md)
- [ossa run](./ossa-run.md)

## Related Documentation

- [API Reference](../api-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Getting Started](../getting-started/index.md)
