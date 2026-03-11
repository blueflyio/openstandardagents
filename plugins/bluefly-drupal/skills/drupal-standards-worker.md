---
name: drupal-standards
description: "**Drupal Standards Worker Agent**: Comprehensive Drupal coding standards enforcement with PHPCS, PHPStan, ESLint, and Drupal.org compliance validation. Covers PHPCS/PHPStan/ESLint checks, hook and Twig validation, YAML config validation, services.yml analysis, deprecation detection, Canvas/SDC component linting, ECA config validation, AI module Tool API contract checks, FlowDrop node processor validation, and OSSA manifest validation for ai_agents_ossa. Supports Drupal 11.2+, DrupalCMS 2.0, and PHP 8.3+. - MANDATORY TRIGGERS: Drupal, PHPCS, PHPStan, Drupal coding standards, theme, Drupal code, PHP standards, drupal.org, check Drupal, Drupal module, Drupal theme, Twig, hook, services.yml, Canvas, SDC, ECA, ai_agents, ai_agents_ossa, OSSA, Tool API, FlowDrop, orchestration, DrupalCMS 2.0, experience_builder, canvas_ai"
license: "Apache-2.0"
compatibility: "Requires PHP 8.3+, Composer, PHPCS with Drupal standards. Environment: Drupal 11.2+ / DrupalCMS 2.0"
allowed-tools: "Bash(composer:*) Bash(drush:*) Bash(php:*) Read Edit Task mcp__filesystem__*"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/drupal-standards-worker/agent.ossa.yaml
  service_account: bot-drupal-prod
  service_account_id: 31840511
  domain: drupal
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.4.0
  npm_package: "@bluefly/openstandardagents"
  drupal_cms_version: "2.0"
  drupal_core_version: "^11.2"
---

# Drupal Standards Worker Agent Skill

**OSSA Agent**: `drupal-standards-worker` | **Version**: 2.0.0 | **Namespace**: blueflyio

This skill invokes the **drupal-standards-worker** OSSA agent for comprehensive Drupal coding standards validation, auto-fixing, Drupal.org compliance, and validation of the modern Drupal AI ecosystem: `drupal/ai`, `drupal/ai_agents`, `drupal/ai_agents_ossa`, ECA, Orchestration, FlowDrop, Drupal Canvas / SDC components, and DrupalCMS 2.0 site templates.

## Quick Start

```bash
# Install OSSA SDK (OSSA v0.4.0)
npm i @bluefly/openstandardagents

# Install Drupal Coder + PHPStan
composer require --dev drupal/coder dealerdirect/phpcodesniffer-composer-installer
composer require --dev phpstan/phpstan mglaman/phpstan-drupal

# Install AI module stack
composer require drupal/ai drupal/ai_agents drupal/ai_agents_ossa

# Install orchestration / workflow modules
composer require drupal/eca drupal/orchestration drupal/flowdrop

# Install DrupalCMS 2.0 with Canvas
composer create-project drupal/cms
# or for existing sites:
composer require drupal/canvas
```

## Ecosystem Context (2025–2026)

The Drupal AI ecosystem has converged around a clear architecture as of DrupalCMS 2.0 (January 2026). Standards validation must now cover all layers:

| Layer | Module(s) | Purpose |
|-------|-----------|---------|
| **AI Framework** | `drupal/ai` (1.2 stable) | Provider abstraction, Tool API, Automators, AI Explorer |
| **Agents** | `drupal/ai_agents` (1.2.x) | Plugin-based agent framework with Tool API |
| **OSSA** | `drupal/ai_agents_ossa` (1.0-alpha) | OSSA v0.4.0 manifest validation, 12 templates, REST API |
| **Orchestration** | `drupal/orchestration` (1.0) | Bi-directional bridge for external automation platforms |
| **Event-driven** | `drupal/eca` | Event-Condition-Action; integrates with AI Agents and Tool API |
| **Visual Workflows** | `drupal/flowdrop` | DAG-based no-code workflow builder (n8n/Langflow for Drupal) |
| **Visual Builder** | `drupal/canvas` (1.1) | Default page builder in DrupalCMS 2.0; SDC-based |
| **AI + Canvas** | `canvas_ai` / `xb_ai_assistant` | Prompt-based page building with SDCs |
| **MCP** | `drupal/mcp`, `drupal/mcp_server` | Model Context Protocol server for LLM tooling |

## Agent Capabilities (from OSSA v0.4.0 Manifest)

### Validation Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `phpcs-validation` | reasoning | fully_autonomous | Run PHP CodeSniffer with Drupal + DrupalPractice standards |
| `phpstan-analysis` | reasoning | fully_autonomous | Run PHPStan static analysis (level 8), mglaman/phpstan-drupal |
| `eslint-validation` | reasoning | fully_autonomous | Run ESLint on JavaScript/TypeScript, including SDC JS |
| `drupal-org-check` | reasoning | fully_autonomous | Validate for Drupal.org compliance |
| `ossa-manifest-validation` | reasoning | fully_autonomous | Parse and validate OSSA v0.4.0 manifests (JSON/YAML) |
| `tool-api-contract-check` | reasoning | fully_autonomous | Validate AI Tool API plugin contracts and type hints |
| `eca-config-validation` | reasoning | fully_autonomous | Validate ECA event/condition/action YAML configuration |
| `flowdrop-node-validation` | reasoning | fully_autonomous | Validate FlowDrop node processor plugin structure |
| `sdc-component-validation` | reasoning | fully_autonomous | Validate Single Directory Component structure and metadata |
| `canvas-template-check` | reasoning | fully_autonomous | Validate Drupal Canvas content templates |
| `mcp-tool-registration-check` | reasoning | fully_autonomous | Validate MCP tool registration and schema definitions |

### Fix Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `auto-fix` | action | semi_autonomous | Automatically fix PHPCS violations with phpcbf |
| `ossa-manifest-import` | action | semi_autonomous | Import/export OSSA manifests via REST API |

### Structure Validation
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `validate-module-structure` | reasoning | fully_autonomous | Validate module directory structure including SDC layout |
| `check-hook-implementations` | reasoning | fully_autonomous | Validate hook implementations (procedural + OO attribute hooks for 11.3+) |
| `validate-yaml-configuration` | reasoning | fully_autonomous | Validate YAML config files and config schema |
| `analyze-service-definitions` | reasoning | fully_autonomous | Analyze services.yml files |
| `check-deprecation-usage` | reasoning | fully_autonomous | Check for deprecated API usage (AI module, Drupal core) |
| `validate-permissions` | reasoning | fully_autonomous | Validate permission definitions |
| `validate-ai-agent-plugin` | reasoning | fully_autonomous | Validate AgentPluginBase implementations |
| `validate-orchestration-endpoints` | reasoning | fully_autonomous | Check Orchestration module REST endpoint definitions |

### Theme / Frontend Validation
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `theme-testing` | reasoning | fully_autonomous | Test theme templates and assets |
| `twig-validation` | reasoning | fully_autonomous | Validate Twig templates, including SDC component templates |
| `sdc-metadata-validation` | reasoning | fully_autonomous | Validate `*.component.yml` schema, props, slots, CSS/JS |

## Core PHPCS Configuration

```xml
<!-- phpcs.xml.dist -->
<?xml version="1.0"?>
<ruleset name="Drupal">
  <description>Drupal coding standards — DrupalCMS 2.0 / Drupal 11</description>

  <file>./src</file>
  <file>./modules</file>
  <file>./themes</file>
  <file>./components</file><!-- SDC components -->

  <arg name="extensions" value="php,module,inc,install,test,profile,theme"/>
  <arg name="colors"/>
  <arg value="sp"/>

  <rule ref="Drupal"/>
  <rule ref="DrupalPractice"/>

  <!-- Drupal.org specific -->
  <rule ref="Drupal.InfoFiles.AutoAddedKeys"/>
  <rule ref="Drupal.Commenting.DocComment"/>
</ruleset>
```

## PHPStan Configuration

```neon
# phpstan.neon
includes:
  - vendor/mglaman/phpstan-drupal/extension.neon
  - vendor/phpstan/phpstan-deprecation-rules/rules.neon

parameters:
  level: 8
  paths:
    - src
    - modules
    - themes/custom
  drupal:
    drupal_root: web
  ignoreErrors:
    - '#Call to deprecated method#'
    - '#deprecated class Drupal\\ai#' # temporary during AI module migration
```

## Validation Workflow

### Phase 1: PHPCS + PHPStan

```bash
# Check standards
vendor/bin/phpcs --standard=Drupal,DrupalPractice \
  --extensions=php,module,inc,install,test,profile,theme \
  modules/custom/my_module

# Auto-fix violations
vendor/bin/phpcbf --standard=Drupal,DrupalPractice \
  modules/custom/my_module

# PHPStan with Drupal extension
vendor/bin/phpstan analyse --level=8 \
  --configuration=phpstan.neon \
  modules/custom/my_module
```

### Phase 2: ESLint + SDC Validation

```bash
# JavaScript / TypeScript
npx eslint themes/custom/my_theme/js/ \
  --config .eslintrc.json

# Validate SDC component metadata (*.component.yml)
drush sdc:validate my_theme:my-card
# or
php vendor/bin/phpcs --standard=Drupal components/
```

### Phase 3: AI Module — Tool API Contract Validation

Modules that register AI Tools must implement `ToolInterface` or extend `ToolBase`. Validate:

```php
<?php
// VALID: Tool API plugin implementing ToolInterface
namespace Drupal\my_module\Plugin\AiTool;

use Drupal\ai\Attribute\AiTool;
use Drupal\ai\PluginInterfaces\AiToolInterface;
use Drupal\ai\PluginBase\AiToolBase;

/**
 * My custom AI tool.
 */
#[AiTool(
  id: 'my_module_check_standards',
  label: new TranslatableMarkup('Check Drupal Standards'),
  description: new TranslatableMarkup('Runs PHPCS on a given module path.'),
  input_schema: [
    'type' => 'object',
    'properties' => [
      'module_path' => ['type' => 'string', 'description' => 'Path to module'],
    ],
    'required' => ['module_path'],
  ],
)]
class CheckStandardsTool extends AiToolBase {

  /**
   * {@inheritdoc}
   */
  public function execute(array $input): array {
    // Tool logic here
    return ['result' => '...', 'errors' => 0, 'warnings' => 0];
  }

}
```

**Validation checks for Tool API:**
- Plugin attribute `#[AiTool(...)]` present and complete
- `input_schema` follows JSON Schema format
- `execute()` method returns typed array
- Service dependencies injected (not `\Drupal::service(...)`)
- Tool is registered in `services.yml` with `tags: [{ name: ai.tool }]`

### Phase 4: AI Agent Plugin Validation

```php
<?php
// VALID: Custom AI Agent using ai_agents plugin system
namespace Drupal\my_module\Plugin\AiAgent;

use Drupal\ai_agents\Attribute\AiAgent;
use Drupal\ai_agents\PluginBase\AgentPluginBase;

/**
 * Drupal standards validation agent.
 */
#[AiAgent(
  id: 'drupal_standards_agent',
  label: new TranslatableMarkup('Drupal Standards Agent'),
  description: new TranslatableMarkup('Validates Drupal coding standards.'),
)]
class DrupalStandardsAgent extends AgentPluginBase {

  /**
   * {@inheritdoc}
   */
  public function deterministic(): bool {
    return TRUE;
  }

  /**
   * {@inheritdoc}
   */
  public function getTools(): array {
    return [
      'my_module_check_standards',
    ];
  }

}
```

**Validation checks for AI Agents:**
- `#[AiAgent(...)]` attribute complete with `id`, `label`, `description`
- `getTools()` returns registered Tool API IDs only
- Agent registered in services.yml with `tags: [{ name: ai_agents.agent }]`
- `deterministic()` correctly declared
- Max loops set appropriately (default 10)

### Phase 5: OSSA Manifest Validation (ai_agents_ossa)

```yaml
# VALID: OSSA v0.4.0 manifest (agent.ossa.yaml)
ossa_version: v0.4.0
agent:
  id: drupal-standards-worker
  namespace: blueflyio
  label: Drupal Standards Worker
  description: Validates Drupal coding standards for contrib-ready modules
  version: 2.0.0
  tier: worker
  autonomy: fully_autonomous
  domain: drupal

capabilities:
  - id: phpcs-validation
    category: reasoning
    autonomy: fully_autonomous
    description: Run PHP CodeSniffer with Drupal standards

  - id: tool-api-contract-check
    category: reasoning
    autonomy: fully_autonomous
    description: Validate AI Tool API plugin contracts

access:
  tier: tier_2_write_limited
  permissions:
    - read:code
    - read:repository
    - read:configuration
    - write:repository
  prohibited:
    - write:credentials
    - write:secrets
```

**Validate via Drush (ai_agents_ossa):**
```bash
drush ai-ossa:validate agent.ossa.yaml
drush ai-ossa:import agent.ossa.yaml
drush ai-ossa:list
```

### Phase 6: ECA Configuration Validation

ECA (Event-Condition-Action) config entities are YAML-based. Validate:

```yaml
# VALID: ECA model integrating with AI Agents
id: my_module_content_update_agent
label: 'Content Update AI Agent Trigger'
status: true
model:
  id: my_module_content_update_agent
events:
  node_insert:
    plugin: eca_content:entity:insert
    configuration:
      entity_type_id: node
conditions:
  content_type_check:
    plugin: eca_content:entity_bundle
    configuration:
      bundle: article
actions:
  trigger_ai_agent:
    plugin: ai_agents:run_agent
    configuration:
      agent_id: drupal_standards_agent
      input: '[node:title]'
```

**ECA validation checks:**
- All plugin IDs resolve to registered plugins
- Condition logic consistent (no circular dependencies)
- AI agent IDs match registered `ai_agents.agent` plugins
- Config schema passes `drush config:validate`

### Phase 7: FlowDrop Node Processor Validation

```php
<?php
// VALID: Custom FlowDrop node processor
namespace Drupal\my_module\Plugin\FlowDropNodeProcessor;

use Drupal\flowdrop\Attribute\FlowDropNodeProcessor;
use Drupal\flowdrop\PluginBase\NodeProcessorBase;

/**
 * PHPCS node processor for FlowDrop.
 */
#[FlowDropNodeProcessor(
  id: 'my_module_phpcs_processor',
  label: new TranslatableMarkup('Run PHPCS'),
  category: 'drupal_standards',
  inputs: [
    'module_path' => ['type' => 'string', 'required' => TRUE],
    'standard' => ['type' => 'string', 'default' => 'Drupal'],
  ],
  outputs: [
    'errors' => ['type' => 'integer'],
    'warnings' => ['type' => 'integer'],
    'report' => ['type' => 'string'],
  ],
)]
class PhpcsNodeProcessor extends NodeProcessorBase {

  /**
   * {@inheritdoc}
   */
  public function process(array $input, array $context): array {
    // Processor logic
    return ['errors' => 0, 'warnings' => 0, 'report' => '...'];
  }

}
```

**FlowDrop validation checks:**
- `#[FlowDropNodeProcessor(...)]` attribute complete
- Input/output schema types are valid JSON Schema primitives
- `process()` returns all declared outputs
- Node Type config at `/admin/structure/flowdrop-node-type` matches processor

### Phase 8: Drupal Canvas / SDC Component Validation

Single Directory Components (SDC) are the building blocks of Drupal Canvas and DrupalCMS 2.0.

```yaml
# VALID: SDC component metadata (my-card.component.yml)
$schema: 'https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/assets/schemas/v1/metadata.schema.json'
name: My Card
description: A reusable card component for Drupal Canvas.
status: stable
props:
  type: object
  properties:
    title:
      type: string
      title: Title
    description:
      type: string
      title: Description
    image:
      $ref: 'ui-patterns://image'
      title: Image
slots:
  footer:
    title: Footer content
libraryOverrides:
  css:
    component:
      css/my-card.css: {}
  js:
    js/my-card.js: {}
```

**SDC validation checks (via `drush sdc:validate`):**
- `$schema` field present and correct
- All `props` have `type` and `title`
- Slot definitions valid
- CSS and JS files exist relative to component directory
- Twig template filename matches component ID (`my-card.twig`)
- No hardcoded strings in Twig (use `props.title`, not `'Title'`)
- Canvas AI compatibility: component generates from prompts if `canvas_ai: true`

```bash
# Validate all SDC components in a theme
drush sdc:validate my_theme

# List all available components
drush sdc:list
```

### Phase 9: Drupal.org Compliance

```bash
# Check info.yml files
drupal-check modules/custom/my_module

# Full compliance checklist:
# - No development dependencies in info.yml
# - Proper version format (^11 || ^10.3)
# - Required fields: name, type, description, core_version_requirement
# - project field set (added by drupal.org packager)
# - No hardcoded localhost URLs
# - No TODO/FIXME in production code
# - GPL-2.0-or-later license
# - OSSA manifest valid if registering as AI agent
```

## Module Structure Validation

```yaml
required_structure:
  standard_module:
    - "my_module.info.yml"
    - "my_module.module"            # (optional) Hooks
    - "my_module.services.yml"      # Service definitions
    - "my_module.routing.yml"       # Routes
    - "my_module.permissions.yml"   # Permissions
    - "src/"                        # PHP classes
    - "config/install/"             # Default config
    - "config/schema/"              # Config schema (required for drupal.org)
    - "tests/"                      # Tests
    - "composer.json"               # Composer metadata

  ai_agent_module:
    - "my_module.info.yml"          # Declare: drupal/ai_agents dependency
    - "my_module.services.yml"      # Register tools + agents with tags
    - "src/Plugin/AiTool/"          # Tool API plugins
    - "src/Plugin/AiAgent/"         # Agent plugins
    - "agent.ossa.yaml"             # OSSA v0.4.0 manifest (if registering externally)
    - "config/install/ai_agents.*"  # Default agent config entities
    - "tests/"

  eca_module:
    - "my_module.info.yml"          # Declare: drupal/eca dependency
    - "src/Plugin/ECA/Condition/"   # Custom ECA conditions
    - "src/Plugin/ECA/Action/"      # Custom ECA actions
    - "src/Plugin/ECA/Event/"       # Custom ECA events
    - "config/install/eca.*.yml"    # Default ECA models

  flowdrop_module:
    - "my_module.info.yml"          # Declare: drupal/flowdrop dependency
    - "src/Plugin/FlowDropNodeProcessor/" # Node processor plugins
    - "config/install/flowdrop_node_type.*" # Default node types

  canvas_theme:
    - "my_theme.info.yml"
    - "my_theme.theme"
    - "components/"                 # SDC components directory
    - "components/my-card/"
    - "components/my-card/my-card.component.yml"
    - "components/my-card/my-card.twig"
    - "components/my-card/css/"
    - "components/my-card/js/"
    - "templates/"                  # Non-SDC Twig templates
```

## Hook Implementations — Procedural and OO (Drupal 11.3+)

```php
<?php
// VALID: Procedural hook (Drupal 11)
/**
 * Implements hook_form_alter().
 */
function my_module_form_alter(array &$form, FormStateInterface $form_state, string $form_id): void {
  // Implementation
}

// VALID: OO attribute-based hook (Drupal 11.3+, preferred)
use Drupal\Core\Hook\Attribute\Hook;

class MyModuleHooks {

  /**
   * Implements hook_form_alter() via OO hooks.
   */
  #[Hook('form_alter')]
  public function formAlter(array &$form, FormStateInterface $form_state, string $form_id): void {
    // Implementation — no procedural function needed
  }

}

// INVALID — missing return type and implements comment
function my_module_form_alter(&$form, $form_state, $form_id) {
  // Will fail PHPCS + PHPStan
}
```

## Services.yml Validation — AI-Aware

```yaml
# Valid services.yml — module with AI Tools + ECA Actions
services:
  my_module.my_service:
    class: Drupal\my_module\MyService
    arguments:
      - '@entity_type.manager'
      - '@config.factory'
      - '@ai.provider_manager'        # Inject AI provider manager
      - '@logger.channel.my_module'

  # Tool API plugin registration
  my_module.check_standards_tool:
    class: Drupal\my_module\Plugin\AiTool\CheckStandardsTool
    tags:
      - { name: ai.tool }

  # AI Agent plugin registration
  my_module.drupal_standards_agent:
    class: Drupal\my_module\Plugin\AiAgent\DrupalStandardsAgent
    tags:
      - { name: ai_agents.agent }

  # FlowDrop node processor registration
  my_module.phpcs_node_processor:
    class: Drupal\my_module\Plugin\FlowDropNodeProcessor\PhpcsNodeProcessor
    tags:
      - { name: flowdrop.node_processor }
```

## Common Violations

```yaml
phpcs_violations:
  critical:
    - "Drupal.Commenting.DocComment.Missing"
    - "Drupal.Files.EndFileNewline"
    - "Drupal.Commenting.FunctionComment.Missing"
    - "Drupal.Commenting.FunctionComment.MissingReturnType"

  major:
    - "Drupal.NamingConventions.ValidFunctionName"
    - "Drupal.NamingConventions.ValidVariableName"
    - "DrupalPractice.CodeAnalysis.VariableAnalysis"

  minor:
    - "Drupal.WhiteSpace.ScopeIndent"
    - "Drupal.Commenting.InlineComment.SpacingAfter"
    - "Drupal.Arrays.Array.LongLineDeclaration"

ai_module_violations:
  critical:
    - "Tool plugin missing #[AiTool] attribute"
    - "Agent plugin missing #[AiAgent] attribute"
    - "Tool not registered in services.yml with ai.tool tag"
    - "execute() method missing return type array"
    - "OSSA manifest missing required fields (id, version, capabilities)"

  major:
    - "Tool input_schema not valid JSON Schema"
    - "Agent getTools() references unregistered tool IDs"
    - "ECA action plugin ID not found in registry"
    - "FlowDrop processor output schema mismatch"

  minor:
    - "SDC component missing canvas_ai: true flag"
    - "SDC component Twig using hardcoded strings instead of props"
    - "OSSA manifest version is outdated (< v0.4.0)"

sdc_violations:
  critical:
    - "Missing $schema field in *.component.yml"
    - "CSS/JS files declared but not found"
    - "Twig template filename does not match component ID"
  major:
    - "Prop missing type declaration"
    - "Slot missing title"
```

## Validation Report Template

```markdown
## Drupal Standards Report

### Module: my_module
- **Drupal Version**: 11.2+
- **PHP Version**: 8.3
- **DrupalCMS**: 2.0 compatible

### PHPCS Results
| Severity | Count |
|----------|-------|
| Errors   | 5     |
| Warnings | 12    |

**Top Violations:**
1. Missing DocBlock — 5 instances
2. Missing return type — 3 instances
3. Line length — 2 instances

### PHPStan Results
- **Level**: 8
- **Errors**: 3

**Issues:**
1. Parameter type mismatch in MyService::process()
2. Undefined method on EntityInterface
3. Deprecated function call (AI module 1.1 → 1.2 migration)

### AI Module Compliance
- [x] Tool API plugins have `#[AiTool]` attribute
- [x] Agent plugins have `#[AiAgent]` attribute
- [x] Tools registered with `ai.tool` service tag
- [ ] OSSA manifest missing `capabilities[].autonomy`
- [x] `execute()` returns typed array

### ECA Configuration
- [x] All event plugin IDs resolve
- [x] All action plugin IDs resolve
- [ ] Condition `entity_bundle` missing bundle config

### FlowDrop Validation
- [x] Node processor plugin attribute complete
- [x] Input/output schema valid
- [ ] Node Type config missing for `my_module_phpcs_processor`

### SDC / Canvas Components
- [x] `$schema` field present
- [x] Props have type + title
- [ ] CSS file `css/my-card.css` declared but not found
- [ ] `canvas_ai: true` not set — component won't be available for Canvas AI page building

### OSSA Manifest (ai_agents_ossa)
- [x] OSSA version: v0.4.0
- [x] Required fields present
- [ ] Capability `phpstan-analysis` missing `autonomy` field

### Drupal.org Compliance
- [x] Valid info.yml
- [x] No dev dependencies exposed
- [ ] Missing project field (added by drupal.org packager)
- [x] Valid version format (`^11.2`)
- [x] config/schema/ present

### Auto-Fixed
- 8 whitespace issues
- 3 array formatting issues
- 2 missing blank lines after opening braces

### Remaining Manual Fixes
1. Add missing DocBlocks (5 functions)
2. Fix PHPStan type errors (3)
3. Add `autonomy` to OSSA capability definitions
4. Create missing CSS file for SDC component
5. Add `canvas_ai: true` to SDC metadata for Canvas AI support
6. Fix ECA condition bundle configuration
```

## Access Control (OSSA v0.4.0 Spec)

```yaml
access:
  tier: tier_2_write_limited
  permissions:
    - read:code
    - read:repository
    - read:configuration
    - write:repository
  prohibited:
    - write:credentials
    - write:secrets
    - write:ai_provider_keys
```

## Drupal Configuration

```yaml
extensions:
  drupal:
    version: "^11.2"
    cms_version: "2.0"
    php_version: "8.3"
    standards:
      - Drupal
      - DrupalPractice
    phpstan_level: 8
    hook_style: "oo_preferred"   # Prefer OO attribute hooks (Drupal 11.3+)
    canvas: true                 # Validate SDC components
    ai_agents_ossa: "v0.4.0"    # OSSA manifest version
```

## Integration with Claude Code

This skill is triggered by phrases like:
- "Check Drupal standards" / "Run PHPCS on my module"
- "Fix PHPCS violations"
- "Is this module Drupal.org ready?"
- "Validate my Canvas theme" / "Check my SDC components"
- "Validate my ECA config"
- "Check my AI Tool API plugin"
- "Validate my OSSA manifest"
- "Is this FlowDrop node processor valid?"
- "Check my AI agent plugin"
- "Is this DrupalCMS 2.0 compatible?"
- "Validate my Orchestration endpoint"

## Examples

### Full Standards Check
```
User: Check standards for modules/custom/my_module
Agent: Running PHPCS... 5 errors, 12 warnings
       Running PHPStan level 8... 3 errors
       Checking AI Tool API plugins... 1 issue (missing service tag)
       Checking OSSA manifest... 1 issue (missing capability autonomy)
       Checking Drupal.org compliance... 1 issue
       [Detailed report]
```

### AI Agent Module Check
```
User: Validate my AI agent module
Agent: Checking Tool API plugins... OK (3 tools found, all tagged correctly)
       Checking Agent plugins... 1 issue (missing getTools() return)
       Validating OSSA manifest... OK (v0.4.0)
       Checking services.yml tags... OK
       [Report + fix suggestions]
```

### Canvas Theme Validation
```
User: Validate my Drupal Canvas theme
Agent: Checking SDC component structure... 4 components found
       Validating *.component.yml metadata... 1 issue (missing CSS file)
       Validating Twig templates... 2 issues (hardcoded strings)
       Checking canvas_ai compatibility... 2 of 4 components Canvas AI ready
       Checking CSS/JS... OK
```

### ECA + FlowDrop Workflow Validation
```
User: Validate my ECA model and FlowDrop workflow
Agent: Validating ECA model config... 1 issue (invalid condition plugin ID)
       Validating FlowDrop node processors... OK
       Checking AI agent integration... OK (agent IDs match registry)
       [Report]
```

## Service Account

- **Account**: bot-drupal-prod
- **ID**: 31840511
- **Group**: blueflyio
- **Permissions**: Developer (write:repository)

## Related Agents

- `module-scaffolder` — Scaffold new modules with AI Tools, ECA, FlowDrop, or Canvas SDC structure
- `recipe-publisher` — Publish validated modules and DrupalCMS 2.0 recipes
- `code-reviewer` — General code review
- `ossa-registry-agent` — Register agents with OSSA manifest via ai_agents_ossa REST API
- `orchestration-connector` — Wire Drupal Orchestration endpoints to external platforms (Activepieces, n8n, Zapier)

## References

- [OSSA v0.4.0 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [Drupal AI module](https://www.drupal.org/project/ai)
- [AI Agents module](https://www.drupal.org/project/ai_agents) — 1.2.x stable
- [AI Agents OSSA module](https://www.drupal.org/project/ai_agents_ossa)
- [ECA module](https://www.drupal.org/project/eca)
- [Orchestration module](https://www.drupal.org/project/orchestration)
- [FlowDrop module](https://www.drupal.org/project/flowdrop)
- [Drupal Canvas](https://www.drupal.org/project/canvas) — 1.1.0, default in DrupalCMS 2.0
- [DrupalCMS 2.0 Release](https://www.drupal.org/project/cms/releases/2.0.0)
- [MCP module](https://www.drupal.org/project/mcp)
- [Drupal Coding Standards](https://www.drupal.org/docs/develop/standards)
- [Drupal.org Module Guidelines](https://www.drupal.org/docs/develop/managing-a-drupalorg-theme-module-or-distribution-project)
- [Single Directory Components](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components)
- [Drupal AI Initiative — State of Drupal Oct 2025](https://www.drupal.org/blog/state-of-drupal-presentation-october-2025)