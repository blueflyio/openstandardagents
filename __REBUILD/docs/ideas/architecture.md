# OSSA Core Architecture

## Executive Summary

OSSA (Open Standards for Scalable Agents) is a comprehensive framework that combines a 360° Feedback Loop with the Agent Capability Description Language (ACDL) to enable interoperable, self-improving agent systems. The specification provides enterprise-grade governance, multi-protocol support, and token-efficient communication patterns designed for production AI agent deployments.

## Core Architecture: The 360° Feedback Loop

The system operates on a continuous improvement cycle:

**Plan → Execute → Review → Judge → Learn → Govern**

Each phase involves specialized agent types:
- **Orchestrators** decompose goals into executable plans
- **Workers** execute tasks with self-reporting capabilities
- **Critics** provide multi-dimensional reviews
- **Judges** make binary decisions through pairwise comparisons
- **Trainers** synthesize feedback into learning signals
- **Governors** enforce budgets and compliance

## Workspace Structure

The `.agents-workspace/` directory provides standardized organization:

```
.agents-workspace/
├── plans/           # Execution plans
├── executions/      # Reports and outputs
├── feedback/        # Reviews and judgments
├── learning/        # Signals and updates
├── audit/           # Immutable event logs
└── roadmap/         # Machine-lean JSON sitemap
```

## Multi-Protocol Support

OSSA supports three primary communication protocols:

**REST API** (Primary)
- Base URL: `https://api.ossa.bluefly.io/v1`
- Full CRUD operations for all resources
- Synchronous request/response patterns

**gRPC** (High Performance)
- Service: `grpc://grpc.ossa.bluefly.io:50051`
- Streaming support for real-time updates
- Binary protocol for efficiency

**WebSocket** (Real-time)
- URL: `wss://ws.ossa.bluefly.io/realtime`
- Channels: `/stream/execution`, `/stream/feedback`
- Heartbeat: 30-second intervals

## Audit & Compliance

Immutable audit trail with hash-chained events:
- Event types: execution, review, judgment, learning, budget, audit
- JSONL format for append-only storage
- Metadata includes actor, action, resource, outcome
- Exportable for compliance reporting

## GitLab-Native Implementation

The system leverages GitLab's ecosystem:
- **CI/CD Components**: Reusable pipeline stages per agent type
- **ML Experiment Tracking**: A/B testing and model comparison
- **Model Registry**: Versioned model storage
- **Steps**: Shareable workflow definitions

## Conformance Levels

Three tiers of OSSA compliance:

**Bronze**: Basic object support, core endpoints, JSON validation
**Silver**: Full feedback loop, budget enforcement, audit logging, ACDL registration
**Gold**: Multi-protocol support, Props tokens, learning signals, workspace management

## Implementation Priority

1. **Core Infrastructure**: OpenAPI schema, agent base classes, taxonomy
2. **Execution Engine**: Budget management, basic plan/execute cycle
3. **Feedback System**: Critics, judges, review aggregation
4. **CLI Tool**: Agent Forge for command-line operations
5. **GitLab Integration**: CI components, ML tracking
6. **Learning Pipeline**: Signal processing, memory updates
7. **Advanced Features**: Props resolution, DITA generation
8. **Production Hardening**: Audit, telemetry, compression

## Key Differentiators

- **Interoperability-first**: No framework rewrites required
- **Token-efficient**: 50-70% reduction vs naive implementations
- **Enterprise-ready**: Governance, audit, budget controls built-in
- **GitLab-native**: Leverages existing DevOps infrastructure
- **Documentation-centric**: DITA-native with machine-readable roadmaps

OSSA provides a production-ready foundation for deploying scalable, governable, and continuously improving agent systems while maintaining compatibility with existing tools and workflows.