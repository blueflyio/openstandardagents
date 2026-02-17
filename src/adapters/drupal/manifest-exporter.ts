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

      const agentName = this.sanitizeName(
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

      // Perfect Agent files
      files.push(...await this.generatePerfectAgentFiles(manifest, options));

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

    // Drupal-specific validation
    const name = manifest.metadata?.name;
    if (name && !/^[a-z0-9_]+$/.test(name)) {
      warnings.push({
        message:
          'Agent name should only contain lowercase letters, numbers, and underscores for Drupal compatibility',
        path: 'metadata.name',
        suggestion: `Use: ${this.sanitizeName(name)}`,
      });
    }

    if (!manifest.kind || manifest.kind !== 'Agent') {
      warnings.push({
        message: 'Drupal ai_agents_ossa expects kind: Agent',
        path: 'kind',
        suggestion: 'Set kind to "Agent" for best Drupal integration',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
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
      label: this.toLabel(manifest.metadata?.name || agentName),
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
   * Convert kebab-case or snake_case name to Title Case label.
   */
  private toLabel(name: string): string {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
    const capabilities = (
      (manifest.spec?.capabilities || []) as Array<string | any>
    ).map((c: string | any) => (typeof c === 'string' ? c : c.name || ''));

    const tools = (manifest.spec?.tools || []) as any[];

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
  // Utility Methods
  // ===================================================================

  /**
   * Sanitize agent name for Drupal compatibility
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^[0-9]+/, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
