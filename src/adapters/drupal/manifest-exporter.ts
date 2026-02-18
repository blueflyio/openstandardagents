/**
 * Drupal Manifest Exporter - Separation of Duties
 *
 * OSSA is an agent BUILDER/EXPORTER, not a Drupal module generator.
 * This exporter generates a minimal manifest package (3-4 files) that
 * Drupal's ai_agents_ossa contrib module imports and activates.
 *
 * Generated files:
 * 1. agent.ossa.yaml                                    - The OSSA manifest itself
 * 2. config/install/ai_agents_ossa.agent.{name}.yml     - Drupal config entity YAML (drush config:import ready)
 * 3. composer.json                                       - Dependencies
 * 4. README.md                                           - Installation instructions
 * 5. INSTALL.txt                                         - Quick start for Drupal.org
 *
 * The config entity YAML (#2) is the key deliverable. It maps the OSSA manifest
 * into Drupal's config system so `drush config:import` Just Works.
 *
 * @see https://www.drupal.org/project/ai_agents
 * @see https://www.drupal.org/project/eca
 * @see https://www.drupal.org/project/charts
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ExportFile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';
import * as yaml from 'yaml';
import {
  sanitizeModuleName,
  toLabel,
  validateDrupalCompatibility,
  buildValidationResult,
  extractCapabilities,
  extractTools,
  mapOssaToolToDrupalTool,
} from './drupal-utils.js';
import type { OssaToolEntry } from './drupal-utils.js';

export interface DrupalManifestExportOptions extends ExportOptions {
  /** Minimum required version of drupal/ai_agents (default: ^1.3) */
  aiAgentsVersion?: string;
  /** Minimum required version of drupal/eca (default: ^2.0) */
  ecaVersion?: string;
  /** Minimum required version of drupal/charts (default: ^5.0) */
  chartsVersion?: string;
  /** Drupal core version requirement (default: ^10.3 || ^11) */
  coreVersion?: string;
}

export class DrupalManifestExporter extends BaseAdapter {
  readonly platform = 'drupal';
  readonly displayName = 'Drupal Manifest Package';
  readonly description =
    'Minimal OSSA manifest package for Drupal (import via ai_agents_ossa)';
  readonly status = 'production' as const;
  readonly supportedVersions = ['v0.4.x'];

  /**
   * Export OSSA agent as a minimal Drupal manifest package
   */
  async export(
    manifest: OssaAgent,
    options?: DrupalManifestExportOptions
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

      const agentName = sanitizeModuleName(
        manifest.metadata?.name || 'ossa_agent'
      );

      const opts: DrupalManifestExportOptions = {
        aiAgentsVersion: '^1.3',
        ecaVersion: '^2.0',
        chartsVersion: '^5.0',
        coreVersion: '^10.3 || ^11',
        ...options,
      };

      const files: ExportFile[] = [];

      // 1. agent.ossa.yaml - The OSSA manifest
      files.push(
        this.createFile(
          `${agentName}/agent.ossa.yaml`,
          this.generateOssaYaml(manifest),
          'config'
        )
      );

      // 2. Drupal config entity YAML - ready for drush config:import
      files.push(
        this.createFile(
          `${agentName}/config/install/ai_agents_ossa.agent.${agentName}.yml`,
          this.generateConfigEntityYaml(manifest, agentName),
          'config'
        )
      );

      // 3. composer.json - Dependencies only
      files.push(
        this.createFile(
          `${agentName}/composer.json`,
          this.generateComposerJson(manifest, agentName, opts),
          'config'
        )
      );

      // 4. README.md - Installation instructions
      files.push(
        this.createFile(
          `${agentName}/README.md`,
          this.generateReadme(manifest, agentName, opts),
          'documentation'
        )
      );

      // 5. INSTALL.txt - Quick start for Drupal.org
      files.push(
        this.createFile(
          `${agentName}/INSTALL.txt`,
          this.generateInstallTxt(manifest, agentName, opts),
          'documentation'
        )
      );

      // 6. Tool AI connector config entities (config-only, no PHP)
      const tools = extractTools(manifest);
      if (tools.length > 0) {
        for (const tool of tools) {
          const drupalTool = mapOssaToolToDrupalTool(tool, agentName);
          files.push(
            this.createFile(
              `${agentName}/config/install/tool_ai_connector.tool.${drupalTool.id}.yml`,
              this.generateToolAiConnectorConfig(drupalTool),
              'config'
            )
          );
        }
      }

      // 7. ECA model YAML (event-condition-action, config-only)
      files.push(
        this.createFile(
          `${agentName}/config/install/eca.eca_model.${agentName}_agent.yml`,
          this.generateEcaModelYaml(manifest, agentName),
          'config'
        )
      );

      // 8. Recipe YAML (composable installation)
      files.push(
        this.createFile(
          `${agentName}/recipes/${agentName}-agent/recipe.yml`,
          this.generateRecipe(manifest, agentName, tools, opts),
          'config'
        )
      );

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: manifest.metadata?.version || '1.0.0',
        filesGenerated: files.length,
        agentName,
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

    // Drupal-specific validation (shared name check)
    const drupalValidation = validateDrupalCompatibility(manifest);
    errors.push(...drupalValidation.errors);
    warnings.push(...drupalValidation.warnings);

    // Manifest-exporter-specific: kind check
    if (!manifest.kind || manifest.kind !== 'Agent') {
      warnings.push({
        message: 'Drupal ai_agents_ossa expects kind: Agent',
        path: 'kind',
        suggestion: 'Set kind to "Agent" for best Drupal integration',
      });
    }

    return buildValidationResult(errors, warnings);
  }

  /**
   * Get example manifest for Drupal
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4.x',
      kind: 'Agent',
      metadata: {
        name: 'content_moderator',
        version: '1.0.0',
        description: 'AI-powered content moderation agent for Drupal',
        license: 'GPL-2.0-or-later',
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
      extensions: {
        drupal: {
          ai_agent_plugin: 'ossa_agent',
          tools: ['tool:read:content_load', 'tool:explain:code_review'],
          eca_events: ['entity:node:presave'],
          permissions: ['access content'],
          content_types: ['article', 'page'],
        },
      },
    } as any;
  }

  // ===================================================================
  // File Generation Methods
  // ===================================================================

  /**
   * Generate Drupal config entity YAML for drush config:import.
   *
   * Maps OSSA manifest to ai_agents_ossa config entity format:
   * - id: metadata.name (kebab→snake_case)
   * - label: metadata.name (Title Case)
   * - api_version: apiVersion
   * - manifest: full manifest data (minus apiVersion/kind, stored as nested YAML)
   */
  private generateConfigEntityYaml(
    manifest: OssaAgent,
    agentName: string
  ): string {
    // Build the manifest storage object (everything except apiVersion/kind)
    const manifestData: Record<string, unknown> = {};

    if (manifest.metadata) {
      manifestData.metadata = manifest.metadata;
    }
    if (manifest.spec) {
      manifestData.spec = manifest.spec;
    }
    if ((manifest as any).extensions) {
      manifestData.extensions = (manifest as any).extensions;
    }

    // Build the config entity
    const configEntity: Record<string, unknown> = {
      id: agentName,
      label: toLabel(manifest.metadata?.name || agentName),
      api_version: manifest.apiVersion || 'ossa/v0.4.5',
      status: true,
      manifest: manifestData,
    };

    return yaml.stringify(configEntity, {
      indent: 2,
      lineWidth: 120,
    });
  }

  /**
   * Generate agent.ossa.yaml - the OSSA manifest in YAML format
   */
  private generateOssaYaml(manifest: OssaAgent): string {
    // Serialize the manifest as clean YAML
    const doc = yaml.stringify(manifest, {
      indent: 2,
      lineWidth: 120,
    });

    return `# OSSA Agent Manifest
# Import this file into Drupal via ai_agents_ossa module
# See: https://www.drupal.org/project/ai_agents_ossa
#
# Usage:
#   drush ai-agents:import agent.ossa.yaml
#   Or upload via admin UI: /admin/config/ai/agents/import
${doc}`;
  }

  /**
   * Generate README.md with installation instructions
   */
  private generateReadme(
    manifest: OssaAgent,
    agentName: string,
    options: DrupalManifestExportOptions
  ): string {
    const capabilities = extractCapabilities(manifest);
    const tools = extractTools(manifest);

    return `# ${manifest.metadata?.name || agentName}

${manifest.metadata?.description || 'OSSA agent for Drupal'}

## About

This is an OSSA (Open Standard Agents) manifest package. It does NOT contain
a Drupal module. Instead, it contains the agent definition that Drupal's
\`ai_agents_ossa\` contrib module reads, imports, and activates.

**Role**: ${manifest.spec?.role || 'AI Agent'}

${capabilities.length > 0 ? `## Capabilities\n\n${capabilities.map((c: string) => `- ${c}`).join('\n')}\n` : ''}
${tools.length > 0 ? `## Tools\n\n${tools.map((t: any) => `- **${t.name || 'unknown'}**: ${t.description || 'No description'}`).join('\n')}\n` : ''}
## Requirements

Install the following Drupal modules before importing this manifest:

| Module | Version | Purpose |
|--------|---------|---------|
| [drupal/ai_agents](https://www.drupal.org/project/ai_agents) | ${options.aiAgentsVersion} | Core AI agent framework |
| drupal/ai_agents_ossa | - | OSSA manifest import/runtime |
| [drupal/eca](https://www.drupal.org/project/eca) | ${options.ecaVersion} | Event-Condition-Action (replaces custom event subscribers) |
| [drupal/charts](https://www.drupal.org/project/charts) | ${options.chartsVersion} | Agent execution metrics and dashboards |

Optional but recommended:

| Module | Purpose |
|--------|---------|
| [drupal/workflows](https://www.drupal.org/project/workflows) | Agent state machine and lifecycle management |
| [drupal/views](https://www.drupal.org/project/views) | Agent execution history and result browsing |

## Installation

### Step 1: Install dependencies via Composer

\`\`\`bash
cd /path/to/drupal
composer require drupal/ai_agents:${options.aiAgentsVersion} \\
  drupal/ai_agents_ossa \\
  drupal/eca:${options.ecaVersion} \\
  drupal/charts:${options.chartsVersion}
\`\`\`

### Step 2: Enable modules

\`\`\`bash
drush en ai_agents ai_agents_ossa eca charts
\`\`\`

### Step 3: Import this manifest

\`\`\`bash
drush ai-agents:import agent.ossa.yaml
\`\`\`

Or via the admin UI:
1. Navigate to \`/admin/config/ai/agents/import\`
2. Upload \`agent.ossa.yaml\`
3. Review and confirm the import

### Step 4: Configure the agent

1. Visit \`/admin/config/ai/agents\`
2. Find "${manifest.metadata?.name || agentName}" in the agent list
3. Configure LLM provider, API keys, and execution settings
4. Set up ECA rules for event-driven triggers (optional)

## Architecture

This package follows OSSA's separation of duties:

- **OSSA** (this package): Defines WHAT the agent does (manifest)
- **ai_agents**: Provides the Drupal agent framework (entity types, admin UI, execution engine)
- **ai_agents_ossa**: Bridges OSSA manifests into Drupal's ai_agents system
- **ECA**: Handles event-driven agent triggers (replaces custom EventSubscriber classes)
- **Charts**: Provides execution metrics visualization
- **Views**: Powers agent execution history listings

No custom PHP code is needed. The contrib modules handle everything.

## OSSA Specification

- **API Version**: ${manifest.apiVersion || 'ossa/v0.4.x'}
- **Kind**: ${manifest.kind || 'Agent'}
- **Version**: ${manifest.metadata?.version || '1.0.0'}

## License

${manifest.metadata?.license || 'GPL-2.0-or-later'}
`;
  }

  /**
   * Generate INSTALL.txt - quick start for Drupal.org
   */
  private generateInstallTxt(
    manifest: OssaAgent,
    agentName: string,
    options: DrupalManifestExportOptions
  ): string {
    return `INSTALLATION
============

${manifest.metadata?.name || agentName}
${manifest.metadata?.description || 'OSSA agent for Drupal'}

This is an OSSA manifest package, NOT a Drupal module.
You need the following contrib modules to use it:

REQUIREMENTS
------------
  - drupal/ai_agents ${options.aiAgentsVersion}
  - drupal/ai_agents_ossa
  - drupal/eca ${options.ecaVersion}
  - drupal/charts ${options.chartsVersion}

QUICK START
-----------
  1. Install dependencies:
     composer require drupal/ai_agents:${options.aiAgentsVersion} drupal/ai_agents_ossa drupal/eca:${options.ecaVersion} drupal/charts:${options.chartsVersion}

  2. Enable modules:
     drush en ai_agents ai_agents_ossa eca charts

  3. Import manifest:
     drush ai-agents:import agent.ossa.yaml

  4. Configure at /admin/config/ai/agents

WHAT THIS IS NOT
----------------
  This package does NOT contain:
  - A Drupal module (.info.yml, .module, etc.)
  - PHP code (services, controllers, entities)
  - EventSubscriber classes (use ECA module instead)

  All Drupal integration is handled by the ai_agents and
  ai_agents_ossa contrib modules. This package only contains
  the OSSA agent definition (agent.ossa.yaml).

SUPPORT
-------
  OSSA: https://openstandardagents.org/
  ai_agents: https://www.drupal.org/project/ai_agents
  ECA: https://www.drupal.org/project/eca
`;
  }

  /**
   * Generate composer.json - dependencies only, no Drupal module metadata
   */
  private generateComposerJson(
    manifest: OssaAgent,
    agentName: string,
    options: DrupalManifestExportOptions
  ): string {
    return JSON.stringify(
      {
        name: `ossa/${agentName}`,
        type: 'ossa-agent',
        description:
          manifest.metadata?.description || 'OSSA agent manifest for Drupal',
        keywords: ['OSSA', 'AI', 'Agent', 'Drupal', 'ai_agents'],
        license: manifest.metadata?.license || 'GPL-2.0-or-later',
        require: {
          'drupal/ai_agents': options.aiAgentsVersion || '^1.3',
          'drupal/ai_agents_ossa': '*',
          'drupal/eca': options.ecaVersion || '^2.0',
          'drupal/charts': options.chartsVersion || '^5.0',
        },
        extra: {
          ossa: {
            apiVersion: manifest.apiVersion,
            kind: manifest.kind,
            version: manifest.metadata?.version,
            manifest: 'agent.ossa.yaml',
          },
        },
      },
      null,
      2
    );
  }

  // ===================================================================
  // Tool API Config Generation (Phase 5 - Issue #433)
  // ===================================================================

  /**
   * Generate tool_ai_connector config YAML for a single tool.
   *
   * Registers the tool with Drupal's Tool API AI connector system
   * so it is discoverable by AI-powered modules. Config-only, no PHP.
   *
   * @param drupalTool - Drupal tool definition from mapOssaToolToDrupalTool
   */
  private generateToolAiConnectorConfig(drupalTool: {
    id: string;
    label: string;
    description: string;
  }): string {
    return `id: '${drupalTool.id}'
label: '${drupalTool.label}'
description: '${drupalTool.description}'
status: true
ai_callable: true
`;
  }

  // ===================================================================
  // ECA Model YAML Generation (Phase 5 - Issue #433)
  // ===================================================================

  /**
   * Generate ECA (Event-Condition-Action) model YAML.
   *
   * Creates an ECA model that triggers the OSSA agent on entity presave
   * events. This is config-only (no PHP event subscribers needed) because
   * ECA handles event routing declaratively.
   *
   * Philosophy: "OSSA defines WHAT, Drupal executes HOW"
   */
  private generateEcaModelYaml(
    manifest: OssaAgent,
    agentName: string
  ): string {
    const displayName = toLabel(manifest.metadata?.name || agentName);

    // Check for drupal extension hints
    const extensions = (manifest as any).extensions?.drupal || {};
    const ecaEvents = extensions.eca_events || ['entity:node:presave'];
    const contentTypes = extensions.content_types || ['article', 'page'];

    // Build content type condition value
    const contentTypeCondition = contentTypes.join(', ');

    // Use the first event as the primary trigger
    const primaryEvent = ecaEvents[0] || 'entity:node:presave';

    return `id: ${agentName}_agent
label: '${displayName} Agent Trigger'
status: true
version: '${manifest.metadata?.version || '1.0.0'}'
events:
  ${agentName}_event:
    plugin_id: '${primaryEvent}'
    label: '${displayName} trigger event'
    configuration: {}
    successors:
      - ${agentName}_condition
conditions:
  ${agentName}_condition:
    plugin_id: 'eca_entity_type_bundle'
    label: 'Check content type'
    configuration:
      type: 'node'
      bundles: '${contentTypeCondition}'
    successors:
      - ${agentName}_action
    negate: false
actions:
  ${agentName}_action:
    plugin_id: 'ai_agents_execute'
    label: 'Execute ${displayName} agent'
    configuration:
      agent_id: '${agentName}'
      async: true
`;
  }

  // ===================================================================
  // Recipe Generation (Phase 5 - Issue #433)
  // ===================================================================

  /**
   * Generate a Drupal Recipe YAML for composable installation.
   *
   * Recipes are Drupal's modern approach to distributing reusable
   * configuration sets. For manifest-exporter, this installs the
   * required contrib modules and imports the agent config entity.
   * No custom PHP module is installed (manifest-exporter philosophy).
   */
  private generateRecipe(
    manifest: OssaAgent,
    agentName: string,
    tools: OssaToolEntry[],
    options: DrupalManifestExportOptions
  ): string {
    const displayName = toLabel(manifest.metadata?.name || agentName);
    const llmConfig = (manifest.spec?.llm as any) || {};

    // Install list: contrib modules only (no custom module)
    const installModules = [
      'ai',
      'ai_agents',
      'ai_agents_ossa',
      'tool',
      'eca',
    ];

    // Build config actions for tool_ai_connector entities
    const toolConfigLines: string[] = [];
    if (tools.length > 0) {
      for (const tool of tools) {
        const drupalTool = mapOssaToolToDrupalTool(tool, agentName);
        toolConfigLines.push(
          `    tool_ai_connector.tool.${drupalTool.id}:`,
          `      simple_config_update:`,
          `        status: true`,
          `        ai_callable: true`
        );
      }
    }

    let recipe = `name: '${displayName}'
description: 'Install and configure the OSSA ${agentName} agent'
type: 'AI Agent'
install:
${installModules.map((m) => `  - ${m}`).join('\n')}
config:
  import:
    ai_agents_ossa:
      - ai_agents_ossa.agent.${agentName}
  actions:
    ai_agents_ossa.agent.${agentName}:
      simple_config_update:
        status: true
`;

    if (toolConfigLines.length > 0) {
      recipe += toolConfigLines.join('\n') + '\n';
    }

    return recipe;
  }

}
