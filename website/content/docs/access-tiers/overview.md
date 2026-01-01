---
title: "Access Tiers Overview"
description: "OSSA Access Tiers - permission levels for agent capabilities"
---

# Access Tiers Overview

OSSA defines four access tiers that control agent permissions and capabilities:

| Tier | Level | Description |
|------|-------|-------------|
| **observer** | Read-only | Query-only access, no state changes |
| **operator** | Standard | Execute capabilities, tool calls |
| **admin** | Elevated | System configuration, agent management |
| **system** | Full | Unrestricted access (internal only) |

## Configuration

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

spec:
  access_tier: operator  # Default tier

  capabilities:
    - name: read_data
      access_tier: observer
    - name: update_record
      access_tier: operator
    - name: manage_agents
      access_tier: admin
```

## Permission Inheritance

Access tiers form a hierarchy:

```
system > admin > operator > observer
```

Higher tiers inherit permissions from lower tiers.

## Related Documentation

- [Execution Profiles](/docs/runtime/execution-profiles)
- [Memory Model](/docs/runtime/memory-model)
- [Schema Reference](/docs/schema-reference)
