# Schema Reference

Complete reference for the OSSA agent manifest schema.

## Overview

The OSSA schema defines the structure of agent manifests. Every field serves a specific purpose in the agent lifecycle.

## Resource Kinds

OSSA supports multiple resource kinds (v0.3.1+):

- **[Agent](./agent-spec.md)** - Single agent definition
- **[Workflow](./workflow-spec.md)** - Multi-agent composition
- **[Task](./task-spec.md)** - Deterministic task definition
- **[MessageRouting](./message-routing-spec.md)** - Message routing rules

## Core Fields

### Agent Identification
- [agent.id](./agent-id.md) - Unique agent identifier
- [agent.name](./agent-name.md) - Human-readable name
- [agent.version](./agent-version.md) - Semantic version
- [agent.role](./agent-role.md) - Agent role classification

### Agent Capabilities
- [agent.capabilities](./agent-capabilities.md) - What the agent can do

### Workflow Composition
- [workflow.spec](./workflow-spec.md) - Workflow specification
- [workflow.steps](./workflow-spec.md#workflowstep-object) - Workflow steps
- [workflow.triggers](./workflow-spec.md#triggers) - Workflow triggers

## Schema Versions

- **Current**: v0.2.8-RC
- **Stable**: v0.2.8
- **Previous**: v0.3.0, v0.3.0

See [Versioning Guide](../guides/versioning.md) for migration information.

## Validation

Validate your agent manifests:

```bash
ossa validate agent.ossa.yaml
```

## Complete Schema

View the complete JSON Schema:
- [v0.2.8-RC Schema](https://github.com/blueflyio/openstandardagents/blob/main/spec/v0.3.0/ossa-0.3.0.schema.json)

## Related Documentation

- [CLI Reference](../cli-reference/index.md)
- [API Reference](../api-reference/index.md)
- [Creating Agents Guide](../guides/creating-agents.md)
