<!--
OSSA Migration Guide
Purpose: Guide users through version upgrades
Audience: Developers upgrading OSSA versions
Educational Focus: Show migration paths and breaking changes
-->

# Migration Guide

## Version Migration

### Current Version: 0.3.3

## Upgrading to v0.3.x

### From v0.2.x to v0.3.0

**Breaking Changes:**
- `apiVersion` format changed from `ossa.ai/v1` to `ossa/v0.3.0`
- Removed legacy `role` field - use `spec.role` instead
- `capabilities` now require `type: function` explicitly
- `llm` configuration is now required for Agent kind

**New Features:**
- 4-Tier Access System (Tier1Read, Tier2WriteLimited, Tier3WriteElevated, Tier4Policy)
- 7-Phase Lifecycle (init, norm, resol, infer, exec, persist, emit)
- Capability URI format: `ossa:provider/capability@version`
- Kill switch support for production agents
- Workflow and Task kinds in addition to Agent

**Migration Steps:**

```bash
# 1. Update OSSA CLI
npm install -g @bluefly/openstandardagents@0.3.3

# 2. Run automated migration
ossa migrate agents/*.yaml --to v0.3.0

# 3. Validate migrated agents
ossa validate agents/*.yaml

# 4. Update apiVersion manually if needed
# Before: apiVersion: ossa.ai/v1
# After:  apiVersion: ossa/v0.3.0
```

### From v0.3.0 to v0.3.3

**Breaking Changes:**
- None

**New Features:**
- Agent identity extensions
- Multi-provider LLM configuration
- Enhanced metadata annotations

**Migration Steps:**

```bash
# Update apiVersion
sed -i 's/ossa\/v0.3.0/ossa\/v0.3.3/' agents/*.yaml

# Validate
ossa validate agents/*.yaml
```

### From v0.3.3 to v0.3.3

**Breaking Changes:**
- None

**New Features:**
- Separation of duties enforcement
- Access tier constants
- Enhanced schema validation
- Showcase example agents

**Migration Steps:**

```bash
# Update apiVersion
sed -i 's/ossa\/v0.3.3/ossa\/v0.3.3/' agents/*.yaml

# Or use CLI
ossa migrate agents/*.yaml --to v0.3.3

# Validate
ossa validate agents/*.yaml
```

## v0.3.3 Schema Requirements

### Required Fields

```yaml
apiVersion: ossa/v0.3.3          # Required - exact format
kind: Agent                       # Required - Agent, Task, or Workflow
metadata:
  name: kebab-case-name          # Required - lowercase with hyphens
  version: 1.0.0                 # Required - semver format
spec:
  capabilities: []               # Required - at least one capability
  role: |                        # Required for Agent kind
    System prompt...
  llm:                           # Required for Agent kind
    provider: anthropic
    model: claude-sonnet-4
```

### Capability Format

```yaml
capabilities:
  - type: function               # Required - must be explicit
    name: capability.name
    description: What it does
```

### Tool Format

```yaml
tools:
  - type: function               # Required - must be explicit
    name: tool.name
    description: What it does
```

## 4-Tier Access System

When migrating to v0.3.x, consider access tier requirements:

| Tier | Constant | Operations | Approval |
|------|----------|------------|----------|
| 1 | Tier1Read | Read code, issues, MRs | No |
| 2 | Tier2WriteLimited | Create issues, comments | No |
| 3 | Tier3WriteElevated | Merge MRs, deploy | Yes |
| 4 | Tier4Policy | Define policies, RBAC | Yes |

Add access tier to capabilities:

```yaml
capabilities:
  - type: function
    name: merge_request.approve
    access_tier: Tier3WriteElevated
    constraints:
      require_approval: true
```

## 7-Phase Lifecycle

v0.3.x introduces formal lifecycle phases:

```
init → norm → resol → infer → exec → persist → emit
```

Add lifecycle configuration:

```yaml
spec:
  lifecycle:
    phases: [init, norm, resol, infer, exec, persist, emit]
    hooks:
      pre_exec: validate_permissions
      post_exec: audit_log
```

## Production Requirements

### Kill Switch (Recommended)

```yaml
spec:
  kill_switch:
    enabled: true
    triggers:
      error_rate_threshold: 0.15
      cost_threshold_usd: 500
      unauthorized_access_attempt: true
```

### Guardrails (Recommended)

```yaml
spec:
  guardrails:
    require_human_approval_for:
      - production_deploy
      - namespace_delete
    max_actions_per_minute: 30
    audit_all_actions: true
```

## Automated Migration

```bash
# Migrate single file
ossa migrate agent.yaml --to v0.3.3

# Migrate directory
ossa migrate agents/ --to v0.3.3 --recursive

# Dry run (preview changes)
ossa migrate agent.yaml --to v0.3.3 --dry-run

# Show what would change
ossa diff agent.yaml agent.yaml.bak
```

## Version Compatibility Matrix

| OSSA Version | Node.js | TypeScript | Status |
|--------------|---------|------------|--------|
| 0.3.3 | >=20.0.0 | >=5.0.0 | Current |
| 0.3.3 | >=20.0.0 | >=5.0.0 | Supported |
| 0.3.0 | >=18.0.0 | >=5.0.0 | Supported |
| 0.2.9 | >=18.0.0 | >=5.0.0 | Deprecated |
| 0.2.x | >=16.0.0 | >=4.5.0 | Unsupported |

## Common Migration Issues

### Issue: Invalid apiVersion format

**Error:**
```
ValidationError: apiVersion must match pattern 'ossa/v\d+\.\d+\.\d+'
```

**Fix:**
```yaml
# Before (wrong)
apiVersion: ossa.ai/v1
apiVersion: ossa.ai/v0.3.3

# After (correct)
apiVersion: ossa/v0.3.3
```

### Issue: Missing type on capabilities/tools

**Error:**
```
ValidationError: capability must have 'type' field
```

**Fix:**
```yaml
capabilities:
  - type: function        # Add this line
    name: my.capability
    description: Does something
```

### Issue: Missing llm configuration

**Error:**
```
ValidationError: Agent kind requires spec.llm configuration
```

**Fix:**
```yaml
spec:
  llm:
    provider: anthropic   # or openai, google
    model: claude-sonnet-4
    temperature: 0.3
    maxTokens: 8192
```

## Migration Support

- **Documentation**: [openstandardagents.org](https://openstandardagents.org)
- **CLI Help**: `ossa migrate --help`
- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Spec**: [spec/v0.3.3/](https://gitlab.com/blueflyio/ossa/openstandardagents/-/tree/main/spec/v0.3.3)

---

**Next**: [Tutorials](tutorials.md) for hands-on examples
