# Migration Guide: OSSA v0.3.3 → v0.3.3

> **Status**: Draft
> **Last Updated**: 2025-12-31

---

## Overview

OSSA v0.3.3 introduces **Skills Compatibility Extension** for interoperability with Anthropic Skills and AgentSkills.io specifications.

### Key Changes

- ✅ **Backward Compatible**: v0.3.3 manifests validate against v0.3.3 schema
- ✅ **Skills Extension**: New `extensions.skills` for bidirectional Skills format support
- ✅ **Progressive Disclosure**: Token-budgeted metadata → instructions → resources pattern

---

## Migration Path

### Option 1: No Changes Required (Recommended for Existing Agents)

**v0.3.3 agents continue to work without modification:**

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
# ... rest of manifest unchanged
```

### Option 2: Add Skills Compatibility

**Enable Skills format export/import:**

```yaml
apiVersion: ossa/v0.3.3
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

## References

- [Skills Compatibility Extension](../../spec/v0.3.3/extensions/skills-compatibility.md)
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [AgentSkills.io Specification](https://agentskills.io/specification)
