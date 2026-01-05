---
title: "OSSA Specification"
description: "Complete authoritative OSSA specification document - single source of truth"
weight: 1
---

# OSSA Specification - Complete Reference

> **Single Source of Truth** - This document consolidates all OSSA specification information, comparisons, and migration guides into one authoritative reference.

## Overview

The **Open Standard for Scalable AI Agents (OSSA)** is a specification standard for defining AI agents, similar to how OpenAPI standardizes REST APIs. OSSA enables agent interoperability across frameworks, runtimes, and organizations.

## Table of Contents

1. [Specification Versions](#specification-versions)
2. [Core Concepts](#core-concepts)
3. [Schema Reference](#schema-reference)
4. [Framework Comparison](#framework-comparison)
5. [Migration Guides](#migration-guides)
6. [Version-Specific Information](#version-specific-information)

---

## Specification Versions

### Current Version: v0.3.2

**Status**: Stable  
**Release Date**: 2025-12-31  
**Schema**: [v0.3.2 JSON Schema](https://gitlab.com/blueflyio/openstandardagents/-/blob/main/spec/v0.3.2/ossa-0.3.2.schema.json)

### Previous Versions

- **v0.3.1**: Previous stable release
- **v0.3.0**: First v0.3.x stable release
- **v0.2.9**: Legacy version

### Version Migration

See [Migration Guides](#migration-guides) section for version-to-version migration instructions.

---

## Core Concepts

### What is OSSA?

OSSA is a **specification standard** (not a framework) that defines:
- Agent manifest structure (JSON Schema)
- Agent capabilities and roles
- Agent-to-agent messaging (A2A protocol)
- Workflow composition
- Observability and governance

### Key Principles

1. **Framework Agnostic**: Works with any agent framework
2. **Language Independent**: Not tied to any programming language
3. **Vendor Neutral**: Open standard, no vendor lock-in
4. **Enterprise Ready**: Built-in governance, compliance, and observability
5. **Versioned**: Semantic versioning with migration paths

### Resource Kinds

OSSA v0.3.2 supports multiple resource kinds:

- **Agent**: Single agent definition
- **Workflow**: Multi-agent composition
- **Task**: Deterministic task definition
- **MessageRouting**: Message routing rules

---

## Schema Reference

### Core Agent Fields

#### Agent Identification
- **agent.id**: Unique agent identifier (UUID)
- **agent.name**: Human-readable name
- **agent.version**: Semantic version (e.g., "1.0.0")
- **agent.role**: Agent role classification (worker, orchestrator, critic, governor)

#### Agent Capabilities
- **agent.capabilities**: Array of capability names
- Each capability defines input/output schemas
- Capabilities enable agent composition

#### Agent Configuration
- **agent.modelConfig**: LLM provider and model configuration
- **agent.tools**: Available tools for the agent
- **agent.messaging**: A2A messaging channels

### Complete Schema Documentation

For detailed field-by-field documentation, see:
- [Schema Reference Index](/docs/schema-reference)
- [Agent Spec](/docs/schema-reference/agent-spec)
- [Workflow Spec](/docs/schema-reference/workflow-spec)

### Validation

Validate agent manifests:

```bash
ossa validate agent.ossa.yaml
```

---

## Framework Comparison

### OSSA vs. Popular Frameworks

| Framework | Type | OSSA Compatibility | Enterprise Features |
|-----------|------|-------------------|-------------------|
| **OSSA** | Open Standard | Native | Built-in |
| **LangChain** | Development Framework | Via adapter | Limited |
| **AutoGPT** | Autonomous Agent | Via adapter | None |
| **CrewAI** | Multi-Agent Framework | Via adapter | None |
| **Microsoft AutoGen** | Conversational Framework | Via adapter | Limited |

### Key Differentiators

#### OSSA Advantages

1. **Framework Agnostic**: Not tied to any specific framework
2. **Multi-Language**: Works with any programming language
3. **Enterprise Governance**: Built-in compliance, audit, and policy enforcement
4. **Standardized Observability**: OpenTelemetry integration
5. **Portability**: Agents can move between runtimes
6. **Versioning**: Semantic versioning with migration paths

#### Framework-Specific Strengths

- **LangChain**: Rich ecosystem, rapid prototyping
- **AutoGPT**: Full autonomy, self-directed tasks
- **CrewAI**: Role-based agent teams, simple orchestration
- **AutoGen**: Conversational AI, human-in-the-loop

### Detailed Comparison

For comprehensive framework comparison, see:
- [Framework Comparison Matrix](/docs/positioning/comparison-matrix)
- [Agent Schema Comparison](/docs/migration-guides/agent-schema-comparison)

---

## Migration Guides

### Framework Migrations

Migrate agents from popular frameworks to OSSA:

- [LangChain to OSSA](/docs/migration-guides/langchain-to-ossa)
- [CrewAI to OSSA](/docs/migration-guides/crewai-to-ossa)
- [AutoGPT to OSSA](/docs/migration-guides/autogpt-to-ossa)
- [Drupal ECA to OSSA](/docs/migration-guides/drupal-eca-to-ossa)
- [Anthropic MCP to OSSA](/docs/migration-guides/anthropic-mcp-to-ossa)
- [OpenAI to OSSA](/docs/migration-guides/openai-to-ossa)
- [Langflow to OSSA](/docs/migration-guides/langflow-to-ossa)

### Version Migrations

#### v0.3.1 -> v0.3.2

**New Features**:
- Unified LLM configuration with runtime-configurable models
- Environment variable substitution for LLM config
- Fallback models configuration
- Retry configuration with backoff strategies
- Cross-platform compatibility (GitLab Duo, Google A2A, MCP)

**Migration Steps**:
1. Update `apiVersion` to `ossa/v0.3.2`
2. Optionally migrate hardcoded provider/model to env vars
3. Add fallback_models for production resilience
4. Configure retry_config for transient failures
5. Validate with `ossa validate`

**Migration Tool**:
```bash
ossa migrate agent.ossa.yaml --from v0.3.1 --to v0.3.2
```

#### v0.2.x -> v0.3.2

**Breaking Changes**:
- Agent messaging (A2A protocol) introduced
- Workflow composition enhanced
- Schema structure updated
- Unified LLM configuration

**Migration Steps**:
1. Update `apiVersion` to `ossa/v0.3.2`
2. Review messaging configuration
3. Update workflow definitions
4. Migrate LLM config to new unified format
5. Validate with `ossa validate`

**Migration Tool**:
```bash
ossa migrate agent.ossa.yaml --from v0.2.9 --to v0.3.2
```

---

## Version-Specific Information

### OSSA v0.3.2

#### New Features

1. **Unified LLM Configuration**
   - Runtime-configurable models (no hardcoded providers)
   - Environment variable substitution: `${LLM_PROVIDER:-anthropic}`
   - Fallback models for automatic failover
   - Retry configuration with backoff strategies
   - Cross-platform compatibility (OSSA, GitLab Duo, Google A2A, MCP)

2. **Execution Profiles**
   - Task-specific optimization profiles
   - Compatible with Google A2A
   - Profiles: `fast`, `balanced`, `deep`, `safe`

3. **Enhanced Resilience**
   - Fallback conditions: `on_error`, `on_timeout`, `on_rate_limit`, `always`
   - Backoff strategies: `exponential`, `linear`, `constant`

4. **Enterprise Governance**
   - Compliance metadata (SOC2, GDPR, HIPAA)
   - Policy enforcement
   - Audit logging

#### Schema Changes

- Added `fallback_models` to LLM config
- Added `retry_config` to LLM config
- Added `profile` field for execution profiles
- Environment variable substitution support

#### Example Configuration

```yaml
apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: production-agent
  version: 1.0.0
spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4}
    profile: balanced
    temperature: 0.3
    maxTokens: 8192

    fallback_models:
      - provider: openai
        model: gpt-4o
        condition: on_error

    retry_config:
      max_attempts: 3
      backoff_strategy: exponential
```

### OSSA v0.3.1

#### Features

1. **Agent-to-Agent (A2A) Messaging**
   - Standardized message envelopes
   - Message routing and delivery
   - Authentication and encryption support

2. **Enhanced Workflow Composition**
   - Multi-agent workflows
   - Conditional execution
   - Parallel and sequential patterns

3. **Improved Observability**
   - OpenTelemetry integration
   - Distributed tracing
   - Structured logging

---

## Agent Schema Comparison

### GitLab Duo Agent vs. OSSA Agent

**GitLab Duo Agent**:
- Specialized for GitLab integration
- Project-scoped agents
- GitLab-specific triggers

**OSSA Agent**:
- Platform-agnostic design
- Universal trigger types
- Framework-independent

For detailed comparison, see:
- [Agent Schema Comparison](/docs/migration-guides/agent-schema-comparison)

---

## Related Documentation

### Getting Started
- [5-Minute Overview](/docs/getting-started/5-minute-overview)
- [Installation Guide](/docs/getting-started/installation)
- [Hello World Tutorial](/docs/getting-started/hello-world)

### Technical Reference
- [Schema Reference](/docs/schema-reference)
- [CLI Reference](/docs/cli-reference)
- [API Reference](/docs/api-reference)
- [LLM Configuration](/docs/schema-reference/llm-config)

### Integration Guides
- [Drupal Integration](/docs/integrations/drupal)
- [Symphony + Drupal Integration](/docs/integrations/symphony-drupal)
- [Framework Support](/docs/ecosystem/framework-support)

---

## References

- **OSSA Specification Repository**: https://gitlab.com/blueflyio/openstandardagents
- **npm Package**: @bluefly/openstandardagents
- **Website**: https://openstandardagents.org
- **JSON Schema**: [v0.3.2 Schema](https://gitlab.com/blueflyio/openstandardagents/-/blob/main/spec/v0.3.2/ossa-0.3.2.schema.json)

---

## Changelog

See [Changelog](/docs/changelog) for detailed version history and changes.

---

**Last Updated**: 2025-12-31  
**Specification Version**: v0.3.2  
**Document Status**: Complete and Authoritative
