---
title: AutoGPT to OSSA Migration
description: Migrate your AutoGPT agents to the Open Standard for Structured Agents
---

# AutoGPT to OSSA Migration Guide

This guide covers migrating AutoGPT agents to OSSA-compliant manifests.

## Overview

AutoGPT is an autonomous AI agent framework. This guide maps AutoGPT concepts to OSSA equivalents.

## Concept Mapping

| AutoGPT | OSSA |
|---------|------|
| Agent | `kind: Agent` manifest |
| Goals | `spec.objectives` |
| Tools | `spec.capabilities` |
| Memory | `spec.memory` |
| Plugins | MCP tools or capabilities |

## Migration Steps

### 1. Create OSSA Manifest

```yaml
apiVersion: ossa/v0.3.1
kind: Agent
metadata:
  name: my-autogpt-agent
  version: 1.0.0
spec:
  model:
    provider: openai
    name: gpt-4
  capabilities:
    - web_search
    - file_operations
    - code_execution
```

### 2. Map Goals to Objectives

AutoGPT goals become OSSA objectives:

```yaml
spec:
  objectives:
    - description: "Research and summarize topic"
      priority: 1
```

### 3. Convert Plugins to Capabilities

AutoGPT plugins map to OSSA capabilities or MCP tools.

## Key Differences

1. **Autonomy Level**: OSSA provides finer control over agent autonomy
2. **Observability**: OSSA includes built-in tracing and metrics
3. **Security**: OSSA enforces sandbox policies

## Related

- [LangChain to OSSA](/docs/migration-guides/langchain-to-ossa)
- [CrewAI to OSSA](/docs/migration-guides/crewai-to-ossa)
