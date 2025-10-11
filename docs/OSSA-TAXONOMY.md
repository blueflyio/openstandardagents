# OSSA Agent Taxonomy Standard v1.0

## Overview

The OSSA (OpenAPI Specification for Software Agents) Taxonomy provides a standardized classification system for AI agents based on their primary responsibilities and behavioral patterns.

## Core Agent Categories

### 1. Critics
**Purpose**: Code review, quality assessment, and improvement suggestions
- Analyze code quality and patterns
- Provide constructive feedback
- Suggest optimizations and improvements
- Validate best practices compliance

**Examples**: code-reviewer, performance-analyzer, security-auditor

### 2. Governors
**Purpose**: Security, compliance, and governance enforcement
- Enforce security policies
- Manage compliance requirements
- Audit system activities
- Control access and permissions

**Current Agents**:
- audit-logger
- auth-security-specialist
- cert-manager
- compliance-auditor
- drools-rules-expert
- governance-enforcer
- opa-policy-architect
- rbac-configurator
- security-scanner
- vault-secrets-expert

### 3. Integrators
**Purpose**: API, protocol, and system integration
- Connect disparate systems
- Translate between protocols
- Manage API gateways
- Handle communication protocols

**Current Agents**:
- api-connector
- communication-multiprotocol
- mcp-enhanced

### 4. Judges
**Purpose**: Decision-making and evaluation
- Make complex decisions
- Evaluate multiple options
- Apply business rules
- Resolve conflicts

**Current Agents**:
- decision-engine

### 5. Monitors
**Purpose**: System observation and alerting
- Track system metrics
- Monitor performance
- Generate alerts
- Collect telemetry data

**Current Agents**:
- observability-agent

### 6. Orchestrators
**Purpose**: Workflow coordination and agent management
- Coordinate multi-agent workflows
- Manage agent lifecycles
- Route tasks to appropriate agents
- Handle complex orchestrations

**Current Agents**:
- meta-orchestrator
- roadmap-orchestrator

### 7. Trainers
**Purpose**: ML/AI model training and optimization
- Train machine learning models
- Optimize inference pipelines
- Manage training data
- Configure GPU resources

**Current Agents**:
- embeddings-model-trainer
- gpu-cluster-manager
- inference-optimizer
- knowledge-distillation-expert
- llama2-fine-tuning-expert
- lora-training-specialist
- mlops-pipeline-architect
- model-serving-specialist
- ppo-optimization-agent
- training-data-curator

### 8. Voice
**Purpose**: Voice and speech interfaces
- Handle speech recognition
- Manage voice synthesis
- Process natural language audio
- Enable voice interactions

**Status**: Category reserved for future voice agents

### 9. Workers
**Purpose**: Task execution and domain-specific operations
- Execute specific tasks
- Implement business logic
- Process data transformations
- Handle domain operations

**Current Agents**: 23 domain-specific workers including api-gateway-configurator, cache-optimizer, database-migration-specialist, etc.

## Agent Structure Requirements

Each agent MUST contain:

```
.agents/<category>/<agent-name>/
├── agent.yml          # Agent metadata and configuration
├── openapi.yaml       # OpenAPI specification
└── README.md         # Agent documentation
```

### agent.yml Schema

```yaml
name: string                    # Unique agent identifier
category: string                # OSSA taxonomy category
type: worker|orchestrator|critic|governor|trainer|integrator|monitor|judge|voice
description: string             # Agent purpose
version: string                # Semantic version
capabilities:                   # List of capabilities
  - string
domains:                       # Domain expertise areas
  - string
integrations:                  # External systems
  - string
requirements:                  # System requirements
  runtime: string
  memory: string
  gpu: boolean
```

### OpenAPI Specification Requirements

Each agent MUST provide an OpenAPI 3.0+ specification defining:
- All endpoints the agent exposes
- Request/response schemas
- Authentication requirements
- Rate limiting information
- Error responses

## Compliance Validation

Use the OSSA compliance validator to ensure agents meet taxonomy standards:

```bash
# Validate single agent
ossa validate agent <agent-name>

# Validate entire taxonomy
ossa validate taxonomy

# Generate compliance report
ossa report compliance
```

## Agent Registration

Agents are automatically discovered and registered through:

1. **File System Discovery**: Scanning `.agents/` directory
2. **Registry Manifest**: Central `registry.yml` file
3. **Dynamic Registration**: Runtime agent registration API

## Migration Guide

To migrate agents to OSSA taxonomy:

1. Identify agent's primary responsibility
2. Assign to appropriate category
3. Update agent.yml with category metadata
4. Validate OpenAPI specification
5. Run compliance checks

## Best Practices

1. **Single Responsibility**: Each agent should have one primary purpose
2. **Clear Categorization**: Choose the most specific applicable category
3. **Complete Specifications**: Provide comprehensive OpenAPI specs
4. **Semantic Versioning**: Use proper version numbers
5. **Documentation**: Include detailed README files

## Category Selection Matrix

| If agent primarily... | Use category |
|----------------------|--------------|
| Reviews/analyzes code | critics |
| Enforces policies/security | governors |
| Connects systems/APIs | integrators |
| Makes decisions | judges |
| Observes/alerts | monitors |
| Coordinates workflows | orchestrators |
| Trains/optimizes models | trainers |
| Handles voice/speech | voice |
| Executes specific tasks | workers |

## Future Extensions

The OSSA taxonomy is designed to be extensible. New categories can be proposed through the OSSA RFC process.

---

*OSSA Taxonomy Standard v1.0 - Part of the OpenAPI Specification for Software Agents*