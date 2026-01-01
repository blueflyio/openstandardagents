---
title: "Access Tiers Schema"
description: "JSON Schema reference for OSSA access tier definitions"
---

# Access Tiers Schema Reference

This page documents the JSON Schema for OSSA access tiers.

## Schema Definition

```json
{
  "accessTier": {
    "type": "string",
    "enum": ["observer", "operator", "admin", "system"],
    "default": "operator",
    "description": "Permission level for agent capabilities"
  }
}
```

## Tier Definitions

### observer

Read-only access level for monitoring and query operations.

```yaml
access_tier: observer
permissions:
  - read
  - query
  - observe
```

### operator

Standard operational access for executing capabilities.

```yaml
access_tier: operator
permissions:
  - read
  - write
  - execute
  - tool_call
```

### admin

Elevated access for system configuration and agent management.

```yaml
access_tier: admin
permissions:
  - read
  - write
  - execute
  - tool_call
  - configure
  - manage_agents
```

### system

Full unrestricted access for internal system operations.

```yaml
access_tier: system
permissions:
  - "*"
```

## Related Documentation

- [Access Tiers Overview](/docs/access-tiers/overview)
- [Protocols - Delegation](/docs/protocols/delegation)
