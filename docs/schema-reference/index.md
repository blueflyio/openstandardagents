# Schema Reference

Complete reference for the OSSA agent manifest schema.

## Overview

The OSSA schema defines the structure of agent manifests. Every field serves a specific purpose in the agent lifecycle.

## Core Fields

### Agent Identification

- [agent.id](./agent-id.md) - Unique agent identifier
- [agent.name](./agent-name.md) - Human-readable name
- [agent.version](./agent-version.md) - Semantic version
- [agent.role](./agent-role.md) - Agent role classification

### Agent Capabilities

- [agent.capabilities](./agent-capabilities.md) - What the agent can do

## Schema Versions

- **Current**: v0.5

See [Versioning Guide](../guides/versioning.md) for migration information.

## Validation

Validate your agent manifests:

```bash
ossa validate agent.ossa.yaml
```

## Complete Schema

View the complete JSON Schema:

- [Current Schema](https://github.com/blueflyio/openstandardagents/blob/main/spec/v0.5/agent.schema.json)

## Related Documentation

- [CLI Reference](../cli-reference/index.md)
- [API Reference](../api-reference/index.md)
- [Creating Agents Guide](../guides/creating-agents.md)
