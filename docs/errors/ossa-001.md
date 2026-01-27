# OSSA-001: Missing Required Field

**Severity**: Error
**Category**: Schema Validation
**Tags**: schema, validation, required

## Description

A required field is missing from your OSSA manifest. OSSA v0.3.6 requires specific fields at the top level and within nested objects to ensure manifest completeness and compatibility.

## Error Message

```
Missing required field
```

## Common Causes

1. **Top-level fields missing**: `apiVersion`, `kind`, or `metadata` are required
2. **Spec fields missing**: `spec` is required for Agent, Task, Workflow kinds
3. **Nested required fields**: Missing required fields within objects (e.g., `tier` in `access_tier`)
4. **Typo in field name**: Field exists but has wrong name

## Remediation

Add the required field to your manifest. Check the schema for required fields at the current path.

### Top-Level Fields

All OSSA manifests require:
- `apiVersion` (string)
- `kind` (string)
- `metadata` (object)

### Kind-Specific Requirements

| Kind | Required Fields |
|------|-----------------|
| Agent | `spec` (AgentSpec) |
| Task | `spec` (TaskSpec) |
| Workflow | `spec` (WorkflowSpec) |
| Flow | `spec` (FlowSpec) |

### Access Tier Requirements

If using `metadata.access_tier`:
- `tier` (string) is **required**

### Taxonomy Requirements

If using `metadata.taxonomy`:
- `domain` (string) is **required**

## Examples

### Example 1: Missing apiVersion

**❌ Invalid**
```json
{
  "kind": "Agent",
  "metadata": {
    "name": "my-agent"
  }
}
```

**✅ Valid**
```json
{
  "apiVersion": "ossa/v0.3.6",
  "kind": "Agent",
  "metadata": {
    "name": "my-agent"
  },
  "spec": {
    "type": "worker"
  }
}
```

### Example 2: Missing spec

**❌ Invalid**
```json
{
  "apiVersion": "ossa/v0.3.6",
  "kind": "Agent",
  "metadata": {
    "name": "my-agent"
  }
}
```

**✅ Valid**
```json
{
  "apiVersion": "ossa/v0.3.6",
  "kind": "Agent",
  "metadata": {
    "name": "my-agent"
  },
  "spec": {
    "type": "worker",
    "model": {
      "provider": "anthropic",
      "name": "claude-3-5-sonnet-20241022"
    }
  }
}
```

### Example 3: Missing tier in access_tier

**❌ Invalid**
```json
{
  "apiVersion": "ossa/v0.3.6",
  "kind": "Agent",
  "metadata": {
    "name": "security-scanner",
    "access_tier": {
      "permissions": ["read_code", "read_configs"]
    }
  },
  "spec": {
    "type": "analyzer"
  }
}
```

**✅ Valid**
```json
{
  "apiVersion": "ossa/v0.3.6",
  "kind": "Agent",
  "metadata": {
    "name": "security-scanner",
    "access_tier": {
      "tier": "tier_1_read",
      "permissions": ["read_code", "read_configs"]
    }
  },
  "spec": {
    "type": "analyzer"
  }
}
```

### Example 4: Missing domain in taxonomy

**❌ Invalid**
```json
{
  "metadata": {
    "taxonomy": {
      "subdomain": "auth",
      "capability": "authentication"
    }
  }
}
```

**✅ Valid**
```json
{
  "metadata": {
    "taxonomy": {
      "domain": "security",
      "subdomain": "auth",
      "capability": "authentication"
    }
  }
}
```

## Validation Path Examples

The error will indicate the path where the field is missing:

| Path | Missing Field | Fix |
|------|---------------|-----|
| `/` | `apiVersion` | Add `"apiVersion": "ossa/v0.3.6"` |
| `/` | `kind` | Add `"kind": "Agent"` |
| `/` | `metadata` | Add `"metadata": {}` |
| `/` | `spec` | Add `"spec": {}` with kind-specific fields |
| `/metadata/access_tier` | `tier` | Add `"tier": "tier_1_read"` |
| `/metadata/taxonomy` | `domain` | Add `"domain": "security"` |

## Related Errors

- [OSSA-002](./ossa-002.md) - Invalid field type (wrong type for required field)
- [OSSA-005](./ossa-005.md) - Missing spec field (specific to spec)
- [OSSA-006](./ossa-006.md) - Invalid spec for kind

## Debugging Tips

1. **Check schema version**: Ensure you're using the correct schema version for your apiVersion
2. **Validate with schema**: Use a JSON Schema validator to see all missing fields
3. **Copy from example**: Start with a working example and modify incrementally
4. **Use IDE validation**: Configure your IDE to validate against OSSA schema

## Schema Reference

Required fields are marked in the schema with `"required": [...]`:

```json
{
  "type": "object",
  "required": ["apiVersion", "kind", "metadata"],
  "properties": {
    "apiVersion": { "type": "string" },
    "kind": { "type": "string", "enum": ["Agent", "Task", "Workflow", "Flow"] },
    "metadata": { "$ref": "#/definitions/Metadata" }
  }
}
```

## Documentation

- [OSSA v0.3.6 Schema](../../spec/v0.3/ossa-0.3.6.schema.json)
- [Required Fields Guide](../guides/required-fields.md)
- [Manifest Structure](../guides/manifest-structure.md)
- [Error Catalog](./catalog.md)

## Support

If you're still stuck:
1. Check the [examples directory](../../examples/) for working manifests
2. Join our [Discord community](https://discord.gg/openstandardagents)
3. Open an issue on [GitHub](https://github.com/bluefly-ai/openstandardagents/issues)
