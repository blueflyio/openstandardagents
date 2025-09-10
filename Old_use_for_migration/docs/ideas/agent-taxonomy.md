# OSSA Agent Taxonomy & ACDL

## Overview

Agents are categorized by primary function with defined subtypes, forming the Agent Capability Description Language (ACDL) foundation. This taxonomy enables interoperability, routing, and specialized task assignment across the ecosystem.

## Core Categories

**Orchestration** (orchestrator, router, scheduler)
- **Orchestrator**: Plans/handoff, budgets, routes tasks
- **Router**: Directs requests to appropriate agents
- **Scheduler**: Manages timing and dependencies

**Execution** (worker, executor, processor)
- **Worker**: Implements specific domain tasks (e.g., worker.drupal, worker.docs, worker.devops)
- **Executor**: General task execution
- **Processor**: Data processing and transformation

**Evaluation** (critic, verifier, judge)
- **Critic**: Multi-dimensional reviews (style, security, accessibility, licensing, compliance)
- **Verifier**: Test runner, schema validator, lint, SAST/DAST
- **Judge**: RAG-assisted pairwise ranking A/B/n decisions

**Learning** (trainer, synthesizer, optimizer)
- **Trainer**: Embeddings, skill updates, curriculum queues
- **Synthesizer**: Combines multiple feedback sources
- **Optimizer**: Improves performance over time

**Governance** (governor, auditor, enforcer)
- **Governor**: Budget and policy enforcement (governor.cost, governor.policy)
- **Auditor**: Compliance checking and reporting
- **Enforcer**: Implements governance decisions

**Telemetry** (monitor, collector, analyzer)
- **Monitor**: Real-time system observation
- **Collector**: Metrics, traces, budget events to OSS/Prometheus
- **Analyzer**: Performance analysis and insights

**Integration** (adapter, translator, bridge)
- **Adapter**: Protocol and format adaptation
- **Translator**: Cross-system communication
- **Bridge**: Framework interoperability

## Agent Registration Schema

Each agent registers its capabilities using ACDL, specifying:
- **Agent Type**: Primary functional category
- **Agent SubType**: Specialized implementation (e.g., "worker.drupal", "critic.security")
- **Supported Domains**: NLP, vision, reasoning, data
- **Protocol Endpoints**: REST, gRPC, WebSocket
- **Performance Metrics**: Latency, throughput, accuracy
- **Version Compatibility**: Requirements and constraints

## Taxonomy Structure

```yaml
agentType: orchestrator|worker|critic|verifier|judge|integrator|trainer|governor|telemetry
agentSubType: "worker.drupal" | "critic.security" | "verifier.openapi" | ...
```

## OpenAPI Agent Reference Schema

```yaml
AgentRef:
  type: object
  required: [id, agentType]
  properties:
    id: { type: string }
    agentType: { type: string }
    agentSubType: { type: string }
```

## Reserved SubType Examples

- **worker.drupal**: Drupal-specific development tasks
- **worker.docs**: Documentation generation and maintenance
- **worker.devops**: Infrastructure and deployment tasks
- **critic.security**: Security vulnerability assessment
- **critic.accessibility**: WCAG compliance checking
- **verifier.openapi**: OpenAPI specification validation
- **governor.cost**: Token budget enforcement
- **governor.policy**: Compliance policy enforcement

## Namespace Rules

1. **Reserved Names**: Core OSSA types are reserved and documented
2. **Dot Notation**: SubTypes use dot notation for hierarchical organization
3. **Domain Specificity**: SubTypes should be specific enough to enable proper routing
4. **Version Compatibility**: Changes must maintain backward compatibility
5. **Validator Enforcement**: Unknown or illegal subtypes are rejected

## Agent Discovery

Agents can be discovered by:
- **Type**: Query by primary agentType
- **Capability**: Search by supported domains
- **Protocol**: Filter by communication method
- **Performance**: Select by latency/throughput requirements
- **Version**: Compatibility with specific OSSA versions

## Registration Process

1. **Capability Declaration**: Agent declares its type, subtypes, and capabilities
2. **Validation**: Registry validates against taxonomy rules
3. **Registration**: Approved agents receive unique identifiers
4. **Discovery**: Agents become available for routing and selection
5. **Monitoring**: Performance metrics tracked for optimization

This taxonomy provides the foundation for the OSSA ecosystem's interoperability and enables sophisticated agent orchestration patterns while maintaining clear separation of concerns.