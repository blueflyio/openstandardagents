/**
 * Drupal Module Generator for OSSA Agents
 *
 * Generates complete, production-ready Drupal modules from OSSA agent manifests.
 * Uses modern PHP 8 syntax: attributes instead of annotations, OO hook classes,
 * constructor property promotion, and Drupal AI module integration.
 *
 * Generated modules include:
 * - MODULE.info.yml (module metadata)
 * - MODULE.services.yml (DI configuration)
 * - src/Service/AgentExecutorService.php (uses drupal/ai provider system)
 * - src/Plugin/QueueWorker/ (async execution with #[QueueWorker] attribute)
 * - src/Plugin/Tool/ (Tool API plugins with #[Tool] attributes)
 * - src/Plugin/Action/ (Action plugins for CUD tools with #[Action] attributes)
 * - src/Plugin/Condition/ (Condition plugins from safety guardrails with #[Condition] attributes)
 * - src/Controller/ (admin UI and API endpoints)
 * - src/Entity/ (agent result storage with #[ContentEntityType] attribute)
 * - src/Form/ (configuration forms)
 * - src/Hook/ (OO hook classes with #[Hook] attributes)
 * - MODULE.module (minimal procedural hooks)
 * - templates/*.html.twig (Twig templates)
 * - composer.json (with drupal/ai, drupal/ai_agents, drupal/tool)
 * - config/schema/MODULE.schema.yml (configuration schema)
 * - config/install/*.yml (default configuration)
 * - config/install/eca.model.*.yml (ECA event-condition-action models)
 *
 * SOLID Principles:
 * - Single Responsibility: Drupal module generation only
 * - Dependency Inversion: Uses Drupal AI module for LLM provider access
 * - Interface Segregation: Separate interfaces for different module components
 *
 * DRY: Reuses Drupal AI module patterns, no duplication
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportFile,
  ExportOptions,
  ExportResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';
import {
  sanitizeModuleName,
  toClassName,
  toLabel,
  validateDrupalCompatibility,
  buildValidationResult,
  extractCapabilities,
  extractTools,
  mapOssaToolToDrupalTool,
} from './drupal-utils.js';
import type { OssaToolEntry, DrupalToolDefinition } from './drupal-utils.js';

export interface DrupalModuleGeneratorOptions extends ExportOptions {
  /** Include Queue Worker for async execution */
  includeQueueWorker?: boolean;
  /** Include Entity for result storage */
  includeEntity?: boolean;
  /** Include Controller with admin UI */
  includeController?: boolean;
  /** Include Configuration Form */
  includeConfigForm?: boolean;
  /** Include Drupal hooks (entity_presave, cron) */
  includeHooks?: boolean;
  /** Include Views integration */
  includeViews?: boolean;
  /** Include Tool API plugins for each spec.tools[] entry */
  includeToolPlugins?: boolean;
  /** Include ECA model YAML for event-driven triggers */
  includeEcaModels?: boolean;
  /** Include Action plugins for CUD tools (create/update/delete) */
  includeActionPlugins?: boolean;
  /** Include Condition plugins from safety guardrails */
  includeConditionPlugins?: boolean;
  /** Drupal core version requirement */
  coreVersion?: string;
}

export class DrupalModuleGenerator extends BaseAdapter {
  readonly platform = 'drupal';
  readonly displayName = 'Drupal Module (Full)';
  readonly description =
    'Production-ready Drupal module with OSSA/AI module integration';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v{{VERSION}}'];

  /**
   * Generate complete Drupal module from OSSA manifest
   */
  async export(
    manifest: OssaAgent,
    options?: DrupalModuleGeneratorOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // Validate manifest
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            {
              duration: Date.now() - startTime,
              warnings: validation.warnings?.map((w) => w.message),
            }
          );
        }
      }

      const moduleName = sanitizeModuleName(
        manifest.metadata?.name || 'ossa_agent'
      );
      const className = toClassName(moduleName);

      // Default options
      const opts = {
        includeQueueWorker: true,
        includeEntity: true,
        includeController: true,
        includeConfigForm: true,
        includeHooks: true,
        includeViews: true,
        includeToolPlugins: true,
        includeEcaModels: true,
        includeActionPlugins: true,
        includeConditionPlugins: true,
        coreVersion: '^10 || ^11',
        validate: options?.validate ?? true,
        ...options,
      };

      const files: ExportFile[] = [];

      // ===================================================================
      // Core Module Files
      // ===================================================================

      // MODULE.info.yml
      files.push(
        this.createFile(
          `${moduleName}/${moduleName}.info.yml`,
          this.generateInfoYml(manifest, moduleName, opts),
          'config'
        )
      );

      // MODULE.services.yml
      files.push(
        this.createFile(
          `${moduleName}/${moduleName}.services.yml`,
          this.generateServicesYml(manifest, moduleName, className, opts),
          'config'
        )
      );

      // composer.json
      files.push(
        this.createFile(
          `${moduleName}/composer.json`,
          this.generateComposerJson(manifest, moduleName),
          'config'
        )
      );

      // MODULE.module (minimal procedural hooks)
      if (opts.includeHooks) {
        files.push(
          this.createFile(
            `${moduleName}/${moduleName}.module`,
            this.generateModuleHooks(manifest, moduleName, className),
            'code',
            'php'
          )
        );

        // OO Hook classes (PHP 8 attribute-based hooks)
        const hookFiles = this.generateHookClasses(manifest, moduleName, className);
        files.push(...hookFiles);
      }

      // ===================================================================
      // Service Classes
      // ===================================================================

      // src/Service/AgentExecutorService.php
      files.push(
        this.createFile(
          `${moduleName}/src/Service/AgentExecutorService.php`,
          this.generateAgentExecutorService(manifest, moduleName, className),
          'code',
          'php'
        )
      );

      // ===================================================================
      // Queue Worker (Async Execution)
      // ===================================================================

      if (opts.includeQueueWorker) {
        files.push(
          this.createFile(
            `${moduleName}/src/Plugin/QueueWorker/AgentQueueWorker.php`,
            this.generateQueueWorker(manifest, moduleName, className),
            'code',
            'php'
          )
        );
      }

      // ===================================================================
      // Entity (Result Storage)
      // ===================================================================

      if (opts.includeEntity) {
        // Entity class
        files.push(
          this.createFile(
            `${moduleName}/src/Entity/AgentResult.php`,
            this.generateEntityClass(manifest, moduleName, className),
            'code',
            'php'
          )
        );

        // Entity interface
        files.push(
          this.createFile(
            `${moduleName}/src/Entity/AgentResultInterface.php`,
            this.generateEntityInterface(moduleName),
            'code',
            'php'
          )
        );

        // Views data
        if (opts.includeViews) {
          files.push(
            this.createFile(
              `${moduleName}/${moduleName}.views.inc`,
              this.generateViewsData(moduleName, className),
              'code',
              'php'
            )
          );
        }
      }

      // ===================================================================
      // Controller (Admin UI + API)
      // ===================================================================

      if (opts.includeController) {
        files.push(
          this.createFile(
            `${moduleName}/src/Controller/AgentController.php`,
            this.generateController(manifest, moduleName, className),
            'code',
            'php'
          )
        );

        // Routing
        files.push(
          this.createFile(
            `${moduleName}/${moduleName}.routing.yml`,
            this.generateRouting(moduleName),
            'config'
          )
        );
      }

      // ===================================================================
      // Configuration Form
      // ===================================================================

      if (opts.includeConfigForm) {
        files.push(
          this.createFile(
            `${moduleName}/src/Form/AgentConfigForm.php`,
            this.generateConfigForm(manifest, moduleName, className),
            'code',
            'php'
          )
        );

        // Menu links
        files.push(
          this.createFile(
            `${moduleName}/${moduleName}.links.menu.yml`,
            this.generateMenuLinks(moduleName),
            'config'
          )
        );
      }

      // ===================================================================
      // Tool API Plugins (drupal/tool integration)
      // ===================================================================

      const tools = extractTools(manifest);
      if (opts.includeToolPlugins && tools.length > 0) {
        for (const tool of tools) {
          const drupalTool = mapOssaToolToDrupalTool(tool, moduleName);
          const toolClassName = toClassName(
            sanitizeModuleName(tool.name || 'unknown_tool')
          );

          // Tool plugin class
          files.push(
            this.createFile(
              `${moduleName}/src/Plugin/Tool/${toolClassName}Tool.php`,
              this.generateToolPlugin(
                manifest,
                moduleName,
                className,
                tool,
                drupalTool
              ),
              'code',
              'php'
            )
          );

          // Tool AI connector config
          files.push(
            this.createFile(
              `${moduleName}/config/install/tool_ai_connector.tool.${drupalTool.id}.yml`,
              this.generateToolAiConnectorConfig(drupalTool),
              'config'
            )
          );
        }
      }

      // ===================================================================
      // ECA Model YAML (Event-Condition-Action)
      // ===================================================================

      const ecaEvents = this.extractEcaEvents(manifest);
      if (opts.includeEcaModels && ecaEvents.length > 0) {
        const ecaFiles = this.generateEcaModels(manifest, moduleName, ecaEvents);
        files.push(...ecaFiles);
      }

      // ===================================================================
      // Action Plugins (for CUD tools: create/update/delete)
      // ===================================================================

      if (opts.includeActionPlugins && tools.length > 0) {
        const actionFiles = this.generateActionPlugins(manifest, moduleName, tools);
        files.push(...actionFiles);
      }

      // ===================================================================
      // Condition Plugins (from safety guardrails)
      // ===================================================================

      if (opts.includeConditionPlugins) {
        const conditionFiles = this.generateConditionPlugins(manifest, moduleName);
        files.push(...conditionFiles);
      }

      // ===================================================================
      // Configuration Schema
      // ===================================================================

      files.push(
        this.createFile(
          `${moduleName}/config/schema/${moduleName}.schema.yml`,
          this.generateConfigSchema(moduleName),
          'config'
        )
      );

      // Default configuration
      files.push(
        this.createFile(
          `${moduleName}/config/install/${moduleName}.settings.yml`,
          this.generateDefaultConfig(manifest),
          'config'
        )
      );

      // ===================================================================
      // Templates
      // ===================================================================

      files.push(
        this.createFile(
          `${moduleName}/templates/agent-result.html.twig`,
          this.generateAgentResultTemplate(moduleName),
          'other'
        )
      );

      files.push(
        this.createFile(
          `${moduleName}/templates/agent-execute-form.html.twig`,
          this.generateExecuteFormTemplate(moduleName),
          'other'
        )
      );

      // ===================================================================
      // Documentation
      // ===================================================================

      files.push(
        this.createFile(
          `${moduleName}/README.md`,
          this.generateReadme(manifest, moduleName, opts),
          'documentation'
        )
      );

      files.push(
        this.createFile(
          `${moduleName}/INSTALL.md`,
          this.generateInstallGuide(manifest, moduleName),
          'documentation'
        )
      );

      // ===================================================================
      // Original OSSA Manifest
      // ===================================================================

      files.push(
        this.createFile(
          `${moduleName}/config/ossa/agent.ossa.yaml`,
          JSON.stringify(manifest, null, 2),
          'config'
        )
      );

      // ===================================================================
      // Recipe (Composable Installation)
      // ===================================================================

      files.push(
        this.createFile(
          `${moduleName}/recipes/${moduleName}-agent/recipe.yml`,
          this.generateRecipe(manifest, moduleName, tools),
          'config'
        )
      );

      // Perfect Agent files
      files.push(...await this.generatePerfectAgentFiles(manifest, options));

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '1.0.0',
        moduleName,
      });
    } catch (error) {
      return this.createResult(
        false,
        [],
        error instanceof Error ? error.message : String(error),
        { duration: Date.now() - startTime }
      );
    }
  }

  /**
   * Validate manifest for Drupal compatibility
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Base validation
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // Drupal-specific validation
    const drupalValidation = validateDrupalCompatibility(manifest);
    errors.push(...drupalValidation.errors);
    warnings.push(...drupalValidation.warnings);

    return buildValidationResult(errors, warnings);
  }

  /**
   * Get example manifest optimized for Drupal
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
      kind: 'Agent',
      metadata: {
        name: 'content_moderator',
        version: '1.0.0',
        description: 'AI-powered content moderation agent for Drupal',
      },
      spec: {
        role: 'Review and moderate user-generated content for quality and compliance',
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          maxTokens: 2048,
        } as any,
        capabilities: [
          'content-analysis',
          'spam-detection',
          'sentiment-analysis',
          'auto-moderation',
        ] as any,
        tools: [
          {
            type: 'api',
            name: 'analyze_content',
            description: 'Analyze content for spam, toxicity, and quality',
          },
          {
            type: 'api',
            name: 'moderate_node',
            description: 'Publish, unpublish, or flag a Drupal node',
            operation: 'update',
          },
          {
            type: 'api',
            name: 'delete_spam',
            description: 'Delete confirmed spam content',
            operation: 'delete',
          },
        ],
        safety: {
          guardrails: [
            {
              name: 'block_profanity',
              type: 'input' as const,
              blocked_patterns: ['badword1', 'badword2'],
            },
            {
              name: 'max_output_length',
              type: 'output' as const,
              maxLength: 5000,
            },
          ],
        },
      },
      extensions: {
        drupal: {
          eca_events: ['entity:node:presave'],
        },
      },
    } as any;
  }

  // ===================================================================
  // Generator Methods
  // ===================================================================

  /**
   * Generate MODULE.info.yml
   */
  private generateInfoYml(
    manifest: OssaAgent,
    moduleName: string,
    options: DrupalModuleGeneratorOptions
  ): string {
    const dependencies = ['ai:ai', 'ai:ai_agents'];

    if (options.includeEntity) {
      dependencies.push('drupal:views');
    }

    return `name: '${manifest.metadata?.name || moduleName}'
type: module
description: '${manifest.metadata?.description || 'OSSA agent module'}'
core_version_requirement: ${options.coreVersion}
package: 'OSSA Agents'

dependencies:
${dependencies.map((d) => `  - ${d}`).join('\n')}

# OSSA metadata
ossa:
  version: '${manifest.metadata?.version || '1.0.0'}'
  api_version: '${manifest.apiVersion || 'ossa/v{{VERSION}}'}'
  kind: '${manifest.kind || 'Agent'}'
`;
  }

  /**
   * Generate MODULE.services.yml with full DI configuration
   */
  private generateServicesYml(
    manifest: OssaAgent,
    moduleName: string,
    className: string,
    options: DrupalModuleGeneratorOptions
  ): string {
    let services = `services:
  # ===================================================================
  # Agent Executor Service (uses Drupal AI module)
  # ===================================================================

  ${moduleName}.agent_executor:
    class: Drupal\\${moduleName}\\Service\\AgentExecutorService
    arguments:
      - '@ai.provider'
      - '@logger.factory'
      - '@config.factory'
      - '@entity_type.manager'
`;

    if (options.includeEntity) {
      services += `      - '@queue'
`;
    }

    services += `    tags:
      - { name: ossa_agent }
`;

    if (options.includeQueueWorker) {
      services += `
  # ===================================================================
  # Queue Service
  # ===================================================================

  ${moduleName}.queue:
    parent: queue
    arguments: ['${moduleName}_agent_queue']
`;
    }

    return services;
  }

  /**
   * Generate composer.json with Drupal AI module dependencies
   */
  private generateComposerJson(
    manifest: OssaAgent,
    moduleName: string
  ): string {
    return JSON.stringify(
      {
        name: `drupal/${moduleName}`,
        type: 'drupal-module',
        description: manifest.metadata?.description || 'OSSA agent module',
        keywords: ['Drupal', 'OSSA', 'AI', 'Agent'],
        license: manifest.metadata?.license || 'GPL-2.0-or-later',
        require: {
          php: '>=8.2',
          'drupal/core': '^10 || ^11',
          'drupal/ai': '^1.0',
          'drupal/ai_agents': '^1.3',
          'drupal/tool': '^1.0@alpha',
        },
        autoload: {
          'psr-4': {
            [`Drupal\\${moduleName}\\`]: 'src/',
          },
        },
        extra: {
          ossa: {
            version: manifest.metadata?.version,
            apiVersion: manifest.apiVersion,
            kind: manifest.kind,
          },
        },
      },
      null,
      2
    );
  }

  /**
   * Generate MODULE.module with minimal procedural hooks.
   *
   * Most hooks are now implemented as OO classes using PHP 8 #[Hook] attributes
   * in src/Hook/. Only hook_help remains procedural as a legacy convention.
   */
  private generateModuleHooks(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

/**
 * @file
 * ${className} module hooks (minimal procedural file).
 *
 * Most hooks are implemented as OO classes in src/Hook/ using
 * PHP 8 #[Hook] attributes. Only legacy procedural hooks remain here.
 */

use Drupal\\Core\\Routing\\RouteMatchInterface;

/**
 * Implements hook_help().
 */
function ${moduleName}_help(string $route_name, RouteMatchInterface $route_match): string|null {
  if ($route_name === 'help.page.${moduleName}') {
    return '<p>' . t('${manifest.metadata?.description || 'OSSA agent module'}') . '</p>';
  }
  return NULL;
}
`;
  }

  /**
   * Generate OO hook classes using PHP 8 #[Hook] attributes.
   *
   * Generates:
   * - src/Hook/CronHooks.php (hook_cron)
   * - src/Hook/EntityHooks.php (hook_entity_presave)
   * - src/Hook/ThemeHooks.php (hook_theme)
   */
  private generateHookClasses(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): ExportFile[] {
    const files = [];

    // src/Hook/CronHooks.php
    files.push(
      this.createFile(
        `${moduleName}/src/Hook/CronHooks.php`,
        this.generateCronHookClass(manifest, moduleName, className),
        'code',
        'php'
      )
    );

    // src/Hook/EntityHooks.php
    files.push(
      this.createFile(
        `${moduleName}/src/Hook/EntityHooks.php`,
        this.generateEntityHookClass(manifest, moduleName, className),
        'code',
        'php'
      )
    );

    // src/Hook/ThemeHooks.php
    files.push(
      this.createFile(
        `${moduleName}/src/Hook/ThemeHooks.php`,
        this.generateThemeHookClass(moduleName),
        'code',
        'php'
      )
    );

    return files;
  }

  /**
   * Generate src/Hook/CronHooks.php
   */
  private generateCronHookClass(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

declare(strict_types=1);

namespace Drupal\\${moduleName}\\Hook;

use Drupal\\Core\\Hook\\Attribute\\Hook;
use Drupal\\Core\\Queue\\QueueFactory;
use Drupal\\Core\\Queue\\QueueWorkerManagerInterface;
use Psr\\Log\\LoggerInterface;

/**
 * Cron hook implementations for ${className}.
 */
class CronHooks {

  public function __construct(
    protected readonly QueueFactory $queueFactory,
    protected readonly QueueWorkerManagerInterface $queueWorkerManager,
    protected readonly LoggerInterface $logger,
  ) {}

  /**
   * Process queued agent tasks during cron.
   */
  #[Hook('cron')]
  public function processCron(): void {
    $queue = $this->queueFactory->get('${moduleName}_agent_queue');
    $queue_worker = $this->queueWorkerManager->createInstance('${moduleName}_agent_queue');

    $processed = 0;
    $max_items = 50;

    while ($processed < $max_items && $item = $queue->claimItem()) {
      try {
        $queue_worker->processItem($item->data);
        $queue->deleteItem($item);
        $processed++;
      }
      catch (\\Exception $e) {
        $this->logger->error('Queue processing failed: @message', [
          '@message' => $e->getMessage(),
        ]);
        $queue->releaseItem($item);
      }
    }

    if ($processed > 0) {
      $this->logger->info('Processed @count agent queue items', [
        '@count' => $processed,
      ]);
    }
  }

}
`;
  }

  /**
   * Generate src/Hook/EntityHooks.php
   */
  private generateEntityHookClass(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

declare(strict_types=1);

namespace Drupal\\${moduleName}\\Hook;

use Drupal\\Core\\Config\\ConfigFactoryInterface;
use Drupal\\Core\\Entity\\EntityInterface;
use Drupal\\Core\\Hook\\Attribute\\Hook;
use Drupal\\Core\\Queue\\QueueFactory;

/**
 * Entity hook implementations for ${className}.
 */
class EntityHooks {

  public function __construct(
    protected readonly ConfigFactoryInterface $configFactory,
    protected readonly QueueFactory $queueFactory,
  ) {}

  /**
   * Queue agent execution on entity save.
   */
  #[Hook('entity_presave')]
  public function entityPresave(EntityInterface $entity): void {
    $config = $this->configFactory->get('${moduleName}.settings');

    if (!$config->get('auto_execute_on_save')) {
      return;
    }

    $enabled_types = $config->get('enabled_entity_types') ?: [];
    if (!in_array($entity->getEntityTypeId(), $enabled_types)) {
      return;
    }

    $queue = $this->queueFactory->get('${moduleName}_agent_queue');
    $queue->createItem([
      'entity_type' => $entity->getEntityTypeId(),
      'entity_id' => $entity->id(),
      'operation' => 'presave',
      'timestamp' => time(),
    ]);
  }

}
`;
  }

  /**
   * Generate src/Hook/ThemeHooks.php
   */
  private generateThemeHookClass(moduleName: string): string {
    return `<?php

declare(strict_types=1);

namespace Drupal\\${moduleName}\\Hook;

use Drupal\\Core\\Hook\\Attribute\\Hook;

/**
 * Theme hook implementations.
 */
class ThemeHooks {

  /**
   * Register theme templates.
   */
  #[Hook('theme')]
  public function theme(): array {
    return [
      'agent_result' => [
        'variables' => [
          'result' => NULL,
          'metadata' => NULL,
        ],
        'template' => 'agent-result',
      ],
      'agent_execute_form' => [
        'render element' => 'form',
        'template' => 'agent-execute-form',
      ],
    ];
  }

}
`;
  }

  /**
   * Generate src/Service/AgentExecutorService.php
   *
   * Uses Drupal AI module for LLM provider integration
   */
  private generateAgentExecutorService(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

declare(strict_types=1);

namespace Drupal\\${moduleName}\\Service;

use Drupal\\ai\\AiProviderPluginManager;
use Drupal\\Core\\Config\\ConfigFactoryInterface;
use Drupal\\Core\\Entity\\EntityTypeManagerInterface;
use Drupal\\Core\\Logger\\LoggerChannelFactoryInterface;
use Drupal\\Core\\Queue\\QueueFactory;

/**
 * Agent Executor Service.
 *
 * Uses the Drupal AI module provider system for LLM execution:
 * - AI provider plugin manager for model access
 * - Entity storage for results
 * - Queue integration for async execution
 * - Drupal configuration integration
 * - Logging integration
 */
class AgentExecutorService {

  public function __construct(
    protected readonly AiProviderPluginManager $aiProvider,
    protected readonly LoggerChannelFactoryInterface $loggerFactory,
    protected readonly ConfigFactoryInterface $configFactory,
    protected readonly EntityTypeManagerInterface $entityTypeManager,
    protected readonly QueueFactory $queueFactory,
  ) {}

  /**
   * Execute the agent synchronously.
   *
   * @param string $input
   *   Input data for the agent.
   * @param array $context
   *   Additional context (Drupal-specific: user_id, site_name, etc.).
   * @param bool $save_result
   *   Whether to save the result to the database.
   *
   * @return array
   *   Agent execution result with 'success', 'output', and 'metadata' keys.
   */
  public function execute(string $input, array $context = [], bool $save_result = TRUE): array {
    $logger = $this->loggerFactory->get('${moduleName}');

    try {
      $logger->info('Agent execution started');

      $context = $this->enrichContext($context);

      $config = $this->configFactory->get('${moduleName}.settings');
      $provider_id = $config->get('llm_provider') ?? 'anthropic';
      $model_id = $config->get('llm_model') ?? 'claude-sonnet-4-20250514';

      /** @var \\Drupal\\ai\\OperationType\\Chat\\ChatInterface $provider */
      $provider = $this->aiProvider->createInstance($provider_id);
      $provider->setConfiguration(['model_id' => $model_id]);

      $messages = new \\Drupal\\ai\\OperationType\\Chat\\ChatInput([
        new \\Drupal\\ai\\OperationType\\Chat\\ChatMessage('user', $input),
      ]);

      $response = $provider->chat($messages, $model_id);

      $result = [
        'success' => TRUE,
        'output' => $response->getNormalized()->getText(),
        'metadata' => [
          'provider' => $provider_id,
          'model' => $model_id,
        ],
      ];

      if ($save_result) {
        $this->saveResult($input, $result);
      }

      $logger->info('Agent execution completed successfully');

      return $result;
    }
    catch (\\Exception $e) {
      $logger->error('Agent execution failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      return [
        'success' => FALSE,
        'error' => $e->getMessage(),
      ];
    }
  }

  /**
   * Execute the agent asynchronously via queue.
   *
   * @param string $input
   *   Input data for the agent.
   * @param array $context
   *   Additional context.
   *
   * @return int
   *   Queue item ID.
   */
  public function executeAsync(string $input, array $context = []): int {
    $queue = $this->queueFactory->get('${moduleName}_agent_queue');

    return $queue->createItem([
      'input' => $input,
      'context' => $context,
      'timestamp' => time(),
    ]);
  }

  /**
   * Execute a specific tool by name.
   *
   * Called by Tool API plugin classes to delegate execution
   * to the OSSA agent executor.
   *
   * @param string $tool_name
   *   The OSSA tool name.
   * @param array $input
   *   Tool input parameters.
   *
   * @return array
   *   Tool execution result.
   */
  public function executeTool(string $tool_name, array $input): array {
    $logger = $this->loggerFactory->get('${moduleName}');

    try {
      $logger->info('Tool execution started: @tool', ['@tool' => $tool_name]);

      $context = $this->enrichContext([
        'tool' => $tool_name,
      ]);

      $response = $this->agentExecutor->executeTool(
        '${manifest.metadata?.name || 'agent'}',
        $tool_name,
        $input,
        $context
      );

      $result = [
        'success' => TRUE,
        'output' => $response->getOutput(),
        'metadata' => $response->getMetadata(),
      ];

      $logger->info('Tool execution completed: @tool', ['@tool' => $tool_name]);

      return $result;
    }
    catch (\\Exception $e) {
      $logger->error('Tool execution failed (@tool): @message', [
        '@tool' => $tool_name,
        '@message' => $e->getMessage(),
      ]);

      return [
        'success' => FALSE,
        'error' => $e->getMessage(),
      ];
    }
  }

  /**
   * Enrich context with Drupal-specific data.
   *
   * @param array $context
   *   Base context.
   *
   * @return array
   *   Enriched context.
   */
  protected function enrichContext(array $context): array {
    $context['site_name'] = $this->configFactory
      ->get('system.site')
      ->get('name');

    $current_user = \\Drupal::currentUser();
    $context['user_id'] = $current_user->id();
    $context['user_name'] = $current_user->getAccountName();
    $context['drupal_version'] = \\Drupal::VERSION;

    $module_config = $this->configFactory->get('${moduleName}.settings');
    $context['module_config'] = $module_config->getRawData();

    return $context;
  }

  /**
   * Save agent result to entity storage.
   *
   * @param string $input
   *   The input that was processed.
   * @param array $result
   *   The execution result.
   */
  protected function saveResult(string $input, array $result): void {
    try {
      $storage = $this->entityTypeManager->getStorage('${moduleName}_result');

      $entity = $storage->create([
        'name' => 'Result ' . date('Y-m-d H:i:s'),
        'input' => $input,
        'output' => $result['output'] ?? '',
        'metadata' => json_encode($result['metadata'] ?? []),
        'status' => $result['success'] ? 'completed' : 'failed',
        'created' => time(),
      ]);

      $entity->save();
    }
    catch (\\Exception $e) {
      $this->loggerFactory->get('${moduleName}')->error(
        'Failed to save result: @message',
        ['@message' => $e->getMessage()]
      );
    }
  }

}
`;
  }

  /**
   * Generate src/Plugin/QueueWorker/AgentQueueWorker.php
   */
  private generateQueueWorker(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

declare(strict_types=1);

namespace Drupal\\${moduleName}\\Plugin\\QueueWorker;

use Drupal\\Core\\Plugin\\ContainerFactoryPluginInterface;
use Drupal\\Core\\Queue\\Attribute\\QueueWorker;
use Drupal\\Core\\Queue\\QueueWorkerBase;
use Drupal\\Core\\StringTranslation\\TranslatableMarkup;
use Drupal\\${moduleName}\\Service\\AgentExecutorService;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;

/**
 * Agent Queue Worker.
 *
 * Processes agent execution tasks asynchronously via Drupal's queue system.
 */
#[QueueWorker(
  id: '${moduleName}_agent_queue',
  title: new TranslatableMarkup('${className} Agent Queue Worker'),
  cron: ['time' => 60],
)]
class AgentQueueWorker extends QueueWorkerBase implements ContainerFactoryPluginInterface {

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected readonly AgentExecutorService $agentExecutor,
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
  ): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('${moduleName}.agent_executor'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function processItem($data): void {
    $input = $data['input'] ?? '';
    $context = $data['context'] ?? [];

    if (empty($input)) {
      throw new \\Exception('Queue item missing required input data');
    }

    $result = $this->agentExecutor->execute($input, $context, TRUE);

    if (!$result['success']) {
      throw new \\Exception($result['error'] ?? 'Agent execution failed');
    }
  }

}
`;
  }

  /**
   * Generate src/Entity/AgentResult.php
   */
  private generateEntityClass(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

declare(strict_types=1);

namespace Drupal\\${moduleName}\\Entity;

use Drupal\\Core\\Entity\\Attribute\\ContentEntityType;
use Drupal\\Core\\Entity\\ContentEntityBase;
use Drupal\\Core\\Entity\\EntityTypeInterface;
use Drupal\\Core\\Entity\\EntityViewBuilder;
use Drupal\\Core\\Entity\\EntityListBuilder;
use Drupal\\Core\\Entity\\EntityAccessControlHandler;
use Drupal\\Core\\Field\\BaseFieldDefinition;
use Drupal\\Core\\StringTranslation\\TranslatableMarkup;
use Drupal\\views\\EntityViewsData;

/**
 * Defines the Agent Result entity.
 *
 * Stores agent execution results for auditing and analysis.
 */
#[ContentEntityType(
  id: '${moduleName}_result',
  label: new TranslatableMarkup('Agent Result'),
  base_table: '${moduleName}_result',
  entity_keys: [
    'id' => 'id',
    'label' => 'name',
    'uuid' => 'uuid',
  ],
  handlers: [
    'view_builder' => EntityViewBuilder::class,
    'list_builder' => EntityListBuilder::class,
    'views_data' => EntityViewsData::class,
    'access' => EntityAccessControlHandler::class,
  ],
  links: [
    'canonical' => '/admin/${moduleName}/result/{${moduleName}_result}',
    'collection' => '/admin/${moduleName}/results',
  ],
)]
class AgentResult extends ContentEntityBase implements AgentResultInterface {

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields = parent::baseFieldDefinitions($entity_type);

    $fields['name'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Name'))
      ->setDescription(t('Result name/title'))
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'hidden',
        'type' => 'string',
        'weight' => -5,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => -5,
      ]);

    $fields['input'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Input'))
      ->setDescription(t('Agent input data'))
      ->setDisplayOptions('view', [
        'label' => 'above',
        'type' => 'text_default',
        'weight' => 0,
      ]);

    $fields['output'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Output'))
      ->setDescription(t('Agent output/response'))
      ->setDisplayOptions('view', [
        'label' => 'above',
        'type' => 'text_default',
        'weight' => 1,
      ]);

    $fields['metadata'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Metadata'))
      ->setDescription(t('Execution metadata (JSON)'))
      ->setDisplayOptions('view', [
        'label' => 'above',
        'type' => 'text_default',
        'weight' => 2,
      ]);

    $fields['status'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Status'))
      ->setSettings([
        'allowed_values' => [
          'pending' => 'Pending',
          'processing' => 'Processing',
          'completed' => 'Completed',
          'failed' => 'Failed',
        ],
      ])
      ->setDefaultValue('pending')
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'list_default',
        'weight' => 3,
      ]);

    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'))
      ->setDescription(t('Creation timestamp'));

    return $fields;
  }
}
`;
  }

  /**
   * Generate src/Entity/AgentResultInterface.php
   */
  private generateEntityInterface(moduleName: string): string {
    return `<?php

namespace Drupal\\${moduleName}\\Entity;

use Drupal\\Core\\Entity\\ContentEntityInterface;

/**
 * Interface for Agent Result entities.
 */
interface AgentResultInterface extends ContentEntityInterface {
}
`;
  }

  /**
   * Generate MODULE.views.inc
   */
  private generateViewsData(moduleName: string, className: string): string {
    return `<?php

/**
 * @file
 * Provide views data for ${moduleName}_result entities.
 */

/**
 * Implements hook_views_data().
 */
function ${moduleName}_views_data() {
  $data = [];

  $data['${moduleName}_result']['table']['group'] = t('Agent Result');
  $data['${moduleName}_result']['table']['base'] = [
    'field' => 'id',
    'title' => t('Agent Result'),
    'help' => t('Agent execution results.'),
  ];

  $data['${moduleName}_result']['id'] = [
    'title' => t('ID'),
    'help' => t('The agent result ID.'),
    'field' => [
      'id' => 'numeric',
    ],
    'sort' => [
      'id' => 'standard',
    ],
    'filter' => [
      'id' => 'numeric',
    ],
  ];

  $data['${moduleName}_result']['name'] = [
    'title' => t('Name'),
    'help' => t('The result name.'),
    'field' => [
      'id' => 'standard',
    ],
    'sort' => [
      'id' => 'standard',
    ],
    'filter' => [
      'id' => 'string',
    ],
  ];

  $data['${moduleName}_result']['status'] = [
    'title' => t('Status'),
    'help' => t('The execution status.'),
    'field' => [
      'id' => 'standard',
    ],
    'sort' => [
      'id' => 'standard',
    ],
    'filter' => [
      'id' => 'string',
    ],
  ];

  $data['${moduleName}_result']['created'] = [
    'title' => t('Created'),
    'help' => t('The creation timestamp.'),
    'field' => [
      'id' => 'date',
    ],
    'sort' => [
      'id' => 'date',
    ],
    'filter' => [
      'id' => 'date',
    ],
  ];

  return $data;
}
`;
  }

  /**
   * Generate src/Controller/AgentController.php
   */
  private generateController(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

namespace Drupal\\${moduleName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Drupal\\${moduleName}\\Service\\AgentExecutorService;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;

/**
 * Agent Controller.
 *
 * Provides admin UI and API endpoints for agent execution.
 */
class AgentController extends ControllerBase {

  /**
   * The agent executor service.
   *
   * @var \\Drupal\\${moduleName}\\Service\\AgentExecutorService
   */
  protected AgentExecutorService $agentExecutor;

  /**
   * {@inheritdoc}
   */
  public function __construct(AgentExecutorService $agent_executor) {
    $this->agentExecutor = $agent_executor;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('${moduleName}.agent_executor')
    );
  }

  /**
   * Execute agent via UI.
   */
  public function executePage() {
    $form = \\Drupal::formBuilder()->getForm('Drupal\\${moduleName}\\Form\\AgentExecuteForm');

    return [
      '#theme' => 'agent_execute_form',
      '#form' => $form,
    ];
  }

  /**
   * Execute agent via API.
   */
  public function executeApi(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    if (empty($data['input'])) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Missing required field: input',
      ], 400);
    }

    $result = $this->agentExecutor->execute(
      $data['input'],
      $data['context'] ?? [],
      $data['save_result'] ?? TRUE
    );

    return new JsonResponse($result);
  }

  /**
   * Execute agent asynchronously via API.
   */
  public function executeAsyncApi(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    if (empty($data['input'])) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Missing required field: input',
      ], 400);
    }

    $queue_id = $this->agentExecutor->executeAsync(
      $data['input'],
      $data['context'] ?? []
    );

    return new JsonResponse([
      'success' => TRUE,
      'queue_id' => $queue_id,
      'message' => 'Agent execution queued',
    ]);
  }

  /**
   * Results listing page.
   */
  public function resultsPage() {
    $storage = $this->entityTypeManager()->getStorage('${moduleName}_result');
    $results = $storage->loadMultiple();

    $rows = [];
    foreach ($results as $result) {
      $rows[] = [
        'id' => $result->id(),
        'name' => $result->get('name')->value,
        'status' => $result->get('status')->value,
        'created' => date('Y-m-d H:i:s', $result->get('created')->value),
      ];
    }

    return [
      '#theme' => 'table',
      '#header' => ['ID', 'Name', 'Status', 'Created'],
      '#rows' => $rows,
      '#empty' => $this->t('No results found.'),
    ];
  }
}
`;
  }

  /**
   * Generate MODULE.routing.yml
   */
  private generateRouting(moduleName: string): string {
    return `${moduleName}.execute:
  path: '/admin/${moduleName}/execute'
  defaults:
    _controller: '\\Drupal\\${moduleName}\\Controller\\AgentController::executePage'
    _title: 'Execute Agent'
  requirements:
    _permission: 'administer ${moduleName}'

${moduleName}.api.execute:
  path: '/api/${moduleName}/execute'
  defaults:
    _controller: '\\Drupal\\${moduleName}\\Controller\\AgentController::executeApi'
  methods: [POST]
  requirements:
    _permission: 'access content'

${moduleName}.api.execute_async:
  path: '/api/${moduleName}/execute-async'
  defaults:
    _controller: '\\Drupal\\${moduleName}\\Controller\\AgentController::executeAsyncApi'
  methods: [POST]
  requirements:
    _permission: 'access content'

${moduleName}.results:
  path: '/admin/${moduleName}/results'
  defaults:
    _controller: '\\Drupal\\${moduleName}\\Controller\\AgentController::resultsPage'
    _title: 'Agent Results'
  requirements:
    _permission: 'administer ${moduleName}'

${moduleName}.settings:
  path: '/admin/config/${moduleName}'
  defaults:
    _form: '\\Drupal\\${moduleName}\\Form\\AgentConfigForm'
    _title: 'Agent Configuration'
  requirements:
    _permission: 'administer ${moduleName}'
`;
  }

  /**
   * Generate src/Form/AgentConfigForm.php
   */
  private generateConfigForm(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

namespace Drupal\\${moduleName}\\Form;

use Drupal\\Core\\Form\\ConfigFormBase;
use Drupal\\Core\\Form\\FormStateInterface;

/**
 * Configuration form for ${className} agent.
 */
class AgentConfigForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['${moduleName}.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return '${moduleName}_config_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('${moduleName}.settings');

    $form['auto_execute_on_save'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Auto-execute on entity save'),
      '#description' => $this->t('Automatically execute agent when configured entities are saved.'),
      '#default_value' => $config->get('auto_execute_on_save') ?? FALSE,
    ];

    $form['enabled_entity_types'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Enabled entity types'),
      '#description' => $this->t('Entity types that trigger agent execution.'),
      '#options' => [
        'node' => $this->t('Content'),
        'comment' => $this->t('Comment'),
        'user' => $this->t('User'),
      ],
      '#default_value' => $config->get('enabled_entity_types') ?: [],
      '#states' => [
        'visible' => [
          ':input[name="auto_execute_on_save"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['llm_provider'] = [
      '#type' => 'select',
      '#title' => $this->t('LLM Provider'),
      '#options' => [
        'anthropic' => $this->t('Anthropic (Claude)'),
        'openai' => $this->t('OpenAI (GPT)'),
        'google' => $this->t('Google (Gemini)'),
        'azure' => $this->t('Azure OpenAI'),
      ],
      '#default_value' => $config->get('llm_provider') ?? 'anthropic',
    ];

    $form['llm_model'] = [
      '#type' => 'textfield',
      '#title' => $this->t('LLM Model'),
      '#default_value' => $config->get('llm_model') ?? 'claude-sonnet-4-20250514',
    ];

    $form['temperature'] = [
      '#type' => 'number',
      '#title' => $this->t('Temperature'),
      '#description' => $this->t('Controls randomness (0.0 to 1.0).'),
      '#min' => 0,
      '#max' => 1,
      '#step' => 0.1,
      '#default_value' => $config->get('temperature') ?? 0.7,
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('${moduleName}.settings')
      ->set('auto_execute_on_save', $form_state->getValue('auto_execute_on_save'))
      ->set('enabled_entity_types', array_filter($form_state->getValue('enabled_entity_types')))
      ->set('llm_provider', $form_state->getValue('llm_provider'))
      ->set('llm_model', $form_state->getValue('llm_model'))
      ->set('temperature', $form_state->getValue('temperature'))
      ->save();

    parent::submitForm($form, $form_state);
  }
}
`;
  }

  /**
   * Generate MODULE.links.menu.yml
   */
  private generateMenuLinks(moduleName: string): string {
    return `${moduleName}.admin:
  title: 'Agent'
  description: 'Configure agent settings'
  route_name: ${moduleName}.settings
  parent: system.admin_config
  weight: 100

${moduleName}.execute:
  title: 'Execute'
  route_name: ${moduleName}.execute
  parent: ${moduleName}.admin
  weight: 0

${moduleName}.results:
  title: 'Results'
  route_name: ${moduleName}.results
  parent: ${moduleName}.admin
  weight: 10
`;
  }

  // ===================================================================
  // Tool API Plugin Generation (Phase 3 - Issue #433)
  // ===================================================================

  /**
   * Generate a Drupal Tool API plugin class for a single OSSA tool.
   *
   * Uses PHP 8 #[Tool] attributes (not annotations) and implements
   * ContainerFactoryPluginInterface for proper dependency injection.
   */
  private generateToolPlugin(
    _manifest: OssaAgent,
    moduleName: string,
    _className: string,
    tool: OssaToolEntry,
    drupalTool: DrupalToolDefinition
  ): string {
    const toolClassName = toClassName(sanitizeModuleName(tool.name || 'unknown_tool'));
    const toolName = tool.name || 'unknown_tool';
    const inputDef = this.buildSchemaDefinitionArray(tool.inputSchema || (tool as any).input_schema);
    const outputDef = this.buildSchemaDefinitionArray(tool.outputSchema || (tool as any).output_schema);
    return `<?php

namespace Drupal\\${moduleName}\\Plugin\\Tool;

use Drupal\\tool\\Attribute\\Tool;
use Drupal\\tool\\ToolPluginBase;
use Drupal\\Core\\StringTranslation\\TranslatableMarkup;
use Drupal\\Core\\Plugin\\ContainerFactoryPluginInterface;
use Drupal\\${moduleName}\\Service\\AgentExecutorService;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;

/**
 * Tool plugin: ${this.escapePhpString(drupalTool.label)}.
 *
 * Generated from OSSA manifest tool: ${toolName}
 * Type: ${drupalTool.type}
 */
#[Tool(
  id: '${drupalTool.id}',
  label: new TranslatableMarkup('${this.escapePhpString(drupalTool.label)}'),
  description: new TranslatableMarkup('${this.escapePhpString(drupalTool.description)}'),
)]
class ${toolClassName}Tool extends ToolPluginBase implements ContainerFactoryPluginInterface {

  /**
   * Constructs a new ${toolClassName}Tool.
   *
   * @param array \$configuration
   *   Plugin configuration.
   * @param string \$plugin_id
   *   The plugin ID.
   * @param mixed \$plugin_definition
   *   The plugin definition.
   * @param \\Drupal\\${moduleName}\\Service\\AgentExecutorService \$agentService
   *   The agent executor service.
   */
  public function __construct(
    array \$configuration,
    string \$plugin_id,
    mixed \$plugin_definition,
    private readonly AgentExecutorService \$agentService,
  ) {
    parent::__construct(\$configuration, \$plugin_id, \$plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface \$container, array \$configuration, \$plugin_id, \$plugin_definition): static {
    return new static(
      \$configuration,
      \$plugin_id,
      \$plugin_definition,
      \$container->get('${moduleName}.agent_executor'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getInputDefinition(): array {
    return ${inputDef};
  }

  /**
   * {@inheritdoc}
   */
  public function getOutputDefinition(): array {
    return ${outputDef};
  }

  /**
   * {@inheritdoc}
   */
  public function execute(array \$input): array {
    return \$this->agentService->executeTool('${this.escapePhpString(toolName)}', \$input);
  }

}
`;
  }

  /**
   * Generate tool_ai_connector config YAML for a single tool.
   *
   * Registers the tool with Drupal's Tool API AI connector system
   * so it is discoverable by AI-powered modules.
   */
  private generateToolAiConnectorConfig(drupalTool: DrupalToolDefinition): string {
    return `id: '${drupalTool.id}'
status: true
ai_callable: true
`;
  }

  /**
   * Build a PHP array literal from a JSON Schema definition.
   *
   * Converts OSSA tool input/output schema (JSON Schema) into a PHP array
   * that Drupal's Tool API can consume for input/output definitions.
   */
  private buildSchemaDefinitionArray(schema?: Record<string, unknown>): string {
    if (!schema || Object.keys(schema).length === 0) {
      return '[]';
    }
    const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
    if (!properties || Object.keys(properties).length === 0) {
      return '[]';
    }
    const required = (schema.required as string[]) || [];
    const entries: string[] = [];
    for (const [propName, propDef] of Object.entries(properties)) {
      const phpType = this.jsonSchemaTypeToPHP((propDef.type as string) || 'string');
      const description = propDef.description
        ? this.escapePhpString(propDef.description as string)
        : `The ${propName} parameter`;
      const isRequired = required.includes(propName) ? 'TRUE' : 'FALSE';
      entries.push(`      '${propName}' => [
        'type' => '${phpType}',
        'label' => '${toLabel(propName)}',
        'description' => '${this.escapePhpString(description)}',
        'required' => ${isRequired},
      ]`);
    }
    return `[
${entries.join(',\n')},
    ]`;
  }

  /**
   * Map a JSON Schema type to a PHP/Drupal typed data type string.
   */
  private jsonSchemaTypeToPHP(jsonType: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'float',
      integer: 'integer',
      boolean: 'boolean',
      array: 'list',
      object: 'map',
    };
    return typeMap[jsonType] || 'string';
  }

  /**
   * Escape a string for safe inclusion inside PHP single-quoted strings.
   */
  private escapePhpString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  // ===================================================================
  // ECA Model Generation (Phase 4 - Issue #433)
  // ===================================================================

  /**
   * Extract ECA event definitions from the manifest.
   *
   * Looks for extensions.drupal.eca_events in the manifest. Each entry
   * is a string like 'entity:node:presave' or 'content_entity:presave'.
   */
  private extractEcaEvents(manifest: OssaAgent): string[] {
    const extensions = (manifest as any).extensions;
    if (!extensions?.drupal?.eca_events) {
      return [];
    }
    const events = extensions.drupal.eca_events;
    if (!Array.isArray(events)) {
      return [];
    }
    return events.filter((e: unknown) => typeof e === 'string') as string[];
  }

  /**
   * Generate ECA model YAML config files for each event in eca_events.
   *
   * Creates config/install/eca.model.MODULE_on_EVENT.yml files that define
   * the Event-Condition-Action models for Drupal's ECA module. Each model
   * wires an event trigger to an OSSA agent condition check and tool execution.
   */
  private generateEcaModels(
    manifest: OssaAgent,
    moduleName: string,
    ecaEvents: string[]
  ): ExportFile[] {
    const files = [];
    const agentName = manifest.metadata?.name || moduleName;
    const agentLabel = toLabel(agentName);

    for (const event of ecaEvents) {
      // Build a slug from the event: 'entity:node:presave' -> 'entity_node_presave'
      const eventSlug = sanitizeModuleName(event.replace(/:/g, '_'));
      const modelId = `${moduleName}_on_${eventSlug}`;
      const modelLabel = `${agentLabel} - On ${toLabel(eventSlug)}`;

      // Determine plugin_id and configuration from event string
      const eventParts = event.split(':');
      const pluginId = this.mapEcaEventToPluginId(eventParts);
      const eventConfig = this.buildEcaEventConfiguration(eventParts);

      // Find tools that should be executed for this event
      const tools = extractTools(manifest);
      const toolRef = tools.length > 0
        ? `${moduleName}.${sanitizeModuleName(tools[0].name || 'unknown_tool')}`
        : `${moduleName}.default_tool`;

      const yamlContent = `id: '${modelId}'
label: '${this.escapeYamlString(modelLabel)}'
modeller: core
version: '1.0.0'
events:
  - plugin_id: '${pluginId}'
    configuration:
${this.indentYamlObject(eventConfig, 6)}
conditions:
  - plugin_id: 'ossa_agent_enabled'
    configuration:
      agent_id: '${agentName}'
actions:
  - plugin_id: 'ossa_execute_tool'
    configuration:
      tool: '${toolRef}'
      async: true
`;

      files.push(
        this.createFile(
          `${moduleName}/config/install/eca.model.${modelId}.yml`,
          yamlContent,
          'config'
        )
      );
    }

    return files;
  }

  /**
   * Map ECA event parts to a Drupal ECA plugin ID.
   *
   * Converts OSSA event notation (e.g., ['entity', 'node', 'presave'])
   * to ECA plugin IDs (e.g., 'content_entity:presave').
   */
  private mapEcaEventToPluginId(eventParts: string[]): string {
    if (eventParts.length >= 3 && eventParts[0] === 'entity') {
      // 'entity:node:presave' -> 'content_entity:presave'
      return `content_entity:${eventParts[2]}`;
    }
    if (eventParts.length >= 2) {
      // 'content_entity:presave' -> pass through
      return eventParts.join(':');
    }
    // Fallback: use as-is
    return eventParts.join(':');
  }

  /**
   * Build ECA event configuration from event parts.
   *
   * Returns a key-value map that becomes the configuration block
   * under the event entry in the ECA model YAML.
   */
  private buildEcaEventConfiguration(eventParts: string[]): Record<string, string> {
    const config: Record<string, string> = {};

    if (eventParts.length >= 3 && eventParts[0] === 'entity') {
      // 'entity:node:presave' -> type: node
      config.type = eventParts[1];
    } else if (eventParts.length >= 2 && eventParts[0] === 'content_entity') {
      // 'content_entity:presave' -> type: node (default)
      config.type = 'node';
    }

    return config;
  }

  /**
   * Escape a string for safe inclusion in YAML single-quoted values.
   */
  private escapeYamlString(str: string): string {
    return str.replace(/'/g, "''");
  }

  /**
   * Indent a key-value object as YAML at a given indentation level.
   */
  private indentYamlObject(obj: Record<string, string>, indent: number): string {
    const pad = ' '.repeat(indent);
    return Object.entries(obj)
      .map(([key, value]) => `${pad}${key}: ${value}`)
      .join('\n');
  }

  // ===================================================================
  // Action Plugin Generation (Phase 4 - Issue #433)
  // ===================================================================

  /**
   * Generate Action plugin classes for tools with CUD operations.
   *
   * Filters tools where the operation field matches create, update, or delete,
   * and generates a Drupal Action plugin class for each. Tools without an
   * explicit operation field are skipped.
   *
   * Uses PHP 8 #[Action] attributes and implements ContainerFactoryPluginInterface.
   */
  private generateActionPlugins(
    manifest: OssaAgent,
    moduleName: string,
    tools: OssaToolEntry[]
  ): ExportFile[] {
    const files = [];
    const cudOperations = ['create', 'update', 'delete'];

    for (const tool of tools) {
      const operation = (tool as any).operation as string | undefined;
      if (!operation || !cudOperations.includes(operation.toLowerCase())) {
        continue;
      }

      const toolName = tool.name || 'unknown_tool';
      const actionId = `${moduleName}_${sanitizeModuleName(toolName)}`;
      const actionClassName = toClassName(sanitizeModuleName(toolName));
      const actionLabel = toLabel(toolName);
      const entityType = this.inferEntityType(tool);

      const phpContent = this.generateActionPluginClass(
        moduleName,
        actionId,
        actionClassName,
        actionLabel,
        entityType,
        toolName,
        operation.toLowerCase()
      );

      files.push(
        this.createFile(
          `${moduleName}/src/Plugin/Action/${actionClassName}Action.php`,
          phpContent,
          'code',
          'php'
        )
      );
    }

    return files;
  }

  /**
   * Infer the entity type a tool operates on from its metadata.
   *
   * Checks tool.config.entity_type, falls back to 'node'.
   */
  private inferEntityType(tool: OssaToolEntry): string {
    const config = (tool as any).config as Record<string, unknown> | undefined;
    if (config?.entity_type && typeof config.entity_type === 'string') {
      return config.entity_type;
    }
    return 'node';
  }

  /**
   * Generate a single Action plugin PHP class.
   *
   * Produces a Drupal Action plugin using PHP 8 #[Action] attribute syntax,
   * constructor property promotion, and ContainerFactoryPluginInterface.
   */
  private generateActionPluginClass(
    moduleName: string,
    actionId: string,
    actionClassName: string,
    actionLabel: string,
    entityType: string,
    toolName: string,
    operation: string
  ): string {
    // Map operation to appropriate access check
    const accessOp = operation === 'delete' ? 'delete' : 'update';

    return `<?php

declare(strict_types=1);

namespace Drupal\\${moduleName}\\Plugin\\Action;

use Drupal\\Core\\Action\\Attribute\\Action;
use Drupal\\Core\\Action\\ActionBase;
use Drupal\\Core\\StringTranslation\\TranslatableMarkup;
use Drupal\\Core\\Plugin\\ContainerFactoryPluginInterface;
use Drupal\\Core\\Session\\AccountInterface;
use Drupal\\${moduleName}\\Service\\AgentExecutorService;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;

/**
 * Action plugin: ${this.escapePhpString(actionLabel)}.
 *
 * Generated from OSSA manifest tool: ${toolName}
 * Operation: ${operation}
 */
#[Action(
  id: '${actionId}',
  label: new TranslatableMarkup('${this.escapePhpString(actionLabel)}'),
  type: '${entityType}',
)]
class ${actionClassName}Action extends ActionBase implements ContainerFactoryPluginInterface {

  /**
   * Constructs a new ${actionClassName}Action.
   *
   * @param array \$configuration
   *   Plugin configuration.
   * @param string \$plugin_id
   *   The plugin ID.
   * @param mixed \$plugin_definition
   *   The plugin definition.
   * @param \\Drupal\\${moduleName}\\Service\\AgentExecutorService \$agentService
   *   The agent executor service.
   */
  public function __construct(
    array \$configuration,
    string \$plugin_id,
    mixed \$plugin_definition,
    private readonly AgentExecutorService \$agentService,
  ) {
    parent::__construct(\$configuration, \$plugin_id, \$plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface \$container, array \$configuration, \$plugin_id, \$plugin_definition): static {
    return new static(
      \$configuration,
      \$plugin_id,
      \$plugin_definition,
      \$container->get('${moduleName}.agent_executor'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function execute(\$entity = NULL): void {
    \$this->agentService->executeTool('${this.escapePhpString(toolName)}', [
      'entity_id' => \$entity?->id(),
      'entity_type' => \$entity?->getEntityTypeId(),
      'operation' => '${operation}',
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function access(\$object, ?AccountInterface \$account = NULL, \$return_as_object = FALSE) {
    return \$object->access('${accessOp}', \$account, \$return_as_object);
  }

}
`;
  }

  // ===================================================================
  // Condition Plugin Generation (Phase 4 - Issue #433)
  // ===================================================================

  /**
   * Generate Condition plugin classes from OSSA safety guardrails.
   *
   * Maps spec.safety.guardrails[] entries to Drupal Condition plugins.
   * Also always generates an AgentEnabledCondition that checks whether
   * the OSSA agent is enabled in module configuration.
   *
   * Uses PHP 8 #[Condition] attributes and ConditionPluginBase.
   */
  private generateConditionPlugins(
    manifest: OssaAgent,
    moduleName: string
  ): ExportFile[] {
    const files = [];
    const agentName = manifest.metadata?.name || moduleName;

    // Always generate the AgentEnabledCondition
    files.push(
      this.createFile(
        `${moduleName}/src/Plugin/Condition/AgentEnabledCondition.php`,
        this.generateAgentEnabledConditionClass(moduleName, agentName),
        'code',
        'php'
      )
    );

    // Generate condition plugins for each safety guardrail
    const guardrails = manifest.spec?.safety?.guardrails || [];
    for (const guardrail of guardrails) {
      const guardName = guardrail.name || 'unknown_guard';
      const conditionId = `${moduleName}_${sanitizeModuleName(guardName)}`;
      const conditionClassName = toClassName(sanitizeModuleName(guardName));
      const conditionLabel = toLabel(guardName);

      files.push(
        this.createFile(
          `${moduleName}/src/Plugin/Condition/${conditionClassName}Condition.php`,
          this.generateGuardrailConditionClass(
            moduleName,
            conditionId,
            conditionClassName,
            conditionLabel,
            guardrail
          ),
          'code',
          'php'
        )
      );
    }

    return files;
  }

  /**
   * Generate the AgentEnabledCondition plugin class.
   *
   * This condition checks whether the OSSA agent is enabled in module
   * configuration. Used by ECA models to gate event-driven execution.
   */
  private generateAgentEnabledConditionClass(
    moduleName: string,
    agentName: string
  ): string {
    return `<?php

declare(strict_types=1);

namespace Drupal\\${moduleName}\\Plugin\\Condition;

use Drupal\\Core\\Condition\\Attribute\\Condition;
use Drupal\\Core\\Condition\\ConditionPluginBase;
use Drupal\\Core\\Form\\FormStateInterface;
use Drupal\\Core\\StringTranslation\\TranslatableMarkup;
use Drupal\\Core\\Plugin\\ContainerFactoryPluginInterface;
use Drupal\\Core\\Config\\ConfigFactoryInterface;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;

/**
 * Condition plugin: OSSA Agent Enabled.
 *
 * Evaluates whether the OSSA agent is enabled in module configuration.
 * Used by ECA models to gate event-driven agent execution.
 */
#[Condition(
  id: 'ossa_agent_enabled',
  label: new TranslatableMarkup('OSSA Agent Enabled'),
)]
class AgentEnabledCondition extends ConditionPluginBase implements ContainerFactoryPluginInterface {

  /**
   * Constructs a new AgentEnabledCondition.
   *
   * @param array \$configuration
   *   Plugin configuration.
   * @param string \$plugin_id
   *   The plugin ID.
   * @param mixed \$plugin_definition
   *   The plugin definition.
   * @param \\Drupal\\Core\\Config\\ConfigFactoryInterface \$configFactory
   *   The config factory service.
   */
  public function __construct(
    array \$configuration,
    string \$plugin_id,
    mixed \$plugin_definition,
    private readonly ConfigFactoryInterface \$configFactory,
  ) {
    parent::__construct(\$configuration, \$plugin_id, \$plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface \$container, array \$configuration, \$plugin_id, \$plugin_definition): static {
    return new static(
      \$configuration,
      \$plugin_id,
      \$plugin_definition,
      \$container->get('config.factory'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      'agent_id' => '${this.escapePhpString(agentName)}',
    ] + parent::defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array \$form, FormStateInterface \$form_state): array {
    \$form['agent_id'] = [
      '#type' => 'textfield',
      '#title' => \$this->t('Agent ID'),
      '#default_value' => \$this->configuration['agent_id'],
      '#description' => \$this->t('The OSSA agent identifier to check.'),
      '#required' => TRUE,
    ];

    return parent::buildConfigurationForm(\$form, \$form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &\$form, FormStateInterface \$form_state): void {
    \$this->configuration['agent_id'] = \$form_state->getValue('agent_id');
    parent::submitConfigurationForm(\$form, \$form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function evaluate(): bool {
    \$config = \$this->configFactory->get('${moduleName}.settings');

    // Check if auto-execution is enabled (agent is active)
    \$enabled = (bool) \$config->get('auto_execute_on_save');

    return \$this->isNegated() ? !\$enabled : \$enabled;
  }

  /**
   * {@inheritdoc}
   */
  public function summary(): TranslatableMarkup {
    if (\$this->isNegated()) {
      return new TranslatableMarkup('OSSA agent @agent is disabled', [
        '@agent' => \$this->configuration['agent_id'],
      ]);
    }

    return new TranslatableMarkup('OSSA agent @agent is enabled', [
      '@agent' => \$this->configuration['agent_id'],
    ]);
  }

}
`;
  }

  /**
   * Generate a Condition plugin class for a specific safety guardrail.
   *
   * Maps OSSA spec.safety.guardrails[] entries to Drupal Condition plugins.
   * Supports 'input' guardrails (check blocked patterns) and 'output' guardrails
   * (check response constraints like maxLength).
   */
  private generateGuardrailConditionClass(
    moduleName: string,
    conditionId: string,
    conditionClassName: string,
    conditionLabel: string,
    guardrail: {
      name: string;
      type: 'input' | 'output';
      blocked_patterns?: string[];
      maxLength?: number;
    }
  ): string {
    const guardType = guardrail.type || 'input';
    const blockedPatterns = guardrail.blocked_patterns || [];
    const maxLength = guardrail.maxLength;

    // Build the patterns array as a PHP literal
    const patternsPhp = blockedPatterns.length > 0
      ? `[${blockedPatterns.map((p) => `'${this.escapePhpString(p)}'`).join(', ')}]`
      : '[]';

    // Build evaluation logic based on guardrail type
    let evaluateBody: string;
    if (guardType === 'input' && blockedPatterns.length > 0) {
      evaluateBody = `    \$content = \$this->configuration['content'] ?? '';
    \$blocked_patterns = ${patternsPhp};

    foreach (\$blocked_patterns as \$pattern) {
      if (str_contains(\$content, \$pattern)) {
        return \$this->isNegated() ? TRUE : FALSE;
      }
    }

    return \$this->isNegated() ? FALSE : TRUE;`;
    } else if (guardType === 'output' && maxLength) {
      evaluateBody = `    \$content = \$this->configuration['content'] ?? '';
    \$max_length = ${maxLength};
    \$within_limit = mb_strlen(\$content) <= \$max_length;

    return \$this->isNegated() ? !\$within_limit : \$within_limit;`;
    } else {
      evaluateBody = `    // Default: condition passes
    return !\$this->isNegated();`;
    }

    return `<?php

declare(strict_types=1);

namespace Drupal\\${moduleName}\\Plugin\\Condition;

use Drupal\\Core\\Condition\\Attribute\\Condition;
use Drupal\\Core\\Condition\\ConditionPluginBase;
use Drupal\\Core\\StringTranslation\\TranslatableMarkup;

/**
 * Condition plugin: ${this.escapePhpString(conditionLabel)}.
 *
 * Generated from OSSA safety guardrail: ${guardrail.name}
 * Type: ${guardType}
 */
#[Condition(
  id: '${conditionId}',
  label: new TranslatableMarkup('${this.escapePhpString(conditionLabel)}'),
)]
class ${conditionClassName}Condition extends ConditionPluginBase {

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      'content' => '',
    ] + parent::defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function evaluate(): bool {
${evaluateBody}
  }

  /**
   * {@inheritdoc}
   */
  public function summary(): TranslatableMarkup {
    return new TranslatableMarkup('${this.escapePhpString(conditionLabel)} guardrail (${guardType})');
  }

}
`;
  }

  // ===================================================================
  // Recipe Generation (Phase 5 - Issue #433)
  // ===================================================================

  /**
   * Generate a Drupal Recipe YAML file for composable installation.
   *
   * Recipes are Drupal's modern approach to distributing reusable
   * configuration sets. This generates a recipe that installs and
   * configures the OSSA agent module along with its dependencies.
   */
  private generateRecipe(
    manifest: OssaAgent,
    moduleName: string,
    tools: OssaToolEntry[]
  ): string {
    const displayName = toLabel(manifest.metadata?.name || moduleName);
    const description = manifest.metadata?.description || `OSSA ${displayName} agent`;
    const llmConfig = (manifest.spec?.llm as any) || {};

    // Build the install list
    const installModules = [
      'ai',
      'ai_agents',
      'tool',
      'eca',
      moduleName,
    ];

    // Build config actions for tool_ai_connector entities
    const toolConfigLines: string[] = [];
    if (tools.length > 0) {
      for (const tool of tools) {
        const drupalTool = mapOssaToolToDrupalTool(tool, moduleName);
        toolConfigLines.push(
          `    tool_ai_connector.tool.${drupalTool.id}:`,
          `      simple_config_update:`,
          `        status: true`,
          `        ai_callable: true`
        );
      }
    }

    let recipe = `name: '${displayName}'
description: 'Install and configure the OSSA ${sanitizeModuleName(manifest.metadata?.name || moduleName)} agent'
type: 'AI Agent'
install:
${installModules.map((m) => `  - ${m}`).join('\n')}
config:
  import:
    ${moduleName}:
      - ${moduleName}.settings
  actions:
    ${moduleName}.settings:
      simple_config_update:
        auto_execute_on_save: true
        llm_provider: ${llmConfig.provider || 'anthropic'}
        llm_model: ${llmConfig.model || 'claude-sonnet-4-20250514'}
        temperature: ${llmConfig.temperature || 0.7}
`;

    if (toolConfigLines.length > 0) {
      recipe += toolConfigLines.join('\n') + '\n';
    }

    return recipe;
  }

  /**
   * Generate config/schema/MODULE.schema.yml
   */
  private generateConfigSchema(moduleName: string): string {
    return `${moduleName}.settings:
  type: config_object
  label: 'Agent Settings'
  mapping:
    auto_execute_on_save:
      type: boolean
      label: 'Auto-execute on entity save'
    enabled_entity_types:
      type: sequence
      label: 'Enabled entity types'
      sequence:
        type: string
    llm_provider:
      type: string
      label: 'LLM Provider'
    llm_model:
      type: string
      label: 'LLM Model'
    temperature:
      type: float
      label: 'Temperature'
`;
  }

  /**
   * Generate config/install/MODULE.settings.yml
   */
  private generateDefaultConfig(manifest: OssaAgent): string {
    const llmConfig = (manifest.spec?.llm as any) || {};

    return `auto_execute_on_save: false
enabled_entity_types: []
llm_provider: '${llmConfig.provider || 'anthropic'}'
llm_model: '${llmConfig.model || 'claude-sonnet-4-20250514'}'
temperature: ${llmConfig.temperature || 0.7}
`;
  }

  /**
   * Generate templates/agent-result.html.twig
   */
  private generateAgentResultTemplate(moduleName: string): string {
    return `{#
/**
 * @file
 * Theme template for agent execution result.
 *
 * Available variables:
 * - result: The execution result object
 * - metadata: Execution metadata
 */
#}
<div class="${moduleName}-result">
  <div class="result-output">
    <h3>{{ 'Output'|t }}</h3>
    <div class="output-content">
      {{ result.output }}
    </div>
  </div>

  {% if metadata %}
  <div class="result-metadata">
    <h4>{{ 'Metadata'|t }}</h4>
    <dl>
      {% if metadata.duration_ms %}
      <dt>{{ 'Duration'|t }}</dt>
      <dd>{{ metadata.duration_ms }} ms</dd>
      {% endif %}

      {% if metadata.model %}
      <dt>{{ 'Model'|t }}</dt>
      <dd>{{ metadata.model }}</dd>
      {% endif %}

      {% if metadata.provider %}
      <dt>{{ 'Provider'|t }}</dt>
      <dd>{{ metadata.provider }}</dd>
      {% endif %}

      {% if metadata.usage %}
      <dt>{{ 'Token Usage'|t }}</dt>
      <dd>{{ metadata.usage.total_tokens|default('N/A') }}</dd>
      {% endif %}
    </dl>
  </div>
  {% endif %}
</div>
`;
  }

  /**
   * Generate templates/agent-execute-form.html.twig
   */
  private generateExecuteFormTemplate(moduleName: string): string {
    return `{#
/**
 * @file
 * Theme template for agent execute form.
 *
 * Available variables:
 * - form: The form render array
 */
#}
<div class="${moduleName}-execute-form">
  <div class="form-header">
    <h2>{{ 'Execute Agent'|t }}</h2>
    <p>{{ 'Enter your input and execute the agent.'|t }}</p>
  </div>

  <div class="form-content">
    {{ form }}
  </div>
</div>
`;
  }

  /**
   * Generate README.md
   */
  private generateReadme(
    manifest: OssaAgent,
    moduleName: string,
    options: DrupalModuleGeneratorOptions
  ): string {
    const capabilities = extractCapabilities(manifest);
    const tools = extractTools(manifest);

    return `# ${manifest.metadata?.name || moduleName}

${manifest.metadata?.description || 'OSSA agent module for Drupal'}

## Description

${manifest.spec?.role || 'AI Agent powered by OSSA'}

This module provides a complete integration of an OSSA agent with Drupal, including:

${options.includeQueueWorker ? '- ✅ Queue Worker for asynchronous execution' : ''}
${options.includeEntity ? '- ✅ Entity storage for agent results' : ''}
${options.includeController ? '- ✅ Admin UI and API endpoints' : ''}
${options.includeConfigForm ? '- ✅ Configuration form' : ''}
${options.includeHooks ? '- ✅ Drupal hooks (entity_presave, cron)' : ''}
${options.includeViews ? '- ✅ Views integration' : ''}

## Requirements

- **Drupal**: ${options.coreVersion}
- **PHP**: >=8.2
- **Composer packages**:
  - \`drupal/ai\`: ^1.0
  - \`drupal/ai_agents\`: ^1.3
  - \`drupal/tool\`: ^1.0@alpha

## Installation

### 1. Install via Composer

\`\`\`bash
cd /path/to/drupal
composer require drupal/ai drupal/ai_agents drupal/tool
\`\`\`

### 2. Copy module to Drupal

\`\`\`bash
cp -r ${moduleName} web/modules/custom/
\`\`\`

### 3. Enable module

\`\`\`bash
drush en ${moduleName}
\`\`\`

### 4. Configure API keys

Set your LLM provider API keys in \`settings.php\`:

\`\`\`php
// Anthropic (Claude)
$config['ossa']['providers']['anthropic']['api_key'] = getenv('ANTHROPIC_API_KEY');

// OpenAI
$config['ossa']['providers']['openai']['api_key'] = getenv('OPENAI_API_KEY');
\`\`\`

Or use environment variables:

\`\`\`bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
\`\`\`

## Configuration

Visit \`/admin/config/${moduleName}\` to configure:

- LLM provider (Anthropic, OpenAI, Google, Azure)
- Model selection
- Temperature settings
- Auto-execution triggers
- Enabled entity types

## Usage

### Execute via Admin UI

1. Navigate to \`/admin/${moduleName}/execute\`
2. Enter your input
3. Click "Execute"
4. View results

### Execute via Drush

\`\`\`bash
drush ossa:agent:execute ${manifest.metadata?.name || 'agent'} "Your input here"
\`\`\`

### Execute via API

\`\`\`bash
# Synchronous execution
curl -X POST https://example.com/api/${moduleName}/execute \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Your input here"}'

# Asynchronous execution (queued)
curl -X POST https://example.com/api/${moduleName}/execute-async \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Your input here"}'
\`\`\`

### Execute via PHP

\`\`\`php
// Get service
$agent = \\Drupal::service('${moduleName}.agent_executor');

// Execute synchronously
$result = $agent->execute('Your input here');

if ($result['success']) {
  echo $result['output'];
}

// Execute asynchronously (queued)
$queue_id = $agent->executeAsync('Your input here');
\`\`\`

## Capabilities

${capabilities.map((c) => `- ${c}`).join('\n')}

## Tools

${tools.map((t) => `- **${t.name || 'unknown'}**: ${t.description || 'No description'}`).join('\n')}

${
  options.includeQueueWorker
    ? `
## Queue Processing

The module includes a queue worker for asynchronous agent execution:

\`\`\`bash
# Process queue via cron
drush cron

# Process queue manually
drush queue:run ${moduleName}_agent_queue
\`\`\`
`
    : ''
}

${
  options.includeEntity
    ? `
## Results Storage

All agent execution results are stored in the database and can be viewed at:
\`/admin/${moduleName}/results\`

Results can also be queried via Views or entity queries:

\`\`\`php
$storage = \\Drupal::entityTypeManager()->getStorage('${moduleName}_result');
$results = $storage->loadMultiple();
\`\`\`
`
    : ''
}

## Hooks

This module implements the following Drupal hooks:

${
  options.includeHooks
    ? `
- \`hook_help()\`: Provides help text
- \`hook_cron()\`: Processes queue items
- \`hook_entity_presave()\`: Triggers agent on entity save (if enabled)
- \`hook_theme()\`: Registers theme templates
`
    : ''
}

## Architecture

This module follows OSSA (Open Standard Agents) specification and uses:

- **drupal/ai**: LLM provider abstraction (Anthropic, OpenAI, Google, Azure)
- **drupal/ai_agents**: AI agent plugin system for Drupal
- **drupal/tool**: Tool API plugin system
- **PHP 8 Attributes**: Modern \`#[Hook]\`, \`#[QueueWorker]\`, \`#[ContentEntityType]\`
- **OO Hook Classes**: All hooks implemented as classes in \`src/Hook/\`
- **Queue System**: Drupal queue for async execution
- **Entity API**: Drupal entities for result storage
- **Configuration API**: Drupal configuration system

## Generated from OSSA

This module was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '{{VERSION}}'} manifest.

Original manifest: \`config/ossa/agent.ossa.yaml\`

## Support

- **OSSA Specification**: https://openstandardagents.org/
- **Symfony Bundle**: https://github.com/blueflyio/openstandardagents
- **Issue Tracker**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues

## License

${manifest.metadata?.license || 'GPL-2.0-or-later'}
`;
  }

  /**
   * Generate INSTALL.md
   */
  private generateInstallGuide(
    manifest: OssaAgent,
    moduleName: string
  ): string {
    return `# Installation Guide: ${manifest.metadata?.name || moduleName}

## Prerequisites

- Drupal 10.x or 11.x
- PHP 8.2 or higher
- Composer
- LLM provider API key (Anthropic, OpenAI, Google, or Azure)

## Step 1: Install Dependencies

\`\`\`bash
cd /path/to/drupal
composer require drupal/ai drupal/ai_agents drupal/tool
\`\`\`

## Step 2: Install Module

### Option A: Via Composer (if published)

\`\`\`bash
composer require drupal/${moduleName}
drush en ${moduleName}
\`\`\`

### Option B: Manual Installation

\`\`\`bash
# Copy module directory
cp -r ${moduleName} /path/to/drupal/web/modules/custom/

# Enable module
drush en ${moduleName}

# Or via UI: Admin → Extend → Enable "${manifest.metadata?.name || moduleName}"
\`\`\`

## Step 3: Configure API Keys

### Method 1: Environment Variables (Recommended)

Add to \`.env\` or export:

\`\`\`bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GOOGLE_API_KEY="..."
export AZURE_OPENAI_API_KEY="..."
export AZURE_OPENAI_ENDPOINT="https://..."
\`\`\`

### Method 2: settings.php

Add to \`sites/default/settings.php\`:

\`\`\`php
// OSSA Provider Configuration
$config['ossa']['providers']['anthropic']['api_key'] = getenv('ANTHROPIC_API_KEY');
$config['ossa']['providers']['openai']['api_key'] = getenv('OPENAI_API_KEY');
$config['ossa']['providers']['google']['api_key'] = getenv('GOOGLE_API_KEY');
$config['ossa']['providers']['azure']['api_key'] = getenv('AZURE_OPENAI_API_KEY');
$config['ossa']['providers']['azure']['base_url'] = getenv('AZURE_OPENAI_ENDPOINT');
\`\`\`

## Step 4: Configure Module

1. Navigate to \`/admin/config/${moduleName}\`
2. Select your preferred LLM provider
3. Choose model (e.g., \`claude-sonnet-4-20250514\`)
4. Adjust temperature (0.0-1.0)
5. Configure auto-execution triggers (optional)
6. Save configuration

## Step 5: Verify Installation

### Test via Drush

\`\`\`bash
# List available agents
drush ossa:agent:list

# Execute agent
drush ossa:agent:execute ${manifest.metadata?.name || 'agent'} "Test input"
\`\`\`

### Test via UI

1. Visit \`/admin/${moduleName}/execute\`
2. Enter test input
3. Click "Execute"
4. Verify output appears

### Test via API

\`\`\`bash
curl -X POST http://localhost/api/${moduleName}/execute \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Hello, agent!"}'
\`\`\`

## Step 6: Set Up Cron (Optional)

For asynchronous execution via queue:

\`\`\`bash
# Configure Drupal cron
drush cron

# Or set up system cron
crontab -e
# Add: */5 * * * * drush -r /path/to/drupal cron
\`\`\`

## Troubleshooting

### Issue: "Missing API key"

**Solution**: Verify environment variables or settings.php configuration

\`\`\`bash
# Check environment
echo $ANTHROPIC_API_KEY

# Or verify in PHP
drush php-eval "print_r(\\Drupal::config('ossa.settings')->get('providers'));"
\`\`\`

### Issue: "Agent not found"

**Solution**: Clear cache

\`\`\`bash
drush cr
\`\`\`

### Issue: "Queue not processing"

**Solution**: Run cron manually

\`\`\`bash
drush cron
# Or process queue directly
drush queue:run ${moduleName}_agent_queue
\`\`\`

### Issue: "Permission denied"

**Solution**: Grant permissions

1. Visit \`/admin/people/permissions\`
2. Grant "Administer ${moduleName}" permission
3. Save permissions

## Next Steps

- Configure auto-execution triggers
- Set up Views for result browsing
- Integrate with custom modules
- Monitor execution logs

## Support

- Documentation: https://openstandardagents.org/
- Issues: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- Drupal.org: https://www.drupal.org/project/${moduleName}
`;
  }

}
