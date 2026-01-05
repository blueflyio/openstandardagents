---
title: "ossa providers"
---

# ossa providers

**Purpose**: Manage LLM provider configurations

## Synopsis

```bash
ossa providers [command] [options]
```

## Commands

### list
List configured providers

```bash
ossa providers list
```

### add
Add a new provider

```bash
ossa providers add <name> --api-key <key> [options]
```

### remove
Remove a provider

```bash
ossa providers remove <name>
```

### set-default
Set default provider

```bash
ossa providers set-default <name>
```

## Options

- `--api-key <key>` - Provider API key
- `--model <model>` - Default model for provider
- `--priority <number>` - Provider priority
- `--enabled` - Enable provider
- `--disabled` - Disable provider

## Examples

```bash
# List all providers
ossa providers list

# Add Anthropic provider
ossa providers add anthropic --api-key sk-ant-xxxxx

# Set OpenAI as default
ossa providers set-default openai

# Remove provider
ossa providers remove local
```

## Configuration

Providers are stored in `~/.ossa/providers.json`:

```json
{
  "anthropic": {
    "api_key": "sk-ant-xxxxx",
    "model": "claude-sonnet-4-20250514",
    "priority": 1,
    "enabled": true
  },
  "openai": {
    "api_key": "sk-xxxxx",
    "model": "gpt-4o",
    "priority": 2,
    "enabled": true
  }
}
```

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Provider not found

## Related Commands

- [ossa init](./ossa-init.md)
- [ossa validate](./ossa-validate.md)
- [ossa run](./ossa-run.md)

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
