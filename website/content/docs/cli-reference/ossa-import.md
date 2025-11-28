# ossa import

**Purpose**: Import agents from other frameworks

## Synopsis

```bash
ossa import <source> [options]
```

## Description

Import agents from other frameworks

## Arguments

- `<source>` (required) - Source file or URL

## Options

- `--from <framework>` - Source framework: langchain, crewai, openai, mcp
- `--output <path>` - Output file path (default: agent.ossa.yaml)
- `--validate` - Validate after import

## Examples

```bash
ossa import langchain-agent.py --from langchain
```

```bash
ossa import crew.yaml --from crewai --validate
```

```bash
ossa import https://example.com/agent.json --from openai
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
