# API Documentation

## Services

### `content_moderator.agent_executor`

Main service for executing the agent.

```php
$agent = \Drupal::service('content_moderator.agent_executor');
$result = $agent->execute(['input' => 'data']);
```

**Methods:**

- `execute(array $input): array` - Execute agent with input data

**Returns:**

```php
[
  'success' => bool,
  'data' => mixed,
  'error' => string|null,
]
```

## Plugin

### `content_moderator` AI Agent Plugin

Implements ai_agents plugin interface.

```php
$plugin_manager = \Drupal::service('plugin.manager.ai_agent');
$plugin = $plugin_manager->createInstance('content_moderator');
$result = $plugin->execute(['input' => 'data']);
```

**Plugin ID:** `content_moderator`

**Annotation:**
```php
@AIAgent(
  id = "content_moderator",
  label = @Translation("content_moderator"),
  description = @Translation("AI-powered content moderation agent for Drupal with ai_agents integration"),
  ossa_version = "1.0.0",
  capabilities = {...}
)
```

## Entities

### `content_moderator_execution`

Stores agent execution history.

```php
$storage = \Drupal::entityTypeManager()->getStorage('content_moderator_execution');

// Create execution
$execution = $storage->create([
  'input' => json_encode($input),
  'output' => json_encode($output),
  'success' => TRUE,
]);
$execution->save();

// Load execution
$execution = $storage->load($id);
```

**Fields:**
- `id` - Execution ID
- `uid` - User who triggered execution
- `input` - Input data (JSON)
- `output` - Output result (JSON)
- `success` - Success flag
- `error` - Error message
- `created` - Creation timestamp
- `completed` - Completion timestamp

## Events

### AgentExecutionEvent

Dispatched before/after agent execution.

```php
use Drupal\content_moderator\Event\AgentExecutionEvent;

// Subscribe to event
public function onAgentExecution(AgentExecutionEvent $event) {
  $input = $event->getInput();
  $result = $event->getResult();
}
```

## Hooks

### hook_content_moderator_execute_alter()

Alter agent execution input.

```php
function mymodule_content_moderator_execute_alter(array &$input) {
  // Modify input before execution
  $input['custom_field'] = 'value';
}
```

### hook_content_moderator_result_alter()

Alter agent execution result.

```php
function mymodule_content_moderator_result_alter(array &$result) {
  // Modify result after execution
  $result['custom_field'] = 'value';
}
```

## Queue

### `content_moderator_execution`

Queue for async execution.

```php
$queue = \Drupal::queue('content_moderator_execution');
$queue->createItem(['input' => $data]);
```

## Symfony Messenger

### AgentExecutionMessage

Message class for async execution.

```php
use Drupal\content_moderator\Message\AgentExecutionMessage;

$message = new AgentExecutionMessage($input, $execution_id, $user_id);
$bus = \Drupal::service('messenger.default_bus');
$bus->dispatch($message);
```

## Configuration

### `content_moderator.settings`

```php
$config = \Drupal::config('content_moderator.settings');
$enabled = $config->get('enabled');
$timeout = $config->get('timeout');
```

**Keys:**
- `enabled` - Enable agent
- `async_execution` - Enable async
- `timeout` - Execution timeout (seconds)
- `retry_attempts` - Retry attempts

## Permissions

- `administer content_moderator` - Administer settings
- `execute content_moderator` - Execute agent
- `view content_moderator executions` - View execution history
- `view own content_moderator executions` - View own executions
