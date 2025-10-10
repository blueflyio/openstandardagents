# Agent Communication Protocol Specification

**Version**: 1.0.0  
**Status**: Draft  
**Last Updated**: 2024-09-26

## 1. Abstract

This specification defines the standard communication protocol for inter-agent messaging in OSSA-compliant systems.

## 2. Message Format

### 2.1 Base Message Structure

```typescript
interface OSSAMessage {
  // Message metadata
  header: MessageHeader;
  
  // Message content
  body: MessageBody;
  
  // Digital signature for authentication
  signature?: string;
}

interface MessageHeader {
  // Unique message identifier (UUID v4)
  messageId: string;
  
  // Message type identifier
  type: MessageType;
  
  // Protocol version
  version: string;
  
  // Timestamp (ISO 8601)
  timestamp: string;
  
  // Sender identification
  sender: AgentIdentity;
  
  // Recipient identification
  recipient: AgentIdentity | AgentIdentity[];
  
  // Correlation ID for request-response patterns
  correlationId?: string;
  
  // Priority level (0-9, 0 = highest)
  priority?: number;
  
  // Message expiry time
  expiresAt?: string;
}

interface MessageBody {
  // Action to be performed
  action: string;
  
  // Action parameters
  payload: any;
  
  // Error information (for error messages)
  error?: ErrorInfo;
}

interface AgentIdentity {
  // Agent unique identifier
  agentId: string;
  
  // Agent type classification
  agentType: AgentType;
  
  // Agent instance name
  instanceName?: string;
  
  // Agent version
  version?: string;
}
```

### 2.2 Message Types

```typescript
enum MessageType {
  // Request-Response Pattern
  REQUEST = 'request',
  RESPONSE = 'response',
  
  // Event Pattern
  EVENT = 'event',
  
  // Command Pattern
  COMMAND = 'command',
  COMMAND_RESULT = 'command_result',
  
  // Stream Pattern
  STREAM_START = 'stream_start',
  STREAM_DATA = 'stream_data',
  STREAM_END = 'stream_end',
  
  // Control Messages
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
  ACK = 'acknowledgment',
  NACK = 'negative_acknowledgment'
}
```

## 3. Communication Patterns

### 3.1 Request-Response Pattern

```typescript
interface RequestResponsePattern {
  // Client sends request
  async sendRequest(request: OSSAMessage): Promise<string>;
  
  // Server processes and responds
  async handleRequest(request: OSSAMessage): Promise<OSSAMessage>;
  
  // Timeout handling (default: 30 seconds)
  requestTimeout?: number;
  
  // Retry policy
  retryPolicy?: RetryPolicy;
}
```

### 3.2 Publish-Subscribe Pattern

```typescript
interface PublishSubscribePattern {
  // Subscribe to topic
  subscribe(topic: string, handler: MessageHandler): Subscription;
  
  // Publish to topic
  publish(topic: string, message: OSSAMessage): Promise<void>;
  
  // Unsubscribe
  unsubscribe(subscription: Subscription): void;
}
```

### 3.3 Streaming Pattern

```typescript
interface StreamingPattern {
  // Initiate stream
  startStream(streamId: string, metadata: StreamMetadata): Stream;
  
  // Send stream data
  sendData(stream: Stream, data: any): Promise<void>;
  
  // End stream
  endStream(stream: Stream): Promise<void>;
  
  // Handle stream
  handleStream(handler: StreamHandler): void;
}
```

## 4. Error Handling

### 4.1 Error Codes

```typescript
enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TIMEOUT = 408,
  RATE_LIMITED = 429,
  
  // Server Errors (5xx)
  INTERNAL_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  SERVICE_UNAVAILABLE = 503,
  INSUFFICIENT_RESOURCES = 507
}

interface ErrorInfo {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  traceId?: string;
}
```

### 4.2 Retry Policy

```typescript
interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: ErrorCode[];
}

// Default retry policy
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.TIMEOUT,
    ErrorCode.RATE_LIMITED
  ]
};
```

## 5. Security Requirements

### 5.1 Message Authentication

- All messages MUST include sender identification
- Messages SHOULD be digitally signed using JWT or similar
- Signature verification MUST be performed on receipt

### 5.2 Message Encryption

- Sensitive payloads MUST be encrypted using AES-256-GCM
- TLS 1.3+ MUST be used for transport security
- Certificate pinning SHOULD be implemented for known agents

### 5.3 Rate Limiting

- Agents MUST implement rate limiting
- Default: 100 requests per minute per agent
- Configurable based on agent classification

## 6. Quality of Service (QoS)

### 6.1 Delivery Guarantees

```typescript
enum QoSLevel {
  AT_MOST_ONCE = 0,  // Fire and forget
  AT_LEAST_ONCE = 1, // Acknowledged delivery
  EXACTLY_ONCE = 2   // Transactional delivery
}
```

### 6.2 Message Ordering

- Messages with same correlationId MUST be processed in order
- Global ordering is NOT guaranteed
- Use sequence numbers for strict ordering requirements

## 7. Compliance Requirements

Systems claiming OSSA communication protocol compliance MUST:

1. Support all defined message types
2. Implement request-response and publish-subscribe patterns
3. Follow error handling specifications
4. Implement security requirements
5. Support configurable QoS levels
6. Pass protocol validation suite

## 8. JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://ossa.org/schemas/message.json",
  "title": "OSSA Message",
  "type": "object",
  "required": ["header", "body"],
  "properties": {
    "header": {
      "type": "object",
      "required": ["messageId", "type", "version", "timestamp", "sender", "recipient"],
      "properties": {
        "messageId": {
          "type": "string",
          "format": "uuid"
        },
        "type": {
          "type": "string",
          "enum": ["request", "response", "event", "command", "command_result", "stream_start", "stream_data", "stream_end", "heartbeat", "error", "acknowledgment", "negative_acknowledgment"]
        },
        "version": {
          "type": "string",
          "pattern": "^\\d+\\.\\d+\\.\\d+$"
        },
        "timestamp": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "body": {
      "type": "object",
      "required": ["action", "payload"],
      "properties": {
        "action": {
          "type": "string"
        },
        "payload": {},
        "error": {
          "type": "object"
        }
      }
    }
  }
}
```

## 9. Example Messages

### 9.1 Request Message

```json
{
  "header": {
    "messageId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "request",
    "version": "1.0.0",
    "timestamp": "2024-09-26T10:30:00Z",
    "sender": {
      "agentId": "agent-001",
      "agentType": "worker"
    },
    "recipient": {
      "agentId": "agent-002",
      "agentType": "governor"
    },
    "correlationId": "correlation-123",
    "priority": 5
  },
  "body": {
    "action": "validate_compliance",
    "payload": {
      "resource": "deployment-config",
      "standards": ["ossa-security", "ossa-lifecycle"]
    }
  }
}
```

### 9.2 Error Response

```json
{
  "header": {
    "messageId": "660e8400-e29b-41d4-a716-446655440001",
    "type": "error",
    "version": "1.0.0",
    "timestamp": "2024-09-26T10:30:01Z",
    "sender": {
      "agentId": "agent-002",
      "agentType": "governor"
    },
    "recipient": {
      "agentId": "agent-001",
      "agentType": "worker"
    },
    "correlationId": "correlation-123"
  },
  "body": {
    "action": "error",
    "payload": {},
    "error": {
      "code": 404,
      "message": "Resource not found",
      "details": {
        "resource": "deployment-config"
      },
      "timestamp": "2024-09-26T10:30:01Z"
    }
  }
}
```