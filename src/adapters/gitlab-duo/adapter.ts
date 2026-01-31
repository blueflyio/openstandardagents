/**
 * GitLab Duo Export Adapter
 * Exports OSSA agent manifests to GitLab Duo custom agent format
 *
 * SOLID: Single Responsibility - GitLab Duo export only
 * DRY: Reuses BaseAdapter validation and helpers
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

export interface GitLabDuoConfig {
  name: string;
  description: string;
  instructions: string;
  mcp_servers: MCPServerConfig[];
  tools: GitLabDuoTool[];
}

export interface MCPServerConfig {
  name: string;
  url: string;
  transport: 'http' | 'stdio';
  env?: Record<string, string>;
}

export interface GitLabDuoTool {
  name: string;
  description: string;
  mcp_server: string;
  mcp_tool: string;
}

export class GitLabDuoAdapter extends BaseAdapter {
  readonly platform = 'gitlab-duo';
  readonly displayName = 'GitLab Duo';
  readonly description = 'GitLab Duo Custom Agent with MCP integration';
  readonly supportedVersions = ['v0.4.0'];

  /**
   * Export OSSA manifest to GitLab Duo format
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

      // Convert to GitLab Duo config
      const config = this.convertToGitLabDuo(manifest);
      const files: ExportFile[] = [];

      // Generate agent-config.yaml
      const agentConfig = this.generateAgentConfig(config);
      files.push(
        this.createFile(
          'gitlab-duo/agent-config.yaml',
          agentConfig,
          'config'
        )
      );

      // Generate MCP server configuration
      const mcpConfig = this.generateMCPConfig(config);
      files.push(
        this.createFile(
          'gitlab-duo/mcp-servers.json',
          mcpConfig,
          'config'
        )
      );

      // Generate README
      const readme = this.generateReadme(manifest, config);
      files.push(
        this.createFile(
          'gitlab-duo/README.md',
          readme,
          'documentation'
        )
      );

      // Generate deployment script
      const deployScript = this.generateDeployScript(manifest);
      files.push(
        this.createFile(
          'gitlab-duo/deploy.sh',
          deployScript,
          'script'
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
   * Validate manifest for GitLab Duo compatibility
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Base validation
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // GitLab Duo specific validation
    const spec = manifest.spec;

    // Check for instructions/role
    if (!spec?.role && !spec?.instructions) {
      warnings.push({
        message: 'No role or instructions found, agent may not have clear guidance',
        path: 'spec.role',
        suggestion: 'Add spec.role or spec.instructions field',
      });
    }

    // Check for tools/capabilities
    if (!spec?.tools && !spec?.capabilities) {
      warnings.push({
        message: 'No tools or capabilities defined, agent will have limited functionality',
        path: 'spec.tools',
        suggestion: 'Add spec.tools or spec.capabilities array',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get example GitLab Duo optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4.0',
      kind: 'Agent',
      metadata: {
        name: 'gitlab-duo-example',
        version: '1.0.0',
        description: 'Example GitLab Duo custom agent',
      },
      spec: {
        role: 'You are a GitLab expert that helps with CI/CD, merge requests, and code review.',
        capabilities: [
          'gitlab-api',
          'code-review',
          'ci-cd-debugging',
        ],
        tools: [
          {
            name: 'list_merge_requests',
            description: 'List merge requests for a project',
            type: 'mcp',
          },
          {
            name: 'review_code',
            description: 'Review code changes and provide feedback',
            type: 'mcp',
          },
        ],
      },
    };
  }

  /**
   * Convert OSSA manifest to GitLab Duo config
   */
  private convertToGitLabDuo(manifest: OssaAgent): GitLabDuoConfig {
    const spec = manifest.spec as any;
    const name = manifest.metadata?.name || 'custom-agent';
    const description = manifest.metadata?.description || '';
    const instructions = spec.role || spec.instructions || '';

    // Map OSSA capabilities to MCP servers
    const mcpServers: MCPServerConfig[] = [];
    const tools: GitLabDuoTool[] = [];

    // Default MCP server for OSSA agents
    mcpServers.push({
      name: 'ossa-agent-server',
      url: 'http://agent-mesh:8080/mcp',
      transport: 'http',
      env: {
        AGENT_NAME: name,
      },
    });

    // Convert tools to GitLab Duo format
    if (spec.tools && Array.isArray(spec.tools)) {
      spec.tools.forEach((tool: any) => {
        tools.push({
          name: tool.name,
          description: tool.description || '',
          mcp_server: 'ossa-agent-server',
          mcp_tool: tool.name,
        });
      });
    }

    // Convert capabilities to tools
    if (spec.capabilities && Array.isArray(spec.capabilities)) {
      spec.capabilities.forEach((cap: string) => {
        if (!tools.find(t => t.name === cap)) {
          tools.push({
            name: cap.replace(/-/g, '_'),
            description: `Capability: ${cap}`,
            mcp_server: 'ossa-agent-server',
            mcp_tool: cap,
          });
        }
      });
    }

    return {
      name,
      description,
      instructions,
      mcp_servers: mcpServers,
      tools,
    };
  }

  /**
   * Generate agent-config.yaml
   */
  private generateAgentConfig(config: GitLabDuoConfig): string {
    return `# GitLab Duo Custom Agent Configuration
# Generated from OSSA manifest

name: "${config.name}"
description: "${config.description}"

instructions: |
  ${config.instructions.split('\n').join('\n  ')}

# MCP Server References
mcp_servers:
${config.mcp_servers.map(server => `  - name: "${server.name}"
    transport: ${server.transport}
    ${server.transport === 'http' ? `url: "${server.url}"` : ''}
    ${server.env ? `env:\n${Object.entries(server.env).map(([k, v]) => `      ${k}: "${v}"`).join('\n')}` : ''}`).join('\n')}

# Available Tools
tools:
${config.tools.map(tool => `  - name: "${tool.name}"
    description: "${tool.description}"
    mcp_server: "${tool.mcp_server}"
    mcp_tool: "${tool.mcp_tool}"`).join('\n')}
`;
  }

  /**
   * Generate MCP servers configuration
   */
  private generateMCPConfig(config: GitLabDuoConfig): string {
    const mcpConfig = {
      mcpServers: {} as Record<string, any>,
    };

    config.mcp_servers.forEach(server => {
      mcpConfig.mcpServers[server.name] = {
        command: server.transport === 'http' ? undefined : 'node',
        args: server.transport === 'http' ? undefined : ['server.js'],
        url: server.transport === 'http' ? server.url : undefined,
        env: server.env || {},
      };

      // Clean up undefined values
      Object.keys(mcpConfig.mcpServers[server.name]).forEach(key => {
        if (mcpConfig.mcpServers[server.name][key] === undefined) {
          delete mcpConfig.mcpServers[server.name][key];
        }
      });
    });

    return JSON.stringify(mcpConfig, null, 2);
  }

  /**
   * Generate README.md
   */
  private generateReadme(manifest: OssaAgent, config: GitLabDuoConfig): string {
    return `# ${manifest.metadata?.name || 'GitLab Duo Custom Agent'}

${manifest.metadata?.description || 'GitLab Duo custom agent generated from OSSA manifest'}

## Description

${manifest.spec?.role || (manifest.spec as any)?.instructions || 'Custom AI Agent'}

## Setup

### Prerequisites

- GitLab instance with Duo enabled
- MCP server infrastructure
- Agent mesh (for OSSA integration)

### Deployment

1. Upload \`agent-config.yaml\` to your GitLab instance:
   \`\`\`bash
   ./deploy.sh
   \`\`\`

2. Configure MCP servers in your GitLab instance:
   - Navigate to **Settings** > **Duo** > **Custom Agents**
   - Import \`mcp-servers.json\`

3. Activate the agent in your project

## Configuration

- **Name**: ${config.name}
- **MCP Servers**: ${config.mcp_servers.length}
- **Tools**: ${config.tools.length}

## Available Tools

${config.tools.map(t => `- **${t.name}**: ${t.description}`).join('\n')}

## MCP Integration

This agent integrates with the following MCP servers:

${config.mcp_servers.map(s => `- **${s.name}** (${s.transport}): ${s.url || 'stdio'}`).join('\n')}

## Generated from OSSA

This agent was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '0.4.0'} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

${manifest.metadata?.license || 'MIT'}
`;
  }

  /**
   * Generate deployment script
   */
  private generateDeployScript(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'custom-agent';

    return `#!/bin/bash
# GitLab Duo Custom Agent Deployment Script
# Generated from OSSA manifest

set -euo pipefail

AGENT_NAME="${name}"
GITLAB_URL="\${GITLAB_URL:-https://gitlab.com}"
GITLAB_TOKEN="\${GITLAB_TOKEN:-}"
PROJECT_ID="\${PROJECT_ID:-}"

if [ -z "$GITLAB_TOKEN" ]; then
  echo "Error: GITLAB_TOKEN environment variable is required"
  exit 1
fi

if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID environment variable is required"
  exit 1
fi

echo "Deploying GitLab Duo custom agent: $AGENT_NAME"

# Upload agent configuration
curl -X POST "$GITLAB_URL/api/v4/projects/$PROJECT_ID/duo/agents" \\
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d @agent-config.yaml

echo "Agent deployed successfully!"
echo "View at: $GITLAB_URL/projects/$PROJECT_ID/-/duo/agents"
`;
  }
}
