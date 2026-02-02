/**
 * Drupal Platform Adapter
 * Exports OSSA agent manifests to Drupal module format (PHP)
 *
 * Generates a complete Drupal module with:
 * - .info.yml (module metadata)
 * - .services.yml (service definitions)
 * - Plugin/AiAgent (agent implementation)
 * - Service class (business logic)
 *
 * SOLID: Single Responsibility - Drupal module export only
 * DRY: Reuses BaseAdapter validation and helpers
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

export class DrupalAdapter extends BaseAdapter {
  readonly platform = 'drupal';
  readonly displayName = 'Drupal Module';
  readonly description = 'Drupal module with OSSA agent integration';
  readonly supportedVersions = ['v{{VERSION}}'];

  /**
   * Export OSSA manifest to Drupal module format
   */
  async export(
    manifest: OssaAgent,
    options?: ExportOptions
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
      const files = [];

      // Generate .info.yml
      files.push(
        this.createFile(
          `drupal/${moduleName}/${moduleName}.info.yml`,
          this.generateInfoYml(manifest, moduleName),
          'config'
        )
      );

      // Generate .services.yml
      files.push(
        this.createFile(
          `drupal/${moduleName}/${moduleName}.services.yml`,
          this.generateServicesYml(manifest, moduleName, className),
          'config'
        )
      );

      // Generate Plugin/AiAgent/{ClassName}.php
      files.push(
        this.createFile(
          `drupal/${moduleName}/src/Plugin/AiAgent/${className}.php`,
          this.generatePluginClass(manifest, moduleName, className),
          'code',
          'php'
        )
      );

      // Generate Service/{ClassName}Service.php
      files.push(
        this.createFile(
          `drupal/${moduleName}/src/Service/${className}Service.php`,
          this.generateServiceClass(manifest, moduleName, className),
          'code',
          'php'
        )
      );

      // Copy OSSA manifest to config/ossa/
      files.push(
        this.createFile(
          `drupal/${moduleName}/config/ossa/agent.yml`,
          JSON.stringify(manifest, null, 2),
          'config'
        )
      );

      // Generate README.md
      files.push(
        this.createFile(
          `drupal/${moduleName}/README.md`,
          this.generateReadme(manifest, moduleName),
          'documentation'
        )
      );

      // Generate composer.json
      files.push(
        this.createFile(
          `drupal/${moduleName}/composer.json`,
          this.generateComposerJson(manifest, moduleName),
          'config'
        )
      );

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '1.0.0',
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
   * Get example Drupal-optimized manifest
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

  /**
   * Generate .info.yml
   */
  private generateInfoYml(manifest: OssaAgent, moduleName: string): string {
    return `name: '${manifest.metadata?.name || moduleName}'
type: module
description: '${manifest.metadata?.description || 'OSSA agent module'}'
core_version_requirement: ^10 || ^11
package: 'OSSA Agents'

dependencies:
  - drupal:typed_data
  - drupal:key_value

# OSSA metadata
ossa:
  version: '${manifest.metadata?.version || '1.0.0'}'
  api_version: '${manifest.apiVersion || 'ossa/v{{VERSION}}'}'
  kind: '${manifest.kind || 'Agent'}'
`;
  }

  /**
   * Generate .services.yml
   */
  private generateServicesYml(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    return `services:
  ${moduleName}.agent_service:
    class: Drupal\\${moduleName}\\Service\\${className}Service
    arguments:
      - '@logger.factory'
      - '@config.factory'
      - '@entity_type.manager'
    tags:
      - { name: ossa_agent }
`;
  }

  /**
   * Generate Plugin class
   */
  private generatePluginClass(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    const capabilities = ((manifest.spec?.capabilities || []) as Array<string | any>).map(c => typeof c === 'string' ? c : c.name || '');

    return `<?php

namespace Drupal\\${moduleName}\\Plugin\\AiAgent;

use Drupal\\Core\\Plugin\\PluginBase;
use Drupal\\${moduleName}\\Service\\${className}Service;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;

/**
 * ${manifest.metadata?.description || 'OSSA Agent Plugin'}
 *
 * @AiAgent(
 *   id = "${moduleName}",
 *   label = @Translation("${manifest.metadata?.name || moduleName}"),
 *   description = @Translation("${manifest.metadata?.description || ''}"),
 *   ossa_version = "${manifest.metadata?.version || '1.0.0'}",
 *   capabilities = {${capabilities.map((c) => `"${c}"`).join(', ')}}
 * )
 */
class ${className} extends PluginBase {

  /**
   * The agent service.
   *
   * @var \\Drupal\\${moduleName}\\Service\\${className}Service
   */
  protected $agentService;

  /**
   * {@inheritdoc}
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, ${className}Service $agent_service) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->agentService = $agent_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('${moduleName}.agent_service')
    );
  }

  /**
   * Execute the agent.
   *
   * @param array $input
   *   Input data for the agent.
   *
   * @return array
   *   Agent execution result.
   */
  public function execute(array $input): array {
    return $this->agentService->execute($input);
  }

  /**
   * Get agent capabilities.
   *
   * @return array
   *   List of capabilities.
   */
  public function getCapabilities(): array {
    return $this->pluginDefinition['capabilities'] ?? [];
  }

}
`;
  }

  /**
   * Generate Service class
   */
  private generateServiceClass(
    manifest: OssaAgent,
    moduleName: string,
    className: string
  ): string {
    const tools = (manifest.spec?.tools || []) as any[];

    return `<?php

namespace Drupal\\${moduleName}\\Service;

use Drupal\\Core\\Logger\\LoggerChannelFactoryInterface;
use Drupal\\Core\\Config\\ConfigFactoryInterface;
use Drupal\\Core\\Entity\\EntityTypeManagerInterface;

/**
 * ${className} Service.
 *
 * Implements the business logic for the ${manifest.metadata?.name || moduleName} agent.
 */
class ${className}Service {

  /**
   * The logger factory.
   *
   * @var \\Drupal\\Core\\Logger\\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * The config factory.
   *
   * @var \\Drupal\\Core\\Config\\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The entity type manager.
   *
   * @var \\Drupal\\Core\\Entity\\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs a new ${className}Service.
   *
   * @param \\Drupal\\Core\\Logger\\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   * @param \\Drupal\\Core\\Config\\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \\Drupal\\Core\\Entity\\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(
    LoggerChannelFactoryInterface $logger_factory,
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager
  ) {
    $this->loggerFactory = $logger_factory;
    $this->configFactory = $config_factory;
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * Execute the agent.
   *
   * @param array $input
   *   Input data.
   *
   * @return array
   *   Execution result.
   */
  public function execute(array $input): array {
    $this->loggerFactory->get('${moduleName}')->info('Agent execution started');

    try {
      // Agent execution logic
      $result = $this->processInput($input);

      return [
        'success' => TRUE,
        'data' => $result,
      ];
    }
    catch (\\Exception $e) {
      $this->loggerFactory->get('${moduleName}')->error('Agent execution failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      return [
        'success' => FALSE,
        'error' => $e->getMessage(),
      ];
    }
  }

  /**
   * Process input data.
   *
   * @param array $input
   *   Input data.
   *
   * @return mixed
   *   Processed result.
   */
  protected function processInput(array $input) {
    // TODO: Implement agent logic here
    // Role: ${manifest.spec?.role || 'Process input'}

${tools.map((tool) => `    // Tool: ${tool.name || 'unknown'} - ${tool.description || 'No description'}`).join('\n')}

    return $input;
  }

}
`;
  }

  /**
   * Generate composer.json
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
          'drupal/core': '^10 || ^11',
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
   * Generate README.md
   */
  private generateReadme(manifest: OssaAgent, moduleName: string): string {
    const capabilities = ((manifest.spec?.capabilities || []) as Array<string | any>).map(c => typeof c === 'string' ? c : c.name || '');
    const tools = (manifest.spec?.tools || []) as any[];

    return `# ${manifest.metadata?.name || moduleName}

${manifest.metadata?.description || 'OSSA agent module for Drupal'}

## Description

${manifest.spec?.role || 'AI Agent'}

## Installation

\`\`\`bash
# Copy module to Drupal modules directory
cp -r ${moduleName} /path/to/drupal/modules/custom/

# Enable module
drush en ${moduleName}
\`\`\`

## Usage

\`\`\`php
// Get agent service
$agent = \\Drupal::service('${moduleName}.agent_service');

// Execute agent
$result = $agent->execute([
  'input' => 'your data here',
]);

if ($result['success']) {
  print_r($result['data']);
}
\`\`\`

## Capabilities

${capabilities.map((c) => `- ${c}`).join('\n')}

## Tools

${tools.map((t) => `- **${t.name || 'unknown'}**: ${t.description || 'No description'}`).join('\n')}

## Configuration

Configure the module at: \`/admin/config/ossa/${moduleName}\`

## Generated from OSSA

This module was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '{{VERSION}}'} manifest.

Original manifest: \`config/ossa/agent.yml\`

## Requirements

- Drupal 10 or 11
- PHP 8.1+

## License

${manifest.metadata?.license || 'GPL-2.0-or-later'}
`;
  }

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
   * Convert module name to class name
   */
  private toClassName(moduleName: string): string {
    return moduleName
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
