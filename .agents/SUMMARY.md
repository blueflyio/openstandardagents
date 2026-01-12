# OSSA Agents Directory Summary

## Overview

This directory contains OSSA agent manifests that showcase the Open Standard for Software Agents specification.

## Structure

```
.agents/
├── bot-ossa-validator.ossa.yaml      # OSSA validation agent
├── spec-healer/                      # Specification maintenance agent
│   └── manifest.ossa.yaml
├── orchestrators/                    # Orchestration agents
│   └── meta-orchestrator/
│       └── manifest.ossa.yaml
├── workers/                          # Worker agents
│   ├── drupal-module-developer/
│   ├── drupal-security-compliance/
│   ├── drupal-migration-intelligence/
│   └── security-healer/
└── workflows/                        # Workflow definitions
    └── mr-agent-router.ossa.yaml
```

## Agent Categories

### Validators
- **bot-ossa-validator** - Validates OSSA manifests against schema
- **spec-healer** - Maintains OSSA specification consistency

### Orchestrators
- **meta-orchestrator** - Master orchestrator for all OSSA agents

### Workers
- **drupal-module-developer** - Drupal module development specialist
- **drupal-security-compliance** - Drupal security and compliance specialist
- **drupal-migration-intelligence** - Drupal migration specialist
- **security-healer** - Security scanning and remediation

### Workflows
- **mr-agent-router** - Routes GitLab MR events to appropriate agents

## OSSA Features Showcased

### Resource Kinds
- ✅ **Agent** - LLM reasoning agents (all agents)
- ✅ **Workflow** - Multi-agent workflows (mr-agent-router)

### Extensions
- ✅ **GitLab Extension** - GitLab integration (multiple agents)
- ⚠️ **OpenTelemetry Extension** - Observability (needs addition)
- ⚠️ **Framework Extensions** - Langflow, LangChain (needs addition)

### Capabilities
- ✅ **Multi-provider LLM** - Anthropic, OpenAI fallbacks
- ✅ **Tool Integration** - MCP server integration
- ✅ **Observability** - Tracing, metrics, logging
- ✅ **Safety** - Content filtering, guardrails
- ✅ **Compliance** - FedRAMP, SOC2, HIPAA profiles

## Version Status

All agents use **OSSA v0.3.3** (updated 2026-01-11)

## File Naming Standard

All manifests use `.ossa.yaml` extension:
- ✅ `manifest.ossa.yaml` (preferred)
- ✅ `agent.ossa.yaml` (acceptable)
- ❌ `.yml` (deprecated)

## Next Steps

1. Add OpenTelemetry extension to showcase observability
2. Add framework integration examples (Langflow, LangChain)
3. Add Task kind example
4. Validate all manifests against schema

---

*Last updated: 2026-01-11*
