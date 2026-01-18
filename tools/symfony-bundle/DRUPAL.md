# OSSA for Drupal: Add AI Agents to Your Site

**Integrate AI agents into Drupal 10+ in minutes with OSSA (Open Standard Agents)**

## Quick Start

### 1. Install via Composer

```bash
cd /path/to/your/drupal/site
composer require ossa/symfony-bundle
drush en ossa -y
```

### 2. Configure (Add to settings.php)

```php
// web/sites/default/settings.php
$config['ossa.settings'] = [
  'default_provider' => 'anthropic',
  'default_model' => 'claude-sonnet-4-20250514',
  'manifest_paths' => [
    '/app/modules/custom/my_agents/manifests',
  ],
  'providers' => [
    'anthropic' => [
      'api_key' => getenv('ANTHROPIC_API_KEY'),
    ],
    'openai' => [
      'api_key' => getenv('OPENAI_API_KEY'),
    ],
  ],
  'safety' => [
    'pii_detection' => TRUE,
    'secrets_detection' => TRUE,
    'max_cost_per_day' => 50.0,
  ],
];
```

### 3. Create Your First Agent

Create `modules/custom/my_agents/manifests/content_helper.ossa.yaml`:

```yaml
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: content-helper
  labels:
    drupal: "true"
    use-case: content-generation

spec:
  role: "Help content editors write and improve content"

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7

  prompt: |
    You are a Drupal content assistant helping editors create high-quality content.

    Your capabilities:
    - Suggest content improvements
    - Check SEO optimization
    - Generate article drafts
    - Rewrite content for clarity
    - Suggest taxonomy terms

    Be helpful, concise, and focused on Drupal best practices.

  tools:
    - search_web
    - check_grammar

  capabilities:
    - content_writing
    - seo_optimization
    - drupal_expertise
```

### 4. Use in Your Module

Create a custom module service:

```php
<?php
// modules/custom/my_agents/src/Service/ContentHelperService.php

namespace Drupal\my_agents\Service;

use Ossa\SymfonyBundle\Agent\AgentExecutor;

class ContentHelperService {

  public function __construct(
    private readonly AgentExecutor $agentExecutor
  ) {}

  /**
   * Get content suggestions from AI agent
   */
  public function improvContent(string $content, string $contentType): array {
    $response = $this->agentExecutor->execute(
      agentName: 'content-helper',
      input: "Improve this {$contentType} content:\n\n{$content}",
      context: [
        'content_type' => $contentType,
        'drupal_version' => \Drupal::VERSION,
        'site_name' => \Drupal::config('system.site')->get('name'),
      ]
    );

    return [
      'suggestions' => $response->getOutput(),
      'cost_usd' => $response->getMetadata()['cost'] ?? 0,
      'tokens_used' => $response->getUsage()['total_tokens'] ?? 0,
      'duration_ms' => $response->getDuration(),
    ];
  }
}
```

Register service in `my_agents.services.yml`:

```yaml
services:
  my_agents.content_helper:
    class: Drupal\my_agents\Service\ContentHelperService
    arguments:
      - '@Ossa\SymfonyBundle\Agent\AgentExecutor'
```

### 5. Add to Form

```php
<?php
// modules/custom/my_agents/src/Form/ContentHelperForm.php

namespace Drupal\my_agents\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\my_agents\Service\ContentHelperService;
use Symfony\Component\DependencyInjection\ContainerInterface;

class ContentHelperForm extends FormBase {

  public function __construct(
    private readonly ContentHelperService $contentHelper
  ) {}

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('my_agents.content_helper')
    );
  }

  public function getFormId() {
    return 'my_agents_content_helper_form';
  }

  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['content'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Your Content'),
      '#required' => TRUE,
      '#rows' => 10,
    ];

    $form['content_type'] = [
      '#type' => 'select',
      '#title' => $this->t('Content Type'),
      '#options' => [
        'article' => $this->t('Article'),
        'page' => $this->t('Page'),
        'product' => $this->t('Product'),
      ],
    ];

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Get AI Suggestions'),
    ];

    return $form;
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $content = $form_state->getValue('content');
    $contentType = $form_state->getValue('content_type');

    $result = $this->contentHelper->improvContent($content, $contentType);

    $this->messenger()->addMessage(
      $this->t('AI Suggestions:<br><pre>@suggestions</pre>', [
        '@suggestions' => $result['suggestions'],
      ])
    );

    $this->messenger()->addStatus(
      $this->t('Cost: $@cost | Tokens: @tokens | Duration: @ms ms', [
        '@cost' => number_format($result['cost_usd'], 4),
        '@tokens' => $result['tokens_used'],
        '@ms' => round($result['duration_ms']),
      ])
    );
  }
}
```

## Drush Commands

```bash
# List all agents
drush ossa:agent:list

# Execute an agent
drush ossa:agent:execute content-helper "Write a blog post about Drupal 11"

# Validate manifests
drush ossa:agent:validate

# List MCP tool servers
drush ossa:mcp:list
```

## Common Use Cases for Drupal

### 1. Content Moderation Agent

```yaml
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: content-moderator
spec:
  role: "Review content for quality, spam, and policy violations"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.2
  capabilities:
    - content_moderation
    - spam_detection
    - policy_enforcement
```

### 2. SEO Optimization Agent

```yaml
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: seo-optimizer
spec:
  role: "Analyze and improve SEO for Drupal content"
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.5
  tools:
    - analyze_keywords
    - check_meta_tags
    - suggest_internal_links
```

### 3. User Support Agent

```yaml
apiVersion: ossa/v0.3
kind: Agent
metadata:
  name: support-bot
spec:
  role: "Answer user questions and create support tickets"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
  tools:
    - search_documentation
    - create_ticket
    - search_forums
```

## Drupal Hooks

```php
<?php

/**
 * Implements hook_ossa_agent_execute().
 */
function my_module_ossa_agent_execute($agent_name, $input, &$context) {
  // Add Drupal-specific context to all agent executions
  $context['drupal_version'] = \Drupal::VERSION;
  $context['site_name'] = \Drupal::config('system.site')->get('name');
  $context['current_user'] = \Drupal::currentUser()->getAccountName();
  $context['current_language'] = \Drupal::languageManager()->getCurrentLanguage()->getId();
}

/**
 * Implements hook_ossa_agent_response_alter().
 */
function my_module_ossa_agent_response_alter(&$response, $agent_name, $context) {
  // Log all agent responses for auditing
  \Drupal::logger('ossa')->info('Agent @agent executed by @user', [
    '@agent' => $agent_name,
    '@user' => \Drupal::currentUser()->getDisplayName(),
  ]);

  // Track costs
  if (isset($response['metadata']['cost'])) {
    \Drupal::state()->set('ossa_total_cost',
      \Drupal::state()->get('ossa_total_cost', 0) + $response['metadata']['cost']
    );
  }
}

/**
 * Implements hook_ossa_providers_alter().
 */
function my_module_ossa_providers_alter(&$providers) {
  // Override provider settings based on Drupal config
  $config = \Drupal::config('my_module.settings');

  if ($api_key = $config->get('anthropic_key')) {
    $providers['anthropic']['api_key'] = $api_key;
  }
}
```

## Controller Example

```php
<?php

namespace Drupal\my_agents\Controller;

use Drupal\Core\Controller\ControllerBase;
use Ossa\SymfonyBundle\Agent\AgentExecutor;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class AgentApiController extends ControllerBase {

  public function __construct(
    private readonly AgentExecutor $agentExecutor
  ) {}

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('Ossa\SymfonyBundle\Agent\AgentExecutor')
    );
  }

  /**
   * API endpoint: POST /api/agents/{agent_name}/execute
   */
  public function execute(Request $request, string $agent_name): JsonResponse {
    $input = $request->request->get('input');

    if (empty($input)) {
      return new JsonResponse(['error' => 'Input required'], 400);
    }

    try {
      $response = $this->agentExecutor->execute(
        agentName: $agent_name,
        input: $input,
        context: [
          'user_id' => $this->currentUser()->id(),
          'request_time' => \Drupal::time()->getRequestTime(),
        ]
      );

      return new JsonResponse([
        'success' => TRUE,
        'output' => $response->getOutput(),
        'metadata' => $response->getMetadata(),
      ]);
    } catch (\Exception $e) {
      \Drupal::logger('ossa')->error('Agent execution failed: @error', [
        '@error' => $e->getMessage(),
      ]);

      return new JsonResponse([
        'success' => FALSE,
        'error' => $e->getMessage(),
      ], 500);
    }
  }
}
```

Route in `my_agents.routing.yml`:

```yaml
my_agents.api.execute:
  path: '/api/agents/{agent_name}/execute'
  defaults:
    _controller: '\Drupal\my_agents\Controller\AgentApiController::execute'
  requirements:
    _permission: 'use ossa agents'
  methods: [POST]
```

## Field Widget Example

Add AI assistance to any text field:

```php
<?php

namespace Drupal\my_agents\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * @FieldWidget(
 *   id = "text_with_ai_assist",
 *   label = @Translation("Text with AI Assist"),
 *   field_types = {"text_long", "text_with_summary"}
 * )
 */
class TextWithAiAssistWidget extends WidgetBase {

  public function formElement(
    FieldItemListInterface $items,
    $delta,
    array $element,
    array &$form,
    FormStateInterface $form_state
  ) {
    $element['value'] = [
      '#type' => 'textarea',
      '#default_value' => $items[$delta]->value ?? '',
      '#rows' => 10,
    ];

    $element['ai_assist'] = [
      '#type' => 'button',
      '#value' => $this->t('AI Suggestions'),
      '#ajax' => [
        'callback' => [$this, 'aiAssistCallback'],
        'wrapper' => 'ai-suggestions-wrapper',
      ],
    ];

    $element['suggestions'] = [
      '#type' => 'container',
      '#attributes' => ['id' => 'ai-suggestions-wrapper'],
    ];

    return $element;
  }

  public function aiAssistCallback(array &$form, FormStateInterface $form_state) {
    $agentExecutor = \Drupal::service('Ossa\SymfonyBundle\Agent\AgentExecutor');

    $content = $form_state->getValue(['field_name', 0, 'value']);

    $response = $agentExecutor->execute(
      'content-helper',
      "Improve this content:\n\n{$content}"
    );

    return [
      '#type' => 'markup',
      '#markup' => '<div class="ai-suggestions">' .
                   nl2br($response->getOutput()) .
                   '</div>',
    ];
  }
}
```

## Cost Tracking Block

```php
<?php

namespace Drupal\my_agents\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "ossa_cost_tracker",
 *   admin_label = @Translation("OSSA Cost Tracker")
 * )
 */
class OssaCostTrackerBlock extends BlockBase {

  public function build() {
    $totalCost = \Drupal::state()->get('ossa_total_cost', 0);

    return [
      '#markup' => $this->t('AI Agent Costs Today: $@cost', [
        '@cost' => number_format($totalCost, 2),
      ]),
      '#cache' => ['max-age' => 300], // 5 minutes
    ];
  }
}
```

## Requirements

- **Drupal**: 10.x or 11.x
- **PHP**: 8.2+
- **Composer**: 2.x
- **API Keys**: Anthropic, OpenAI, Google, or Azure

## Environment Variables

Add to `.env` or `settings.php`:

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=AIzaxxxxx
AZURE_OPENAI_API_KEY=xxxxx
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
```

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Enable PII detection** - Protect user privacy
3. **Set cost limits** - Prevent runaway costs
4. **Use permissions** - Control who can use agents
5. **Audit logs** - Track all agent executions

## Support & Documentation

- **Full Docs**: See [README.md](./README.md)
- **OSSA Spec**: https://openstandardagents.org/spec/v0.3/
- **Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- **Drupal.org**: (Coming soon)

## License

MIT - Free to use in any Drupal project (commercial or open source)
