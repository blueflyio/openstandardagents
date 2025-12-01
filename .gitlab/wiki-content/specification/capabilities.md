<!--
OSSA Capabilities Specification
Purpose: Define capability types and patterns
Audience: Developers implementing agent capabilities
Educational Focus: Show common patterns and best practices
-->

# Capabilities

## What are Capabilities?

Capabilities define **what an agent can do**. Each capability specifies:
- **Name** - Unique identifier
- **Type** - Category of operation
- **Input** - Expected input schema
- **Output** - Expected output schema

## Capability Structure

```json
{
  "name": "capability-name",
  "type": "query | action | stream | event",
  "description": "What this capability does",
  "input": {
    "$ref": "#/components/schemas/InputSchema"
  },
  "output": {
    "$ref": "#/components/schemas/OutputSchema"
  },
  "metadata": {
    "timeout": 30000,
    "retryable": true
  }
}
```

## Capability Types

### `query`
Read-only operations that return data.

```json
{
  "name": "get-user",
  "type": "query",
  "input": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" }
    }
  },
  "output": {
    "type": "object",
    "properties": {
      "user": { "$ref": "#/components/schemas/User" }
    }
  }
}
```

**Characteristics:**
- No side effects
- Idempotent
- Cacheable
- Fast execution

### `action`
Operations that modify state or trigger side effects.

```json
{
  "name": "create-ticket",
  "type": "action",
  "input": {
    "type": "object",
    "required": ["title", "description"],
    "properties": {
      "title": { "type": "string" },
      "description": { "type": "string" }
    }
  },
  "output": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" },
      "status": { "type": "string" }
    }
  }
}
```

**Characteristics:**
- Has side effects
- May not be idempotent
- Requires validation
- May be long-running

### `stream`
Continuous data streams or real-time updates.

```json
{
  "name": "monitor-logs",
  "type": "stream",
  "input": {
    "type": "object",
    "properties": {
      "filter": { "type": "string" }
    }
  },
  "output": {
    "type": "object",
    "properties": {
      "logEntry": { "$ref": "#/components/schemas/LogEntry" }
    }
  }
}
```

**Characteristics:**
- Continuous output
- Real-time updates
- May be long-lived
- Requires streaming protocol

### `event`
Event-driven capabilities triggered by external events.

```json
{
  "name": "on-ticket-created",
  "type": "event",
  "input": {
    "type": "object",
    "properties": {
      "event": { "$ref": "#/components/schemas/TicketCreatedEvent" }
    }
  },
  "output": {
    "type": "object",
    "properties": {
      "handled": { "type": "boolean" }
    }
  }
}
```

**Characteristics:**
- Triggered by events
- Asynchronous
- May have no immediate output
- Requires event bus

## Common Patterns

### CRUD Operations

```json
{
  "capabilities": [
    {
      "name": "create-resource",
      "type": "action",
      "input": { "$ref": "#/components/schemas/ResourceInput" },
      "output": { "$ref": "#/components/schemas/Resource" }
    },
    {
      "name": "get-resource",
      "type": "query",
      "input": { "type": "object", "properties": { "id": { "type": "string" } } },
      "output": { "$ref": "#/components/schemas/Resource" }
    },
    {
      "name": "update-resource",
      "type": "action",
      "input": { "$ref": "#/components/schemas/ResourceUpdate" },
      "output": { "$ref": "#/components/schemas/Resource" }
    },
    {
      "name": "delete-resource",
      "type": "action",
      "input": { "type": "object", "properties": { "id": { "type": "string" } } },
      "output": { "type": "object", "properties": { "deleted": { "type": "boolean" } } }
    },
    {
      "name": "list-resources",
      "type": "query",
      "input": { "$ref": "#/components/schemas/ListParams" },
      "output": { "$ref": "#/components/schemas/ResourceList" }
    }
  ]
}
```

### Validation Pattern

```json
{
  "name": "validate-input",
  "type": "query",
  "input": {
    "type": "object",
    "properties": {
      "data": { "type": "object" }
    }
  },
  "output": {
    "type": "object",
    "properties": {
      "valid": { "type": "boolean" },
      "errors": {
        "type": "array",
        "items": { "$ref": "#/components/schemas/ValidationError" }
      }
    }
  }
}
```

### Batch Processing

```json
{
  "name": "process-batch",
  "type": "action",
  "input": {
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "items": { "$ref": "#/components/schemas/Item" }
      }
    }
  },
  "output": {
    "type": "object",
    "properties": {
      "results": {
        "type": "array",
        "items": { "$ref": "#/components/schemas/ProcessResult" }
      }
    }
  }
}
```

## Metadata Fields

### `timeout`
Maximum execution time in milliseconds.

```json
{
  "metadata": {
    "timeout": 30000
  }
}
```

### `retryable`
Whether capability can be safely retried.

```json
{
  "metadata": {
    "retryable": true,
    "maxRetries": 3
  }
}
```

### `rateLimit`
Rate limiting configuration.

```json
{
  "metadata": {
    "rateLimit": {
      "requests": 100,
      "period": 60000
    }
  }
}
```

## Best Practices

1. **Use Descriptive Names** - `create-user` not `cu`
2. **Choose Correct Type** - Query for reads, action for writes
3. **Define Clear Schemas** - Explicit input/output types
4. **Add Descriptions** - Help users understand purpose
5. **Set Timeouts** - Prevent hanging operations
6. **Mark Retryable** - Enable automatic retry logic
7. **Version Carefully** - Breaking changes require new capability

## Validation

```bash
# Validate capability definitions
ossa validate agent.json

# Check capability compatibility
ossa validate --strict agent.json
```

## Examples

See [Tutorials](../guides/tutorials.md) for complete examples.

---

**Next**: [Validation](validation.md) for validation rules and error handling
