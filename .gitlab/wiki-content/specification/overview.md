<!--
OSSA Specification Overview
Purpose: High-level overview of the OSSA specification structure
Audience: Developers implementing OSSA support
Educational Focus: Explain specification components and their relationships
-->

# OSSA Specification Overview

## What is the OSSA Specification?

The OSSA specification defines a **JSON Schema-based format** for describing AI agents. It provides:

- Standard structure for agent definitions
- Validation rules for agent configurations
- Type definitions for capabilities and interfaces
- Versioning and migration paths

## Specification Structure

### Core Components

```
OSSA Agent Definition
├── Metadata (name, version, description)
├── Capabilities (what the agent can do)
├── Configuration (agent settings)
├── Dependencies (required services/tools)
└── Schemas (input/output types)
```

### Example Agent Definition

```json
{
  "ossa": "0.3.0",
  "agent": {
    "name": "example-agent",
    "version": "1.0.0",
    "description": "Example OSSA agent",
    "capabilities": [
      {
        "name": "process-data",
        "type": "action",
        "input": {
          "type": "object",
          "properties": {
            "data": { "type": "string" }
          }
        },
        "output": {
          "type": "object",
          "properties": {
            "result": { "type": "string" }
          }
        }
      }
    ]
  }
}
```

## Key Concepts

### 1. Agent Metadata

Every agent must define:
- **name**: Unique identifier
- **version**: Semantic version
- **description**: Human-readable description
- **ossa**: Specification version

### 2. Capabilities

Capabilities define what an agent can do:
- **name**: Capability identifier
- **type**: action, query, stream, etc.
- **input**: JSON Schema for inputs
- **output**: JSON Schema for outputs

### 3. Validation

All agent definitions are validated against JSON Schema:

```bash
# Validate an agent
ossa validate agent.json

# Output: ✅ Valid OSSA agent definition
```

### 4. Type Safety

Generate types from agent definitions:

```bash
# Generate TypeScript types
ossa generate types agent.json

# Output: agent.types.ts
```

## Specification Versions

OSSA uses semantic versioning:

- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

Current version: **0.2.6**

### Migration

Migrate between versions:

```bash
# Migrate from 0.2.5 to 0.2.6
ossa migrate agent-v0.2.5.json --to 0.2.6
```

## Schema Reference

The full JSON Schema is available at:
- [OSSA 0.2.6 Schema](https://gitlab.com/blueflyio/openstandardagents/-/blob/main/spec/v0.3.0/ossa-0.3.0.schema.json)

## Detailed Documentation

- [Agent Definition](agent-definition.md) - Complete agent structure
- [Capabilities](capabilities.md) - Capability types and patterns
- [Validation](validation.md) - Validation rules and errors

## Design Principles

### 1. JSON Schema-Based
Use proven, standard validation technology

### 2. Framework-Agnostic
No assumptions about runtime or execution

### 3. Extensible
Support custom extensions while maintaining compatibility

### 4. Versioned
Clear migration paths between versions

### 5. Type-Safe
Generate types for any language

## Implementation Guide

### For Framework Authors

1. Parse OSSA JSON definitions
2. Validate against schema
3. Map capabilities to your framework
4. Implement agent logic

### For Tool Builders

1. Use OSSA CLI as reference
2. Leverage JSON Schema validation
3. Generate types/docs from specs
4. Contribute back to ecosystem

## Examples

See [Examples](../guides/tutorials.md) for:
- Basic agents
- Multi-capability agents
- Complex workflows
- Integration patterns

## Questions?

- **Where's the full schema?** [spec/v0.3.0/](https://gitlab.com/blueflyio/openstandardagents/-/tree/main/spec/v0.3.0)
- **How do I validate?** Use `ossa validate` CLI command
- **Can I extend it?** Yes, use custom properties (prefixed with `x-`)
- **Is it stable?** Yes, v0.3.0 is production-ready

---

**Next**: [Agent Definition](agent-definition.md) for complete structure details
