---
name: observability
description: "A2A telemetry, Grafana dashboards, DORA metrics, cost intelligence, tracing, compliance audit."
triggers:
  - pattern: "observ|monitor|metric|alert|grafana|dashboard"
    priority: critical
  - pattern: "trace|log|a2a|dora|slo|sli"
    priority: high
  - pattern: "cost|budget|latency|error.*rate|throughput"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

# Observability

## Telemetry Stack

```
Agents → A2A Collector → A2A Stream → Grafana/Prometheus
              ↓                ↓
         Tracer           Alert Manager
              ↓
         Compliance Engine (audit log)
```

## A2A (Agent-to-Agent) Telemetry

### A2A Collector
- **URL**: https://a2a-collector.blueflyagents.com
- **Port**: 3011
- **Purpose**: Receives telemetry from all agents (spans, metrics, events)

### A2A Stream
- **URL**: https://a2a-stream.blueflyagents.com
- **Port**: 3012
- **Purpose**: Real-time event stream (SSE) for live dashboards

### Live Stream Commands
```bash
# Watch all agent events
curl -N https://a2a-stream.blueflyagents.com/events

# Filter by agent
curl -N "https://a2a-stream.blueflyagents.com/events?agent=vulnerability-scanner"

# Filter by severity
curl -N "https://a2a-stream.blueflyagents.com/events?severity=error"
```

## Dashboards

| Dashboard | URL | Metrics |
|-----------|-----|---------|
| Grafana | https://grafana.blueflyagents.com | All platform metrics |
| Agent Dashboard | https://adash.blueflyagents.com | Agent-specific views |
| Prometheus | internal :9090 | Raw metrics + alerts |

### Key Grafana Dashboards
| Dashboard | UID | Shows |
|-----------|-----|-------|
| Platform Overview | platform-overview | 38-service health grid |
| Agent Performance | agent-perf | Latency, throughput, error rates per agent |
| Fleet Status | fleet-status | Change control pipeline metrics |
| DORA Metrics | dora | Deployment frequency, lead time, MTTR, change failure |
| Cost Intelligence | cost-intel | Resource usage, budget tracking, projections |
| Compliance | compliance | Audit events, policy violations, gate decisions |

## DORA Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Deployment Frequency | Daily | GitLab deployments to production per day |
| Lead Time for Changes | < 1 day | Time from commit to production deploy |
| Mean Time to Recovery | < 1 hour | Time from incident detection to resolution |
| Change Failure Rate | < 5% | Percentage of deploys causing incidents |

### DORA Queries
```bash
# Via Grafana API
curl -s https://grafana.blueflyagents.com/api/dashboards/uid/dora \
  -H "Authorization: Bearer $GRAFANA_TOKEN"

# Via BuildKit
buildkit observe dora --window 30d
buildkit observe dora --team platform
```

## Tracing

- **Service**: Tracer (https://tracer.blueflyagents.com, port 3013)
- **Protocol**: OpenTelemetry-compatible
- **Storage**: Qdrant (vector traces) + PostgreSQL (structured spans)

### Trace Queries
```bash
# Recent traces
curl https://tracer.blueflyagents.com/api/traces?limit=20

# Traces by agent
curl "https://tracer.blueflyagents.com/api/traces?agent=code-reviewer&window=1h"

# Slow traces (>5s)
curl "https://tracer.blueflyagents.com/api/traces?min_duration=5000"

# Error traces
curl "https://tracer.blueflyagents.com/api/traces?status=error"
```

## Cost Intelligence

### Budget Controls
| Variable | Purpose | Default |
|----------|---------|---------|
| `FLEET_BUDGET_DAILY_USD` | Daily fleet spend cap | 50 |
| `VAST_BUDGET_HOURLY_USD` | GPU hourly cap | 2.50 |
| `LITELLM_BUDGET_MONTHLY_USD` | LLM API monthly cap | 500 |

### Cost Commands
```bash
# Current spend
buildkit observe cost --today
buildkit observe cost --month

# By service
buildkit observe cost --service litellm --window 7d

# Projections
buildkit observe cost --project 30d

# Alerts
buildkit observe cost --alerts
```

## Compliance Audit

The Compliance Engine (https://compliance.blueflyagents.com, port 3009) maintains an immutable audit log.

### Audit Queries
```bash
# Recent audit events
curl https://compliance.blueflyagents.com/api/audit?limit=50

# By agent
curl "https://compliance.blueflyagents.com/api/audit?agent=pipeline-remediation"

# Policy violations
curl "https://compliance.blueflyagents.com/api/audit?type=violation"

# Gate decisions
curl "https://compliance.blueflyagents.com/api/audit?type=gate_decision&window=24h"
```

## 360 Feedback Loop

```
Metrics (Prometheus) ──┐
Traces (Tracer)  ──────┤
Audit (Compliance) ────┼──→ Intel Feed ──→ Agent Brain ──→ Recommendations
A2A Events (Stream) ───┤
Cost Data ─────────────┘
```

The Intel Feed (https://intel.blueflyagents.com, port 3014) aggregates all signals and feeds into Agent Brain for automated recommendations.

## Alerting

### Alert Channels
- Grafana alerts → webhook → Agent Mesh → incident-commander agent
- Prometheus alertmanager → PagerDuty / Slack (configurable)

### Key Alert Rules
| Alert | Condition | Severity |
|-------|-----------|----------|
| ServiceDown | Health check fails 3x | Critical |
| HighErrorRate | >5% errors in 5min | Warning |
| HighLatency | p99 >10s for 5min | Warning |
| BudgetExceeded | Daily spend >80% cap | Warning |
| PolicyViolation | Cedar DENY event | Critical |
| DriftDetected | Config drift from desired state | Info |
