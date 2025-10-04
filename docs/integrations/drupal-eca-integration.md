# Drupal ECA Integration with OSSA Knowledge Graph

Integrate OSSA agent workflows with Drupal using the ECA (Event-Condition-Action) module.

## Overview

The ECA module enables visual, rule-based orchestration in Drupal. Combine it with OSSA to:

- **Trigger agent workflows** from Drupal events (node updates, form submissions, cron)
- **Query knowledge graphs** for agent discovery and routing
- **Execute AI workflows** based on content changes
- **Track agent performance** with Drupal logging

## Prerequisites

- Drupal 9.5+ or Drupal 10+
- ECA module (`composer require drupal/eca`)
- OSSA server running and accessible
- HTTP client for API calls

## Architecture

```
┌────────────────┐
│  Drupal Event  │
│  (node update) │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│   ECA Module   │
│  (conditions)  │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  HTTP Request  │
│  to OSSA API   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ OSSA Agents    │
│ Execute Tasks  │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Return Results │
│ to Drupal      │
└────────────────┘
```

## Installation

### 1. Install ECA Module

```bash
composer require drupal/eca
drush en eca eca_base eca_content -y
```

### 2. Configure OSSA API Endpoint

Add to `settings.php`:

```php
// OSSA API Configuration
$settings['ossa_api_url'] = 'http://localhost:3000/api/v1';
$settings['ossa_api_key'] = getenv('OSSA_API_KEY');
$settings['ossa_phoenix_url'] = 'http://localhost:6006';
```

### 3. Create Custom Module (Optional)

For advanced integration, create `ossa_integration` module:

```bash
drush generate module
# Name: OSSA Integration
# Machine name: ossa_integration
```

## ECA Model Examples

### Example 1: Rebuild Graph on Content Update

**Use Case**: Automatically rebuild knowledge graph when agent configuration is updated.

**ECA Model YAML**:

```yaml
uuid: ossa-rebuild-graph
label: 'OSSA: Rebuild Knowledge Graph on Agent Update'
version: '1.0'
status: true

events:
  entity_update_node:
    id: entity_update
    entity_type: node
    bundle: agent_config

conditions:
  check_content_type:
    id: node_is_of_bundle
    bundle: agent_config
    negate: false

actions:
  http_rebuild_graph:
    id: http_client_request
    method: POST
    url: '{{ settings.ossa_api_url }}/knowledge-graph/rebuild'
    headers:
      Authorization: 'Bearer {{ settings.ossa_api_key }}'
      Content-Type: 'application/json'
    body: |
      {
        "reason": "agent_config_updated",
        "node_id": "{{ node.id }}",
        "title": "{{ node.title }}"
      }

  log_rebuild:
    id: system_logger
    level: notice
    message: 'Knowledge graph rebuild triggered by node {{ node.id }}'
```

### Example 2: Query Agent for Content Analysis

**Use Case**: When analysis content is created, send it to AI agent for processing.

**ECA Model YAML**:

```yaml
uuid: ossa-content-analysis
label: 'OSSA: AI Content Analysis'
version: '1.0'
status: true

events:
  entity_insert_node:
    id: entity_insert
    entity_type: node
    bundle: analysis

conditions:
  check_published:
    id: entity_field_value_check
    field: status
    value: 1

actions:
  query_knowledge_graph:
    id: http_client_request
    method: GET
    url: '{{ settings.ossa_api_url }}/agents/search'
    query_params:
      capability: content-analysis
      domain: text-processing

  execute_agent_task:
    id: http_client_request
    method: POST
    url: '{{ settings.ossa_api_url }}/agents/execute'
    headers:
      Authorization: 'Bearer {{ settings.ossa_api_key }}'
    body: |
      {
        "agent_id": "{{ query_knowledge_graph.response.agents[0].id }}",
        "task": {
          "type": "analyze_content",
          "input": {
            "title": "{{ node.title }}",
            "body": "{{ node.body.value }}",
            "created": "{{ node.created }}"
          }
        }
      }

  store_results:
    id: entity_set_field_value
    entity: node
    field: field_ai_analysis
    value: '{{ execute_agent_task.response.result }}'

  save_node:
    id: entity_save
    entity: node
```

### Example 3: Form Submission Workflow

**Use Case**: Process form submissions through agent workflow.

**ECA Model YAML**:

```yaml
uuid: ossa-form-processing
label: 'OSSA: Process Contact Form with AI Agent'
version: '1.0'
status: true

events:
  webform_submit:
    id: webform_submission_insert
    webform_id: contact

actions:
  classify_submission:
    id: http_client_request
    method: POST
    url: '{{ settings.ossa_api_url }}/agents/classify'
    body: |
      {
        "text": "{{ webform_submission.data.message }}",
        "categories": ["support", "sales", "feedback"]
      }

  route_to_department:
    id: condition_switch
    switch_value: '{{ classify_submission.response.category }}'
    cases:
      support:
        - id: email_send
          to: support@example.com
          subject: 'Support Request: {{ webform_submission.data.subject }}'
      sales:
        - id: email_send
          to: sales@example.com
          subject: 'Sales Inquiry: {{ webform_submission.data.subject }}'
      feedback:
        - id: email_send
          to: feedback@example.com
          subject: 'Customer Feedback: {{ webform_submission.data.subject }}'
```

### Example 4: Scheduled Graph Updates

**Use Case**: Rebuild knowledge graph on schedule.

**ECA Model YAML**:

```yaml
uuid: ossa-scheduled-rebuild
label: 'OSSA: Scheduled Knowledge Graph Rebuild'
version: '1.0'
status: true

events:
  cron_run:
    id: eca_base_cron
    cron_interval: '0 2 * * *'  # Daily at 2 AM

actions:
  rebuild_graph:
    id: http_client_request
    method: POST
    url: '{{ settings.ossa_api_url }}/knowledge-graph/rebuild'
    headers:
      Authorization: 'Bearer {{ settings.ossa_api_key }}'
    body: |
      {
        "reason": "scheduled_rebuild",
        "timestamp": "{{ 'now'|date('c') }}"
      }

  export_metrics:
    id: http_client_request
    method: GET
    url: '{{ settings.ossa_api_url }}/knowledge-graph/metrics'

  log_metrics:
    id: system_logger
    level: info
    message: 'Graph metrics: {{ export_metrics.response.stats.totalAgents }} agents, {{ export_metrics.response.stats.relationships }} relationships'
```

## PHP Custom Module Integration

For more advanced use cases, create custom PHP code:

### Service Class

**File**: `ossa_integration/src/OssaApiClient.php`

```php
<?php

namespace Drupal\ossa_integration;

use GuzzleHttp\ClientInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Psr\Log\LoggerInterface;

/**
 * OSSA API Client Service.
 */
class OssaApiClient {

  /**
   * HTTP client.
   */
  protected ClientInterface $httpClient;

  /**
   * Config factory.
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * Logger.
   */
  protected LoggerInterface $logger;

  /**
   * Constructs OSSA API client.
   */
  public function __construct(
    ClientInterface $http_client,
    ConfigFactoryInterface $config_factory,
    LoggerInterface $logger
  ) {
    $this->httpClient = $http_client;
    $this->configFactory = $config_factory;
    $this->logger = $logger;
  }

  /**
   * Get OSSA API base URL.
   */
  protected function getApiUrl(): string {
    return \Drupal::config('ossa_integration.settings')->get('api_url')
      ?? 'http://localhost:3000/api/v1';
  }

  /**
   * Get API key.
   */
  protected function getApiKey(): string {
    return \Drupal::config('ossa_integration.settings')->get('api_key') ?? '';
  }

  /**
   * Query knowledge graph for agents.
   */
  public function queryAgents(array $criteria): array {
    try {
      $response = $this->httpClient->get($this->getApiUrl() . '/agents/search', [
        'query' => $criteria,
        'headers' => [
          'Authorization' => 'Bearer ' . $this->getApiKey(),
        ],
      ]);

      return json_decode($response->getBody(), TRUE);
    }
    catch (\Exception $e) {
      $this->logger->error('OSSA API error: @message', ['@message' => $e->getMessage()]);
      return [];
    }
  }

  /**
   * Execute agent task.
   */
  public function executeAgent(string $agent_id, array $task): array {
    try {
      $response = $this->httpClient->post($this->getApiUrl() . '/agents/execute', [
        'json' => [
          'agent_id' => $agent_id,
          'task' => $task,
        ],
        'headers' => [
          'Authorization' => 'Bearer ' . $this->getApiKey(),
        ],
      ]);

      return json_decode($response->getBody(), TRUE);
    }
    catch (\Exception $e) {
      $this->logger->error('Agent execution error: @message', ['@message' => $e->getMessage()]);
      return ['error' => $e->getMessage()];
    }
  }

  /**
   * Rebuild knowledge graph.
   */
  public function rebuildGraph(string $reason = 'manual'): bool {
    try {
      $response = $this->httpClient->post($this->getApiUrl() . '/knowledge-graph/rebuild', [
        'json' => ['reason' => $reason],
        'headers' => [
          'Authorization' => 'Bearer ' . $this->getApiKey(),
        ],
      ]);

      return $response->getStatusCode() === 200;
    }
    catch (\Exception $e) {
      $this->logger->error('Graph rebuild error: @message', ['@message' => $e->getMessage()]);
      return FALSE;
    }
  }

  /**
   * Get graph metrics.
   */
  public function getGraphMetrics(): array {
    try {
      $response = $this->httpClient->get($this->getApiUrl() . '/knowledge-graph/metrics', [
        'headers' => [
          'Authorization' => 'Bearer ' . $this->getApiKey(),
        ],
      ]);

      return json_decode($response->getBody(), TRUE);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to fetch metrics: @message', ['@message' => $e->getMessage()]);
      return [];
    }
  }
}
```

### Event Subscriber

**File**: `ossa_integration/src/EventSubscriber/NodeEventSubscriber.php`

```php
<?php

namespace Drupal\ossa_integration\EventSubscriber;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\node\Event\NodeEvent;
use Drupal\ossa_integration\OssaApiClient;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Subscribes to node events and triggers OSSA workflows.
 */
class NodeEventSubscriber implements EventSubscriberInterface {

  /**
   * OSSA API client.
   */
  protected OssaApiClient $ossaClient;

  /**
   * Constructs subscriber.
   */
  public function __construct(OssaApiClient $ossa_client) {
    $this->ossaClient = $ossa_client;
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    return [
      'node.insert' => ['onNodeInsert', 0],
      'node.update' => ['onNodeUpdate', 0],
    ];
  }

  /**
   * React to node insert.
   */
  public function onNodeInsert(NodeEvent $event) {
    $node = $event->getNode();

    if ($node->bundle() === 'analysis') {
      // Find appropriate agent
      $agents = $this->ossaClient->queryAgents([
        'capability' => 'content-analysis',
        'domain' => 'text-processing',
      ]);

      if (!empty($agents['agents'])) {
        // Execute first matching agent
        $result = $this->ossaClient->executeAgent($agents['agents'][0]['id'], [
          'type' => 'analyze_content',
          'input' => [
            'title' => $node->getTitle(),
            'body' => $node->get('body')->value,
          ],
        ]);

        if (!empty($result['result'])) {
          $node->set('field_ai_analysis', $result['result']);
          $node->save();
        }
      }
    }
  }

  /**
   * React to node update.
   */
  public function onNodeUpdate(NodeEvent $event) {
    $node = $event->getNode();

    if ($node->bundle() === 'agent_config') {
      // Trigger graph rebuild
      $this->ossaClient->rebuildGraph('agent_config_updated');
    }
  }
}
```

## Testing Integration

### 1. Test API Connectivity

```bash
# From Drupal site
curl -X GET http://localhost:3000/api/v1/agents/search?capability=test

# Expected response:
# {"agents": [...]}
```

### 2. Test ECA Workflow

1. Navigate to `/admin/config/workflow/eca`
2. Import one of the example models above
3. Trigger the event (create node, submit form, etc.)
4. Check Drupal logs: `/admin/reports/dblog`
5. Verify OSSA Phoenix dashboard: `http://localhost:6006`

### 3. Test Custom Service

```php
// In Drupal controller or custom code
$ossa = \Drupal::service('ossa_integration.api_client');
$metrics = $ossa->getGraphMetrics();
dpm($metrics);  // Devel module
```

## Performance Considerations

### Caching

```php
// Cache agent queries
$cache = \Drupal::cache();
$cache_key = 'ossa_agents:' . md5(serialize($criteria));

if ($cached = $cache->get($cache_key)) {
  return $cached->data;
}

$agents = $this->ossaClient->queryAgents($criteria);
$cache->set($cache_key, $agents, time() + 3600);
```

### Async Processing

Use Drupal Queue API for long-running agent tasks:

```php
$queue = \Drupal::queue('ossa_agent_tasks');
$queue->createItem([
  'agent_id' => $agent_id,
  'task' => $task_data,
  'node_id' => $node->id(),
]);
```

## Security

### API Key Management

```php
// Never hardcode API keys
// Use environment variables:
$settings['ossa_api_key'] = getenv('OSSA_API_KEY');

// Or use Key module
$key = \Drupal::service('key.repository')->getKey('ossa_api')->getKeyValue();
```

### Input Validation

```php
// Always validate data sent to agents
use Drupal\Component\Utility\Html;

$safe_input = [
  'title' => Html::escape($node->getTitle()),
  'body' => strip_tags($node->get('body')->value),
];
```

## Monitoring

### Drupal Watchdog Integration

```php
\Drupal::logger('ossa_integration')->notice('Agent @id executed: @result', [
  '@id' => $agent_id,
  '@result' => $result['status'],
]);
```

### Phoenix Tracing

All OSSA API calls automatically send traces to Phoenix at `http://localhost:6006`.

## Resources

- [ECA Module Documentation](https://www.drupal.org/docs/contributed-modules/eca)
- [OSSA API Reference](../api/README.md)
- [Drupal Event System](https://www.drupal.org/docs/creating-custom-modules/subscribe-to-and-dispatch-events)

## Support

For issues with:
- **ECA integration**: Check ECA module issue queue
- **OSSA API**: Check OSSA repository issues
- **Custom code**: Review PHP and Drupal coding standards
