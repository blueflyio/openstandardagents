<!--
OSSA Agent Definition Specification
Purpose: Complete reference for OSSA agent structure and fields
Audience: Developers implementing OSSA agents
Educational Focus: Detailed field-by-field explanation with examples
-->

# Agent Definition

## Complete Structure

```json
{
  "ossa": "0.2.6",
  "agent": {
    "name": "string",
    "version": "string",
    "description": "string",
    "role": "worker | orchestrator | critic | analyzer",
    "capabilities": [...],
    "configuration": {...},
    "dependencies": {...},
    "metadata": {...}
  },
  "components": {
    "schemas": {...}
  }
}
```

## Root Fields

### `ossa` (required)
Specification version following semantic versioning.

```json
{
  "ossa": "0.2.6"
}
```

**Rules:**
- Must be valid semver
- Must match supported version
- Use `ossa validate` to check compatibility

## Agent Object

### `name` (required)
Unique identifier for the agent.

```json
{
  "agent": {
    "name": "customer-support-agent"
  }
}
```

**Rules:**
- Lowercase, hyphens only
- 3-50 characters
- Must be unique within system

### `version` (required)
Agent version following semantic versioning.

```json
{
  "agent": {
    "version": "1.2.3"
  }
}
```

### `description` (required)
Human-readable description of agent purpose.

```json
{
  "agent": {
    "description": "Handles customer support inquiries and escalations"
  }
}
```

### `role` (required)
Agent's role in the system.

```json
{
  "agent": {
    "role": "worker"
  }
}
```

**Valid Roles:**
- `worker` - Executes tasks
- `orchestrator` - Coordinates other agents
- `critic` - Reviews and validates outputs
- `analyzer` - Analyzes data and provides insights

### `capabilities` (required)
Array of capabilities the agent provides.

```json
{
  "agent": {
    "capabilities": [
      {
        "name": "answer-question",
        "type": "query",
        "input": {
          "$ref": "#/components/schemas/Question"
        },
        "output": {
          "$ref": "#/components/schemas/Answer"
        }
      }
    ]
  }
}
```

See [Capabilities](capabilities.md) for detailed documentation.

### `configuration` (optional)
Agent-specific configuration.

```json
{
  "agent": {
    "configuration": {
      "maxRetries": 3,
      "timeout": 30000,
      "model": "gpt-4"
    }
  }
}
```

### `dependencies` (optional)
External services or tools required.

```json
{
  "agent": {
    "dependencies": {
      "services": ["database", "cache"],
      "tools": ["web-search", "calculator"]
    }
  }
}
```

### `metadata` (optional)
Additional metadata for documentation or tooling.

```json
{
  "agent": {
    "metadata": {
      "author": "team@example.com",
      "tags": ["support", "customer-service"],
      "documentation": "https://docs.example.com/agents/support"
    }
  }
}
```

## Components

### `schemas` (optional)
JSON Schema definitions for inputs/outputs.

```json
{
  "components": {
    "schemas": {
      "Question": {
        "type": "object",
        "required": ["text"],
        "properties": {
          "text": {
            "type": "string",
            "description": "Question text"
          },
          "context": {
            "type": "string",
            "description": "Additional context"
          }
        }
      },
      "Answer": {
        "type": "object",
        "required": ["text", "confidence"],
        "properties": {
          "text": {
            "type": "string"
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          }
        }
      }
    }
  }
}
```

## Complete Example

```json
{
  "ossa": "0.2.6",
  "agent": {
    "name": "customer-support-agent",
    "version": "1.0.0",
    "description": "AI agent for customer support",
    "role": "worker",
    "capabilities": [
      {
        "name": "answer-question",
        "type": "query",
        "description": "Answer customer questions",
        "input": {
          "$ref": "#/components/schemas/Question"
        },
        "output": {
          "$ref": "#/components/schemas/Answer"
        }
      },
      {
        "name": "escalate-issue",
        "type": "action",
        "description": "Escalate to human agent",
        "input": {
          "$ref": "#/components/schemas/Escalation"
        },
        "output": {
          "$ref": "#/components/schemas/EscalationResult"
        }
      }
    ],
    "configuration": {
      "model": "gpt-4",
      "temperature": 0.7,
      "maxTokens": 500
    },
    "dependencies": {
      "services": ["ticket-system", "knowledge-base"]
    },
    "metadata": {
      "author": "support-team@example.com",
      "tags": ["support", "customer-service"]
    }
  },
  "components": {
    "schemas": {
      "Question": {
        "type": "object",
        "required": ["text"],
        "properties": {
          "text": { "type": "string" },
          "customerId": { "type": "string" }
        }
      },
      "Answer": {
        "type": "object",
        "required": ["text", "confidence"],
        "properties": {
          "text": { "type": "string" },
          "confidence": { "type": "number" }
        }
      }
    }
  }
}
```

## Validation

```bash
# Validate agent definition
ossa validate agent.json

# Generate TypeScript types
ossa generate types agent.json
```

## Best Practices

1. **Use Schema References** - Define schemas once, reference everywhere
2. **Semantic Versioning** - Bump version on changes
3. **Clear Descriptions** - Help users understand capabilities
4. **Minimal Configuration** - Only include necessary config
5. **Document Dependencies** - List all required services

---

**Next**: [Capabilities](capabilities.md) for detailed capability documentation
