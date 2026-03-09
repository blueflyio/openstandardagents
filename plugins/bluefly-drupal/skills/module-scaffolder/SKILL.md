---
name: drupal-scaffold
description: "**Module Scaffolder Agent**: Generates complete Drupal module and recipe scaffolding with proper structure, info files, services, routing, controllers, forms, plugins, configuration schemas, and PHPUnit test structure. Supports Drupal 11 and PHP 8.3 with full PSR-4 autoloading. - MANDATORY TRIGGERS: scaffold module, create module, Drupal module, recipe scaffold, new module, generate module, Drupal recipe, create plugin, scaffold service, new Drupal, generate form, create controller"
license: "Apache-2.0"
compatibility: "Requires PHP 8.3+, Composer, Drush. Environment: Drupal 11 installation"
allowed-tools: "Bash(composer:*) Bash(drush:*) Write Edit Read Task mcp__filesystem__*"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/module-scaffolder/agent.ossa.yaml
  service_account: module-scaffolder
  service_account_id: pending
  domain: drupal
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
  npm_package: "@bluefly/openstandardagents"
---

# Module Scaffolder Agent Skill

**OSSA Agent**: `module-scaffolder` | **Version**: 1.0.0 | **Namespace**: blueflyio

This skill invokes the **module-scaffolder** OSSA agent for generating complete Drupal module and recipe structures with proper boilerplate code.

## Quick Start

```bash
# Install OSSA SDK
npm i @bluefly/openstandardagents

# Use Drush for quick scaffolding
drush generate module
```

## Agent Capabilities (from OSSA Manifest)

### Module Scaffolding
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `module-generation` | action | fully_autonomous | Generate complete module structure |
| `generate-module-structure` | action | fully_autonomous | Create module directory structure |
| `create-info-file` | action | fully_autonomous | Generate *.info.yml file |
| `scaffold-services` | action | fully_autonomous | Create services.yml and service classes |
| `generate-routing` | action | fully_autonomous | Generate routing.yml |
| `create-controllers` | action | fully_autonomous | Create controller classes |
| `scaffold-forms` | action | fully_autonomous | Generate form classes |
| `generate-plugins` | action | fully_autonomous | Create plugin annotations and classes |
| `create-configuration` | action | fully_autonomous | Generate config schema and defaults |
| `scaffold-tests` | action | fully_autonomous | Create PHPUnit test structure |

### Recipe Scaffolding (Absorbed)
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `recipe-scaffolding` | action | fully_autonomous | Scaffold Drupal recipes |
| `boilerplate-creation` | action | fully_autonomous | Create boilerplate code |

## Complete Module Structure

```
modules/custom/my_module/
├── my_module.info.yml          # Module info
├── my_module.module            # Hook implementations
├── my_module.services.yml      # Service definitions
├── my_module.routing.yml       # Route definitions
├── my_module.permissions.yml   # Permissions
├── my_module.links.menu.yml    # Menu links
├── my_module.links.task.yml    # Task links
├── my_module.libraries.yml     # Asset libraries
├── config/
│   ├── install/                # Default configuration
│   │   └── my_module.settings.yml
│   └── schema/                 # Config schema
│       └── my_module.schema.yml
├── src/
│   ├── Controller/
│   │   └── MyModuleController.php
│   ├── Form/
│   │   └── MyModuleSettingsForm.php
│   ├── Plugin/
│   │   └── Block/
│   │       └── MyModuleBlock.php
│   ├── Service/
│   │   └── MyModuleService.php
│   └── EventSubscriber/
│       └── MyModuleSubscriber.php
├── templates/
│   └── my-module-block.html.twig
├── css/
│   └── my_module.css
├── js/
│   └── my_module.js
└── tests/
    ├── src/
    │   ├── Unit/
    │   │   └── MyModuleServiceTest.php
    │   ├── Kernel/
    │   │   └── MyModuleKernelTest.php
    │   └── Functional/
    │       └── MyModuleFunctionalTest.php
    └── modules/
        └── my_module_test/
```

## Scaffold Templates

### info.yml

```yaml
name: My Module
type: module
description: 'Module description here.'
package: Custom
core_version_requirement: ^10.3 || ^11
php: 8.3

dependencies:
  - drupal:node
  - drupal:user

configure: my_module.settings

test_dependencies:
  - drupal:views
```

### services.yml

```yaml
services:
  my_module.my_service:
    class: Drupal\my_module\Service\MyModuleService
    arguments:
      - '@entity_type.manager'
      - '@config.factory'
      - '@logger.factory'

  my_module.event_subscriber:
    class: Drupal\my_module\EventSubscriber\MyModuleSubscriber
    arguments:
      - '@my_module.my_service'
    tags:
      - { name: event_subscriber }
```

### routing.yml

```yaml
my_module.settings:
  path: '/admin/config/my-module'
  defaults:
    _form: '\Drupal\my_module\Form\MyModuleSettingsForm'
    _title: 'My Module Settings'
  requirements:
    _permission: 'administer my_module'

my_module.content:
  path: '/my-module/{id}'
  defaults:
    _controller: '\Drupal\my_module\Controller\MyModuleController::content'
    _title: 'My Module Content'
  requirements:
    _permission: 'access content'
    id: \d+
```

### Controller

```php
<?php

declare(strict_types=1);

namespace Drupal\my_module\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\my_module\Service\MyModuleService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Controller for My Module routes.
 */
final class MyModuleController extends ControllerBase {

  /**
   * Constructs a MyModuleController.
   */
  public function __construct(
    private readonly MyModuleService $myService,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('my_module.my_service'),
    );
  }

  /**
   * Returns the content page.
   */
  public function content(int $id): array {
    return [
      '#theme' => 'my_module_block',
      '#data' => $this->myService->getData($id),
    ];
  }

}
```

### Form

```php
<?php

declare(strict_types=1);

namespace Drupal\my_module\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Settings form for My Module.
 */
final class MyModuleSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'my_module_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['my_module.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('my_module.settings');

    $form['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable feature'),
      '#default_value' => $config->get('enabled'),
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->config('my_module.settings')
      ->set('enabled', $form_state->getValue('enabled'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}
```

### Plugin Block

```php
<?php

declare(strict_types=1);

namespace Drupal\my_module\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\my_module\Service\MyModuleService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a My Module block.
 *
 * @Block(
 *   id = "my_module_block",
 *   admin_label = @Translation("My Module Block"),
 *   category = @Translation("Custom")
 * )
 */
final class MyModuleBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * Constructs a MyModuleBlock.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    private readonly MyModuleService $myService,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(
    ContainerInterface $container,
    array $configuration,
    $plugin_id,
    $plugin_definition,
  ): self {
    return new self(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('my_module.my_service'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    return [
      '#theme' => 'my_module_block',
      '#data' => $this->myService->getData(),
    ];
  }

}
```

## Recipe Structure

```
recipes/my_recipe/
├── recipe.yml
├── config/
│   └── my_module.settings.yml
└── content/
    └── node/
        └── my-content.yml
```

### recipe.yml

```yaml
name: My Recipe
description: 'Installs and configures My Module with default settings.'
type: Site

install:
  - my_module
  - views
  - block

config:
  import:
    my_module: '*'

content:
  import:
    node:
      - my-content.yml
```

## Integration with Claude Code

This skill is triggered by phrases like:
- "Create a new Drupal module"
- "Scaffold a module called user_dashboard"
- "Generate a controller for my module"
- "Create a settings form"
- "Scaffold a Drupal recipe"

## Examples

### Full Module
```
User: Create a module called analytics_dashboard
Agent: Creating module structure...
       - analytics_dashboard.info.yml
       - analytics_dashboard.services.yml
       - src/Controller/...
       - src/Form/...
       [Full structure created]
```

### Specific Component
```
User: Add a block plugin to my_module
Agent: Creating block plugin...
       - src/Plugin/Block/MyModuleBlock.php
       [Block created with DI]
```

### Recipe
```
User: Create a recipe for the analytics setup
Agent: Creating recipe structure...
       - recipe.yml
       - config/...
       [Recipe ready]
```

## Service Account

- **Account**: module-scaffolder
- **Group**: blueflyio
- **Permissions**: Developer (write:repository)

## Related Agents

- `drupal-standards-worker` - Validate scaffolded code
- `recipe-publisher` - Publish completed modules
- `code-reviewer` - Review generated code

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [Drupal Module Development](https://www.drupal.org/docs/develop/creating-modules)
- [Drupal Recipes](https://www.drupal.org/docs/extending-drupal/drupal-recipes)
