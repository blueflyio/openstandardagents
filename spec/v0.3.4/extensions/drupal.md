# Drupal Extension for OSSA v0.3.3

## Overview

The `extensions.drupal` schema formalizes Drupal-specific runtime bindings, permission systems, and async processing via Symfony Messenger.

## Schema Definition

```yaml
extensions:
  drupal:
    type: object
    properties:
      module:
        type: string
        description: "Drupal module providing this agent"
        example: "ai_agents_ossa"

      config_entity:
        type: boolean
        description: "Store agent configuration as Drupal config entity for export/import"
        default: true

      permissions:
        type: object
        description: "Permission configuration for autonomous and user-context agent execution"
        properties:
          entity_permissions:
            type: array
            items: { type: string }
            description: "Drupal core entity permissions (create content, edit own content, etc.)"
            examples:
              - "create article content"
              - "edit any page content"
              - "delete own blog content"

          custom_permissions:
            type: array
            items: { type: string }
            description: "Module-specific custom permissions"
            examples:
              - "execute content writer agent"
              - "approve ai generated content"

          execution_user:
            type: string
            description: "Service account UID for autonomous background execution"
            examples:
              - "1"  # admin
              - "agent_executor"  # service account name

          permission_mode:
            enum: [least_permissive, most_permissive, user_only, agent_only]
            description: "How to merge user + agent permissions when agent runs in user context"
            default: "least_permissive"

      messenger:
        type: object
        description: "Symfony Messenger integration for async agent execution"
        properties:
          transport:
            enum: [redis, amqp, doctrine, sync]
            description: "Message transport backend"
            default: "doctrine"

          queue:
            type: string
            description: "Queue name for agent messages"
            default: "agents_default"

          retry_strategy:
            type: object
            description: "Message retry configuration"
            properties:
              max_retries:
                type: integer
                description: "Maximum retry attempts"
                default: 3

              delay:
                type: integer
                description: "Initial delay in milliseconds"
                default: 1000

              multiplier:
                type: number
                description: "Backoff multiplier for exponential retry"
                default: 2

              max_delay:
                type: integer
                description: "Maximum delay cap in milliseconds"
                default: 10000

      workflow_engine:
        enum: [flowdrop, eca, custom]
        description: "Visual workflow integration engine"
        examples:
          - "eca"  # Events-Conditions-Actions module
          - "flowdrop"  # FlowDrop visual builder

      discovery_paths:
        type: array
        items: { type: string }
        description: "Paths where Drupal should discover agent manifests"
        default: ["config/agents", "agents"]
        examples:
          - "config/agents/*.ossa.yaml"
          - "modules/custom/*/agents/*.ossa.yaml"
          - "profiles/custom/*/agents/*.ossa.yaml"

      hooks:
        type: object
        description: "Drupal hook integration points"
        properties:
          before_execute:
            type: string
            description: "Hook name called before agent execution"

          after_execute:
            type: string
            description: "Hook name called after agent execution"

          on_error:
            type: string
            description: "Hook name called on agent error"
```

## Use Cases

### 1. Background Content Generation Agent

An agent that generates content autonomously without user context:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: content-writer
  version: 1.0.0

spec:
  # ... agent spec ...

extensions:
  drupal:
    module: ai_agents_ossa
    config_entity: true
    permissions:
      entity_permissions:
        - "create article content"
        - "create page content"
      execution_user: "1"  # Run as admin
      permission_mode: agent_only
    messenger:
      transport: redis
      queue: content_generation
      retry_strategy:
        max_retries: 3
        delay: 1000
        multiplier: 2
    discovery_paths:
      - "config/agents/*.ossa.yaml"
```

### 2. User-Context Content Review Agent

An agent that reviews user-submitted content with merged permissions:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: content-reviewer
  version: 1.0.0

spec:
  # ... agent spec ...

extensions:
  drupal:
    module: ai_agents_ossa
    permissions:
      entity_permissions:
        - "view any article content"
        - "edit any article content"
      custom_permissions:
        - "approve ai content review"
      permission_mode: least_permissive  # User must have all permissions
    workflow_engine: eca
```

### 3. Visual Workflow Integration with ECA

An agent integrated into ECA (Events-Conditions-Actions) module:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: moderation-assistant
  version: 1.0.0

spec:
  # ... agent spec ...

extensions:
  drupal:
    module: ai_agents_ossa
    workflow_engine: eca
    permissions:
      entity_permissions:
        - "use editorial transition review"
        - "use editorial transition publish"
      permission_mode: user_only  # Respect user permissions
    hooks:
      before_execute: ai_agents_ossa_moderation_before
      after_execute: ai_agents_ossa_moderation_after
      on_error: ai_agents_ossa_moderation_error
```

### 4. Multi-Site Discovery

An agent that can be discovered across multiple Drupal subsites:

```yaml
extensions:
  drupal:
    module: ai_agents_ossa
    discovery_paths:
      - "config/agents/*.ossa.yaml"
      - "modules/custom/*/agents/*.ossa.yaml"
      - "profiles/custom/*/agents/*.ossa.yaml"
      - "sites/*/agents/*.ossa.yaml"
```

## Permission Modes

### `least_permissive` (default)

User must have **all** permissions that the agent requires:

```
effective_permissions = user_permissions ∩ agent_permissions
```

Example: Agent requires `create article`, `edit article`. User must have both.

### `most_permissive`

User gets **union** of user and agent permissions:

```
effective_permissions = user_permissions ∪ agent_permissions
```

Example: Agent has `create article`, user has `edit article`. Execution gets both.

### `user_only`

Only user's permissions are used:

```
effective_permissions = user_permissions
```

Example: Agent is an assistant, doesn't grant extra privileges.

### `agent_only`

Only agent's permissions are used (service account):

```
effective_permissions = agent_permissions
```

Example: Autonomous background agent ignores user context.

## Messenger Integration

### Transport Options

#### `redis`
- High performance
- Requires Redis server
- Best for high-throughput async agents

#### `amqp`
- Enterprise message queue (RabbitMQ, etc.)
- Advanced routing and durability
- Best for multi-service architectures

#### `doctrine`
- Database-backed queue
- No external dependencies
- Best for simple deployments

#### `sync`
- Synchronous execution (no queue)
- Useful for development/testing

### Retry Strategy

Exponential backoff example:

```
Attempt 1: delay = 1000ms
Attempt 2: delay = 2000ms (1000 * 2)
Attempt 3: delay = 4000ms (2000 * 2)
Attempt 4: delay = 8000ms (4000 * 2)
Capped at max_delay: 10000ms
```

## Workflow Engine Integration

### ECA (Events-Conditions-Actions)

Integrate agents into Drupal's ECA visual workflow builder:

- **Events**: Trigger agent execution on Drupal events
- **Conditions**: Conditional agent invocation
- **Actions**: Agent as an action in workflows

### FlowDrop

Visual low-code agent orchestration:

- Drag-and-drop agent composition
- Real-time agent monitoring
- Visual debugging

## Discovery Paths

Agents can be discovered from multiple locations:

1. **Config directory**: `config/agents/*.ossa.yaml`
2. **Custom modules**: `modules/custom/*/agents/*.ossa.yaml`
3. **Profiles**: `profiles/custom/*/agents/*.ossa.yaml`
4. **Multi-site**: `sites/*/agents/*.ossa.yaml`

Discovery happens during:
- Module installation
- Configuration import
- Cache rebuild
- Manual discovery command

## Hooks

### Before Execute

Called before agent runs:

```php
function mymodule_ai_agents_ossa_before_execute($agent, $context) {
  // Log execution
  // Validate inputs
  // Load additional context
}
```

### After Execute

Called after successful agent execution:

```php
function mymodule_ai_agents_ossa_after_execute($agent, $result, $context) {
  // Save result to entity
  // Trigger follow-up actions
  // Update metrics
}
```

### On Error

Called when agent execution fails:

```php
function mymodule_ai_agents_ossa_on_error($agent, $error, $context) {
  // Log error
  // Send notification
  // Trigger fallback
}
```

## Config Entity Export

When `config_entity: true`, agents are stored as Drupal config entities:

```yaml
# config/agents/content_writer.agent.yml
uuid: 12345678-1234-1234-1234-123456789012
langcode: en
status: true
dependencies:
  module:
    - ai_agents_ossa
id: content_writer
label: Content Writer
manifest: |
  apiVersion: ossa/v0.3.3
  kind: Agent
  # ... full manifest ...
```

Benefits:
- **Exportable**: Via `drush config:export`
- **Versionable**: Track changes in git
- **Multi-site**: Deploy across environments
- **Translatable**: Multi-language support

## Related

- [Drupal AI Community Requirements](https://www.drupal.org/project/ai/issues/3560619)
- [ai_agents_ossa Module](https://gitlab.com/blueflyio/agent-platform/ai_agents_ossa)
- [Symfony Messenger Documentation](https://symfony.com/doc/current/messenger.html)
- [ECA Module](https://www.drupal.org/project/eca)
- [FlowDrop Integration](https://gitlab.com/blueflyio/agent-platform/flowdrop-drupal)
