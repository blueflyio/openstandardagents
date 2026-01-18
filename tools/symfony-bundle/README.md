# OSSA Symfony Bundle

**Integrate Open Standard Agents (OSSA) into Symfony and Drupal Applications**

Production-grade Symfony bundle for running OSSA v0.3.x agents with support for multiple LLM providers (Anthropic, OpenAI, Google, Azure), MCP tools, and comprehensive observability.

## Features

- **Agent Management**: Load and execute OSSA v0.3.x agents
- **Multiple LLM Providers**: Anthropic (Claude), OpenAI (GPT), Google (Gemini), Azure OpenAI
- **MCP Tools**: Model Context Protocol tool integration
- **Manifest Validation**: Validate OSSA manifests against v0.3.5 schema
- **Safety Guardrails**: PII detection, secrets detection, cost controls
- **Observability**: OpenTelemetry tracing, cost tracking, metrics
- **Console Commands**: CLI tools for agent management
- **Symfony Integration**: Full DI container, event dispatcher, configuration
- **Drupal Compatible**: Works with Drupal 10+ (Drupal uses Symfony components)

## Installation

### Symfony

```bash
composer require ossa/symfony-bundle
```

Enable the bundle in `config/bundles.php`:

```php
return [
    // ...
    Ossa\SymfonyBundle\OssaBundle::class => ['all' => true],
];
```

### Drupal 10+

```bash
composer require ossa/symfony-bundle
```

Enable the module:

```bash
drush en ossa
```

## Configuration

### Symfony Configuration

Create `config/packages/ossa.yaml`:

```yaml
ossa:
  # Default LLM settings
  default_provider: anthropic
  default_model: claude-sonnet-4-20250514
  default_temperature: 0.7

  # Manifest discovery
  manifest_paths:
    - '%kernel.project_dir%/config/agents'
    - '%kernel.project_dir%/src/Agents'
  auto_discover: true

  # LLM Provider API keys
  providers:
    anthropic:
      api_key: '%env(ANTHROPIC_API_KEY)%'
      timeout: 60
      max_retries: 3

    openai:
      api_key: '%env(OPENAI_API_KEY)%'
      timeout: 60

    google:
      api_key: '%env(GOOGLE_API_KEY)%'
      timeout: 60

    azure:
      api_key: '%env(AZURE_OPENAI_API_KEY)%'
      base_url: '%env(AZURE_OPENAI_ENDPOINT)%'
      deployment: 'gpt-4'

  # Observability
  observability:
    enabled: true
    otlp_endpoint: '%env(OTEL_EXPORTER_OTLP_ENDPOINT)%'
    log_level: info

  # Safety & Cost Controls
  safety:
    pii_detection: true
    secrets_detection: true
    max_cost_per_day: 100.0
    max_tokens_per_day: 1000000

  # MCP Tool Servers
  mcp:
    enabled: true
    servers:
      filesystem:
        transport: stdio
        command: npx
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/files']

      brave_search:
        transport: stdio
        command: npx
        args: ['-y', '@modelcontextprotocol/server-brave-search']

  # Inline agent definitions (optional - can also use manifest files)
  agents:
    code_reviewer:
      role: "Code review assistant"
      llm:
        provider: anthropic
        model: claude-sonnet-4-20250514
        temperature: 0.3
      tools:
        - read_file
        - list_files
      capabilities:
        - code_analysis
        - security_review
```

### Drupal Configuration

Drupal configuration at `config/ossa.settings.yml`:

```yaml
ossa:
  default_provider: 'anthropic'
  default_model: 'claude-sonnet-4-20250514'

  manifest_paths:
    - 'modules/custom/ossa_agents/manifests'

  providers:
    anthropic:
      api_key: !env ANTHROPIC_API_KEY

  safety:
    pii_detection: true
    max_cost_per_day: 50.0
```

## Usage

### 1. Create an Agent Manifest

Create `config/agents/support_agent.ossa.yaml`:

```yaml
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: support-agent
  labels:
    team: customer-support
    environment: production

spec:
  role: "Customer support assistant that helps users with common issues"

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7
    max_tokens: 2048

  prompt: |
    You are a helpful customer support assistant.
    You help users troubleshoot issues, answer questions, and escalate to humans when needed.

    Guidelines:
    - Be friendly and professional
    - Ask clarifying questions
    - Provide step-by-step solutions
    - Escalate complex issues

  tools:
    - search_knowledge_base
    - create_ticket
    - check_order_status

  capabilities:
    - natural_language_understanding
    - multi_turn_conversation
    - context_awareness

  safety:
    guardrails:
      - no_harmful_content
      - no_pii_storage
    pii_handling: redact
    audit_all_actions: true

  observability:
    telemetry:
      enabled: true
      export_traces: true
      export_metrics: true
```

### 2. Execute Agent in PHP

#### Symfony Controller

```php
<?php

namespace App\Controller;

use Ossa\SymfonyBundle\Agent\AgentExecutor;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class SupportController extends AbstractController
{
    public function __construct(
        private readonly AgentExecutor $agentExecutor
    ) {
    }

    #[Route('/api/support', methods: ['POST'])]
    public function support(Request $request): JsonResponse
    {
        $input = $request->request->get('message');

        $response = $this->agentExecutor->execute(
            agentName: 'support-agent',
            input: $input,
            context: [
                'user_id' => $this->getUser()?->getId(),
                'session_id' => $request->getSession()->getId(),
            ]
        );

        return $this->json([
            'response' => $response->getOutput(),
            'metadata' => $response->getMetadata(),
        ]);
    }
}
```

#### Drupal Service

```php
<?php

namespace Drupal\my_module\Service;

use Ossa\SymfonyBundle\Agent\AgentExecutor;

class SupportService
{
    public function __construct(
        private readonly AgentExecutor $agentExecutor
    ) {
    }

    public function handleSupportRequest(string $message, int $userId): array
    {
        $response = $this->agentExecutor->execute(
            agentName: 'support-agent',
            input: $message,
            context: [
                'user_id' => $userId,
                'drupal_version' => \Drupal::VERSION,
            ]
        );

        return [
            'output' => $response->getOutput(),
            'cost' => $response->getMetadata()['cost'] ?? 0,
            'duration_ms' => $response->getDuration(),
        ];
    }
}
```

Register service in `my_module.services.yml`:

```yaml
services:
  my_module.support_service:
    class: Drupal\my_module\Service\SupportService
    arguments:
      - '@Ossa\SymfonyBundle\Agent\AgentExecutor'
```

### 3. Console Commands

#### List all agents

```bash
# Symfony
php bin/console ossa:agent:list

# Drupal
drush ossa:agent:list
```

Output:
```
 OSSA Agents
 ════════════════════════════════════════════════════════════════════════
  Name            Role                          Provider   Model
 ────────────────────────────────────────────────────────────────────────
  support-agent   Customer support assistant    anthropic  claude-sonnet-4
  code-reviewer   Code review assistant         anthropic  claude-sonnet-4
 ────────────────────────────────────────────────────────────────────────
```

#### Execute an agent

```bash
# Symfony
php bin/console ossa:agent:execute support-agent "How do I reset my password?"

# Drupal
drush ossa:agent:execute support-agent "How do I reset my password?"
```

Output:
```
 Executing Agent: support-agent
 ═══════════════════════════════════════════════════════════════════

 Output
 ───────────────────────────────────────────────────────────────────

 To reset your password, please follow these steps:

 1. Visit the login page and click "Forgot Password"
 2. Enter your email address
 3. Check your email for a password reset link
 4. Click the link and create a new password

 If you don't receive the email within 5 minutes, check your spam folder.

 Metadata
 ───────────────────────────────────────────────────────────────────

  Duration (ms)  Model               Provider    Total Tokens
 ──────────────────────────────────────────────────────────────────
  1247.82        claude-sonnet-4     anthropic   423

 ✓ Agent execution completed
```

#### Validate manifests

```bash
# Validate specific file
php bin/console ossa:agent:validate config/agents/support_agent.ossa.yaml

# Validate all manifests
php bin/console ossa:agent:validate
```

#### List MCP servers

```bash
php bin/console ossa:mcp:list
```

### 4. Advanced Usage

#### With AgentRegistry

```php
use Ossa\SymfonyBundle\Agent\AgentRegistry;
use Ossa\SymfonyBundle\Agent\AgentExecutor;

class MyService
{
    public function __construct(
        private readonly AgentRegistry $registry,
        private readonly AgentExecutor $executor
    ) {
    }

    public function processWithMultipleAgents(string $input): array
    {
        $results = [];

        // Get all agents
        foreach ($this->registry->all() as $agent) {
            $response = $this->executor->execute(
                $agent->getName(),
                $input
            );

            $results[$agent->getName()] = $response->getOutput();
        }

        return $results;
    }

    public function getAgentInfo(string $agentName): array
    {
        $agent = $this->registry->get($agentName);

        return [
            'name' => $agent->getName(),
            'role' => $agent->getRole(),
            'llm' => $agent->getLLMConfig(),
            'tools' => $agent->getTools(),
            'capabilities' => $agent->getCapabilities(),
        ];
    }
}
```

#### Custom LLM Provider

```php
<?php

namespace App\LLM;

use Ossa\SymfonyBundle\LLM\LLMProviderInterface;

class CustomProvider implements LLMProviderInterface
{
    public function getName(): string
    {
        return 'custom';
    }

    public function complete(
        ?string $model = null,
        string $prompt = '',
        ?float $temperature = null,
        ?int $maxTokens = null
    ): array {
        // Your custom LLM implementation
        return [
            'content' => 'Response from custom provider',
            'usage' => ['total_tokens' => 100],
        ];
    }

    public function supportsStreaming(): bool
    {
        return false;
    }

    public function getSupportedModels(): array
    {
        return ['custom-model-v1'];
    }
}
```

## Drupal-Specific Features

### Drupal Hooks

```php
<?php

/**
 * Implements hook_ossa_agent_execute().
 */
function my_module_ossa_agent_execute($agent_name, $input, &$context) {
  // Add Drupal-specific context
  $context['site_name'] = \Drupal::config('system.site')->get('name');
  $context['current_user'] = \Drupal::currentUser()->getAccountName();
}

/**
 * Implements hook_ossa_agent_response_alter().
 */
function my_module_ossa_agent_response_alter(&$response, $agent_name) {
  // Log all agent responses
  \Drupal::logger('ossa')->info('Agent @agent executed', [
    '@agent' => $agent_name,
  ]);
}
```

### Drupal Services

```php
<?php

namespace Drupal\my_module\Controller;

use Drupal\Core\Controller\ControllerBase;
use Ossa\SymfonyBundle\Agent\AgentExecutor;
use Symfony\Component\DependencyInjection\ContainerInterface;

class AgentController extends ControllerBase
{
    public function __construct(
        private readonly AgentExecutor $agentExecutor
    ) {
    }

    public static function create(ContainerInterface $container)
    {
        return new static(
            $container->get('Ossa\SymfonyBundle\Agent\AgentExecutor')
        );
    }

    public function execute($agent_name)
    {
        $input = $this->getRequest()->request->get('input');

        $response = $this->agentExecutor->execute($agent_name, $input);

        return [
            '#type' => 'markup',
            '#markup' => $response->getOutput(),
        ];
    }
}
```

## Examples

### Content Generation Agent

```yaml
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: content-generator
  labels:
    use-case: content-creation

spec:
  role: "Generate high-quality blog posts and articles"

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.8

  prompt: |
    You are an expert content writer who creates engaging, SEO-optimized content.
    Your writing is clear, informative, and tailored to the target audience.

  tools:
    - search_web
    - check_seo
    - generate_images

  capabilities:
    - creative_writing
    - seo_optimization
    - fact_checking
```

### Data Analysis Agent

```yaml
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: data-analyst

spec:
  role: "Analyze data and generate insights"

  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.2

  tools:
    - execute_sql
    - generate_chart
    - export_csv

  capabilities:
    - data_analysis
    - statistical_modeling
    - visualization
```

## Testing

```bash
# Run tests
composer test

# PHPStan
composer phpstan

# Code style
composer cs-fix
```

## Requirements

- **PHP**: >=8.2
- **Symfony**: ^6.4 or ^7.0
- **Drupal**: 10.x or 11.x (optional)

## Documentation

- [OSSA Specification v0.3](https://openstandardagents.org/spec/v0.3/)
- [LLM Providers](./docs/providers.md)
- [MCP Tools](./docs/mcp.md)
- [Safety & Cost Controls](./docs/safety.md)
- [Drupal Integration](./docs/drupal.md)

## Contributing

Contributions welcome! Please submit PRs to:
https://gitlab.com/blueflyio/ossa/openstandardagents

## License

MIT License - see LICENSE file

## Support

- **Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- **Docs**: https://openstandardagents.org/
- **Spec**: https://github.com/blueflyio/openstandardagents

## Roadmap

- [ ] Streaming support for all providers
- [ ] Multi-agent orchestration
- [ ] Enhanced MCP tool integration
- [ ] Agent-to-Agent (A2A) messaging
- [ ] Workflow support (OSSA v0.3 Workflow kind)
- [ ] Drupal-specific agents (node creation, taxonomy, views)
- [ ] Advanced cost optimization
- [ ] Real-time observability dashboard
