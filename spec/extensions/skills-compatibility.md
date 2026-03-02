# OSSA Skills Extension

## Overview

This extension defines OSSA compatibility with the [Anthropic Skills](https://github.com/anthropics/skills) and [Agent Skills](https://agentskills.io) specifications. It enables OSSA agents to be packaged and distributed as Skills, and allows Skills to be consumed by OSSA-compliant runtimes.

**Version**: 0.3.3
**Status**: Draft
**Authors**: Bluefly AI Platform Team

## Goals

1. **Bidirectional Compatibility**: OSSA manifests can generate valid SKILL.md files
2. **Progressive Disclosure**: Support the Skills metadata → instructions → resources pattern
3. **Validation Alignment**: OSSA validation rules match Skills constraints

## Skills Format Overview

Skills use a simple folder structure:

```
my-skill/
├── SKILL.md          # Required - YAML frontmatter + Markdown instructions
├── references/       # Optional - On-demand documentation
└── assets/           # Optional - Static resources (templates, data)
```

## SKILL.md Format

```yaml
---
name: my-skill-name
description: A clear description of what this skill does
license: Apache-2.0
compatibility: "Claude, Claude Code"
metadata:
  author: "Bluefly AI"
  version: "1.0.0"
allowed-tools: ["Read", "Write", "Bash"]
---

# My Skill Name

Instructions for the agent to follow when this skill is active.

## Examples
- Example usage patterns

## Guidelines
- Best practices and constraints
```

## OSSA to Skills Mapping

### Required Fields

| Skills Field | OSSA Manifest Path | Transformation |
|--------------|-------------------|----------------|
| `name` | `metadata.name` | Validate 1-64 chars, lowercase alphanumeric + hyphens |
| `description` | `metadata.description` | Validate 1-1024 chars |

### Optional Fields

| Skills Field | OSSA Manifest Path | Notes |
|--------------|-------------------|-------|
| `license` | `metadata.license` | Direct mapping |
| `compatibility` | `spec.runtime.platforms` | Comma-separated list |
| `metadata.*` | `metadata.annotations` | Key-value pairs |
| `allowed-tools` | `spec.capabilities[].name` | Filter for tool capabilities |

### Markdown Body

The Skills markdown body maps to OSSA as follows:

| Skills Section | OSSA Path |
|----------------|-----------|
| Instructions | `spec.instructions` or `spec.systemPrompt` |
| Examples | `spec.examples[]` |
| Guidelines | `spec.constraints[]` |

## Progressive Disclosure

Skills implement progressive disclosure in three stages:

### Stage 1: Metadata (~100 tokens)
```yaml
name: my-skill
description: What this skill does and when to use it
```

OSSA equivalent:
```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: my-skill
  description: What this skill does and when to use it
```

### Stage 2: Instructions (<5000 tokens)
Full SKILL.md body loaded on activation.

OSSA equivalent: `spec.instructions` field.

### Stage 3: Resources (on-demand)
References and assets loaded as needed via OpenAPI endpoints.

OSSA equivalent: `runtime.resources[]` bindings with OpenAPI-first access.

## Directory Conventions

OSSA agents supporting Skills format SHOULD use these directories:

| Directory | Purpose | OSSA Mapping |
|-----------|---------|--------------|
| `references/` | Documentation | `runtime.resources[type=documentation]` |
| `assets/` | Static files | `runtime.resources[type=static]` |

## Validation Rules

To be Skills-compatible, OSSA manifests MUST pass these validations:

### Name Validation
```yaml
# Skills constraint
pattern: "^[a-z0-9-]{1,64}$"
rules:
  - Cannot start or end with hyphen
  - Cannot contain consecutive hyphens
  - Must match parent directory name (for file-based distribution)
```

### Description Validation
```yaml
# Skills constraint
minLength: 1
maxLength: 1024
```

## Generating SKILL.md from OSSA

```bash
# CLI command
ossa export --format skills --output ./my-skill/

# Generates:
# - SKILL.md with YAML frontmatter
# - references/ directory from documentation resources
```

## Consuming Skills in OSSA

```bash
# CLI command
ossa import --format skills --path ./my-skill/

# Creates:
# - .agents/my-skill/manifest.yaml
```

## Example: Full Mapping

### Skills SKILL.md
```yaml
---
name: drupal-content-publisher
description: Publishes content to Drupal CMS with proper validation and scheduling
license: GPL-2.0-or-later
compatibility: "Claude Code, Cursor"
metadata:
  author: "Bluefly AI"
  version: "1.0.0"
  category: "cms"
allowed-tools: ["WebFetch", "Bash", "Read", "Write"]
---

# Drupal Content Publisher

This skill helps you publish content to Drupal with proper validation.

## Instructions

1. Check if content exists using entity query
2. Validate against Drupal schema
3. Use JSON:API or REST to publish
4. Verify publication status

## Examples

- Publish an article: "Publish 'My Article' with body text and image"
- Update node: "Update node 123 with new title"

## Guidelines

- Always validate content before publishing
- Check user permissions
- Handle media uploads separately
```

### Equivalent OSSA Manifest
```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: drupal-content-publisher
  version: 1.0.0
  description: Publishes content to Drupal CMS with proper validation and scheduling
  license: GPL-2.0-or-later
  annotations:
    author: "Bluefly AI"
    category: "cms"
    skills.compatible: "true"
    skills.platforms: "Claude Code, Cursor"
spec:
  type: worker
  capabilities:
    - name: web_fetch
      type: tool
    - name: bash
      type: tool
    - name: read
      type: tool
    - name: write
      type: tool
  instructions: |
    This skill helps you publish content to Drupal with proper validation.

    1. Check if content exists using entity query
    2. Validate against Drupal schema
    3. Use JSON:API or REST to publish
    4. Verify publication status
  examples:
    - input: "Publish 'My Article' with body text and image"
      description: "Publish an article"
    - input: "Update node 123 with new title"
      description: "Update existing node"
  constraints:
    - "Always validate content before publishing"
    - "Check user permissions"
    - "Handle media uploads separately"
runtime:
  platforms:
    - claude-code
    - cursor
```

## Schema Addition

Add to `ossa-0.3.x.schema.json`:

```json
{
  "definitions": {
    "SkillsExtension": {
      "type": "object",
      "description": "Anthropic/AgentSkills.io compatibility extension",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable Skills format export/import"
        },
        "allowedTools": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Pre-approved tools (maps to spec.capabilities)"
        },
        "platforms": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Compatible platforms (Claude, Claude Code, Cursor, etc.)"
        },
        "progressiveDisclosure": {
          "type": "object",
          "properties": {
            "metadataTokens": { "type": "integer", "default": 100 },
            "instructionsTokens": { "type": "integer", "default": 5000 }
          }
        }
      }
    }
  }
}
```

## References

- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Agent Skills Specification](https://agentskills.io/specification)
- [What Are Skills](https://agentskills.io/what-are-skills)
- [Integrate Skills](https://agentskills.io/integrate-skills)
- [OSSA Manifest Extensions](./manifest-extensions.md)
