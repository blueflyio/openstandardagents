---
title: "Drupal ECA to OSSA"
---

# Drupal ECA to OSSA Migration Guide

> **Comprehensive guide for converting Drupal ECA (Event-Condition-Action) rules to OSSA (Open Standard for Smart & Scalable Agents) agents**

## Table of Contents

1. [Overview](#overview)
2. [Conceptual Mapping](#conceptual-mapping)
3. [Architecture Comparison](#architecture-comparison)
4. [Migration Patterns](#migration-patterns)
5. [Example Migrations](#example-migrations)
6. [Integration Strategies](#integration-strategies)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Why Migrate from ECA to OSSA?

Drupal's ECA module provides powerful event-driven automation for site builders, but OSSA agents offer significant advantages for enterprise systems:

**ECA Strengths:**
- Visual BPMN-based workflow design
- Deep Drupal integration
- No-code/low-code approach
- Site builder friendly

**OSSA Advantages:**
- **Portability**: Framework-agnostic, works beyond Drupal
- **Scalability**: Distributed agent architecture with K8s/Docker support
- **Composability**: Multi-agent coordination and swarm orchestration
- **Observability**: Built-in tracing, metrics, and monitoring
- **AI-Native**: LLM integration for intelligent decision-making
- **Enterprise-Ready**: Compliance, security policies, and audit logging

### When to Migrate

Consider migrating when:
- Workflows extend beyond Drupal boundaries
- Need for distributed processing or microservices
- Require advanced orchestration (multi-agent, swarms)
- AI/LLM integration is desired
- Enterprise compliance standards must be met
- Scaling beyond single Drupal instance

---

## Conceptual Mapping

### ECA → OSSA Translation Matrix

| ECA Component | OSSA Equivalent | Mapping Notes |
|--------------|----------------|---------------|
| **Event** | Capability trigger + Integration endpoint | Events become API endpoints that agents listen to |
| **Condition** | Input schema validation + Policy constraints | Conditions are enforced via JSON Schema and policies |
| **Action** | Agent capability | Actions become agent capabilities with defined schemas |
| **Model** | Agent manifest | BPMN models become YAML/JSON agent definitions |
| **Plugin** | Agent dependency | Plugins become required/optional agent dependencies |
| **Token** | Context data | Tokens map to input/output data passed between capabilities |
| **State** | Monitoring + Integration state | Persistent state managed via monitoring and external stores |

### Key Differences

#### ECA: Sequential Event Processing
```
Event → Condition Check → Action Execution
```

#### OSSA: Capability-Based Agent Response
```
Trigger (HTTP/gRPC) → Agent Capability → Schema Validation → Policy Check → Execute → Monitor
```

---

## Architecture Comparison

### ECA Architecture (Drupal-Centric)

```
┌─────────────────────────────────────┐
│         Drupal Event System         │
│  (hook_entity_presave, form_submit) │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│          ECA Event Listener         │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│        Condition Evaluation         │
│  (Field comparison, role check)     │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│          Action Execution           │
│  (Save entity, send email)          │
└─────────────────────────────────────┘
```

### OSSA Architecture (Distributed)

```
┌─────────────────────────────────────┐
│      External Trigger Sources       │
│  (Drupal hooks, API calls, events)  │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│     OSSA Agent Integration Layer    │
│        (HTTP/gRPC endpoints)        │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│        Agent Capabilities           │
│  + Input Schema Validation          │
│  + Policy Enforcement               │
│  + LLM Processing (optional)        │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│      Monitoring & Observability     │
│  (Traces, metrics, health checks)   │
└─────────────────────────────────────┘
```

---

## Migration Patterns

### Pattern 1: ECA Events → OSSA Triggers

**ECA Event:**
```yaml
# ECA Model (conceptual)
events:
  - event: entity:presave:node:article
    bundle: article
```

**OSSA Agent (Webhook Integration):**
```yaml
ossaVersion: '1.0'
agent:
  id: drupal-content-handler
  name: Drupal Content Handler Agent
  version: 1.0.0
  role: integration

  capabilities:
    - name: handle_article_presave
      description: Process article before saving
      input_schema:
        type: object
        required: [entity_type, entity_id, bundle, field_data]
        properties:
          entity_type:
            type: string
            const: node
          entity_id:
            type: integer
          bundle:
            type: string
            const: article
          field_data:
            type: object

  integration:
    protocol: http
    endpoints:
      base_url: http://content-handler:3000
      webhook: /api/v1/drupal/presave
    auth:
      type: api_key
```

**Drupal Integration Code:**
```php
/**
 * Implements hook_entity_presave().
 */
function mymodule_entity_presave(EntityInterface $entity) {
  if ($entity->getEntityTypeId() === 'node' && $entity->bundle() === 'article') {
    $client = \Drupal::httpClient();
    $response = $client->post('http://content-handler:3000/api/v1/drupal/presave', [
      'json' => [
        'entity_type' => 'node',
        'entity_id' => $entity->id(),
        'bundle' => 'article',
        'field_data' => $entity->toArray(),
      ],
      'headers' => [
        'Authorization' => 'Bearer ' . getenv('OSSA_API_KEY'),
      ],
    ]);
  }
}
```

### Pattern 2: ECA Conditions → OSSA Schema Validation & Policies

**ECA Condition:**
```yaml
# ECA Model
conditions:
  - plugin: entity_field_value_compare
    field: field_status
    operator: equals
    value: published
  - plugin: user_has_role
    role: editor
```

**OSSA Agent (Schema + Policy Enforcement):**
```yaml
ossaVersion: '1.0'
agent:
  id: content-moderator
  name: Content Moderation Agent
  version: 1.0.0

  capabilities:
    - name: moderate_content
      description: Moderate content with role-based validation
      input_schema:
        type: object
        required: [field_status, user_roles]
        properties:
          field_status:
            type: string
            enum: [draft, published, archived]
          user_roles:
            type: array
            items:
              type: string
            contains:
              const: editor  # Enforces editor role requirement
          content:
            type: object
      output_schema:
        type: object
        properties:
          approved:
            type: boolean
          message:
            type: string

  policies:
    compliance:
      - content-moderation
    authorization_required: true
    role_validation:
      required_roles: [editor]
```

### Pattern 3: ECA Actions → OSSA Capabilities

**ECA Action:**
```yaml
# ECA Model
actions:
  - plugin: entity:save
    entity: node
  - plugin: eca_tamper:change_case
    field: title
    case: uppercase
  - plugin: eca_email:send
    to: "admin@example.com"
    subject: "Content updated"
```

**OSSA Agent (Multi-Capability):**
```yaml
ossaVersion: '1.0'
agent:
  id: content-processor
  name: Content Processing Agent
  version: 1.0.0
  role: data_processing

  capabilities:
    - name: transform_content
      description: Transform content fields
      input_schema:
        type: object
        properties:
          title:
            type: string
          body:
            type: string
          transformations:
            type: array
            items:
              type: object
              properties:
                field:
                  type: string
                operation:
                  type: string
                  enum: [uppercase, lowercase, trim]
      output_schema:
        type: object
        properties:
          transformed_data:
            type: object

    - name: save_to_drupal
      description: Save content back to Drupal
      input_schema:
        type: object
        required: [entity_type, entity_id, data]
        properties:
          entity_type:
            type: string
          entity_id:
            type: integer
          data:
            type: object
      output_schema:
        type: object
        properties:
          saved:
            type: boolean
          entity_id:
            type: integer

    - name: send_notification
      description: Send email notification
      input_schema:
        type: object
        required: [to, subject, body]
        properties:
          to:
            type: string
            format: email
          subject:
            type: string
          body:
            type: string
      output_schema:
        type: object
        properties:
          sent:
            type: boolean
```

### Pattern 4: Drupal Hooks → OSSA Runtime Integration

**Drupal Hook Integration Module:**

```php
<?php
/**
 * @file
 * OSSA Integration module for Drupal.
 */

namespace Drupal\ossa_integration;

use Drupal\Core\Entity\EntityInterface;
use GuzzleHttp\ClientInterface;

/**
 * Service for OSSA agent communication.
 */
class OssaAgentService {

  protected ClientInterface $httpClient;
  protected string $baseUrl;
  protected string $apiKey;

  public function __construct(ClientInterface $httpClient) {
    $this->httpClient = $httpClient;
    $this->baseUrl = getenv('OSSA_BASE_URL') ?: 'http://ossa-gateway:8080';
    $this->apiKey = getenv('OSSA_API_KEY');
  }

  /**
   * Trigger OSSA agent capability.
   */
  public function triggerCapability(string $agentId, string $capability, array $input): array {
    $url = "{$this->baseUrl}/api/v1/agents/{$agentId}/capabilities/{$capability}";

    $response = $this->httpClient->post($url, [
      'json' => $input,
      'headers' => [
        'Authorization' => "Bearer {$this->apiKey}",
        'Content-Type' => 'application/json',
      ],
    ]);

    return json_decode($response->getBody()->getContents(), TRUE);
  }

  /**
   * Handle entity presave events.
   */
  public function handleEntityPresave(EntityInterface $entity): void {
    $data = [
      'entity_type' => $entity->getEntityTypeId(),
      'entity_id' => $entity->id(),
      'bundle' => $entity->bundle(),
      'field_data' => $this->serializeEntity($entity),
      'langcode' => $entity->language()->getId(),
    ];

    $this->triggerCapability('drupal-content-handler', 'handle_entity_presave', $data);
  }

  /**
   * Serialize entity for OSSA agents.
   */
  protected function serializeEntity(EntityInterface $entity): array {
    $data = [];
    foreach ($entity->getFields() as $field_name => $field) {
      $data[$field_name] = $field->getValue();
    }
    return $data;
  }
}
```

**Hook Implementation:**

```php
/**
 * Implements hook_entity_presave().
 */
function ossa_integration_entity_presave(EntityInterface $entity) {
  /** @var \Drupal\ossa_integration\OssaAgentService $ossaService */
  $ossaService = \Drupal::service('ossa_integration.agent_service');
  $ossaService->handleEntityPresave($entity);
}

/**
 * Implements hook_user_login().
 */
function ossa_integration_user_login($account) {
  $ossaService = \Drupal::service('ossa_integration.agent_service');
  $ossaService->triggerCapability('user-activity-tracker', 'track_login', [
    'user_id' => $account->id(),
    'username' => $account->getAccountName(),
    'timestamp' => time(),
    'ip_address' => \Drupal::request()->getClientIp(),
  ]);
}
```

### Pattern 5: Content Workflows → OSSA Orchestration

**ECA Workflow (Content Moderation):**
```yaml
# ECA BPMN Model (simplified)
workflow:
  start: content_created
  steps:
    - check_content_quality
    - assign_to_editor
    - wait_for_approval
    - publish_content
    - notify_stakeholders
```

**OSSA Orchestrator Agent:**
```yaml
ossaVersion: '1.0'
agent:
  id: content-workflow-orchestrator
  name: Content Workflow Orchestrator
  version: 1.0.0
  role: orchestration

  runtime:
    type: k8s
    resources:
      cpu: '1000m'
      memory: '1Gi'

  capabilities:
    - name: execute_content_workflow
      description: Execute multi-step content moderation workflow
      input_schema:
        type: object
        required: [content_id, workflow_type]
        properties:
          content_id:
            type: integer
          workflow_type:
            type: string
            enum: [article, page, product]
          initial_data:
            type: object
      output_schema:
        type: object
        properties:
          execution_id:
            type: string
          status:
            type: string
            enum: [queued, running, completed, failed]
          steps_completed:
            type: array
            items:
              type: object
              properties:
                step_name:
                  type: string
                status:
                  type: string
                result:
                  type: object
      timeout_seconds: 3600

  dependencies:
    required:
      - agent_id: content-quality-checker
        min_version: '1.0.0'
      - agent_id: editor-assignment-agent
        min_version: '1.0.0'
      - agent_id: notification-service
        min_version: '1.0.0'
    optional:
      - agent_id: ai-content-analyzer
        fallback: Skip AI analysis
```

**Workflow Definition (Separate Config):**

```yaml
# content-moderation-workflow.yaml
workflow:
  name: content_moderation
  version: 1.0.0

  steps:
    - id: quality_check
      agent_id: content-quality-checker
      capability: analyze_content
      input:
        content: "{{initial_data.body}}"
        criteria: [grammar, readability, seo]
      depends_on: []

    - id: ai_enhancement
      agent_id: ai-content-analyzer
      capability: suggest_improvements
      input:
        content: "{{steps.quality_check.result.content}}"
        quality_score: "{{steps.quality_check.result.score}}"
      depends_on: [quality_check]
      optional: true

    - id: assign_editor
      agent_id: editor-assignment-agent
      capability: assign_to_editor
      input:
        content_type: "{{workflow_type}}"
        complexity: "{{steps.quality_check.result.complexity}}"
      depends_on: [quality_check]

    - id: notify_editor
      agent_id: notification-service
      capability: send_notification
      input:
        recipient: "{{steps.assign_editor.result.editor_email}}"
        template: editor_assignment
        data:
          content_id: "{{content_id}}"
          content_title: "{{initial_data.title}}"
      depends_on: [assign_editor]

    - id: await_approval
      agent_id: approval-workflow-agent
      capability: wait_for_approval
      input:
        content_id: "{{content_id}}"
        approver: "{{steps.assign_editor.result.editor_id}}"
        timeout_hours: 48
      depends_on: [notify_editor]

    - id: publish_content
      agent_id: drupal-content-handler
      capability: publish_content
      input:
        content_id: "{{content_id}}"
        approval_data: "{{steps.await_approval.result}}"
      depends_on: [await_approval]
      condition: "{{steps.await_approval.result.approved == true}}"

    - id: notify_stakeholders
      agent_id: notification-service
      capability: send_bulk_notification
      input:
        recipients: "{{initial_data.stakeholders}}"
        template: content_published
        data:
          content_id: "{{content_id}}"
          url: "{{steps.publish_content.result.url}}"
      depends_on: [publish_content]
```

---

## Example Migrations

### Example 1: Content Moderation Workflow

#### ECA Configuration (Before)

```yaml
# ECA Model: article_moderation.eca.yml
langcode: en
status: true
label: 'Article Moderation Workflow'
id: article_moderation
modeller: core
version: 1.0.0

events:
  event_1:
    plugin: 'entity:presave:node:article'
    configuration:
      bundle: article

conditions:
  condition_1:
    plugin: entity_field_value_compare
    configuration:
      field: moderation_state
      operator: equals
      value: needs_review

  condition_2:
    plugin: token_compare
    configuration:
      token: '[node:author:field_experience_level]'
      operator: less_than
      value: 'senior'

actions:
  action_1:
    plugin: 'eca_content:flag_for_review'
    configuration:
      reviewer_role: editor
      priority: normal

  action_2:
    plugin: 'eca_email:send'
    configuration:
      to: '[site:editor-email]'
      subject: 'New article needs review'
      body: 'Article "[node:title]" by [node:author] needs editorial review.'

  action_3:
    plugin: 'entity:save'
    configuration:
      entity: node
```

#### OSSA Agent (After)

```yaml
# drupal-content-moderator.ossa.yaml
ossaVersion: '1.0'

agent:
  id: drupal-content-moderator
  name: Drupal Content Moderation Agent
  version: 1.0.0
  description: |
    Content moderation agent for Drupal articles.
    Handles review assignment, notifications, and workflow state management.
  role: workflow
  tags:
    - drupal
    - content-moderation
    - workflow
    - article-review

  runtime:
    type: docker
    image: ossa/drupal-moderator:1.0.0
    requirements:
      node: '>=20.0.0'
      packages:
        - '@drupal/node-sdk'
        - nodemailer
    resources:
      cpu: '500m'
      memory: '512Mi'
    health_check:
      type: http
      endpoint: /health
      port: 3200

  capabilities:
    - name: moderate_article_presave
      description: Process article moderation before save
      input_schema:
        type: object
        required:
          - entity_id
          - moderation_state
          - author_experience_level
          - title
          - author_name
        properties:
          entity_id:
            type: integer
          moderation_state:
            type: string
            enum: [draft, needs_review, published, archived]
          author_experience_level:
            type: string
            enum: [junior, intermediate, senior]
          title:
            type: string
          author_name:
            type: string
          author_email:
            type: string
            format: email
      output_schema:
        type: object
        properties:
          requires_review:
            type: boolean
          assigned_reviewer:
            type: string
          notification_sent:
            type: boolean
          updated_state:
            type: string
      timeout_seconds: 30
      retry_policy:
        max_attempts: 3
        backoff: exponential

    - name: assign_reviewer
      description: Assign article to appropriate reviewer
      input_schema:
        type: object
        required: [article_id, priority]
        properties:
          article_id:
            type: integer
          priority:
            type: string
            enum: [low, normal, high, urgent]
          required_role:
            type: string
            default: editor
      output_schema:
        type: object
        properties:
          reviewer_id:
            type: integer
          reviewer_email:
            type: string
          assignment_id:
            type: string

    - name: send_review_notification
      description: Send email notification to reviewer
      input_schema:
        type: object
        required: [recipient, article_title, author_name]
        properties:
          recipient:
            type: string
            format: email
          article_title:
            type: string
          author_name:
            type: string
          article_url:
            type: string
            format: uri
      output_schema:
        type: object
        properties:
          sent:
            type: boolean
          message_id:
            type: string

  policies:
    compliance:
      - content-moderation-policy
    data_residency: [US]
    encryption: true
    audit: true
    pii_handling: encrypt

  integration:
    protocol: http
    endpoints:
      base_url: http://drupal-moderator:3200
      health: /health
      metrics: /metrics
      webhook: /api/v1/drupal/moderate
    auth:
      type: api_key
      config:
        header: X-API-Key
    rate_limits:
      requests_per_second: 50
      burst: 20

  monitoring:
    traces: true
    metrics: true
    logs: true
    health_check: http://localhost:3200/health
    phoenix_arise:
      enabled: true
      project: drupal-moderation
      export_interval_seconds: 30

  dependencies:
    required:
      - agent_id: notification-service
        min_version: '1.0.0'
    optional:
      - agent_id: ai-content-analyzer
        fallback: Skip AI analysis

  metadata:
    author: LLM Platform Team
    maintainer: team@example.com
    license: Apache-2.0
    documentation: https://docs.example.com/agents/drupal-moderator
    keywords:
      - drupal
      - moderation
      - content
      - workflow
```

**Drupal Integration:**

```php
<?php
/**
 * Implements hook_entity_presave().
 */
function ossa_drupal_entity_presave(EntityInterface $entity) {
  if ($entity->getEntityTypeId() !== 'node' || $entity->bundle() !== 'article') {
    return;
  }

  /** @var \Drupal\ossa_integration\OssaAgentService $ossaService */
  $ossaService = \Drupal::service('ossa_integration.agent_service');

  $author = $entity->getOwner();
  $experience_level = $author->get('field_experience_level')->value ?? 'junior';

  $result = $ossaService->triggerCapability(
    'drupal-content-moderator',
    'moderate_article_presave',
    [
      'entity_id' => $entity->id(),
      'moderation_state' => $entity->get('moderation_state')->value,
      'author_experience_level' => $experience_level,
      'title' => $entity->getTitle(),
      'author_name' => $author->getDisplayName(),
      'author_email' => $author->getEmail(),
    ]
  );

  // Update entity based on agent response
  if ($result['requires_review']) {
    $entity->set('moderation_state', $result['updated_state']);
    \Drupal::logger('ossa_drupal')->info(
      'Article @id assigned to reviewer @reviewer',
      [
        '@id' => $entity->id(),
        '@reviewer' => $result['assigned_reviewer'],
      ]
    );
  }
}
```

---

### Example 2: User Workflow (Registration & Onboarding)

#### ECA Configuration (Before)

```yaml
# ECA Model: user_onboarding.eca.yml
langcode: en
status: true
label: 'User Registration and Onboarding'
id: user_onboarding
modeller: core
version: 1.0.0

events:
  event_1:
    plugin: 'user:insert'

conditions:
  condition_1:
    plugin: user_role_compare
    configuration:
      role: authenticated

  condition_2:
    plugin: token_compare
    configuration:
      token: '[user:field_account_type]'
      operator: equals
      value: 'premium'

actions:
  action_1:
    plugin: 'eca_user:create_welcome_message'
    configuration:
      message_type: welcome

  action_2:
    plugin: 'eca_email:send'
    configuration:
      to: '[user:mail]'
      subject: 'Welcome to [site:name]'
      body: 'Template: welcome_premium_user'

  action_3:
    plugin: 'eca_content:create_node'
    configuration:
      type: onboarding_task
      title: 'Complete your profile'
      owner: '[user:uid]'

  action_4:
    plugin: 'eca_user:assign_to_group'
    configuration:
      group: premium_members

  action_5:
    plugin: 'eca_state:set_value'
    configuration:
      key: 'onboarding_started_[user:uid]'
      value: '[current-date:timestamp]'
```

#### OSSA Agent (After)

```yaml
# user-onboarding-agent.ossa.yaml
ossaVersion: '1.0'

agent:
  id: user-onboarding-orchestrator
  name: User Onboarding Orchestration Agent
  version: 1.0.0
  description: |
    Manages user registration workflows, onboarding tasks,
    welcome messaging, and account setup automation.
  role: workflow
  tags:
    - user-management
    - onboarding
    - registration
    - drupal

  runtime:
    type: docker
    image: ossa/user-onboarding:1.0.0
    requirements:
      node: '>=20.0.0'
      packages:
        - '@drupal/user-api'
        - bull
        - ioredis
    resources:
      cpu: '500m'
      memory: '768Mi'

  capabilities:
    - name: handle_user_registration
      description: Orchestrate user registration and onboarding workflow
      input_schema:
        type: object
        required: [user_id, email, account_type, username]
        properties:
          user_id:
            type: integer
          email:
            type: string
            format: email
          username:
            type: string
          account_type:
            type: string
            enum: [free, premium, enterprise]
          roles:
            type: array
            items:
              type: string
          profile_data:
            type: object
      output_schema:
        type: object
        properties:
          onboarding_id:
            type: string
          tasks_created:
            type: array
            items:
              type: object
          welcome_sent:
            type: boolean
          group_assigned:
            type: boolean
      timeout_seconds: 120

    - name: create_welcome_message
      description: Create personalized welcome message
      input_schema:
        type: object
        required: [user_id, message_type, account_type]
        properties:
          user_id:
            type: integer
          message_type:
            type: string
            enum: [welcome, tutorial, premium_features]
          account_type:
            type: string
      output_schema:
        type: object
        properties:
          message_id:
            type: string
          content:
            type: string

    - name: create_onboarding_tasks
      description: Create personalized onboarding tasks
      input_schema:
        type: object
        required: [user_id, account_type]
        properties:
          user_id:
            type: integer
          account_type:
            type: string
          custom_tasks:
            type: array
            items:
              type: object
      output_schema:
        type: object
        properties:
          tasks:
            type: array
            items:
              type: object
              properties:
                task_id:
                  type: string
                title:
                  type: string
                status:
                  type: string

    - name: assign_to_group
      description: Assign user to appropriate groups
      input_schema:
        type: object
        required: [user_id, account_type]
        properties:
          user_id:
            type: integer
          account_type:
            type: string
          custom_groups:
            type: array
            items:
              type: string
      output_schema:
        type: object
        properties:
          groups_assigned:
            type: array
            items:
              type: string

  policies:
    compliance:
      - gdpr
      - ccpa
    data_residency: [US, EU]
    encryption: true
    audit: true
    pii_handling: encrypt

  integration:
    protocol: http
    endpoints:
      base_url: http://user-onboarding:3300
      health: /health
      webhook: /api/v1/users/register
    auth:
      type: jwt
      config:
        issuer: https://auth.example.com
        audience: user-onboarding

  monitoring:
    traces: true
    metrics: true
    logs: true
    health_check: http://localhost:3300/health

  dependencies:
    required:
      - agent_id: notification-service
        min_version: '1.0.0'
      - agent_id: drupal-content-handler
        min_version: '1.0.0'

  metadata:
    author: LLM Platform Team
    license: Apache-2.0
```

**Drupal Integration:**

```php
<?php
/**
 * Implements hook_user_insert().
 */
function ossa_drupal_user_insert(UserInterface $account) {
  /** @var \Drupal\ossa_integration\OssaAgentService $ossaService */
  $ossaService = \Drupal::service('ossa_integration.agent_service');

  $account_type = $account->get('field_account_type')->value ?? 'free';

  // Only trigger for premium accounts (condition mapping)
  if ($account_type !== 'premium') {
    return;
  }

  $result = $ossaService->triggerCapability(
    'user-onboarding-orchestrator',
    'handle_user_registration',
    [
      'user_id' => $account->id(),
      'email' => $account->getEmail(),
      'username' => $account->getAccountName(),
      'account_type' => $account_type,
      'roles' => array_values($account->getRoles()),
      'profile_data' => [
        'created' => $account->getCreatedTime(),
        'timezone' => $account->getTimeZone(),
      ],
    ]
  );

  // Store onboarding state
  \Drupal::state()->set(
    "onboarding_started_{$account->id()}",
    [
      'onboarding_id' => $result['onboarding_id'],
      'timestamp' => time(),
    ]
  );

  \Drupal::logger('ossa_drupal')->info(
    'User @username onboarding started: @id',
    [
      '@username' => $account->getAccountName(),
      '@id' => $result['onboarding_id'],
    ]
  );
}
```

---

### Example 3: Data Processing (Commerce Order)

#### ECA Configuration (Before)

```yaml
# ECA Model: order_processing.eca.yml
langcode: en
status: true
label: 'Commerce Order Processing'
id: order_processing
modeller: core
version: 1.0.0

events:
  event_1:
    plugin: 'commerce_order:paid'

conditions:
  condition_1:
    plugin: commerce_order_total_compare
    configuration:
      operator: greater_than
      value: 1000

  condition_2:
    plugin: commerce_order_contains_product_type
    configuration:
      product_type: subscription

actions:
  action_1:
    plugin: 'eca_commerce:update_order_status'
    configuration:
      status: processing

  action_2:
    plugin: 'eca_commerce:create_fulfillment_record'
    configuration:
      warehouse: primary
      priority: high

  action_3:
    plugin: 'eca_tamper:transform_data'
    configuration:
      source: order_items
      transformations:
        - extract_product_ids
        - calculate_shipping_weight
        - determine_warehouse_location

  action_4:
    plugin: 'eca_http:post_request'
    configuration:
      url: 'https://warehouse-api.example.com/fulfillment'
      method: POST
      body: '[transformed_data]'
      headers:
        Authorization: 'Bearer [warehouse_api_token]'

  action_5:
    plugin: 'eca_email:send'
    configuration:
      to: '[order:email]'
      subject: 'Order Confirmation - High Value Subscription'
      body: 'Template: order_confirmation_premium'

  action_6:
    plugin: 'eca_state:set_value'
    configuration:
      key: 'order_processed_[order:id]'
      value: '[current-date:timestamp]'
```

#### OSSA Agent (After)

```yaml
# commerce-order-processor.ossa.yaml
ossaVersion: '1.0'

agent:
  id: commerce-order-processor
  name: Commerce Order Processing Agent
  version: 1.0.0
  description: |
    Processes high-value commerce orders, handles fulfillment orchestration,
    data transformation, warehouse integration, and customer notifications.
  role: data_processing
  tags:
    - commerce
    - order-processing
    - fulfillment
    - etl

  runtime:
    type: k8s
    image: ossa/order-processor:1.0.0
    requirements:
      node: '>=20.0.0'
      packages:
        - bull
        - axios
        - lodash
    resources:
      cpu: '1000m'
      memory: '2Gi'
    health_check:
      type: http
      endpoint: /health
      port: 3400

  capabilities:
    - name: process_paid_order
      description: Main order processing workflow
      input_schema:
        type: object
        required: [order_id, total_price, order_items, customer_email]
        properties:
          order_id:
            type: integer
          total_price:
            type: number
            minimum: 0
          order_items:
            type: array
            items:
              type: object
              properties:
                product_id:
                  type: integer
                product_type:
                  type: string
                quantity:
                  type: integer
                weight:
                  type: number
          customer_email:
            type: string
            format: email
          shipping_address:
            type: object
      output_schema:
        type: object
        properties:
          processing_id:
            type: string
          fulfillment_id:
            type: string
          warehouse_assigned:
            type: string
          notification_sent:
            type: boolean
          status:
            type: string
      timeout_seconds: 300
      retry_policy:
        max_attempts: 5
        backoff: exponential

    - name: transform_order_data
      description: Transform order data for warehouse system
      input_schema:
        type: object
        required: [order_items, shipping_address]
        properties:
          order_items:
            type: array
          shipping_address:
            type: object
      output_schema:
        type: object
        properties:
          product_ids:
            type: array
            items:
              type: integer
          total_weight:
            type: number
          warehouse_location:
            type: string
          shipping_method:
            type: string
      timeout_seconds: 30

    - name: create_fulfillment_record
      description: Create fulfillment record in Drupal
      input_schema:
        type: object
        required: [order_id, warehouse, priority]
        properties:
          order_id:
            type: integer
          warehouse:
            type: string
            enum: [primary, secondary, regional]
          priority:
            type: string
            enum: [low, normal, high, urgent]
      output_schema:
        type: object
        properties:
          fulfillment_id:
            type: string
          estimated_ship_date:
            type: string
            format: date

    - name: submit_to_warehouse
      description: Submit fulfillment request to warehouse API
      input_schema:
        type: object
        required: [fulfillment_data, warehouse_endpoint]
        properties:
          fulfillment_data:
            type: object
          warehouse_endpoint:
            type: string
            format: uri
          api_token:
            type: string
      output_schema:
        type: object
        properties:
          warehouse_order_id:
            type: string
          status:
            type: string
          tracking_available:
            type: boolean
      timeout_seconds: 60

    - name: send_order_confirmation
      description: Send order confirmation email
      input_schema:
        type: object
        required: [customer_email, order_id, order_type]
        properties:
          customer_email:
            type: string
            format: email
          order_id:
            type: integer
          order_type:
            type: string
            enum: [standard, premium, subscription]
          order_details:
            type: object
      output_schema:
        type: object
        properties:
          sent:
            type: boolean
          message_id:
            type: string

  policies:
    compliance:
      - pci-dss
      - soc2-type2
    data_residency: [US]
    encryption: true
    audit: true
    pii_handling: encrypt

  integration:
    protocol: http
    endpoints:
      base_url: http://order-processor:3400
      health: /health
      metrics: /metrics
      webhook: /api/v1/orders/paid
    auth:
      type: api_key
    rate_limits:
      requests_per_second: 100
      burst: 50

  monitoring:
    traces: true
    metrics: true
    logs: true
    health_check: http://localhost:3400/health
    phoenix_arise:
      enabled: true
      project: commerce-orders
      export_interval_seconds: 30

  dependencies:
    required:
      - agent_id: notification-service
        min_version: '1.0.0'
      - agent_id: drupal-content-handler
        min_version: '1.0.0'
    optional:
      - agent_id: analytics-tracker
        fallback: Skip analytics

  metadata:
    author: LLM Platform Team
    license: Apache-2.0
```

**Drupal Integration:**

```php
<?php
/**
 * Implements hook_commerce_order_paid().
 */
function ossa_drupal_commerce_order_paid(OrderInterface $order) {
  /** @var \Drupal\ossa_integration\OssaAgentService $ossaService */
  $ossaService = \Drupal::service('ossa_integration.agent_service');

  $total = $order->getTotalPrice();
  $order_items = [];

  foreach ($order->getItems() as $item) {
    /** @var \Drupal\commerce_product\Entity\ProductVariationInterface $variation */
    $variation = $item->getPurchasedEntity();

    $order_items[] = [
      'product_id' => $variation->getProductId(),
      'product_type' => $variation->bundle(),
      'quantity' => (int) $item->getQuantity(),
      'weight' => $variation->hasField('field_weight')
        ? (float) $variation->get('field_weight')->value
        : 0,
    ];
  }

  // Condition: Only process orders > $1000 with subscription products
  $has_subscription = FALSE;
  foreach ($order_items as $item) {
    if ($item['product_type'] === 'subscription') {
      $has_subscription = TRUE;
      break;
    }
  }

  if ($total->getNumber() <= 1000 || !$has_subscription) {
    return;
  }

  $shipping_profile = $order->get('shipments')->entity->getShippingProfile();
  $address = $shipping_profile->get('address')->first();

  $result = $ossaService->triggerCapability(
    'commerce-order-processor',
    'process_paid_order',
    [
      'order_id' => $order->id(),
      'total_price' => (float) $total->getNumber(),
      'order_items' => $order_items,
      'customer_email' => $order->getEmail(),
      'shipping_address' => [
        'country_code' => $address->getCountryCode(),
        'postal_code' => $address->getPostalCode(),
        'locality' => $address->getLocality(),
        'address_line1' => $address->getAddressLine1(),
      ],
    ]
  );

  // Update order with processing info
  $order->setData('ossa_processing_id', $result['processing_id']);
  $order->setData('ossa_fulfillment_id', $result['fulfillment_id']);
  $order->save();

  // Store processing state
  \Drupal::state()->set(
    "order_processed_{$order->id()}",
    [
      'processing_id' => $result['processing_id'],
      'timestamp' => time(),
      'warehouse' => $result['warehouse_assigned'],
    ]
  );

  \Drupal::logger('ossa_drupal')->info(
    'Order @id processed by OSSA: @processing_id',
    [
      '@id' => $order->id(),
      '@processing_id' => $result['processing_id'],
    ]
  );
}
```

---

## Integration Strategies

### Strategy 1: Parallel Operation (Gradual Migration)

Run ECA and OSSA agents side-by-side during migration:

```php
/**
 * Parallel operation - ECA and OSSA both active.
 */
function mymodule_entity_presave(EntityInterface $entity) {
  // Existing ECA continues to work
  // OSSA agent also processes in parallel

  if (\Drupal::config('ossa_integration.settings')->get('parallel_mode')) {
    $ossaService = \Drupal::service('ossa_integration.agent_service');
    try {
      $ossaService->handleEntityPresave($entity);
    } catch (\Exception $e) {
      \Drupal::logger('ossa_integration')->error(
        'OSSA agent error: @message',
        ['@message' => $e->getMessage()]
      );
      // ECA continues working as fallback
    }
  }
}
```

### Strategy 2: Feature Flag Migration

Migrate specific workflows using feature flags:

```php
/**
 * Feature-flagged migration.
 */
function mymodule_entity_presave(EntityInterface $entity) {
  $features = \Drupal::service('feature_flags');

  if ($features->isEnabled('ossa_content_moderation')) {
    // Use OSSA agent
    $ossaService = \Drupal::service('ossa_integration.agent_service');
    $ossaService->triggerCapability('drupal-content-moderator', 'moderate_article_presave', $data);
  } else {
    // Use existing ECA workflow
    // ECA handles this automatically
  }
}
```

### Strategy 3: Webhook-Based Integration

Use webhooks for loose coupling:

```yaml
# OSSA agent with webhook
integration:
  protocol: http
  endpoints:
    base_url: http://ossa-gateway:8080
    webhook: /api/v1/drupal/events
  auth:
    type: api_key
```

```php
/**
 * Webhook integration.
 */
function mymodule_entity_presave(EntityInterface $entity) {
  $webhook_url = \Drupal::config('ossa_integration.settings')->get('webhook_url');

  $client = \Drupal::httpClient();
  $client->postAsync($webhook_url, [
    'json' => [
      'event' => 'entity.presave',
      'entity_type' => $entity->getEntityTypeId(),
      'entity_id' => $entity->id(),
      'data' => $entity->toArray(),
    ],
    'headers' => [
      'X-API-Key' => getenv('OSSA_API_KEY'),
    ],
  ]);
}
```

### Strategy 4: Event Queue Integration

Use message queues for asynchronous processing:

```yaml
# OSSA agent with queue consumer
runtime:
  type: k8s
  requirements:
    packages:
      - bull
      - ioredis
```

```php
/**
 * Queue-based integration.
 */
function mymodule_entity_presave(EntityInterface $entity) {
  /** @var \Drupal\Core\Queue\QueueFactory $queueFactory */
  $queueFactory = \Drupal::service('queue');
  $queue = $queueFactory->get('ossa_events');

  $queue->createItem([
    'agent_id' => 'drupal-content-moderator',
    'capability' => 'moderate_article_presave',
    'data' => [
      'entity_id' => $entity->id(),
      'entity_type' => $entity->getEntityTypeId(),
      'timestamp' => time(),
    ],
  ]);
}

/**
 * Implements hook_cron().
 */
function mymodule_cron() {
  $queue = \Drupal::queue('ossa_events');
  $ossaService = \Drupal::service('ossa_integration.agent_service');

  while ($item = $queue->claimItem()) {
    try {
      $ossaService->triggerCapability(
        $item->data['agent_id'],
        $item->data['capability'],
        $item->data['data']
      );
      $queue->deleteItem($item);
    } catch (\Exception $e) {
      $queue->releaseItem($item);
    }
  }
}
```

---

## Best Practices

### 1. Start Small
- Migrate simplest workflows first
- Validate each migration thoroughly
- Use parallel operation during transition

### 2. Maintain ECA as Fallback
- Keep ECA models active during migration
- Use try-catch blocks around OSSA calls
- Implement graceful degradation

### 3. Use Proper Error Handling

```php
try {
  $result = $ossaService->triggerCapability($agentId, $capability, $data);
} catch (RequestException $e) {
  \Drupal::logger('ossa')->error(
    'OSSA agent error: @message. Falling back to ECA.',
    ['@message' => $e->getMessage()]
  );
  // ECA continues automatically
  return;
} catch (\Exception $e) {
  // Handle other exceptions
}
```

### 4. Leverage OSSA Monitoring

```yaml
monitoring:
  traces: true
  metrics: true
  logs: true
  phoenix_arise:
    enabled: true
    project: drupal-integration
```

### 5. Document Data Mappings

Create a mapping document for each workflow:

```yaml
# workflow-mapping.yaml
eca_model: article_moderation.eca.yml
ossa_agent: drupal-content-moderator

mappings:
  events:
    - eca: entity:presave:node:article
      ossa: POST /api/v1/drupal/moderate
      hook: hook_entity_presave()

  conditions:
    - eca: entity_field_value_compare
      ossa: input_schema.properties.moderation_state.enum

  actions:
    - eca: eca_content:flag_for_review
      ossa: capability.moderate_article_presave
```

### 6. Test Thoroughly

```bash
# Test OSSA agent locally
docker run -p 3200:3200 ossa/drupal-moderator:1.0.0

# Validate manifest
ossa validate drupal-content-moderator.ossa.yaml

# Test capability
curl -X POST http://localhost:3200/api/v1/drupal/moderate \
  -H "X-API-Key: test-key" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": 123, "moderation_state": "needs_review"}'
```

### 7. Use BuildKit CLI

```bash
# Create OSSA agent from template
buildkit agents create drupal-moderator --type worker

# Validate agent
buildkit agents validate .agents/workers/drupal-moderator

# Deploy agent
buildkit golden deploy --env dev
```

---

## Troubleshooting

### Issue: OSSA Agent Not Responding

**Symptoms:**
- Drupal hook triggers but no agent response
- Timeout errors in logs

**Solutions:**

1. Check agent health:
```bash
curl http://drupal-moderator:3200/health
```

2. Verify network connectivity:
```bash
kubectl get pods -n ossa
kubectl logs deployment/drupal-moderator
```

3. Check API key:
```php
$api_key = getenv('OSSA_API_KEY');
if (empty($api_key)) {
  \Drupal::logger('ossa')->error('OSSA_API_KEY not set');
}
```

### Issue: Schema Validation Failures

**Symptoms:**
- 400 Bad Request errors
- "Invalid input schema" messages

**Solutions:**

1. Validate input data structure:
```php
$data = [
  'entity_id' => $entity->id(),
  'moderation_state' => $entity->get('moderation_state')->value,
  // Ensure all required fields present
];

\Drupal::logger('ossa')->debug('Sending data: @data', [
  '@data' => json_encode($data, JSON_PRETTY_PRINT),
]);
```

2. Test with minimal data:
```bash
curl -X POST http://localhost:3200/api/v1/drupal/moderate \
  -H "Content-Type: application/json" \
  -d '{"entity_id": 1, "moderation_state": "draft", "author_experience_level": "junior", "title": "Test", "author_name": "Test User"}'
```

### Issue: Performance Degradation

**Symptoms:**
- Slow entity saves
- Increased page load times

**Solutions:**

1. Use async/queue-based processing:
```php
// Don't wait for OSSA response
$client->postAsync($url, ['json' => $data]);
```

2. Add caching:
```yaml
# In OSSA agent
monitoring:
  cache:
    enabled: true
    ttl: 300
```

3. Optimize agent resources:
```yaml
runtime:
  resources:
    cpu: '2000m'
    memory: '2Gi'
```

### Issue: ECA and OSSA Conflicts

**Symptoms:**
- Duplicate actions
- Race conditions

**Solutions:**

1. Disable ECA model:
```bash
drush eca:disable article_moderation
```

2. Use conditional logic:
```php
if ($features->isEnabled('ossa_moderation')) {
  // OSSA only
  return;
}
// ECA continues
```

---

## Additional Resources

### Documentation
- [OSSA Specification](https://github.com/blueflyio/openstandardagents/wiki/home)
- [Drupal ECA Guide](https://ecaguide.org/)
- [BuildKit CLI Reference](https://github.com/blueflyio/openstandardagents/wiki/BuildKit-CLI-Reference)

### Tools
- OSSA CLI: `npm install -g @ossa/cli`
- BuildKit: `npm install -g @llm/agent-buildkit`
- OSSA Validator: `ossa validate <file>`

### Examples
- [OSSA Example Agents](https://github.com/blueflyio/openstandardagents/tree/main/examples)
- [Drupal Integration Module](https://github.com/blueflyio/openstandardagents)

### Support
- [GitLab Issues](https://github.com/blueflyio/openstandardagents/issues)
- [OSSA Discussions](https://github.com/blueflyio/openstandardagents/issues)

---

## Migration Checklist

### Pre-Migration
- [ ] Inventory all ECA models
- [ ] Document event/condition/action mappings
- [ ] Identify external dependencies
- [ ] Review Drupal hook usage
- [ ] Plan rollback strategy

### Agent Development
- [ ] Create OSSA agent manifests
- [ ] Define capabilities with schemas
- [ ] Map ECA conditions to schema validations
- [ ] Map ECA actions to agent capabilities
- [ ] Add monitoring and observability
- [ ] Configure policies and compliance

### Integration
- [ ] Implement Drupal integration module
- [ ] Create hook implementations
- [ ] Add OSSA service class
- [ ] Configure API authentication
- [ ] Implement error handling
- [ ] Add logging

### Testing
- [ ] Validate OSSA manifests
- [ ] Test agents locally
- [ ] Test Drupal integration
- [ ] Performance testing
- [ ] Load testing
- [ ] Integration testing

### Deployment
- [ ] Deploy OSSA agents to environment
- [ ] Configure environment variables
- [ ] Enable feature flags
- [ ] Monitor agent health
- [ ] Monitor Drupal logs
- [ ] Validate workflows

### Post-Migration
- [ ] Compare ECA vs OSSA behavior
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Disable ECA models (after validation)
- [ ] Update documentation
- [ ] Train team on OSSA

---

**Version:** 1.0.0
**Last Updated:** 2025-11-10
**Maintainer:** LLM Platform Team
**License:** Apache-2.0
