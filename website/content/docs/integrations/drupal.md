---
title: "Drupal Integration"
---

# Drupal Integration

Integrate OSSA agents with Drupal's LLM Platform.

## Overview

The OSSA Drupal modules provide:
- Agent management UI
- Workflow orchestration
- CrewAI integration
- Marketplace for agents

## Available Modules

| Module | Description |
|--------|-------------|
| ai_agents_ossa | Core OSSA integration |
| ai_agents_orchestra | Workflow orchestration |
| ai_agents_crewai | CrewAI framework bridge |
| ai_agents_marketplace | Agent marketplace |
| ai_agents_huggingface | HuggingFace models |

## Installation

### Via Composer

```bash
composer require drupal/ai_agents_ossa
drush en ai_agents_ossa
```

### Configuration

1. Go to `/admin/config/ai/agents`
2. Configure LLM provider credentials
3. Import OSSA manifests

## Creating Agents in Drupal

### Using the UI

1. Navigate to `/admin/content/agents`
2. Click "Add Agent"
3. Upload OSSA manifest or configure inline

### Using Drush

```bash
# Import agent from manifest
drush ai:agent:import path/to/agent.ossa.yaml

# List agents
drush ai:agent:list

# Run agent
drush ai:agent:run my-agent "Hello"
```

## Workflow Orchestration

The `ai_agents_orchestra` module enables multi-agent workflows:

```yaml
# workflow.ossa.yaml
apiVersion: ossa/v0.2.5
kind: AgentGraph

metadata:
  name: support-workflow

spec:
  agents:
    - ref: triage-agent
    - ref: resolver-agent
  edges:
    - from: triage-agent
      to: resolver-agent
  process: sequential
```

## ECA Integration

OSSA agents work with Drupal's ECA (Event-Condition-Action):

- Trigger agents on content events
- Use agent responses in conditions
- Chain multiple agents

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List agents |
| `/api/agents/{id}/run` | POST | Run agent |
| `/api/agents/{id}/status` | GET | Agent status |

## Next Steps

- [OSSA Manifest Reference](/docs/schema-reference)
- [Orchestra Module Docs](https://gitlab.bluefly.io/llm/drupal/ai_agents_orchestra)
- [CrewAI Integration](/docs/migration-guides/crewai-to-ossa)
