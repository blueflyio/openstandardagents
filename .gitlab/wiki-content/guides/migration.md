<!--
OSSA Migration Guide
Purpose: Guide users through version upgrades
Audience: Developers upgrading OSSA versions
Educational Focus: Show migration paths and breaking changes
-->

# Migration Guide

## Version Migration

### Current Version: 0.2.6

### Upgrading from 0.2.5 to 0.2.6

**Breaking Changes:**
- None

**New Features:**
- Enhanced validation rules
- Improved error messages
- Additional metadata fields

**Migration Steps:**

```bash
# 1. Update OSSA CLI
npm install -g @bluefly/openstandardagents@latest

# 2. Validate existing agents
ossa validate agents/*.json

# 3. Update version in definitions
sed -i 's/"ossa": "0.2.5"/"ossa": "0.3.0"/' agents/*.json

# 4. Re-validate
ossa validate agents/*.json
```

### Upgrading from 0.2.4 to 0.2.5

**Breaking Changes:**
- `role` field now required
- Capability `type` must be one of: query, action, stream, event

**Migration Steps:**

```bash
# 1. Add role to all agents
# Before:
{
  "agent": {
    "name": "my-agent"
  }
}

# After:
{
  "agent": {
    "name": "my-agent",
    "role": "worker"
  }
}

# 2. Update capability types
# Before: "type": "read"
# After: "type": "query"

# 3. Run migration tool
ossa migrate agents/*.json --from 0.2.4 --to 0.2.5
```

## Automated Migration

```bash
# Migrate single file
ossa migrate agent.json --to 0.2.6

# Migrate directory
ossa migrate agents/ --to 0.2.6 --recursive

# Dry run (preview changes)
ossa migrate agent.json --to 0.2.6 --dry-run
```

## Manual Migration Checklist

### For Each Agent:

- [ ] Update `ossa` version field
- [ ] Add missing required fields
- [ ] Update deprecated fields
- [ ] Validate with `ossa validate`
- [ ] Test agent functionality
- [ ] Update documentation
- [ ] Commit changes

## Common Migration Issues

### Issue: Missing `role` field

**Error:**
```
ValidationError: Missing required field 'role'
```

**Fix:**
```json
{
  "agent": {
    "role": "worker"  // Add appropriate role
  }
}
```

### Issue: Invalid capability type

**Error:**
```
ValidationError: Invalid capability type 'read'
```

**Fix:**
```json
{
  "capabilities": [
    {
      "type": "query"  // Change to valid type
    }
  ]
}
```

### Issue: Schema reference not found

**Error:**
```
ValidationError: Schema reference not found
```

**Fix:**
```json
{
  "components": {
    "schemas": {
      "Input": {  // Define missing schema
        "type": "object"
      }
    }
  }
}
```

## Version Compatibility Matrix

| OSSA Version | Node.js | TypeScript | Status |
|--------------|---------|------------|--------|
| 0.2.6 | >=18.0.0 | >=5.0.0 | Current |
| 0.2.5 | >=18.0.0 | >=5.0.0 | Supported |
| 0.2.4 | >=16.0.0 | >=4.5.0 | Deprecated |
| 0.2.3 | >=16.0.0 | >=4.5.0 | Unsupported |

## Deprecation Policy

- **Current**: Latest version, fully supported
- **Supported**: Previous version, security updates only
- **Deprecated**: 2 versions back, no updates
- **Unsupported**: 3+ versions back, upgrade required

## Migration Support

- **Documentation**: This guide
- **CLI Tool**: `ossa migrate`
- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- **Community**: [Discussions](https://gitlab.com/blueflyio/openstandardagents/-/issues)

---

**Next**: [Tutorials](tutorials.md) for hands-on examples
