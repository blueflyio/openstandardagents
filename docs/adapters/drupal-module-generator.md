# Drupal Module Generator

Complete production-ready Drupal module generator for OSSA agents. Generates installable Drupal modules with full integration of the `ossa/symfony-bundle` for agent execution.

## Overview

The Drupal Module Generator creates a complete Drupal module from an OSSA agent manifest, including:

- **Core Module Files**: `.info.yml`, `.services.yml`, `composer.json`, `.module`
- **Service Layer**: AgentExecutorService (wraps ossa/symfony-bundle)
- **Queue Worker**: Async execution via Drupal's queue system
- **Entity Storage**: Agent result storage with Views integration
- **Admin UI**: Controller with forms and API endpoints
- **Configuration**: Configuration schema and forms
- **Drupal Hooks**: `entity_presave`, `cron`, `theme`
- **Templates**: Twig templates for rendering
- **Documentation**: Complete README and installation guide

## Features

### Production-Grade Architecture

- ✅ **Dependency Injection**: Full Symfony DI container integration
- ✅ **SOLID Principles**: Single responsibility, interface segregation
- ✅ **DRY**: Reuses `ossa/symfony-bundle` - no code duplication
- ✅ **PSR-4 Autoloading**: Standard PHP namespace structure
- ✅ **Drupal Standards**: Follows all Drupal coding standards

### Execution Models

- **Synchronous**: Direct agent execution with immediate results
- **Asynchronous**: Queue-based execution for long-running tasks
- **Entity Hooks**: Trigger agents on entity save (configurable)
- **Cron Jobs**: Scheduled processing via Drupal cron

### Integration Points

- **Views**: Browse and filter agent results
- **Forms API**: Configuration and execution forms
- **REST API**: JSON API endpoints for external integration
- **Drush**: CLI commands for agent management
- **Hooks**: Full hook system for customization

## Usage

### Basic Usage

Generate a Drupal module from an OSSA manifest:

```bash
buildkit export agent.ossa.yaml -p drupal --format module
```

This generates a complete Drupal module in `./module_name/` directory.

### With Options

```bash
# Specify output directory
buildkit export agent.ossa.yaml -p drupal -o ./drupal-modules/my-agent

# Dry run (preview without creating files)
buildkit export agent.ossa.yaml -p drupal --dry-run

# Verbose output
buildkit export agent.ossa.yaml -p drupal --verbose

# Skip validation
buildkit export agent.ossa.yaml -p drupal --no-validate
```

### Advanced Options

```typescript
// Using the generator programmatically
import { DrupalModuleGenerator } from '@ossa/core/adapters/drupal/generator';

const generator = new DrupalModuleGenerator();
const result = await generator.export(manifest, {
  // Include queue worker for async execution
  includeQueueWorker: true,

  // Include entity for result storage
  includeEntity: true,

  // Include admin controller and UI
  includeController: true,

  // Include configuration form
  includeConfigForm: true,

  // Include Drupal hooks (entity_presave, cron)
  includeHooks: true,

  // Include Views integration
  includeViews: true,

  // Drupal core version requirement
  coreVersion: '^10 || ^11',

  // Validate manifest before generation
  validate: true,
});

if (result.success) {
  console.log(`Generated ${result.files.length} files`);
  // Write files to disk
  for (const file of result.files) {
    fs.writeFileSync(file.path, file.content);
  }
}
```

## Generated Module Structure

```
content_moderator/
├── content_moderator.info.yml           # Module metadata
├── content_moderator.services.yml       # Service definitions (DI)
├── content_moderator.module             # Drupal hooks
├── content_moderator.routing.yml        # Routes (admin UI, API)
├── content_moderator.links.menu.yml     # Admin menu links
├── content_moderator.views.inc          # Views integration
├── composer.json                        # Composer metadata (requires ossa/symfony-bundle)
├── README.md                            # Complete documentation
├── INSTALL.md                           # Installation guide
│
├── src/
│   ├── Service/
│   │   └── AgentExecutorService.php    # Main service (wraps symfony-bundle)
│   │
│   ├── Plugin/
│   │   └── QueueWorker/
│   │       └── AgentQueueWorker.php    # Async queue processor
│   │
│   ├── Entity/
│   │   ├── AgentResult.php             # Result storage entity
│   │   └── AgentResultInterface.php    # Entity interface
│   │
│   ├── Controller/
│   │   └── AgentController.php         # Admin UI + API endpoints
│   │
│   └── Form/
│       └── AgentConfigForm.php         # Configuration form
│
├── config/
│   ├── schema/
│   │   └── content_moderator.schema.yml # Configuration schema
│   ├── install/
│   │   └── content_moderator.settings.yml # Default config
│   └── ossa/
│       └── agent.ossa.yaml              # Original OSSA manifest
│
└── templates/
    ├── agent-result.html.twig           # Result display template
    └── agent-execute-form.html.twig     # Execution form template
```

## Installation

### 1. Generate Module

```bash
cd /path/to/ossa-project
buildkit export examples/drupal/content-moderator.ossa.yaml -p drupal
```

### 2. Install Symfony Bundle

The generated module depends on `ossa/symfony-bundle`:

```bash
cd /path/to/drupal
composer require ossa/symfony-bundle
```

### 3. Copy Module to Drupal

```bash
cp -r content_moderator /path/to/drupal/web/modules/custom/
```

### 4. Enable Module

```bash
drush en content_moderator
```

Or via Drupal UI: **Admin → Extend → Enable "content_moderator"**

### 5. Configure API Keys

Set your LLM provider API keys in `settings.php`:

```php
// Anthropic (Claude)
$config['ossa']['providers']['anthropic']['api_key'] = getenv('ANTHROPIC_API_KEY');

// OpenAI
$config['ossa']['providers']['openai']['api_key'] = getenv('OPENAI_API_KEY');

// Google
$config['ossa']['providers']['google']['api_key'] = getenv('GOOGLE_API_KEY');
```

Or use environment variables:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

### 6. Configure Module

Visit `/admin/config/content_moderator` to:
- Select LLM provider
- Choose model
- Configure triggers
- Set auto-execution options

## Usage Examples

### Execute via Admin UI

1. Navigate to `/admin/content_moderator/execute`
2. Enter content to moderate
3. Click "Execute"
4. View moderation result

### Execute via Drush

```bash
# Execute agent
drush ossa:agent:execute content-moderator "Check this content for spam"

# List available agents
drush ossa:agent:list

# Validate manifest
drush ossa:agent:validate
```

### Execute via API

#### Synchronous Execution

```bash
curl -X POST https://example.com/api/content_moderator/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "User submitted content here...",
    "context": {
      "entity_type": "node",
      "entity_id": 123
    }
  }'
```

Response:
```json
{
  "success": true,
  "output": "Status: APPROVED\nConfidence: 95\nViolations: None\nRecommendation: Publish content",
  "metadata": {
    "duration_ms": 1234.56,
    "model": "claude-sonnet-4-20250514",
    "provider": "anthropic",
    "usage": {
      "total_tokens": 423
    }
  }
}
```

#### Asynchronous Execution (Queued)

```bash
curl -X POST https://example.com/api/content_moderator/execute-async \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Large content batch...",
    "context": {}
  }'
```

Response:
```json
{
  "success": true,
  "queue_id": 12345,
  "message": "Agent execution queued"
}
```

### Execute via PHP

```php
// Get service
$agent = \Drupal::service('content_moderator.agent_executor');

// Synchronous execution
$result = $agent->execute(
  'Check this user comment for spam',
  [
    'user_id' => 456,
    'entity_type' => 'comment',
    'entity_id' => 789,
  ]
);

if ($result['success']) {
  echo $result['output'];
}

// Asynchronous execution (queued)
$queue_id = $agent->executeAsync(
  'Check this content',
  ['entity_type' => 'node', 'entity_id' => 123]
);
```

### Auto-Execution on Entity Save

Enable auto-execution in configuration:

1. Visit `/admin/config/content_moderator`
2. Check "Auto-execute on entity save"
3. Select entity types (node, comment, user)
4. Save configuration

Now the agent will automatically execute when configured entities are saved.

## Queue Processing

### Via Cron

Queue items are processed automatically via Drupal cron:

```bash
drush cron
```

### Manual Processing

Process queue manually:

```bash
drush queue:run content_moderator_agent_queue
```

## Views Integration

The module creates a content entity type for agent results. You can:

1. Browse results: `/admin/content_moderator/results`
2. Create custom Views
3. Export to CSV
4. Filter by status, date, etc.

Example View:

```php
// Create a View of agent results
$view = Views::create([
  'id' => 'content_moderator_results',
  'label' => 'Agent Results',
  'base_table' => 'content_moderator_result',
]);
```

## Customization

### Drupal Hooks

The module implements these hooks you can override:

```php
/**
 * Implements hook_ossa_agent_execute().
 */
function my_module_ossa_agent_execute($agent_name, $input, &$context) {
  // Add custom context
  $context['custom_data'] = 'value';
}

/**
 * Implements hook_ossa_agent_response_alter().
 */
function my_module_ossa_agent_response_alter(&$response, $agent_name) {
  // Modify response
  $response['custom_field'] = 'value';
}
```

### Service Decoration

Decorate the agent executor service:

```yaml
# my_module.services.yml
services:
  my_module.decorated_agent_executor:
    class: Drupal\my_module\Service\DecoratedAgentExecutor
    decorates: content_moderator.agent_executor
    arguments:
      - '@my_module.decorated_agent_executor.inner'
```

### Custom Queue Worker

Extend the queue worker:

```php
class CustomAgentQueueWorker extends AgentQueueWorker {
  public function processItem($data) {
    // Custom preprocessing
    $data = $this->preprocess($data);

    // Call parent
    return parent::processItem($data);
  }
}
```

## Architecture

### Service Layer

The module uses a clean service architecture:

```
AgentController (UI/API)
    ↓
AgentExecutorService (Drupal wrapper)
    ↓
AgentExecutor (ossa/symfony-bundle)
    ↓
LLM Provider (Anthropic/OpenAI/etc)
```

### Dependency Injection

All services use Symfony DI:

```php
class AgentExecutorService {
  public function __construct(
    AgentExecutor $agent_executor,        // From symfony-bundle
    LoggerChannelFactoryInterface $logger,
    ConfigFactoryInterface $config,
    EntityTypeManagerInterface $entity_manager,
    QueueFactory $queue
  ) {
    // Dependencies injected automatically
  }
}
```

### SOLID Principles

- **Single Responsibility**: Each class has one job
- **Open/Closed**: Extendable via hooks and service decoration
- **Liskov Substitution**: Services implement interfaces
- **Interface Segregation**: Minimal, focused interfaces
- **Dependency Inversion**: Depend on abstractions (symfony-bundle)

## Troubleshooting

### Issue: "Missing API key"

**Solution**: Configure API keys in `settings.php`:

```php
$config['ossa']['providers']['anthropic']['api_key'] = getenv('ANTHROPIC_API_KEY');
```

Verify:
```bash
drush php-eval "print_r(\Drupal::config('ossa.settings')->get('providers'));"
```

### Issue: "Agent not found"

**Solution**: Clear cache

```bash
drush cr
```

### Issue: "Queue not processing"

**Solution**: Run cron manually

```bash
drush cron
# Or process queue directly
drush queue:run content_moderator_agent_queue
```

### Issue: "Permission denied"

**Solution**: Grant permissions at `/admin/people/permissions`

- Grant "Administer content_moderator" permission
- Grant "Access content" for API endpoints

## Testing

### Unit Tests

```bash
cd /path/to/drupal
vendor/bin/phpunit modules/custom/content_moderator/tests
```

### Integration Tests

```bash
drush test-run ContentModeratorTest
```

### Manual Testing

1. Enable module
2. Configure API keys
3. Visit execute page
4. Test with sample content
5. Verify results in database

## CI/CD Integration

### GitLab CI

```yaml
# .gitlab-ci.yml
generate-drupal-module:
  stage: build
  script:
    - buildkit export agent.ossa.yaml -p drupal -o modules/custom/my-agent
    - cd /path/to/drupal
    - composer require ossa/symfony-bundle
    - drush en my_agent
    - drush ossa:agent:validate
```

### GitHub Actions

```yaml
# .github/workflows/drupal-module.yml
- name: Generate Drupal Module
  run: |
    buildkit export agent.ossa.yaml -p drupal
    cp -r module_name /path/to/drupal/web/modules/custom/
    drush en module_name
```

## Examples

See `examples/drupal/` directory:

- **content-moderator.ossa.yaml**: Content moderation agent
- **Generated module**: Complete working example

## Support

- **OSSA Specification**: https://openstandardagents.org/
- **Symfony Bundle**: https://github.com/blueflyio/openstandardagents/tree/main/tools/symfony-bundle
- **Drupal Integration**: https://openstandardagents.org/integrations/drupal
- **Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues

## Related Documentation

- [OSSA Specification](https://openstandardagents.org/spec/)
- [Symfony Bundle README](../../tools/symfony-bundle/README.md)
- [Drupal Runtime Adapter](./drupal-runtime-adapter.md)
- [Export Command](../cli/export.md)

## License

MIT
