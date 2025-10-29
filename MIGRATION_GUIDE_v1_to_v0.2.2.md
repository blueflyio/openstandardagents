# OSSA Agent Migration Guide: v1.0 → v0.2.2

## Successfully Migrated Pilot Agent

✅ **agent-protocol** - Validated and working with OSSA v0.2.2

## Migration Pattern

### Structure Mapping

| v1.0 Format | v0.2.2 Format | Notes |
|------------|---------------|-------|
| `ossaVersion: '1.0'` | `apiVersion: ossa/v1` | At top level |
| N/A | `kind: Agent` | Required |
| N/A | `metadata:` | Top-level section |
| `agent.id` | `metadata.name` | Agent identifier |
| `agent.name` | `metadata.description` | Human-readable name |
| `agent.version` | `metadata.version` | Semantic version |
| `agent.tags` | `metadata.labels` | Key-value labels |
| N/A | `metadata.annotations` | Author, license, etc. |
| `agent.role` | `spec.role` | Agent role/purpose |
| `agent.capabilities` | `spec.tools` | Tool definitions |
| `agent.runtime` | `spec.extensions.runtime` | Runtime config (in extensions) |
| `agent.integration` | `spec.tools` or `spec.extensions` | Integration config |

### Example Migration

#### Before (v1.0):
```yaml
ossaVersion: '1.0'
agent:
  id: agent-protocol
  name: Agent Protocol
  version: 0.1.0
  description: MCP server for Claude Desktop integration
  role: integration
  tags: [mcp, claude, protocol]
  capabilities:
    - name: mcp_tools
      description: Expose MCP tools for Claude
metadata:
  authors: [Agent BuildKit Team]
```

#### After (v0.2.2):
```yaml
apiVersion: ossa/v1
kind: Agent
metadata:
  name: agent-protocol
  version: 0.1.0
  description: "MCP server for Claude Desktop integration"
  labels:
    framework: mcp
    integration: claude-desktop
  annotations:
    author: "Agent BuildKit Team"
    ossa.io/migration: "v1.0 to v0.2.2"

spec:
  role: "You are an MCP server agent..."
  tools:
    - type: mcp
      name: mcp_tools
      server: agent-protocol
      capabilities:
        - list_tools
  extensions:
    mcp:
      enabled: true
      server_type: stdio
```

## Framework Integration Extensions

### MCP Bridge
```yaml
extensions:
  mcp:
    enabled: true
    server_type: stdio  # or sse, websocket
    tools:
      - name: tool_name
        description: "Tool description"
    resources:
      - uri: "mcp://resource"
        name: "Resource Name"
```

### kagent (Kubernetes)
```yaml
extensions:
  kagent:
    kubernetes:
      namespace: production
      labels:
        app: my-agent
    deployment:
      replicas: 2
```

### Buildkit
```yaml
extensions:
  buildkit:
    deployment:
      replicas:
        min: 1
        max: 4
    container:
      image: my-agent:version
```

### Librechat
```yaml
extensions:
  librachat:
    enabled: true
    actions:
      - name: action_name
        description: "Action description"
        endpoint: "/api/action"
```

### Drupal
```yaml
extensions:
  drupal:
    enabled: true
    module_id: "my_agent_module"
    api_version: "jsonapi"
```

## Schema Validation Checklist

- [ ] Has `apiVersion: ossa/v1` or `ossa/v0.2.2`
- [ ] Has `kind: Agent`
- [ ] Has `metadata` with `name` (required)
- [ ] Has `spec` with `role` (required)
- [ ] No `timeout_seconds` directly on tools (not in schema)
- [ ] Extensions use `additionalProperties: true` structure
- [ ] Validates successfully with `node bin/ossa validate`

## Remaining Work

### To Migrate All 70+ Agents:

1. **Automate Conversion** - Create script to batch convert v1.0 → v0.2.2
2. **Framework Extensions** - Add extensions for each framework type
3. **Validation** - Validate each migrated agent
4. **Testing** - Test with kagent, buildkit, librachat, drupal

### Estimated Effort:
- Manual migration: 2-3 hours per agent = 140-210 hours
- Automated migration: 20-30 hours (script + review)
- **Recommended: Automated approach**

## Next Steps

1. Review this migration guide
2. Approve the pattern
3. Create automated migration script
4. Batch migrate agents by repository
5. Validate all migrations
6. Test framework integrations
7. Replace old v1.0 files with v0.2.2 versions

## Files Created

1. `AGENT_MIGRATION_PLAN.md` - Overall strategy
2. `agent-migration-audit.md` - Detailed audit
3. This file - Migration guide and pattern
4. Pilot agent: `agent-protocol.ossa.v0.2.2.yaml` ✅

