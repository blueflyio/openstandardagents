<!--
OSSA Best Practices Guide
Purpose: Provide implementation guidance and patterns
Audience: Developers building OSSA-compliant agents
Educational Focus: Show proven patterns and avoid common pitfalls
-->

# Best Practices

## Agent Design

### 1. Single Responsibility
Each agent should have one clear purpose.

**❌ Bad:**
```json
{
  "name": "everything-agent",
  "capabilities": [
    "process-payments",
    "send-emails",
    "analyze-data",
    "manage-users"
  ]
}
```

**✅ Good:**
```json
{
  "name": "payment-processor",
  "capabilities": [
    "process-payment",
    "refund-payment",
    "get-payment-status"
  ]
}
```

### 2. Clear Naming
Use descriptive, action-oriented names.

**❌ Bad:**
- `agent1`, `helper`, `processor`

**✅ Good:**
- `customer-support-agent`, `data-analyzer`, `email-sender`

### 3. Semantic Versioning
Version agents properly.

```
1.0.0 → 1.0.1  (Bug fix)
1.0.0 → 1.1.0  (New capability)
1.0.0 → 2.0.0  (Breaking change)
```

## Capability Design

### 1. Use Correct Types

**Query** - Read-only, no side effects:
```json
{
  "name": "get-user",
  "type": "query"
}
```

**Action** - Modifies state:
```json
{
  "name": "create-user",
  "type": "action"
}
```

### 2. Define Clear Schemas

**❌ Bad:**
```json
{
  "input": {
    "type": "object"
  }
}
```

**✅ Good:**
```json
{
  "input": {
    "type": "object",
    "required": ["userId", "action"],
    "properties": {
      "userId": {
        "type": "string",
        "pattern": "^[a-z0-9-]+$"
      },
      "action": {
        "type": "string",
        "enum": ["approve", "reject"]
      }
    }
  }
}
```

### 3. Reuse Schemas

**❌ Bad:**
```json
{
  "capabilities": [
    {
      "name": "create-user",
      "input": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "email": { "type": "string" }
        }
      }
    },
    {
      "name": "update-user",
      "input": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "email": { "type": "string" }
        }
      }
    }
  ]
}
```

**✅ Good:**
```json
{
  "capabilities": [
    {
      "name": "create-user",
      "input": { "$ref": "#/components/schemas/UserInput" }
    },
    {
      "name": "update-user",
      "input": { "$ref": "#/components/schemas/UserInput" }
    }
  ],
  "components": {
    "schemas": {
      "UserInput": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "email": { "type": "string", "format": "email" }
        }
      }
    }
  }
}
```

## Error Handling

### 1. Define Error Schemas

```json
{
  "components": {
    "schemas": {
      "Error": {
        "type": "object",
        "required": ["code", "message"],
        "properties": {
          "code": {
            "type": "string",
            "enum": ["VALIDATION_ERROR", "NOT_FOUND", "INTERNAL_ERROR"]
          },
          "message": { "type": "string" },
          "details": { "type": "object" }
        }
      }
    }
  }
}
```

### 2. Use Standard Error Codes

```
VALIDATION_ERROR - Invalid input
NOT_FOUND - Resource not found
UNAUTHORIZED - Authentication required
FORBIDDEN - Insufficient permissions
INTERNAL_ERROR - Server error
TIMEOUT - Operation timed out
```

## Configuration

### 1. Minimal Configuration
Only include necessary config.

**❌ Bad:**
```json
{
  "configuration": {
    "setting1": "value1",
    "setting2": "value2",
    "setting3": "value3",
    "unusedSetting": "value"
  }
}
```

**✅ Good:**
```json
{
  "configuration": {
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

### 2. Use Defaults
Provide sensible defaults.

```json
{
  "configuration": {
    "timeout": 30000,
    "maxRetries": 3,
    "retryDelay": 1000
  }
}
```

## Dependencies

### 1. Explicit Dependencies
List all required services.

```json
{
  "dependencies": {
    "services": ["database", "cache", "message-queue"],
    "tools": ["web-search", "calculator"]
  }
}
```

### 2. Version Constraints
Specify version requirements.

```json
{
  "dependencies": {
    "services": {
      "database": ">=1.0.0",
      "cache": "^2.0.0"
    }
  }
}
```

## Testing

### 1. Validate Before Deploy

```bash
# Validate definition
ossa validate agent.json

# Strict validation
ossa validate --strict agent.json

# Generate types
ossa generate types agent.json
```

### 2. Test Capabilities

```typescript
import { ValidationService } from '@bluefly/openstandardagents/validation';

describe('Agent Definition', () => {
  it('should be valid OSSA', async () => {
    const validator = new ValidationService();
    const result = await validator.validate(agentDef);
    expect(result.valid).toBe(true);
  });
});
```

## Documentation

### 1. Add Descriptions

```json
{
  "agent": {
    "description": "Processes customer support tickets and routes to appropriate teams"
  },
  "capabilities": [
    {
      "name": "classify-ticket",
      "description": "Classifies ticket by urgency and category"
    }
  ]
}
```

### 2. Include Examples

```json
{
  "components": {
    "schemas": {
      "Input": {
        "type": "object",
        "properties": {
          "query": { "type": "string" }
        },
        "example": {
          "query": "What is my order status?"
        }
      }
    }
  }
}
```

## Performance

### 1. Set Timeouts

```json
{
  "capabilities": [
    {
      "name": "long-running-task",
      "metadata": {
        "timeout": 60000
      }
    }
  ]
}
```

### 2. Mark Retryable

```json
{
  "capabilities": [
    {
      "name": "api-call",
      "metadata": {
        "retryable": true,
        "maxRetries": 3
      }
    }
  ]
}
```

## Security

### 1. Validate Inputs
Always validate external inputs.

```json
{
  "input": {
    "type": "object",
    "required": ["userId"],
    "properties": {
      "userId": {
        "type": "string",
        "pattern": "^[a-zA-Z0-9-]+$",
        "minLength": 1,
        "maxLength": 50
      }
    }
  }
}
```

### 2. Sanitize Outputs
Don't expose sensitive data.

```json
{
  "output": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "email": { "type": "string" }
      // ❌ Don't include: password, apiKey, token
    }
  }
}
```

## CI/CD Integration

### GitLab CI

```yaml
validate-agents:
  stage: test
  script:
    - npm install -g @bluefly/openstandardagents
    - ossa validate agents/*.json --strict
  rules:
    - changes:
      - agents/**/*.json
```

### Pre-commit Hook

```yaml
# .lefthook.yml
pre-commit:
  commands:
    ossa-validate:
      glob: "agents/*.json"
      run: ossa validate {staged_files}
```

## Common Pitfalls

### ❌ Don't Use `any` Types
```json
{
  "input": {
    "type": "object",
    "additionalProperties": true  // ❌ Too permissive
  }
}
```

### ❌ Don't Skip Validation
```bash
# ❌ Bad
git commit --no-verify

# ✅ Good
ossa validate agent.json
git commit
```

### ❌ Don't Hardcode Values
```json
{
  "configuration": {
    "apiKey": "sk-1234..."  // ❌ Never hardcode secrets
  }
}
```

---

**Next**: [Migration Guide](migration.md) for upgrading between versions
