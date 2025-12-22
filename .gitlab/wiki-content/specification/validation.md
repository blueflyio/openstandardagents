<!--
OSSA Validation Specification
Purpose: Explain validation rules and error handling
Audience: Developers implementing OSSA validation
Educational Focus: Show validation process and common errors
-->

# Validation

## Overview

OSSA uses **JSON Schema** for validation, ensuring agent definitions are:
- Structurally correct
- Type-safe
- Complete
- Compatible with specification version

## Validation Levels

### Basic Validation
Checks structure and required fields.

```bash
ossa validate agent.json
```

### Strict Validation
Enforces best practices and recommendations.

```bash
ossa validate --strict agent.json
```

### Schema Validation
Validates custom schemas are valid JSON Schema.

```bash
ossa validate --schemas agent.json
```

## Validation Rules

### Required Fields

**Root Level:**
- `ossa` - Specification version
- `agent` - Agent definition object

**Agent Level:**
- `name` - Agent identifier
- `version` - Agent version
- `description` - Agent description
- `role` - Agent role
- `capabilities` - At least one capability

**Capability Level:**
- `name` - Capability identifier
- `type` - Capability type
- `input` - Input schema
- `output` - Output schema

### Field Constraints

**Name Fields:**
```
Pattern: ^[a-z][a-z0-9-]*$
Length: 3-50 characters
Examples: ✅ user-agent, ✅ data-processor
          ❌ UserAgent, ❌ user_agent
```

**Version Fields:**
```
Pattern: Semantic versioning (X.Y.Z)
Examples: ✅ 1.0.0, ✅ 0.2.6
          ❌ 1.0, ❌ v1.0.0
```

**Role Values:**
```
Allowed: worker, orchestrator, critic, analyzer
Examples: ✅ worker
          ❌ Worker, ❌ custom-role
```

**Capability Types:**
```
Allowed: query, action, stream, event
Examples: ✅ query
          ❌ read, ❌ custom-type
```

## Common Validation Errors

### Missing Required Field

```json
{
  "ossa": "0.3.0",
  "agent": {
    "name": "my-agent"
    // ❌ Missing: version, description, role, capabilities
  }
}
```

**Error:**
```
ValidationError: Missing required field 'version' at path '/agent/version'
```

**Fix:**
```json
{
  "ossa": "0.3.0",
  "agent": {
    "name": "my-agent",
    "version": "1.0.0",
    "description": "My agent",
    "role": "worker",
    "capabilities": [...]
  }
}
```

### Invalid Name Format

```json
{
  "agent": {
    "name": "MyAgent"  // ❌ Uppercase not allowed
  }
}
```

**Error:**
```
ValidationError: Invalid name format. Must be lowercase with hyphens only.
```

**Fix:**
```json
{
  "agent": {
    "name": "my-agent"  // ✅ Lowercase with hyphens
  }
}
```

### Invalid Schema Reference

```json
{
  "capabilities": [
    {
      "input": {
        "$ref": "#/components/schemas/NonExistent"  // ❌ Schema doesn't exist
      }
    }
  ]
}
```

**Error:**
```
ValidationError: Schema reference '#/components/schemas/NonExistent' not found
```

**Fix:**
```json
{
  "capabilities": [
    {
      "input": {
        "$ref": "#/components/schemas/Input"
      }
    }
  ],
  "components": {
    "schemas": {
      "Input": {
        "type": "object",
        "properties": {...}
      }
    }
  }
}
```

### Invalid Capability Type

```json
{
  "capabilities": [
    {
      "type": "read"  // ❌ Invalid type
    }
  ]
}
```

**Error:**
```
ValidationError: Invalid capability type 'read'. Must be one of: query, action, stream, event
```

**Fix:**
```json
{
  "capabilities": [
    {
      "type": "query"  // ✅ Valid type
    }
  ]
}
```

## Programmatic Validation

### TypeScript

```typescript
import { ValidationService } from '@bluefly/openstandardagents/validation';

const validator = new ValidationService();
const result = await validator.validate(agentDefinition);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
  result.errors.forEach(error => {
    console.log(`- ${error.path}: ${error.message}`);
  });
}
```

### CLI

```bash
# Validate and show errors
ossa validate agent.json

# Validate with JSON output
ossa validate agent.json --format json

# Validate multiple files
ossa validate agents/*.json
```

## Validation Output

### Success

```bash
$ ossa validate agent.json
✅ Valid OSSA agent definition (v0.3.0)
```

### Errors

```bash
$ ossa validate agent.json
❌ Validation failed with 3 errors:

1. Missing required field 'version'
   Path: /agent/version
   
2. Invalid name format 'MyAgent'
   Path: /agent/name
   Expected: lowercase-with-hyphens
   
3. Schema reference not found
   Path: /agent/capabilities/0/input/$ref
   Reference: #/components/schemas/Input
```

## Best Practices

1. **Validate Early** - Check during development
2. **Use Strict Mode** - Catch issues before production
3. **CI/CD Integration** - Validate in pipelines
4. **Type Generation** - Generate types after validation
5. **Schema Reuse** - Define schemas once, reference everywhere

## CI/CD Integration

### GitLab CI

```yaml
validate:
  stage: test
  script:
    - npm install -g @bluefly/openstandardagents
    - ossa validate agents/*.json --strict
  rules:
    - changes:
      - agents/**/*.json
```

### GitHub Actions

```yaml
- name: Validate OSSA Agents
  run: |
    npm install -g @bluefly/openstandardagents
    ossa validate agents/*.json --strict
```

## Error Codes

| Code | Meaning |
|------|---------|
| `MISSING_FIELD` | Required field not present |
| `INVALID_FORMAT` | Field format incorrect |
| `INVALID_TYPE` | Wrong data type |
| `INVALID_VALUE` | Value not in allowed set |
| `SCHEMA_NOT_FOUND` | Referenced schema missing |
| `VERSION_MISMATCH` | Incompatible OSSA version |

---

**Next**: [Best Practices](../guides/best-practices.md) for implementation guidance
