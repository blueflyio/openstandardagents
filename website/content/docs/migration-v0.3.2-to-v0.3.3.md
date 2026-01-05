# Migration Guide: OSSA v0.3.2 → v0.3.3

> **Status**: Production Ready  
> **Last Updated**: 2025-01-05  
> **Difficulty**: Easy (Backward Compatible)

---

## Overview

OSSA v0.3.3 introduces **Skills Compatibility Extension** for interoperability with Anthropic Skills and AgentSkills.io specifications.

### Key Changes

- ✅ **Backward Compatible**: v0.3.2 manifests validate against v0.3.3 schema
- ✅ **Skills Extension**: New `extensions.skills` for bidirectional Skills format support
- ✅ **Progressive Disclosure**: Token-budgeted metadata → instructions → resources pattern

---

## Migration Path

### Option 1: No Changes Required (Recommended for Existing Agents)

**v0.3.2 agents continue to work without modification:**

```yaml
apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
# ... rest of manifest unchanged
```

### Option 2: Add Skills Compatibility

**Enable Skills format export/import:**

```yaml
apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: my-skill-compatible-agent
  version: 1.0.0
  description: Agent with Skills compatibility
spec:
  # ... existing spec
extensions:
  skills:
    enabled: true
    platforms:
      - Claude
      - Claude Code
      - Cursor
    allowedTools:
      - Read
      - Write
      - Bash
    progressiveDisclosure:
      metadataTokens: 100
      instructionsTokens: 5000
```

---

## New Features in v0.3.3

### Skills Extension

The Skills extension enables OSSA agents to be packaged and distributed as Skills, and allows Skills to be consumed by OSSA-compliant runtimes.

**Key Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `enabled` | boolean | Enable Skills format export/import |
| `platforms` | string[] | Compatible platforms (Claude, Cursor, etc.) |
| `allowedTools` | string[] | Pre-approved tools list |
| `progressiveDisclosure` | object | Token budgets for disclosure stages |
| `directories` | object | Skills directory structure mapping |

**CLI Commands:**

```bash
# Export OSSA manifest to Skills format
ossa export --format skills --output ./my-skill/

# Import Skills into OSSA
ossa import --format skills --path ./my-skill/
```

---

## Schema Changes

### Added Definitions

- `SkillsExtension`: Full Skills compatibility configuration

### Extensions Object

```json
{
  "extensions": {
    "mcp": { "$ref": "#/definitions/MCPExtension" },
    "skills": { "$ref": "#/definitions/SkillsExtension" }
  }
}
```

---

## Migration Checklist

- [ ] Update `apiVersion` to `ossa/v0.3.3` (optional - v0.3.2 still works)
- [ ] Add `extensions.skills` if you want Skills compatibility
- [ ] Test manifest with `ossa validate agent.ossa.yaml`
- [ ] Export to Skills format: `ossa export --format skills`
- [ ] Test in Claude/Cursor
- [ ] Update CI/CD to use v0.3.3 schema

## Automated Migration

Use the OSSA CLI to automatically upgrade:

```bash
# Upgrade manifest to v0.3.3
ossa migrate --from v0.3.2 --to v0.3.3 agent.ossa.yaml

# Add Skills extension
ossa migrate --add-extension skills agent.ossa.yaml
```

## Common Issues

### Issue: Validation fails after upgrade

**Solution**: v0.3.3 is backward compatible. Your v0.3.2 manifest should validate. If not:
```bash
ossa validate --schema v0.3.3 agent.ossa.yaml --debug
```

### Issue: Skills export fails

**Solution**: Ensure you have the Skills extension enabled:
```yaml
extensions:
  skills:
    enabled: true
```

### Issue: Platform not supported

**Solution**: Check platform compatibility:
```yaml
extensions:
  skills:
    platforms:
      - Claude    # ✅ Supported
      - Cursor    # ✅ Supported
      # Add your platform
```

## References

- [Skills Extension Tutorial](./skills-tutorial.md) - Complete guide
- [Skills Extension Reference](./skills-extension.md) - API reference
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [AgentSkills.io Specification](https://agentskills.io/specification)
- [OSSA CLI Documentation](https://gitlab.com/blueflyio/openstandardagents)
