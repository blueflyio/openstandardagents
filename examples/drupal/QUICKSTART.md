# Drupal Module Generator - Quick Start Guide

Generate a complete, production-ready Drupal module from an OSSA agent manifest in seconds.

## TL;DR

```bash
# 1. Generate module
buildkit export agent.ossa.yaml -p drupal

# 2. Install
cp -r module_name /path/to/drupal/web/modules/custom/
cd /path/to/drupal
composer require ossa/symfony-bundle
drush en module_name

# 3. Configure
export ANTHROPIC_API_KEY="sk-ant-..."
drush cr

# 4. Test
drush ossa:agent:execute module-name "Test input"
```

## Step-by-Step

### 1. Create Your Agent Manifest

Create `my-agent.ossa.yaml`:

```yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: my_agent
  version: 1.0.0
  description: My AI agent for Drupal

spec:
  role: "You are a helpful assistant"

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7
    maxTokens: 2048

  tools:
    - type: api
      name: my_tool
      description: My custom tool

  capabilities:
    - capability-1
    - capability-2
```

### 2. Generate Drupal Module

```bash
buildkit export my-agent.ossa.yaml -p drupal
```

This creates a complete Drupal module in `./my_agent/` with:
- 15+ generated files
- Full DI configuration
- Queue worker for async execution
- Entity storage
- Admin UI
- REST API endpoints
- Configuration forms
- Documentation

### 3. Install Module

```bash
# Copy to Drupal
cp -r my_agent /path/to/drupal/web/modules/custom/

# Install symfony-bundle dependency
cd /path/to/drupal
composer require ossa/symfony-bundle

# Enable module
drush en my_agent
```

### 4. Configure API Keys

**Option A: Environment Variables (Recommended)**

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GOOGLE_API_KEY="..."
```

**Option B: settings.php**

Add to `sites/default/settings.php`:

```php
$config['ossa']['providers']['anthropic']['api_key'] = getenv('ANTHROPIC_API_KEY');
$config['ossa']['providers']['openai']['api_key'] = getenv('OPENAI_API_KEY');
```

### 5. Configure Module

Visit: `/admin/config/my_agent`

- Select LLM provider
- Choose model
- Set temperature
- Configure auto-execution (optional)

### 6. Execute Agent

**Via Admin UI**: `/admin/my_agent/execute`

**Via Drush**:
```bash
drush ossa:agent:execute my-agent "Hello, agent!"
```

**Via REST API**:
```bash
curl -X POST http://localhost/api/my_agent/execute \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello, agent!"}'
```

**Via PHP**:
```php
$agent = \Drupal::service('my_agent.agent_executor');
$result = $agent->execute('Hello, agent!');
print_r($result);
```

### 7. View Results

**Via UI**: `/admin/my_agent/results`

**Via Drush**:
```bash
drush sqlq "SELECT * FROM my_agent_result"
```

**Via Views**: Create custom Views using the `my_agent_result` entity type

## Example: Content Moderator

We've included a complete example. Try it:

```bash
# Generate from example
buildkit export examples/drupal/content-moderator.ossa.yaml -p drupal

# Install
cp -r content_moderator /path/to/drupal/web/modules/custom/
cd /path/to/drupal
composer require ossa/symfony-bundle
drush en content_moderator

# Configure
export ANTHROPIC_API_KEY="sk-ant-..."
drush cr

# Test
drush ossa:agent:execute content-moderator "Check this spam content: BUY NOW!"
```

## Common Use Cases

### 1. Content Moderation

```yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: content_moderator
spec:
  role: "Review content for spam and policy violations"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
```

**Use**: Auto-moderate user comments on entity save

### 2. Content Generation

```yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: content_generator
spec:
  role: "Generate SEO-optimized blog posts"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.8
```

**Use**: Generate article drafts from keywords

### 3. Customer Support

```yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: support_bot
spec:
  role: "Answer customer support questions"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
```

**Use**: Chatbot for support tickets

### 4. Data Analysis

```yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: data_analyst
spec:
  role: "Analyze data and generate insights"
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.2
```

**Use**: Generate reports from Drupal data

## Advanced Features

### Auto-Execute on Entity Save

Enable in module config (`/admin/config/MODULE`):

1. Check "Auto-execute on entity save"
2. Select entity types (node, comment, user)
3. Save

Now the agent runs automatically when entities are saved.

### Async Queue Processing

Queue items for background processing:

```php
$agent = \Drupal::service('my_agent.agent_executor');
$queue_id = $agent->executeAsync('Long running task', $context);
```

Process queue:
```bash
drush cron  # Automatic
drush queue:run my_agent_agent_queue  # Manual
```

### Custom Hooks

Modify agent behavior:

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

## Troubleshooting

### "Missing API key"

**Fix**: Set environment variable or settings.php

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
drush cr
```

### "Agent not found"

**Fix**: Clear cache

```bash
drush cr
```

### "Permission denied"

**Fix**: Grant permissions at `/admin/people/permissions`

- Check "Administer MODULE"
- Check "Access content"

### "Queue not processing"

**Fix**: Run cron

```bash
drush cron
```

## Generator Options

### Basic

```bash
buildkit export agent.ossa.yaml -p drupal
```

### With Options

```bash
# Specify output directory
buildkit export agent.ossa.yaml -p drupal -o ./custom-dir

# Dry run (preview only)
buildkit export agent.ossa.yaml -p drupal --dry-run

# Verbose output
buildkit export agent.ossa.yaml -p drupal --verbose

# Skip validation
buildkit export agent.ossa.yaml -p drupal --no-validate
```

## What Gets Generated

```
my_agent/
├── my_agent.info.yml              # Module metadata
├── my_agent.services.yml          # DI configuration
├── my_agent.module                # Drupal hooks
├── my_agent.routing.yml           # Routes
├── my_agent.links.menu.yml        # Menu links
├── my_agent.views.inc             # Views integration
├── composer.json                  # Dependencies
├── README.md                      # Documentation
├── INSTALL.md                     # Install guide
│
├── src/
│   ├── Service/
│   │   └── AgentExecutorService.php
│   ├── Plugin/QueueWorker/
│   │   └── AgentQueueWorker.php
│   ├── Entity/
│   │   ├── AgentResult.php
│   │   └── AgentResultInterface.php
│   ├── Controller/
│   │   └── AgentController.php
│   └── Form/
│       └── AgentConfigForm.php
│
├── config/
│   ├── schema/my_agent.schema.yml
│   ├── install/my_agent.settings.yml
│   └── ossa/agent.ossa.yaml
│
└── templates/
    ├── agent-result.html.twig
    └── agent-execute-form.html.twig
```

## Architecture

```
User Input
    ↓
AgentController (Drupal UI/API)
    ↓
AgentExecutorService (Drupal wrapper)
    ↓
AgentExecutor (ossa/symfony-bundle)
    ↓
LLM Provider (Anthropic/OpenAI/etc)
    ↓
Response → Entity Storage → Views
```

## Integration Points

- ✅ **Drupal Entity API**: Store results as entities
- ✅ **Drupal Queue API**: Async processing
- ✅ **Drupal Form API**: Config forms
- ✅ **Drupal Hook System**: Customization
- ✅ **Drupal Views**: Browse results
- ✅ **REST API**: External integration
- ✅ **Drush**: CLI commands
- ✅ **Symfony DI**: Service injection

## Requirements

- **Drupal**: 10.x or 11.x
- **PHP**: 8.2 or higher
- **Composer**: Latest version
- **API Key**: Anthropic, OpenAI, Google, or Azure

## Support

- **Documentation**: [Full Guide](../../docs/adapters/drupal-module-generator.md)
- **Example**: [content-moderator.ossa.yaml](./content-moderator.ossa.yaml)
- **Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- **OSSA Spec**: https://openstandardagents.org/

## Next Steps

1. Read the [full documentation](../../docs/adapters/drupal-module-generator.md)
2. Try the [content moderator example](./content-moderator.ossa.yaml)
3. Create your own agent manifests
4. Generate and deploy modules
5. Share your agents with the community

---

**Ready to build AI-powered Drupal modules?** Start with our example:

```bash
buildkit export examples/drupal/content-moderator.ossa.yaml -p drupal
```
