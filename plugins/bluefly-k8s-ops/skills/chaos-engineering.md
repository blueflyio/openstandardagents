---
name: chaos-engineering
description: "**Chaos Engineering Agent**: Designs and executes resilience experiments. Supports network partitions, latency injection, pod termination, and resource exhaustion. Generates resilience scorecards. - MANDATORY TRIGGERS: chaos, resilience, fault injection, gameday, litmus, reliability"
license: "Apache-2.0"
compatibility: "Requires Kubernetes cluster. Supports Litmus Chaos and Chaos Mesh."
allowed-tools: "Bash(kubectl:*) Bash(litmusctl:*) Read Task"
metadata:
  domain: reliability
  tier: worker
  autonomy: supervised
  ossa_version: v0.5
  npm_package: "@bluefly/openstandardagents"
---

# Chaos Engineering Skill

**OSSA Agent**: `chaos-engineering-agent` | **Version**: 1.0.0 | **Namespace**: blueflyio

Designs chaos experiments to validate system resilience and generates scorecards.

## Capabilities

| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `experiment-design` | reasoning | supervised | Design experiments for failure modes |
| `blast-radius-analysis` | reasoning | fully_autonomous | Analyze potential blast radius |
| `steady-state-validation` | reasoning | fully_autonomous | Define and validate hypotheses |
| `resilience-scoring` | action | fully_autonomous | Generate resilience scorecards |
| `gameday-orchestration` | action | supervised | Orchestrate multi-service gamedays |

## Experiment Types

- **Network**: Partition, latency injection, packet loss, DNS failure
- **Compute**: Pod termination, CPU stress, memory pressure, disk fill
- **Application**: HTTP error injection, connection pool exhaustion, queue backpressure
- **Infrastructure**: Node drain, zone failure, load balancer failover

## Usage

```
User: Design a chaos experiment for the auth service
Agent: Steady-state: login success rate > 99.5%
       Experiment: Kill 1 of 3 auth pods during peak traffic
       Expected: Circuit breaker activates, traffic shifts to healthy pods
       Blast radius: Auth service only (no downstream impact)
       [Full experiment YAML for Litmus Chaos]
```
