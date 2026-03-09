# Agent-Mesh / Agent-Tracer Integration

**Purpose:** Canonical reference for how agent-mesh and agent-tracer integrate. Single source of truth for observability wiring.

## Integration Points

| Component | Integration | Env / Config |
|-----------|-------------|--------------|
| agent-mesh tracing.ts | OTLP span export | OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME |
| agent-mesh MeshRpcTracerIntegration | Optional @bluefly/agent-tracer/rpc | MESH_RPC_TRACER_ENABLED |
| agent-mesh agent-interaction-tracker | OpenTelemetry spans, GKG store | getTracer from tracing.ts |
| agent-mesh phoenix-otelexporter | Phoenix/Arize OTLP | PHOENIX_COLLECTOR_ENDPOINT |
| agent-protocol | recordToolCall -> agent-tracer | AGENT_TRACER_URL |
| platform-agents orchestrator | Run traces | AGENT_TRACER_URL |
| gitlab_components | Agent run analytics | AGENT_TRACER_URL |

## Environment Variables

- **AGENT_TRACER_URL** (default https://tracer.blueflyagents.com): HTTP API for recordToolCall, analytics/agent-runs.
- **OTEL_EXPORTER_OTLP_ENDPOINT**: Where agent-mesh exports spans. Use GitLab Observability (OTEL_GITLAB_HTTP_ENDPOINT/v1/traces) when GITLAB_OBSERVABILITY_TOKEN is set.
- **OTEL_EXPORTER_OTLP_HEADERS**: e.g. PRIVATE-TOKEN=${GITLAB_OBSERVABILITY_TOKEN} for GitLab O11y.

## Oracle Wiring

On Oracle, set in /opt/agent-platform/.env:

```
AGENT_TRACER_URL=https://tracer.blueflyagents.com
OTEL_EXPORTER_OTLP_ENDPOINT=http://87749026.otel.gitlab-o11y.com:4318/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=PRIVATE-TOKEN=${GITLAB_OBSERVABILITY_TOKEN}
```

agent-mesh will export spans to GitLab Observability. agent-protocol and platform-agents use AGENT_TRACER_URL for HTTP API calls.

## SOD

- **agent-tracer** owns: tracing, observability, OTLP ingestion, recordToolCall API.
- **agent-mesh** consumes: getTracer (from @bluefly/agent-tracer or local OTEL), exports via OTLP to configured endpoint.
- **agent-protocol** consumes: recordToolCall (delegates to agent-tracer).

## Audit Date

2026-03-01
