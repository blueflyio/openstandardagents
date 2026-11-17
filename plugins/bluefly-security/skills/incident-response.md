---
name: incident-response
description: "**Incident Responder**: Triages alerts, correlates logs, identifies root causes, and generates post-mortem reports. Integrates with PagerDuty, Grafana, and Prometheus. Supports runbook automation. - MANDATORY TRIGGERS: incident, alert, outage, root cause, postmortem, oncall, triage, pagerduty"
license: "Apache-2.0"
compatibility: "Works with Grafana, Prometheus, Loki, PagerDuty APIs."
allowed-tools: "Bash(curl:*) Read Grep Task WebFetch"
metadata:
  domain: operations
  tier: worker
  autonomy: supervised
  ossa_version: v0.5
  npm_package: "@bluefly/openstandardagents"
---

# Incident Responder Skill

**OSSA Agent**: `incident-responder` | **Version**: 1.1.0 | **Namespace**: blueflyio

Automated incident response: triage, correlation, root cause analysis, and post-mortems.

## Capabilities

| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `alert-triage` | reasoning | fully_autonomous | Triage and prioritize incoming alerts |
| `log-correlation` | reasoning | fully_autonomous | Correlate logs across services |
| `root-cause-analysis` | reasoning | supervised | Identify root cause from telemetry |
| `runbook-execution` | action | supervised | Execute automated runbooks |
| `postmortem-generation` | action | fully_autonomous | Generate structured post-mortems |
| `timeline-reconstruction` | reasoning | fully_autonomous | Build incident timelines |

## Integrations

- **PagerDuty** — Alert ingestion and escalation
- **Grafana/Loki** — Log queries and dashboard correlation
- **Prometheus** — Metric anomaly detection

## Usage

```
User: We're seeing 500 errors on the API gateway
Agent: Analyzing error patterns...
       Correlated: DB connection pool exhausted at 14:23 UTC
       Root cause: Connection leak in auth middleware (line 45)
       [Timeline and remediation steps]
```
