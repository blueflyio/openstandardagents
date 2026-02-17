/**
 * Warp Terminal Agent Platform Adapter
 * Exports OSSA agent manifests to Warp agent format
 *
 * Warp agents are command-line agents that run in Warp Terminal
 * https://docs.warp.dev/agent-platform/getting-started/agents-in-warp
 *
 * SOLID: Single Responsibility - Warp agent generation only
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
import type {
  WarpAgent,
  WarpCommand,
  WarpParameter,
  WarpAgentConfig,
} from './types.js';

export class WarpAdapter extends BaseAdapter {
  readonly platform = 'warp';
  readonly displayName = 'Warp Terminal';
  readonly description =
    'Warp terminal agent with command-line interface and triggers';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v{{VERSION}}'];

  /**
   * Export OSSA manifest to Warp agent format
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

      const agentName = manifest.metadata?.name || 'warp-agent';
      const files = [];

      // Generate warp-agent.yaml - Warp agent configuration
      const warpAgent = this.convertToWarpAgent(manifest);
      const config: WarpAgentConfig = {
        version: '1.0',
        agent: warpAgent,
      };

      files.push(
        this.createFile(
          `warp/${agentName}/warp-agent.yaml`,
          this.generateWarpConfig(config),
          'config',
          'yaml'
        )
      );

      // Generate handlers for each command
      warpAgent.commands.forEach((cmd) => {
        files.push(
          this.createFile(
            `warp/${agentName}/handlers/${cmd.name}.sh`,
            this.generateCommandHandler(cmd, manifest),
            'code',
            'bash'
          )
        );
      });

      // Generate README.md
      files.push(
        this.createFile(
          `warp/${agentName}/README.md`,
          this.generateReadme(manifest, warpAgent),
          'documentation'
        )
      );

      // Include source OSSA manifest for provenance
      files.push(this.createManifestFile(manifest));

      // Perfect Agent files
      files.push(...await this.generatePerfectAgentFiles(manifest, options));

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
   * Validate manifest for Warp compatibility
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Base validation
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // Warp-specific validation
    const spec = manifest.spec;

    // Check capabilities or tools (Warp uses these as commands)
    if (
      (!spec?.capabilities || !Array.isArray(spec.capabilities)) &&
      (!spec?.tools || !Array.isArray(spec.tools))
    ) {
      warnings.push({
        message:
          'No capabilities or tools defined, agent will have no commands',
        path: 'spec.capabilities',
        suggestion: 'Add spec.capabilities or spec.tools array',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get example Warp-optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
      kind: 'Agent',
      metadata: {
        name: 'warp-dev-agent',
        version: '1.0.0',
        description: 'Development workflow agent for Warp Terminal',
      },
      spec: {
        role: 'Assists with common development tasks in the terminal',
        capabilities: [
          'git-commit',
          'run-tests',
          'deploy',
          'code-review',
        ] as any,
        tools: [
          {
            type: 'command',
            name: 'git_commit',
            description: 'Create a git commit with conventional commit format',
          },
          {
            type: 'command',
            name: 'run_tests',
            description: 'Run project tests and display results',
          },
        ],
      },
    };
  }

  /**
   * Convert OSSA manifest to Warp agent
   */
  private convertToWarpAgent(manifest: OssaAgent): WarpAgent {
    const name = manifest.metadata?.name || 'warp-agent';
    const description =
      manifest.spec?.role || manifest.metadata?.description || 'Warp agent';

    // Convert tools/capabilities to Warp commands
    const tools = (manifest.spec?.tools || []) as any[];
    const capabilities = (
      (manifest.spec?.capabilities || []) as Array<string | any>
    ).map((c: any) => (typeof c === 'string' ? c : c.name || ''));

    const commands: WarpCommand[] = [];

    // Convert tools to commands
    tools.forEach((tool) => {
      const cmdName = tool.name?.replace(/_/g, '-') || 'unknown';
      const cmd: WarpCommand = {
        name: cmdName,
        description: tool.description || `Execute ${cmdName}`,
        handler: `./handlers/${cmdName}.sh`,
      };

      // Extract parameters from tool schema
      if (tool.inputSchema || tool.schema) {
        const schema = tool.inputSchema || tool.schema;
        if (schema.properties) {
          cmd.parameters = this.convertSchemaToParameters(schema);
        }
      }

      commands.push(cmd);
    });

    // Add capability-based commands if no tools
    if (commands.length === 0 && capabilities.length > 0) {
      capabilities.forEach((cap: string) => {
        const cmdName = cap.replace(/_/g, '-');
        commands.push({
          name: cmdName,
          description: `Execute ${cap} capability`,
          handler: `./handlers/${cmdName}.sh`,
        });
      });
    }

    return {
      name,
      description,
      commands,
      metadata: {
        version: manifest.metadata?.version,
        author: manifest.metadata?.author,
        tags: manifest.metadata?.tags,
      },
    };
  }

  /**
   * Convert JSON Schema to Warp parameters
   */
  private convertSchemaToParameters(
    schema: any
  ): Record<string, WarpParameter> {
    const params: Record<string, WarpParameter> = {};

    if (!schema.properties) return params;

    for (const [key, value] of Object.entries(schema.properties)) {
      const prop = value as any;
      params[key] = {
        type: prop.type || 'string',
        description: prop.description || `Parameter: ${key}`,
        required: schema.required?.includes(key),
        default: prop.default,
        enum: prop.enum,
      };
    }

    return params;
  }

  /**
   * Generate warp-agent.yaml configuration
   */
  private generateWarpConfig(config: WarpAgentConfig): string {
    // Manual YAML generation for better control
    let yaml = `version: "${config.version}"\n\n`;
    yaml += `agent:\n`;
    yaml += `  name: "${config.agent.name}"\n`;
    yaml += `  description: "${config.agent.description}"\n\n`;

    if (config.agent.metadata) {
      yaml += `  metadata:\n`;
      if (config.agent.metadata.version) {
        yaml += `    version: "${config.agent.metadata.version}"\n`;
      }
      if (config.agent.metadata.author) {
        yaml += `    author: "${config.agent.metadata.author}"\n`;
      }
      if (config.agent.metadata.tags) {
        yaml += `    tags:\n`;
        config.agent.metadata.tags.forEach((tag: string) => {
          yaml += `      - "${tag}"\n`;
        });
      }
      yaml += '\n';
    }

    yaml += `  commands:\n`;
    config.agent.commands.forEach((cmd) => {
      yaml += `    - name: "${cmd.name}"\n`;
      yaml += `      description: "${cmd.description}"\n`;
      yaml += `      handler: "${cmd.handler}"\n`;

      if (cmd.parameters && Object.keys(cmd.parameters).length > 0) {
        yaml += `      parameters:\n`;
        Object.entries(cmd.parameters).forEach(([name, param]) => {
          yaml += `        ${name}:\n`;
          yaml += `          type: "${param.type}"\n`;
          yaml += `          description: "${param.description}"\n`;
          if (param.required) yaml += `          required: true\n`;
          if (param.default !== undefined)
            yaml += `          default: ${JSON.stringify(param.default)}\n`;
        });
      }

      yaml += '\n';
    });

    return yaml;
  }

  /**
   * Generate command handler script
   */
  private generateCommandHandler(
    cmd: WarpCommand,
    manifest: OssaAgent
  ): string {
    const params = cmd.parameters || {};
    const paramList = Object.keys(params)
      .map((p) => `$${p.toUpperCase()}`)
      .join(' ');

    return `#!/usr/bin/env bash
# Warp Command Handler: ${cmd.name}
# ${cmd.description}
# Generated from OSSA manifest

set -euo pipefail

# Command: ${cmd.name}
# Description: ${cmd.description}

${
  Object.keys(params).length > 0
    ? `# Parameters:\n${Object.entries(params)
        .map(
          ([name, param]) =>
            `# - ${name.toUpperCase()}: ${param.description}${param.required ? ' (required)' : ''}`
        )
        .join('\n')}`
    : '# No parameters'
}

# Parse arguments
${Object.entries(params)
  .map(([name]) => `${name.toUpperCase()}=""`)
  .join('\n')}

while [[ $# -gt 0 ]]; do
  case $1 in
${Object.keys(params)
  .map(
    (name) => `    --${name})
      ${name.toUpperCase()}="$2"
      shift 2
      ;;`
  )
  .join('\n')}
    *)
      echo "Unknown parameter: $1"
      exit 1
      ;;
  esac
done

# Validate required parameters
${Object.entries(params)
  .filter(([, param]) => param.required)
  .map(
    ([name]) => `if [[ -z "$${name.toUpperCase()}" ]]; then
  echo "Error: --${name} is required"
  exit 1
fi`
  )
  .join('\n')}

# TODO: Implement ${cmd.name} logic here
echo "Executing ${cmd.name} command..."
${paramList ? `echo "Parameters: ${paramList}"` : ''}

# Example implementation:
# Replace this with actual command logic
echo "Command ${cmd.name} not yet implemented"
exit 0
`;
  }

  /**
   * Generate README.md
   */
  private generateReadme(manifest: OssaAgent, agent: WarpAgent): string {
    const agentName = manifest.metadata?.name || 'warp-agent';
    const description =
      manifest.spec?.role || manifest.metadata?.description || 'Warp agent';

    return `# ${agentName}

${description}

## Warp Terminal Agent

This agent is designed for use with [Warp Terminal](https://www.warp.dev/), providing command-line tools and workflows.

## Installation

1. **Copy to Warp agents directory:**

\`\`\`bash
mkdir -p ~/.warp/agents
cp -r warp/${agentName} ~/.warp/agents/
\`\`\`

2. **Make handlers executable:**

\`\`\`bash
chmod +x ~/.warp/agents/${agentName}/handlers/*.sh
\`\`\`

3. **Restart Warp Terminal**

## Available Commands

${agent.commands
  .map(
    (cmd) => `### /${cmd.name}

${cmd.description}

${
  cmd.parameters && Object.keys(cmd.parameters).length > 0
    ? `**Parameters:**

${Object.entries(cmd.parameters)
  .map(
    ([name, param]) =>
      `- \`--${name}\`: ${param.description}${param.required ? ' (required)' : ''}`
  )
  .join('\n')}`
    : '**No parameters**'
}

**Usage:**

\`\`\`bash
/${cmd.name}${
      cmd.parameters
        ? ` ${Object.keys(cmd.parameters)
            .map((p) => `--${p} <value>`)
            .join(' ')}`
        : ''
    }
\`\`\`
`
  )
  .join('\n')}

## Development

Command handlers are located in \`handlers/\` directory. Each handler is a bash script that implements the command logic.

To add or modify commands:

1. Edit \`warp-agent.yaml\` to add/update command definitions
2. Create/modify the corresponding handler script in \`handlers/\`
3. Make the handler executable: \`chmod +x handlers/<command>.sh\`

## Generated from OSSA

This agent was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '{{VERSION}}'} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

${manifest.metadata?.license || 'MIT'}
`;
  }
}
