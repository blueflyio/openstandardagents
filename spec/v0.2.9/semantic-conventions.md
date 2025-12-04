# OSSA OpenTelemetry Semantic Conventions

**Version**: 0.2.9
**Status**: Draft
**Last Updated**: 2025-12-04

This document defines the semantic conventions for OpenTelemetry instrumentation of OSSA-compliant agents. These conventions ensure consistent observability across all agent implementations.

## Overview

OSSA semantic conventions extend the [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) with agent-specific attributes for multi-instance debugging, session tracking, and capability tracing.

## Namespace Hierarchy

```
gen_ai.*          # Standard GenAI conventions (OTel GenAI SIG)
ossa.*            # OSSA-specific extensions
ossa.agent.*      # Agent identity attributes
ossa.session.*    # Session/conversation tracking
ossa.interaction.* # Per-turn tracking
ossa.capability.* # Tool/capability invocation
ossa.state.*      # State management
```

## Required Attributes

### Agent Identity (from spec.identity)

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `ossa.agent.id` | string | Agent definition ID from manifest | `review-agent` |
| `ossa.agent.name` | string | Human-readable agent name | `Code Review Agent` |
| `ossa.agent.version` | string | Agent manifest version (semver) | `1.2.0` |
| `ossa.instance.id` | string | Runtime instance UUID | `550e8400-e29b-41d4-a716-446655440000` |

### Session & Interaction Tracking

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `ossa.session.id` | string | Conversation/workflow session ID | `uuid-v4` |
| `ossa.interaction.id` | string | Per-turn interaction ID | `uuid-v4` |
| `ossa.turn.number` | int | Turn number within session | `3` |

## GenAI Standard Attributes

OSSA agents MUST emit standard GenAI attributes:

### Request Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `gen_ai.system` | string | AI system identifier | `ossa` |
| `gen_ai.request.model` | string | Model identifier | `claude-sonnet-4-20250514` |
| `gen_ai.request.max_tokens` | int | Max tokens requested | `4096` |
| `gen_ai.request.temperature` | float | Sampling temperature | `0.7` |
| `gen_ai.request.top_p` | float | Top-p sampling | `0.9` |

### Response Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `gen_ai.response.id` | string | Provider response ID | `chatcmpl-abc123` |
| `gen_ai.response.model` | string | Actual model used | `claude-sonnet-4-20250514` |
| `gen_ai.response.finish_reason` | string | Completion reason | `stop`, `length`, `tool_use` |
| `gen_ai.usage.input_tokens` | int | Input token count | `1523` |
| `gen_ai.usage.output_tokens` | int | Output token count | `892` |
| `gen_ai.usage.total_tokens` | int | Total tokens | `2415` |

## OSSA Extension Attributes

### Capability/Tool Tracking

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `ossa.capability.name` | string | Capability being invoked | `code_review` |
| `ossa.capability.version` | string | Capability version | `2.1` |
| `ossa.tool.name` | string | Tool name | `gitlab-api` |
| `ossa.tool.type` | string | Tool transport type | `mcp`, `http`, `function` |
| `ossa.tool.source` | string | Tool source URI | `mcp://gitlab/api` |

### State Management

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `ossa.state.mode` | string | State persistence mode | `session`, `persistent`, `none` |
| `ossa.state.storage_type` | string | Storage backend type | `redis`, `postgres`, `vector-db` |
| `ossa.state.ttl_seconds` | int | State TTL | `3600` |

### Reasoning (from spec.reasoning)

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `ossa.reasoning.strategy` | string | Reasoning strategy | `react`, `cot`, `tree_of_thought` |
| `ossa.reasoning.step` | int | Current reasoning step | `3` |
| `ossa.reasoning.max_steps` | int | Maximum steps allowed | `10` |
| `ossa.reasoning.depth` | int | Tree depth (for ToT) | `2` |

### Multi-Agent Collaboration

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `ossa.delegation.target` | string | Target agent ID | `specialist-agent` |
| `ossa.delegation.type` | string | Delegation pattern | `handoff`, `parallel`, `supervisor` |
| `ossa.parent.agent.id` | string | Parent agent (if delegated) | `orchestrator` |
| `ossa.parent.interaction.id` | string | Parent interaction ID | `uuid-v4` |

## Span Naming Conventions

### Span Names

```
ossa.agent.invoke          # Agent invocation
ossa.agent.turn            # Single turn (prompt → response)
ossa.tool.call             # Tool/capability invocation
ossa.reasoning.step        # Individual reasoning step
ossa.delegation.handoff    # Agent-to-agent handoff
ossa.state.load            # State retrieval
ossa.state.save            # State persistence
```

### Span Hierarchy

```
ossa.agent.invoke (root)
├── ossa.agent.turn
│   ├── gen_ai.chat        # LLM call
│   ├── ossa.tool.call     # Tool execution
│   │   └── http.request   # External call
│   └── ossa.reasoning.step
│       └── gen_ai.chat    # Reasoning LLM call
└── ossa.state.save        # Persist state
```

## Span Links (Multi-Agent)

For agent-to-agent communication, use span links instead of parent-child:

```typescript
// Agent handoff creates a link, not a child span
span.addLink({
  context: parentAgentSpanContext,
  attributes: {
    'ossa.link.type': 'delegation',
    'ossa.link.source_agent': 'orchestrator',
    'ossa.link.target_agent': 'specialist'
  }
});
```

## W3C Baggage Propagation

OSSA agents SHOULD propagate context via W3C Baggage:

```
baggage: ossa.session.id=abc123,ossa.workflow.id=workflow-456,ossa.tenant.id=customer-789
```

### Standard Baggage Keys

| Key | Description |
|-----|-------------|
| `ossa.session.id` | Session identifier |
| `ossa.workflow.id` | Workflow identifier |
| `ossa.tenant.id` | Multi-tenant isolation |
| `ossa.environment` | Environment (dev/staging/prod) |

## Metrics

### Required Metrics

| Metric | Type | Unit | Description |
|--------|------|------|-------------|
| `ossa.agent.invocations` | Counter | 1 | Total agent invocations |
| `ossa.agent.turns` | Counter | 1 | Total turns processed |
| `ossa.agent.errors` | Counter | 1 | Total errors |
| `ossa.agent.latency` | Histogram | ms | Turn latency |
| `ossa.tokens.input` | Counter | 1 | Input tokens consumed |
| `ossa.tokens.output` | Counter | 1 | Output tokens generated |
| `ossa.tool.calls` | Counter | 1 | Tool invocations |
| `ossa.tool.errors` | Counter | 1 | Tool failures |

### Metric Attributes

All metrics SHOULD include:
- `ossa.agent.id`
- `ossa.agent.version`
- `gen_ai.request.model`

### Cardinality Control

To prevent metric explosion:
- Do NOT use `ossa.instance.id` as metric attribute
- Do NOT use `ossa.session.id` as metric attribute
- Do NOT use `ossa.interaction.id` as metric attribute

Use these only in traces and logs.

## Example: Instrumented Agent Turn

```typescript
import { trace, metrics, context, propagation } from '@opentelemetry/api';

const tracer = trace.getTracer('ossa-agent', '0.2.9');
const meter = metrics.getMeter('ossa-agent', '0.2.9');

// Metrics
const invocationCounter = meter.createCounter('ossa.agent.invocations');
const latencyHistogram = meter.createHistogram('ossa.agent.latency');

async function processAgentTurn(input: string, agentManifest: OSSAManifest) {
  const startTime = Date.now();

  return tracer.startActiveSpan('ossa.agent.turn', async (span) => {
    // Set identity attributes
    span.setAttributes({
      'gen_ai.system': 'ossa',
      'ossa.agent.id': agentManifest.metadata.name,
      'ossa.agent.version': agentManifest.metadata.version,
      'ossa.instance.id': runtime.instanceId,
      'ossa.session.id': session.id,
      'ossa.interaction.id': generateUUID(),
      'ossa.turn.number': session.turnCount,
    });

    // Extract baggage for multi-agent context
    const baggage = propagation.getBaggage(context.active());
    if (baggage) {
      const workflowId = baggage.getEntry('ossa.workflow.id');
      if (workflowId) {
        span.setAttribute('ossa.workflow.id', workflowId.value);
      }
    }

    try {
      // LLM call span
      const response = await tracer.startActiveSpan('gen_ai.chat', async (llmSpan) => {
        llmSpan.setAttributes({
          'gen_ai.request.model': agentManifest.spec.llm.model,
          'gen_ai.request.max_tokens': agentManifest.spec.llm.parameters?.max_tokens,
        });

        const result = await llmProvider.chat(input);

        llmSpan.setAttributes({
          'gen_ai.response.finish_reason': result.finish_reason,
          'gen_ai.usage.input_tokens': result.usage.input_tokens,
          'gen_ai.usage.output_tokens': result.usage.output_tokens,
        });

        llmSpan.end();
        return result;
      });

      // Record metrics
      invocationCounter.add(1, {
        'ossa.agent.id': agentManifest.metadata.name,
        'gen_ai.request.model': agentManifest.spec.llm.model,
      });

      latencyHistogram.record(Date.now() - startTime, {
        'ossa.agent.id': agentManifest.metadata.name,
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return response;

    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## TypeScript Types

```typescript
// Semantic convention attribute names
export const OSSAAttributes = {
  // Agent Identity
  AGENT_ID: 'ossa.agent.id',
  AGENT_NAME: 'ossa.agent.name',
  AGENT_VERSION: 'ossa.agent.version',
  INSTANCE_ID: 'ossa.instance.id',

  // Session & Interaction
  SESSION_ID: 'ossa.session.id',
  INTERACTION_ID: 'ossa.interaction.id',
  TURN_NUMBER: 'ossa.turn.number',

  // Capability
  CAPABILITY_NAME: 'ossa.capability.name',
  CAPABILITY_VERSION: 'ossa.capability.version',
  TOOL_NAME: 'ossa.tool.name',
  TOOL_TYPE: 'ossa.tool.type',

  // Reasoning
  REASONING_STRATEGY: 'ossa.reasoning.strategy',
  REASONING_STEP: 'ossa.reasoning.step',
  REASONING_MAX_STEPS: 'ossa.reasoning.max_steps',

  // State
  STATE_MODE: 'ossa.state.mode',
  STATE_STORAGE_TYPE: 'ossa.state.storage_type',

  // Delegation
  DELEGATION_TARGET: 'ossa.delegation.target',
  DELEGATION_TYPE: 'ossa.delegation.type',
  PARENT_AGENT_ID: 'ossa.parent.agent.id',
} as const;

export type OSSAAttributeKey = typeof OSSAAttributes[keyof typeof OSSAAttributes];
```

## Integration with Observability Platforms

### GitLab Ultimate

```yaml
# gitlab-ci.yml observability config
variables:
  OTEL_EXPORTER_OTLP_ENDPOINT: "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/observability/v1/traces"
  OTEL_EXPORTER_OTLP_HEADERS: "PRIVATE-TOKEN=${CI_JOB_TOKEN}"
  OTEL_SERVICE_NAME: "ossa-agents"
  OTEL_RESOURCE_ATTRIBUTES: "deployment.environment=${CI_ENVIRONMENT_NAME}"
```

### SigNoz / Jaeger

```typescript
// Configure OTLP exporter
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});
```

## References

- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [W3C Baggage](https://www.w3.org/TR/baggage/)
- [OSSA Specification v0.2.9](./ossa-0.2.9.schema.json)
