---
title: "Control Signals"
description: "OSSA control signals specification - standard communication primitives for agent coordination, tool calls, delegation, and error handling"
---

# Control Signals

Control signals are the standard communication primitives between agents, runtimes, and external systems in OSSA. They provide a consistent way to coordinate agent behavior, invoke tools, delegate work, and handle errors.

## Overview

OSSA defines six standard signal types:

| Signal | Purpose | Async | Default Timeout |
|--------|---------|-------|-----------------|
| `tool_call` | Invoke external tools | Yes | 60s |
| `delegation` | Delegate to sub-agents | Yes | 300s |
| `halt` | Stop agent execution | No | 5s |
| `error` | Indicate error condition | No | - |
| `ready` | Signal readiness | No | - |
| `heartbeat` | Periodic liveness check | No | - |

## Signal Types

### tool_call

Invoke an external tool or capability.

**Structure**:

```yaml
type: tool_call
async: true
timeout_seconds: 60
payload:
  tool_name: string       # Required: Tool identifier
  parameters: object      # Required: Tool input parameters
  correlation_id: string  # Optional: Request tracking ID
```

**Example**:

```yaml
type: tool_call
async: true
timeout_seconds: 60
payload:
  tool_name: "security_scan"
  parameters:
    path: "/src"
    severity: "high"
    exclude_patterns:
      - "node_modules"
      - "*.test.js"
  correlation_id: "req-abc123"
```

**Response**:

```yaml
type: tool_call_response
payload:
  tool_name: "security_scan"
  correlation_id: "req-abc123"
  success: true
  result:
    vulnerabilities_found: 3
    critical: 1
    high: 2
  duration_ms: 4520
```

**Error Response**:

```yaml
type: tool_call_response
payload:
  tool_name: "security_scan"
  correlation_id: "req-abc123"
  success: false
  error:
    code: "TOOL_TIMEOUT"
    message: "Tool execution exceeded timeout"
    recoverable: true
```

### delegation

Delegate work to another agent.

**Structure**:

```yaml
type: delegation
async: true
timeout_seconds: 300
payload:
  target_agent: string     # Required: Agent ID or name
  task: object             # Required: Task definition
  context: object          # Optional: Additional context
  callback: string         # Optional: Callback URL for results
  priority: string         # Optional: low, normal, high, critical
```

**Example**:

```yaml
type: delegation
async: true
timeout_seconds: 300
payload:
  target_agent: "code-review-agent"
  task:
    action: "review"
    files:
      - "src/main.py"
      - "src/utils.py"
    criteria:
      - "security"
      - "performance"
      - "maintainability"
  context:
    pr_number: 123
    repository: "acme/backend"
    author: "developer@example.com"
  callback: "https://callback.example.com/results"
  priority: "high"
```

**Response**:

```yaml
type: delegation_response
payload:
  target_agent: "code-review-agent"
  task_id: "task-xyz789"
  status: "completed"  # accepted, in_progress, completed, failed
  result:
    overall_score: 8.5
    findings:
      - severity: "warning"
        file: "src/main.py"
        line: 42
        message: "Consider using parameterized queries"
      - severity: "info"
        file: "src/utils.py"
        line: 15
        message: "Function could be simplified"
  duration_ms: 45000
```

### halt

Immediately stop agent execution.

**Structure**:

```yaml
type: halt
async: false
timeout_seconds: 5
payload:
  reason: string          # Required: Halt reason code
  graceful: boolean       # Optional: Allow graceful shutdown (default: true)
  message: string         # Optional: Human-readable message
```

**Halt Reasons**:

| Reason | Description |
|--------|-------------|
| `user_interrupt` | User requested cancellation |
| `resource_limit` | Resource quota exceeded |
| `policy_violation` | Security or compliance violation |
| `external_signal` | External system requested halt |
| `parent_termination` | Parent agent terminated |

**Example**:

```yaml
type: halt
async: false
timeout_seconds: 5
payload:
  reason: "user_interrupt"
  graceful: true
  message: "User requested cancellation via UI"
```

**Forceful Halt** (no cleanup):

```yaml
type: halt
async: false
timeout_seconds: 5
payload:
  reason: "policy_violation"
  graceful: false
  message: "Agent attempted to access restricted resource"
```

### error

Indicate an error condition.

**Structure**:

```yaml
type: error
async: false
payload:
  error_code: string      # Required: Error classification
  message: string         # Required: Human-readable message
  recoverable: boolean    # Required: Can execution continue?
  details: object         # Optional: Additional error context
  stack_trace: string     # Optional: Stack trace for debugging
```

**Error Codes**:

| Code | Phase | Description |
|------|-------|-------------|
| `INIT_FAILED` | init | Initialization failed |
| `PLAN_FAILED` | plan | Planning failed |
| `ACTION_FAILED` | act | Action execution failed |
| `TOOL_ERROR` | act | Tool invocation failed |
| `TOOL_TIMEOUT` | act | Tool execution timeout |
| `DELEGATION_ERROR` | act | Sub-agent delegation failed |
| `DELEGATION_TIMEOUT` | act | Delegation timeout |
| `REFLECTION_ERROR` | reflect | Reflection failed |
| `MEMORY_ERROR` | any | Memory operation failed |
| `NETWORK_ERROR` | any | Network communication failed |
| `AUTH_ERROR` | any | Authentication/authorization failed |
| `RESOURCE_EXHAUSTED` | any | Resource limits exceeded |
| `TIMEOUT` | any | General timeout |
| `UNKNOWN` | any | Unclassified error |

**Example** (Recoverable):

```yaml
type: error
async: false
payload:
  error_code: "TOOL_ERROR"
  message: "Tool execution failed"
  recoverable: true
  details:
    tool: "security_scan"
    exit_code: 1
    stderr: "Connection refused to vulnerability database"
    retry_count: 2
    max_retries: 3
```

**Example** (Unrecoverable):

```yaml
type: error
async: false
payload:
  error_code: "AUTH_ERROR"
  message: "API key expired"
  recoverable: false
  details:
    provider: "openai"
    key_prefix: "sk-...abc"
    expiry: "2024-01-01T00:00:00Z"
```

### ready

Signal that agent is ready for work.

**Structure**:

```yaml
type: ready
payload:
  capabilities: array     # Required: Available capabilities
  version: string         # Required: Agent version
  metadata: object        # Optional: Additional info
```

**Example**:

```yaml
type: ready
payload:
  capabilities:
    - "security_scan"
    - "code_review"
    - "dependency_audit"
  version: "1.2.0"
  metadata:
    runtime: "docker"
    memory_mb: 512
    tools_loaded: 5
    models:
      - provider: "anthropic"
        model: "claude-3-sonnet"
```

### heartbeat

Periodic liveness signal.

**Structure**:

```yaml
type: heartbeat
interval_seconds: 30
payload:
  timestamp: string       # Required: ISO 8601 timestamp
  phase: string           # Required: Current lifecycle phase
  metrics: object         # Optional: Resource metrics
  status: string          # Optional: healthy, degraded, unhealthy
```

**Example**:

```yaml
type: heartbeat
interval_seconds: 30
payload:
  timestamp: "2024-01-15T10:30:00Z"
  phase: "act"
  status: "healthy"
  metrics:
    memory_mb: 256
    memory_percent: 50
    cpu_percent: 15
    open_connections: 3
    pending_tasks: 2
    uptime_seconds: 3600
```

**Degraded Status**:

```yaml
type: heartbeat
interval_seconds: 30
payload:
  timestamp: "2024-01-15T10:30:00Z"
  phase: "act"
  status: "degraded"
  metrics:
    memory_mb: 480
    memory_percent: 94
    cpu_percent: 85
  warnings:
    - "High memory usage"
    - "Approaching resource limits"
```

## Signal Configuration

Configure signals in your runtime specification:

```yaml
apiVersion: ossa/v0.3.2
kind: RuntimeSpec

control_signals:
  tool_call:
    async: true
    timeout_seconds: 60
    retry:
      enabled: true
      max_attempts: 3
      backoff_ms: 1000
      backoff_multiplier: 2
  
  delegation:
    async: true
    timeout_seconds: 300
    retry:
      enabled: true
      max_attempts: 2
      backoff_ms: 5000
  
  halt:
    async: false
    timeout_seconds: 5
    force_after_seconds: 10
  
  heartbeat:
    enabled: true
    interval_seconds: 30
    timeout_seconds: 5
    missed_threshold: 3  # Unhealthy after 3 missed beats
```

## Signal Handlers

### TypeScript Implementation

```typescript
interface SignalHandler {
  handle(signal: Signal): Promise<SignalResponse>;
}

class ToolCallHandler implements SignalHandler {
  async handle(signal: ToolCallSignal): Promise<ToolCallResponse> {
    const { tool_name, parameters, correlation_id } = signal.payload;
    
    try {
      const tool = this.registry.get(tool_name);
      const result = await tool.execute(parameters);
      
      return {
        type: 'tool_call_response',
        payload: {
          tool_name,
          correlation_id,
          success: true,
          result,
          duration_ms: Date.now() - signal.timestamp
        }
      };
    } catch (error) {
      return {
        type: 'tool_call_response',
        payload: {
          tool_name,
          correlation_id,
          success: false,
          error: {
            code: 'TOOL_ERROR',
            message: error.message,
            recoverable: error.recoverable ?? true
          }
        }
      };
    }
  }
}
```

### Python Implementation

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional

@dataclass
class Signal:
    type: str
    payload: dict
    timestamp: str
    async_: bool = False
    timeout_seconds: Optional[int] = None

class SignalHandler(ABC):
    @abstractmethod
    async def handle(self, signal: Signal) -> dict:
        pass

class DelegationHandler(SignalHandler):
    def __init__(self, agent_registry):
        self.registry = agent_registry
    
    async def handle(self, signal: Signal) -> dict:
        target = signal.payload['target_agent']
        task = signal.payload['task']
        
        agent = await self.registry.get(target)
        result = await agent.execute(task)
        
        return {
            'type': 'delegation_response',
            'payload': {
                'target_agent': target,
                'status': 'completed',
                'result': result
            }
        }
```

## Signal Routing

### Message Envelope

All signals are wrapped in a standard envelope:

```yaml
envelope:
  id: "msg-uuid-123"
  timestamp: "2024-01-15T10:30:00Z"
  source: "orchestrator-agent"
  destination: "code-review-agent"
  trace_id: "trace-abc123"
  span_id: "span-def456"

signal:
  type: tool_call
  payload:
    tool_name: "lint"
    parameters:
      file: "main.py"
```

### Routing Configuration

```yaml
apiVersion: ossa/v0.3.2
kind: MessageRouting

routes:
  - match:
      signal_type: delegation
      target_agent: "security-*"
    destination:
      queue: "security-agents"
      priority: high
  
  - match:
      signal_type: tool_call
      tool_name: "external_*"
    destination:
      gateway: "external-gateway"
      rate_limit: 10/s
```

## Error Recovery

### Retry Strategies

```yaml
control_signals:
  tool_call:
    retry:
      enabled: true
      strategy: exponential  # constant, linear, exponential
      max_attempts: 3
      initial_delay_ms: 1000
      max_delay_ms: 30000
      jitter: true
      retryable_errors:
        - TOOL_TIMEOUT
        - NETWORK_ERROR
        - RATE_LIMITED
```

### Circuit Breaker

```yaml
control_signals:
  delegation:
    circuit_breaker:
      enabled: true
      failure_threshold: 5
      success_threshold: 2
      timeout_seconds: 60
      half_open_max_calls: 3
```

## Observability

### Signal Metrics

Track signal performance:

```yaml
observability:
  signals:
    metrics:
      - name: signal_latency_ms
        type: histogram
        labels: [signal_type, status]
      - name: signal_count
        type: counter
        labels: [signal_type, status]
      - name: signal_errors
        type: counter
        labels: [signal_type, error_code]
```

### Tracing

Enable distributed tracing for signals:

```yaml
observability:
  tracing:
    enabled: true
    propagation: w3c  # w3c, b3, jaeger
    sample_rate: 0.1
    export:
      endpoint: "http://jaeger:14268/api/traces"
```

## Best Practices

### 1. Use Correlation IDs

Always include correlation IDs for request tracking:

```yaml
payload:
  correlation_id: "${uuid()}"
  parent_correlation_id: "${parent.correlation_id}"
```

### 2. Set Appropriate Timeouts

Match timeouts to expected operation durations:

```yaml
# Fast operations
tool_call:
  timeout_seconds: 10

# Slow operations (external APIs)
tool_call:
  timeout_seconds: 120

# Agent delegation
delegation:
  timeout_seconds: 600
```

### 3. Handle Partial Failures

Design for graceful degradation:

```python
async def execute_with_fallback(signal: Signal):
    try:
        return await primary_handler.handle(signal)
    except RecoverableError as e:
        return await fallback_handler.handle(signal)
    except UnrecoverableError as e:
        return create_error_response(e)
```

### 4. Implement Idempotency

Make signal handlers idempotent:

```python
async def handle_tool_call(signal: Signal):
    # Check if already processed
    if await cache.exists(signal.correlation_id):
        return await cache.get(signal.correlation_id)
    
    # Process and cache result
    result = await execute_tool(signal)
    await cache.set(signal.correlation_id, result, ttl=3600)
    
    return result
```

## Related Documentation

- [Lifecycle Phases](/docs/runtime/lifecycle) - Agent lifecycle states
- [Runtime Overview](/docs/runtime/) - Complete runtime specification
- [A2A Protocol](/docs/schema-reference/a2a-protocol) - Agent-to-agent messaging

---

**Specification Version**: v0.3.2
**Last Updated**: 2024-01
