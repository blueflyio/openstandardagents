---
title: "A2A Protocol Schema"
description: "JSON Schema reference for OSSA Agent-to-Agent (A2A) protocol"
---

# A2A Protocol Schema Reference

This page documents the JSON Schema for OSSA Agent-to-Agent messaging.

## Message Schema

```json
{
  "A2AMessage": {
    "type": "object",
    "required": ["id", "type", "from", "to", "timestamp"],
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid",
        "description": "Unique message identifier"
      },
      "type": {
        "type": "string",
        "enum": ["request", "response", "event", "delegation"],
        "description": "Message type"
      },
      "from": {
        "type": "string",
        "description": "Source agent identifier"
      },
      "to": {
        "type": "string",
        "description": "Target agent identifier"
      },
      "timestamp": {
        "type": "string",
        "format": "date-time"
      },
      "payload": {
        "type": "object",
        "description": "Message payload"
      },
      "correlation_id": {
        "type": "string",
        "description": "Correlation ID for request/response pairs"
      }
    }
  }
}
```

## Message Types

### request

Request message for invoking agent capabilities.

### response

Response message containing capability execution results.

### event

Asynchronous event notification between agents.

### delegation

Delegation request for transferring task execution.

## Related Documentation

- [Control Signals](/docs/runtime/control-signals)
- [Protocols](/docs/protocols/)
