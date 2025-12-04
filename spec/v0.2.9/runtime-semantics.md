# OSSA Runtime Semantics Specification

**Version**: 0.2.9
**Status**: Draft
**Last Updated**: 2025-12-04

This document defines the formal runtime semantics for OSSA-compliant agent execution. All OSSA runtime implementations MUST conform to these semantics.

## 1. Turn Lifecycle

An OSSA agent turn consists of 7 sequential phases:

```
┌─────────────────────────────────────────────────────────────────┐
│                        TURN LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ 1. INIT  │──▶│ 2. NORM  │──▶│ 3. RESOL │──▶│ 4. INFER │     │
│  │          │   │          │   │          │   │          │     │
│  │ Generate │   │ Normalize│   │ Resolve  │   │ LLM Call │     │
│  │ IDs      │   │ Message  │   │ Tools    │   │          │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│                                                      │          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐         │          │
│  │ 7. EMIT  │◀──│ 6. PERSIST│◀──│ 5. EXEC  │◀────────┘          │
│  │          │   │          │   │          │                     │
│  │ Observe  │   │ State    │   │ Tools    │                     │
│  │          │   │          │   │          │                     │
│  └──────────┘   └──────────┘   └──────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 1: Initialization (INIT)

**Purpose**: Generate runtime identifiers and establish context.

```typescript
interface InitPhase {
  // MUST generate per spec.identity configuration
  interaction_id: string;  // New UUID per turn
  session_id: string;      // From context or new
  instance_id: string;     // Stable per pod/process

  // MUST extract from context
  trace_context: W3CTraceContext | null;
  baggage: W3CBaggage | null;

  // MUST record
  turn_number: number;
  started_at: ISO8601Timestamp;
}
```

**Invariants**:
- `interaction_id` MUST be unique across all turns
- `session_id` MUST be consistent within a conversation
- `instance_id` MUST be stable for the agent instance lifetime

### Phase 2: Message Normalization (NORM)

**Purpose**: Transform input into canonical message format.

```typescript
interface NormalizedMessage {
  role: 'user' | 'system' | 'assistant' | 'tool';
  content: string | ContentPart[];
  metadata: {
    source: 'user' | 'api' | 'delegation';
    original_format: string;
    normalized_at: ISO8601Timestamp;
  };
}

type ContentPart = TextPart | ImagePart | FilePart;
```

**Rules**:
1. All inputs MUST be converted to `NormalizedMessage`
2. Content MUST be sanitized per `spec.safety.content_filtering`
3. Multi-modal content MUST be split into `ContentPart[]`
4. Original format MUST be preserved in metadata

### Phase 3: Tool Resolution (RESOL)

**Purpose**: Resolve available tools from manifest and MCP servers.

```typescript
interface ResolvedTool {
  name: string;
  description: string;
  input_schema: JSONSchema;
  source: ToolSource;
  transport: 'function' | 'http' | 'mcp' | 'grpc';
  timeout_ms: number;
  retry_policy: RetryPolicy;
}

type ToolSource =
  | { type: 'manifest'; tool_index: number }
  | { type: 'mcp'; server_uri: string; capability: string }
  | { type: 'delegation'; agent_id: string };
```

**Rules**:
1. Tools MUST be resolved from `spec.tools[]` array
2. MCP tools MUST be discovered via `tools/list` call
3. Tool schemas MUST be validated against JSON Schema
4. Unavailable tools MUST be excluded with warning

### Phase 4: LLM Inference (INFER)

**Purpose**: Execute LLM call with resolved context.

```typescript
interface InferenceRequest {
  model: string;                    // From spec.llm.model
  messages: NormalizedMessage[];    // Conversation history
  tools: ResolvedTool[];            // Available tools
  system_prompt: string;            // From spec.role or spec.prompts
  parameters: LLMParameters;        // From spec.llm.parameters
}

interface InferenceResponse {
  content: string | null;
  tool_calls: ToolCallRequest[];
  finish_reason: 'stop' | 'length' | 'tool_use' | 'content_filter';
  usage: TokenUsage;
  model: string;                    // Actual model used
}
```

**Rules**:
1. System prompt MUST include `spec.role`
2. Few-shot examples from `spec.prompts.few_shot_examples` MUST be prepended
3. Token limits from `spec.constraints` MUST be enforced
4. Timeout from `spec.constraints.timeout_seconds` MUST be enforced

### Phase 5: Tool Execution (EXEC)

**Purpose**: Execute requested tool calls.

```typescript
interface ToolExecution {
  call_id: string;
  tool_name: string;
  input: unknown;
  started_at: ISO8601Timestamp;
  completed_at: ISO8601Timestamp;
  result: ToolResult;
  retries: number;
}

type ToolResult =
  | { status: 'success'; output: unknown }
  | { status: 'error'; error: ToolError }
  | { status: 'timeout'; partial_output?: unknown };
```

**Execution Order**:
1. Tool calls MAY execute in parallel if `spec.tools[].parallel: true`
2. By default, tools execute sequentially in request order
3. Failed tools MUST be retried per `spec.reliability.retry`
4. Circuit breaker MUST trip after threshold failures

**Rules**:
1. Each tool call MUST have unique `call_id`
2. Tool input MUST validate against tool's `input_schema`
3. Tool output MUST be serializable to JSON
4. Sensitive outputs MUST be redacted per `spec.security.output_filtering`

### Phase 6: State Persistence (PERSIST)

**Purpose**: Persist state changes atomically.

```typescript
interface StatePersistence {
  mode: 'none' | 'session' | 'persistent';
  storage: StateStorage;
  changes: StateChange[];
  transaction_id: string;
}

interface StateChange {
  key: string;
  previous_value: unknown | null;
  new_value: unknown;
  operation: 'set' | 'delete' | 'append';
}
```

**Transaction Semantics**:
1. All state changes within a turn MUST be atomic
2. On failure, all changes MUST be rolled back
3. State MUST be isolated per `spec.state.isolation_level`:
   - `read_uncommitted`: No isolation
   - `read_committed`: See only committed state
   - `serializable`: Full isolation (default)

### Phase 7: Observability Emission (EMIT)

**Purpose**: Emit telemetry data.

```typescript
interface ObservabilityEmission {
  // Tracing
  span: OTelSpan;

  // Metrics
  metrics: {
    tokens_input: number;
    tokens_output: number;
    latency_ms: number;
    tool_calls: number;
    errors: number;
  };

  // Logging
  log_entries: LogEntry[];

  // Activity Stream (if enabled)
  event?: CloudEvent;
}
```

**Rules**:
1. Span MUST include all attributes from semantic-conventions.md
2. Metrics MUST NOT include high-cardinality attributes
3. Logs MUST be correlated via `trace_id` and `span_id`
4. CloudEvents MUST conform to spec/v0.2.9/cloudevents.md

---

## 2. Error Handling

### Error Code Taxonomy

```typescript
type ErrorCode =
  // Input Errors (4xx equivalent)
  | 'VALIDATION_ERROR'      // Invalid input format
  | 'SCHEMA_VIOLATION'      // Input doesn't match schema
  | 'CONTENT_FILTERED'      // Content blocked by safety
  | 'POLICY_VIOLATION'      // Violates agent policy

  // Execution Errors (5xx equivalent)
  | 'TOOL_ERROR'            // Tool execution failed
  | 'TOOL_TIMEOUT'          // Tool exceeded timeout
  | 'LLM_ERROR'             // LLM provider error
  | 'LLM_TIMEOUT'           // LLM exceeded timeout
  | 'STATE_ERROR'           // State persistence failed

  // Resource Errors
  | 'RATE_LIMITED'          // Rate limit exceeded
  | 'QUOTA_EXCEEDED'        // Token/request quota exceeded
  | 'CIRCUIT_OPEN'          // Circuit breaker tripped

  // Agent Errors
  | 'MAX_TURNS_EXCEEDED'    // Hit spec.constraints.max_turns
  | 'MAX_TOKENS_EXCEEDED'   // Hit spec.constraints.max_tokens
  | 'DELEGATION_FAILED'     // Child agent failed
  | 'ESCALATION_REQUIRED';  // Needs human intervention

interface OSSAError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  retry_after_ms?: number;
  escalation?: EscalationAction;
}
```

### Recovery Strategies

```typescript
type RecoveryStrategy =
  | 'retry'           // Retry with backoff
  | 'fallback'        // Use fallback value/tool
  | 'skip'            // Skip and continue
  | 'escalate'        // Escalate to human/supervisor
  | 'abort';          // Abort turn/session

interface ErrorHandler {
  error_codes: ErrorCode[];
  strategy: RecoveryStrategy;
  max_retries?: number;
  fallback_value?: unknown;
  escalation_target?: string;
}
```

### Default Error Handling

| Error Code | Default Strategy | Retries |
|------------|------------------|---------|
| `VALIDATION_ERROR` | abort | 0 |
| `TOOL_ERROR` | retry | 3 |
| `TOOL_TIMEOUT` | retry | 2 |
| `LLM_ERROR` | retry | 3 |
| `LLM_TIMEOUT` | retry | 2 |
| `RATE_LIMITED` | retry | 3 (with backoff) |
| `CIRCUIT_OPEN` | fallback | 0 |
| `MAX_TURNS_EXCEEDED` | escalate | 0 |

---

## 3. State Semantics

### Isolation Levels

```typescript
type IsolationLevel =
  | 'read_uncommitted'  // Can see uncommitted changes
  | 'read_committed'    // Only see committed changes
  | 'repeatable_read'   // Consistent reads within turn
  | 'serializable';     // Full isolation (default)
```

### Transaction Boundaries

```
Turn Start ─────────────────────────────────────────── Turn End
     │                                                      │
     │  ┌─────────────────────────────────────────────┐    │
     │  │           TRANSACTION BOUNDARY               │    │
     │  │                                             │    │
     │  │  state.get()  ──▶  compute  ──▶  state.set()│    │
     │  │                                             │    │
     │  │  ALL changes atomic                         │    │
     │  │  ROLLBACK on any failure                    │    │
     │  │                                             │    │
     │  └─────────────────────────────────────────────┘    │
     │                                                      │
     └──────────────────────────────────────────────────────┘
```

### State Operations

```typescript
interface StateOperations {
  // Read operations
  get<T>(key: string): Promise<T | null>;
  getMany<T>(keys: string[]): Promise<Map<string, T>>;
  exists(key: string): Promise<boolean>;

  // Write operations (within transaction)
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  append<T>(key: string, value: T): Promise<void>;

  // Transaction control
  checkpoint(): Promise<string>;  // Save point
  rollback(checkpoint?: string): Promise<void>;
}
```

### Rollback Behavior

1. **Automatic Rollback**: On unhandled error, all state changes roll back
2. **Partial Rollback**: Can rollback to named checkpoint
3. **No Rollback**: `isolation_level: read_uncommitted` disables rollback

---

## 4. Multi-Turn Behavior

### Turn Chaining

```typescript
interface TurnChain {
  // Continue if LLM requests tool use
  continue_on_tool_use: boolean;  // default: true

  // Max consecutive tool turns before response required
  max_tool_turns: number;  // default: 10

  // Require user confirmation between turns
  confirm_between_turns: boolean;  // default: false
}
```

### Conversation Memory

```typescript
interface ConversationMemory {
  // How many messages to include in context
  window_size: number;  // default: 20

  // Token budget for history
  max_history_tokens: number;  // default: 4000

  // Summarization strategy when window exceeded
  summarization: 'truncate' | 'summarize' | 'sliding';
}
```

---

## 5. Delegation Semantics

### Agent-to-Agent Handoff

```typescript
interface Delegation {
  type: 'handoff' | 'parallel' | 'supervisor';
  target_agent: string;
  input: unknown;
  context_propagation: ContextPropagation;
  timeout_ms: number;
  on_failure: 'retry' | 'fallback' | 'escalate';
}

interface ContextPropagation {
  // What to pass to child agent
  include_session_id: boolean;   // default: true
  include_history: boolean;      // default: false
  include_state: boolean;        // default: false
  custom_context: Record<string, unknown>;
}
```

### Delegation Patterns

1. **Handoff**: Transfer control completely to target agent
2. **Parallel**: Execute multiple agents concurrently
3. **Supervisor**: Parent monitors child execution

---

## 6. Compliance Requirements

### MUST Requirements

1. Runtime MUST generate unique `interaction_id` per turn
2. Runtime MUST enforce `spec.constraints.max_turns`
3. Runtime MUST enforce `spec.constraints.timeout_seconds`
4. Runtime MUST emit OpenTelemetry spans per semantic-conventions.md
5. Runtime MUST rollback state on unhandled errors
6. Runtime MUST validate tool inputs against schemas

### SHOULD Requirements

1. Runtime SHOULD support all isolation levels
2. Runtime SHOULD implement circuit breaker pattern
3. Runtime SHOULD support W3C trace context propagation
4. Runtime SHOULD emit CloudEvents for activity streams

### MAY Requirements

1. Runtime MAY implement custom error handlers
2. Runtime MAY support additional state backends
3. Runtime MAY implement conversation summarization

---

## References

- [OSSA Schema v0.2.9](./ossa-0.2.9.schema.json)
- [Semantic Conventions](./semantic-conventions.md)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/)
- [CloudEvents Specification](https://cloudevents.io/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
