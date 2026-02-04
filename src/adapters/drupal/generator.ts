/**
 * Drupal Module Generator for OSSA Agents
 *
 * Generates complete, production-ready Drupal modules from OSSA agent manifests.
 *
 * Generated modules include:
 * - MODULE.info.yml (module metadata)
 * - MODULE.services.yml (DI configuration)
 * - src/Service/AgentExecutor (wrapper around ossa/symfony-bundle)
 * - src/Plugin/QueueWorker (async execution support)
 * - src/Controller (admin UI and API endpoints)
 * - src/Entity (agent result storage)
 * - src/Form (configuration forms)
 * - MODULE.module (Drupal hooks: entity_presave, cron, etc.)
 * - templates/*.html.twig (Twig templates)
 * - composer.json (with ossa/symfony-bundle dependency)
 * - config/schema/MODULE.schema.yml (configuration schema)
 * - config/install/*.yml (default configuration)
 *
 * SOLID Principles:
 * - Single Responsibility: Drupal module generation only
 * - Dependency Inversion: Uses ossa/symfony-bundle for agent execution
 * - Interface Segregation: Separate interfaces for different module components
 *
 * DRY: Reuses Symfony bundle patterns, no duplication
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';

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
  /** Drupal core version requirement */
  coreVersion?: string;
}

export class DrupalModuleGenerator extends BaseAdapter {
  readonly platform = 'drupal';
  readonly displayName = 'Drupal Module (Full)';
  readonly description = 'Production-ready Drupal module with OSSA/Symfony integration';
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

      const moduleName = this.sanitizeModuleName(
        manifest.metadata?.name || 'ossa_agent'
      );
      const className = this.toClassName(moduleName);

      // Default options
      const opts = {
        includeQueueWorker: true,
        includeEntity: true,
        includeController: true,
        includeConfigForm: true,
        includeHooks: true,
        includeViews: true,
        coreVersion: '^10 || ^11',
        validate: options?.validate ?? true,
        ...options,
      };

      const files = [];

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

      // MODULE.module (hooks)
      if (opts.includeHooks) {
        files.push(
          this.createFile(
            `${moduleName}/${moduleName}.module`,
            this.generateModuleHooks(manifest, moduleName, className),
            'code',
            'php'
          )
        );
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
    const name = manifest.metadata?.name;
    if (name && !/^[a-z0-9_]+$/.test(name)) {
      warnings.push({
        message:
          'Module name should only contain lowercase letters, numbers, and underscores',
        path: 'metadata.name',
        suggestion: `Use: ${this.sanitizeModuleName(name)}`,
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
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
          },
        ],
      },
    };
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
    const dependencies = ['key_value', 'typed_data'];

    if (options.includeEntity) {
      dependencies.push('views');
    }

    return `name: '${manifest.metadata?.name || moduleName}'
type: module
description: '${manifest.metadata?.description || 'OSSA agent module'}'
core_version_requirement: ${options.coreVersion}
package: 'OSSA Agents'

dependencies:
${dependencies.map((d) => `  - drupal:${d}`).join('\n')}

# OSSA metadata
ossa:
  version: '${manifest.metadata?.version || '1.0.0'}'
  api_version: '${manifest.apiVersion || 'ossa/v{{VERSION}}'}'
  kind: '${manifest.kind || 'Agent'}'
  symfony_bundle: 'ossa/symfony-bundle'
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
  # Agent Executor Service (wraps ossa/symfony-bundle)
  # ===================================================================

  ${moduleName}.agent_executor:
    class: Drupal\\${moduleName}\\Service\\AgentExecutorService
    arguments:
      - '@Ossa\\SymfonyBundle\\Agent\\AgentExecutor'
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
   * Generate composer.json with ossa/symfony-bundle dependency
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
        keywords: ['Drupal', 'OSSA', 'AI', 'Agent', 'Symfony'],
        license: manifest.metadata?.license || 'GPL-2.0-or-later',
        require: {
          'php': '>=8.2',
          'drupal/core': '^10 || ^11',
          'ossa/symfony-bundle': '^0.3',
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
   * Generate MODULE.module with Drupal hooks
   */
  private generateModuleHooks(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

/**
 * @file
 * ${className} module hooks.
 *
 * Provides integration hooks for OSSA agent execution within Drupal.
 */

use Drupal\\Core\\Entity\\EntityInterface;
use Drupal\\Core\\Routing\\RouteMatchInterface;

/**
 * Implements hook_help().
 */
function ${moduleName}_help($route_name, RouteMatchInterface $route_match) {
  switch ($route_name) {
    case 'help.page.${moduleName}':
      return '<p>' . t('${manifest.metadata?.description || 'OSSA agent module'}') . '</p>';
  }
}

/**
 * Implements hook_cron().
 *
 * Process queued agent tasks.
 */
function ${moduleName}_cron() {
  // Process agent queue items
  $queue = \\Drupal::queue('${moduleName}_agent_queue');
  $queue_worker = \\Drupal::service('plugin.manager.queue_worker')
    ->createInstance('${moduleName}_agent_queue');

  $processed = 0;
  $max_items = 50;

  while ($processed < $max_items && $item = $queue->claimItem()) {
    try {
      $queue_worker->processItem($item->data);
      $queue->deleteItem($item);
      $processed++;
    }
    catch (\\Exception $e) {
      \\Drupal::logger('${moduleName}')->error('Queue processing failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      // Re-queue with delay
      $queue->releaseItem($item);
    }
  }

  if ($processed > 0) {
    \\Drupal::logger('${moduleName}')->info('Processed @count agent queue items', [
      '@count' => $processed,
    ]);
  }
}

/**
 * Implements hook_entity_presave().
 *
 * Trigger agent execution on entity save (optional - configure via settings).
 */
function ${moduleName}_entity_presave(EntityInterface $entity) {
  $config = \\Drupal::config('${moduleName}.settings');

  if (!$config->get('auto_execute_on_save')) {
    return;
  }

  // Only process configured entity types
  $enabled_types = $config->get('enabled_entity_types') ?: [];
  if (!in_array($entity->getEntityTypeId(), $enabled_types)) {
    return;
  }

  // Queue agent execution
  $queue = \\Drupal::queue('${moduleName}_agent_queue');
  $queue->createItem([
    'entity_type' => $entity->getEntityTypeId(),
    'entity_id' => $entity->id(),
    'operation' => 'presave',
    'timestamp' => time(),
  ]);
}

/**
 * Implements hook_theme().
 */
function ${moduleName}_theme($existing, $type, $theme, $path) {
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
`;
  }

  /**
   * Generate src/Service/AgentExecutorService.php
   *
   * Wraps Symfony bundle AgentExecutor with Drupal-specific features
   */
  private generateAgentExecutorService(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `<?php

namespace Drupal\\${moduleName}\\Service;

use Drupal\\Core\\Config\\ConfigFactoryInterface;
use Drupal\\Core\\Entity\\EntityTypeManagerInterface;
use Drupal\\Core\\Logger\\LoggerChannelFactoryInterface;
use Drupal\\Core\\Queue\\QueueFactory;
use Ossa\\SymfonyBundle\\Agent\\AgentExecutor;

/**
 * Agent Executor Service.
 *
 * Wraps the OSSA Symfony bundle AgentExecutor with Drupal-specific features:
 * - Entity storage for results
 * - Queue integration for async execution
 * - Drupal configuration integration
 * - Logging integration
 */
class AgentExecutorService {

  /**
   * The OSSA agent executor (from symfony-bundle).
   *
   * @var \\Ossa\\SymfonyBundle\\Agent\\AgentExecutor
   */
  protected AgentExecutor $agentExecutor;

  /**
   * The logger factory.
   *
   * @var \\Drupal\\Core\\Logger\\LoggerChannelFactoryInterface
   */
  protected LoggerChannelFactoryInterface $loggerFactory;

  /**
   * The config factory.
   *
   * @var \\Drupal\\Core\\Config\\ConfigFactoryInterface
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * The entity type manager.
   *
   * @var \\Drupal\\Core\\Entity\\EntityTypeManagerInterface
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The queue factory.
   *
   * @var \\Drupal\\Core\\Queue\\QueueFactory
   */
  protected QueueFactory $queueFactory;

  /**
   * Constructs a new AgentExecutorService.
   */
  public function __construct(
    AgentExecutor $agent_executor,
    LoggerChannelFactoryInterface $logger_factory,
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager,
    QueueFactory $queue_factory
  ) {
    $this->agentExecutor = $agent_executor;
    $this->loggerFactory = $logger_factory;
    $this->configFactory = $config_factory;
    $this->entityTypeManager = $entity_type_manager;
    $this->queueFactory = $queue_factory;
  }

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

      // Add Drupal-specific context
      $context = $this->enrichContext($context);

      // Execute via Symfony bundle
      $response = $this->agentExecutor->execute(
        '${manifest.metadata?.name || 'agent'}',
        $input,
        $context
      );

      $result = [
        'success' => TRUE,
        'output' => $response->getOutput(),
        'metadata' => $response->getMetadata(),
      ];

      // Save result to entity
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
   * Enrich context with Drupal-specific data.
   *
   * @param array $context
   *   Base context.
   *
   * @return array
   *   Enriched context.
   */
  protected function enrichContext(array $context): array {
    // Add site name
    $context['site_name'] = $this->configFactory
      ->get('system.site')
      ->get('name');

    // Add current user
    $current_user = \\Drupal::currentUser();
    $context['user_id'] = $current_user->id();
    $context['user_name'] = $current_user->getAccountName();

    // Add Drupal version
    $context['drupal_version'] = \\Drupal::VERSION;

    // Add module configuration
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

namespace Drupal\\${moduleName}\\Plugin\\QueueWorker;

use Drupal\\Core\\Queue\\QueueWorkerBase;
use Drupal\\Core\\Plugin\\ContainerFactoryPluginInterface;
use Drupal\\${moduleName}\\Service\\AgentExecutorService;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;

/**
 * Agent Queue Worker.
 *
 * Processes agent execution tasks asynchronously via Drupal's queue system.
 *
 * @QueueWorker(
 *   id = "${moduleName}_agent_queue",
 *   title = @Translation("${className} Agent Queue Worker"),
 *   cron = {"time" = 60}
 * )
 */
class AgentQueueWorker extends QueueWorkerBase implements ContainerFactoryPluginInterface {

  /**
   * The agent executor service.
   *
   * @var \\Drupal\\${moduleName}\\Service\\AgentExecutorService
   */
  protected AgentExecutorService $agentExecutor;

  /**
   * {@inheritdoc}
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    AgentExecutorService $agent_executor
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->agentExecutor = $agent_executor;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(
    ContainerInterface $container,
    array $configuration,
    $plugin_id,
    $plugin_definition
  ) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('${moduleName}.agent_executor')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function processItem($data) {
    $input = $data['input'] ?? '';
    $context = $data['context'] ?? [];

    if (empty($input)) {
      throw new \\Exception('Queue item missing required input data');
    }

    // Execute agent
    $result = $this->agentExecutor->execute($input, $context, TRUE);

    if (!$result['success']) {
      throw new \\Exception($result['error'] ?? 'Agent execution failed');
    }

    return $result;
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

namespace Drupal\\${moduleName}\\Entity;

use Drupal\\Core\\Entity\\ContentEntityBase;
use Drupal\\Core\\Entity\\EntityTypeInterface;
use Drupal\\Core\\Field\\BaseFieldDefinition;

/**
 * Defines the Agent Result entity.
 *
 * Stores agent execution results for auditing and analysis.
 *
 * @ContentEntityType(
 *   id = "${moduleName}_result",
 *   label = @Translation("Agent Result"),
 *   base_table = "${moduleName}_result",
 *   entity_keys = {
 *     "id" = "id",
 *     "label" = "name",
 *     "uuid" = "uuid",
 *   },
 *   handlers = {
 *     "view_builder" = "Drupal\\Core\\Entity\\EntityViewBuilder",
 *     "list_builder" = "Drupal\\Core\\Entity\\EntityListBuilder",
 *     "views_data" = "Drupal\\views\\EntityViewsData",
 *     "access" = "Drupal\\Core\\Entity\\EntityAccessControlHandler",
 *   },
 *   links = {
 *     "canonical" = "/admin/${moduleName}/result/{${moduleName}_result}",
 *     "collection" = "/admin/${moduleName}/results",
 *   },
 * )
 */
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
    const capabilities = ((manifest.spec?.capabilities || []) as Array<string | any>)
      .map(c => typeof c === 'string' ? c : c.name || '');
    const tools = (manifest.spec?.tools || []) as any[];

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
  - \`ossa/symfony-bundle\`: ^0.3

## Installation

### 1. Install via Composer

\`\`\`bash
cd /path/to/drupal
composer require ossa/symfony-bundle
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

${options.includeQueueWorker ? `
## Queue Processing

The module includes a queue worker for asynchronous agent execution:

\`\`\`bash
# Process queue via cron
drush cron

# Process queue manually
drush queue:run ${moduleName}_agent_queue
\`\`\`
` : ''}

${options.includeEntity ? `
## Results Storage

All agent execution results are stored in the database and can be viewed at:
\`/admin/${moduleName}/results\`

Results can also be queried via Views or entity queries:

\`\`\`php
$storage = \\Drupal::entityTypeManager()->getStorage('${moduleName}_result');
$results = $storage->loadMultiple();
\`\`\`
` : ''}

## Hooks

This module implements the following Drupal hooks:

${options.includeHooks ? `
- \`hook_help()\`: Provides help text
- \`hook_cron()\`: Processes queue items
- \`hook_entity_presave()\`: Triggers agent on entity save (if enabled)
- \`hook_theme()\`: Registers theme templates
` : ''}

## Architecture

This module follows OSSA (Open Standard Agents) specification and uses:

- **ossa/symfony-bundle**: Core agent execution engine
- **Dependency Injection**: Full Symfony DI container integration
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
composer require ossa/symfony-bundle
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

  // ===================================================================
  // Utility Methods
  // ===================================================================

  /**
   * Sanitize module name for Drupal
   */
  private sanitizeModuleName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^[0-9]+/, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Convert module name to class name (PascalCase)
   */
  private toClassName(moduleName: string): string {
    return moduleName
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
