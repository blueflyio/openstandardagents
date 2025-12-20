---
title: "Symphony + Drupal Integration with OSSA"
---

# Symphony + Drupal Integration with OSSA

> **Research & Planning Document** - This page documents how OSSA agents integrate with Symphony workflows and Drupal modules, enabling enterprise-grade agent messaging and orchestration.

## Overview

This integration combines:
- **Symphony**: Workflow orchestration and business process automation
- **Drupal**: Content management and module ecosystem
- **OSSA**: Standardized agent definitions and messaging

Together, they enable powerful agent-driven workflows within Drupal sites that can orchestrate complex business processes via Symphony.

---

## Architecture

### Integration Components

```
┌─────────────────┐
│   Drupal Site   │
│                 │
│  ┌───────────┐  │
│  │ OSSA      │  │
│  │ Agents    │  │
│  └─────┬─────┘  │
│        │        │
│        │ A2A    │
│        │ Msgs   │
│        ▼        │
│  ┌───────────┐  │
│  │ Symphony  │  │
│  │ Workflows │  │
│  └───────────┘  │
└─────────────────┘
```

### Message Flow

1. **Drupal Event** → Triggers OSSA agent
2. **OSSA Agent** → Processes request, generates response
3. **Agent-to-Agent (A2A)** → Sends message to Symphony workflow
4. **Symphony** → Executes business process
5. **Response** → Returns to Drupal via agent

---

## OSSA v0.3.0 Features

### Agent Messaging (A2A Protocol)

OSSA v0.3.0 introduces standardized agent-to-agent messaging:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: drupal-content-agent
spec:
  messaging:
    channels:
      - name: symphony-workflow
        type: a2a
        endpoint: symphony://workflow/process-content
        protocol: http
        authentication:
          type: bearer
          token: ${SYMPHONY_TOKEN}
```

### Message Format

OSSA agents communicate with Symphony using standardized message envelopes:

```json
{
  "from": "drupal-content-agent",
  "to": "symphony-content-workflow",
  "message": {
    "type": "workflow.trigger",
    "payload": {
      "action": "process_content",
      "data": {
        "node_id": 123,
        "content_type": "article"
      }
    }
  },
  "metadata": {
    "trace_id": "abc123",
    "timestamp": "2025-12-14T10:00:00Z"
  }
}
```

---

## Drupal Integration

### Module Structure

OSSA agents integrate with Drupal via the `ai_agents_ossa` module:

```php
<?php

namespace Drupal\ai_agents_ossa\Plugin\OSSA\Agent;

use Drupal\Core\Plugin\PluginBase;
use Drupal\ossa\AgentInterface;

/**
 * Drupal Content Processing Agent
 */
class ContentAgent extends PluginBase implements AgentInterface {
  
  public function process(array $input): array {
    // Process Drupal content
    $node = \Drupal::entityTypeManager()
      ->getStorage('node')
      ->load($input['node_id']);
    
    // Trigger Symphony workflow
    $symphony = \Drupal::service('symphony.client');
    $result = $symphony->triggerWorkflow('process-content', [
      'node' => $node->toArray(),
      'action' => $input['action']
    ]);
    
    return $result;
  }
}
```

### Hooks Integration

OSSA agents can hook into Drupal events:

```php
/**
 * Implements hook_node_insert().
 */
function ai_agents_ossa_node_insert(NodeInterface $node) {
  $agent = \Drupal::service('ossa.agent.manager')
    ->getAgent('content-processor');
  
  $agent->invoke([
    'event' => 'node.insert',
    'node_id' => $node->id(),
    'content_type' => $node->bundle()
  ]);
}
```

---

## Symphony Integration

### Workflow Definition

Symphony workflows can be triggered by OSSA agents:

```yaml
# symphony-workflow.yml
name: content-processing
triggers:
  - type: http
    endpoint: /api/workflows/content-processing
    method: POST
    authentication:
      type: bearer

steps:
  - name: validate-content
    type: agent
    agent: content-validator
    input:
      node_id: ${trigger.node_id}
  
  - name: process-content
    type: agent
    agent: content-processor
    depends_on:
      - validate-content
  
  - name: notify-drupal
    type: http
    url: ${DRUPAL_API}/api/agents/notify
    method: POST
    body:
      workflow_id: ${workflow.id}
      status: ${steps.process-content.status}
```

### Agent-to-Symphony Communication

OSSA agents send messages to Symphony via A2A protocol:

```typescript
// Agent capability implementation
async function triggerSymphonyWorkflow(workflowName: string, data: any) {
  const message = {
    from: 'drupal-content-agent',
    to: `symphony://workflow/${workflowName}`,
    message: {
      type: 'workflow.trigger',
      payload: data
    }
  };
  
  await a2aClient.send(message);
}
```

---

## Use Cases

### 1. Content Publishing Workflow

**Scenario**: Automate content review and publishing

1. Editor creates content in Drupal
2. OSSA agent validates content
3. Agent triggers Symphony workflow for approval
4. Symphony orchestrates review process
5. Approved content published back to Drupal

### 2. Multi-Agent Content Processing

**Scenario**: Complex content transformation pipeline

1. Drupal content → Content Analysis Agent
2. Analysis Agent → Content Enhancement Agent
3. Enhancement Agent → SEO Optimization Agent
4. All agents communicate via Symphony workflow
5. Final content saved to Drupal

### 3. Event-Driven Automation

**Scenario**: Automated responses to Drupal events

- Node created → Trigger agent → Start Symphony workflow
- User registered → Agent processes → Symphony onboarding
- Content updated → Agent validates → Symphony approval chain

---

## Implementation Guide

### Phase 1: Setup

1. **Install Drupal Module**
   ```bash
   composer require drupal/ai_agents_ossa
   drush en ai_agents_ossa
   ```

2. **Configure Symphony Connection**
   ```php
   // settings.php
   $config['ai_agents_ossa.settings']['symphony'] = [
     'endpoint' => 'https://symphony.example.com',
     'token' => getenv('SYMPHONY_TOKEN'),
   ];
   ```

3. **Register OSSA Agents**
   ```bash
   drush ai:agent:import /path/to/agent.ossa.yaml
   ```

### Phase 2: Agent Development

1. Create OSSA manifest for Drupal agent
2. Implement agent capabilities
3. Configure A2A messaging channels
4. Test agent locally

### Phase 3: Symphony Integration

1. Define Symphony workflow
2. Configure HTTP triggers
3. Set up authentication
4. Test workflow execution

### Phase 4: End-to-End Testing

1. Create test content in Drupal
2. Verify agent triggers
3. Check Symphony workflow execution
4. Validate response handling

---

## Best Practices

### Message Design

- Use standardized OSSA message envelopes
- Include trace IDs for observability
- Validate message schemas before sending
- Handle errors gracefully

### Security

- Use bearer token authentication
- Validate message signatures
- Encrypt sensitive data in transit
- Implement rate limiting

### Performance

- Use async messaging where possible
- Implement message queuing
- Cache frequently accessed data
- Monitor agent response times

### Observability

- Log all agent interactions
- Track message flow through Symphony
- Monitor workflow execution times
- Alert on failures

---

## Examples

### Example 1: Simple Content Processing

```yaml
# content-processor.ossa.yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: content-processor
spec:
  capabilities:
    - name: process-content
      input:
        type: object
        properties:
          node_id:
            type: integer
          action:
            type: string
      output:
        type: object
        properties:
          status:
            type: string
          result:
            type: object
  
  messaging:
    channels:
      - name: symphony
        type: a2a
        endpoint: symphony://workflow/process-content
```

### Example 2: Drupal Hook Integration

```php
// ai_agents_ossa.module
function ai_agents_ossa_node_presave(NodeInterface $node) {
  if ($node->bundle() === 'article') {
    $agent = \Drupal::service('ossa.agent.manager')
      ->getAgent('content-processor');
    
    $agent->invoke([
      'node_id' => $node->id(),
      'action' => 'validate_and_enhance'
    ]);
  }
}
```

---

## Research Findings

### OSSA v0.3.0 Capabilities

- **A2A Messaging**: Standardized agent-to-agent communication
- **Message Routing**: Built-in message routing and delivery
- **Observability**: Integrated tracing and metrics
- **Security**: Authentication and encryption support

### Symphony Integration Points

- HTTP API triggers
- Webhook callbacks
- Message queue integration
- Workflow state management

### Drupal Module Features

- Agent registration and management
- Hook integration for events
- Drush commands for agent operations
- UI for agent configuration

---

## Next Steps

1. **Complete Research** ✅ (This document)
2. **Create Implementation Plan**
3. **Build Example Agents**
4. **Develop Integration Code**
5. **Write Comprehensive Documentation**
6. **Create Interactive Examples**

---

## Related Documentation

- [OSSA Specification](/docs/specification)
- [Drupal Integration](/docs/integrations/drupal)
- [Agent Messaging](/docs/architecture/multi-agent-systems)
- [Migration Guide: Drupal ECA to OSSA](/docs/migration-guides/drupal-eca-to-ossa)

---

## References

- OSSA v0.3.0 Specification: https://openstandardagents.org
- Symphony Documentation: [Link to Symphony docs]
- Drupal OSSA Module: [Link to module]
