/**
 * Claude Code Sub-agent Platform Adapter
 * Exports OSSA agent manifests to Claude Code sub-agent format
 *
 * Claude Code sub-agents are specialized agents that can be spawned
 * by the main Claude Code agent for specific tasks
 * https://code.claude.com/docs/en/sub-agents
 *
 * SOLID: Single Responsibility - Claude Code sub-agent generation only
 * DRY: Extends BaseExporter for orchestration, validation, and common files
 */

import { BaseExporter } from '../base/base-exporter.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportFile,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';
import type {
  ClaudeCodeSubAgent,
  ClaudeCodeTool,
  ClaudeCodeInputSchema,
  ClaudeCodeSubAgentConfig,
} from './types.js';

export class ClaudeCodeAdapter extends BaseExporter {
  readonly platform = 'claude-code';
  readonly displayName = 'Claude Code Sub-agent';
  readonly description =
    'Claude Code sub-agent for specialized task execution in Claude Code CLI';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v{{VERSION}}'];

  /**
   * Platform-specific validation for Claude Code compatibility
   */
  protected platformValidate(manifest: OssaAgent): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const spec = manifest.spec;

    // Check for role/system prompt
    if (!spec?.role) {
      errors.push({
        message:
          'spec.role is required for Claude Code sub-agents (system prompt)',
        path: 'spec.role',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    // Check for tools or capabilities
    if (
      (!spec?.tools || !Array.isArray(spec.tools)) &&
      (!spec?.capabilities || !Array.isArray(spec.capabilities))
    ) {
      warnings.push({
        message:
          'No tools or capabilities defined, sub-agent will have limited functionality',
        path: 'spec.tools',
        suggestion: 'Add spec.tools or spec.capabilities array',
      });
    }

    return { errors, warnings };
  }

  /**
   * Generate Claude Code-specific files
   */
  protected async generateFiles(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportFile[]> {
    const agentName = this.getAgentName(manifest, 'claude-code-subagent');
    const prefix = `claude-code/${agentName}`;
    const files: ExportFile[] = [];

    // Generate subagent.json - Claude Code sub-agent configuration
    const subagent = this.convertToClaudeCodeSubAgent(manifest);
    const config: ClaudeCodeSubAgentConfig = {
      version: '1.0',
      subagent,
    };

    files.push(
      this.createFile(
        `${prefix}/subagent.json`,
        JSON.stringify(config, null, 2),
        'config',
        'json'
      )
    );

    // Generate SKILL.md for Claude Code skills system
    files.push(
      this.createFile(
        `${prefix}/SKILL.md`,
        this.generateSkillMd(manifest, subagent),
        'documentation'
      )
    );

    // Generate tool implementations
    subagent.tools.forEach((tool) => {
      if (tool.implementation?.type === 'bash') {
        files.push(
          this.createFile(
            `${prefix}/tools/${tool.name}.sh`,
            this.generateBashTool(tool),
            'code',
            'bash'
          )
        );
      }
    });

    // Use shared generator for README
    const toolsDesc = subagent.tools
      .map((t) => `- **${t.name}**: ${t.description}`)
      .join('\n');

    files.push(
      this.generateReadmeFile(manifest, prefix, {
        installation: `mkdir -p ~/.claude/subagents\ncp -r ${prefix} ~/.claude/subagents/\nchmod +x ~/.claude/subagents/${agentName}/tools/*.sh`,
        usage: `### From Claude Code CLI\n\n\`\`\`bash\n/${agentName.replace(/-/g, '')}\n\`\`\`\n\n### Configuration\n\nAdd to \`~/.claude/config.json\`:\n\n\`\`\`json\n{\n  "subagents": [\n    {\n      "name": "${agentName}",\n      "config": "~/.claude/subagents/${agentName}/subagent.json"\n    }\n  ]\n}\`\`\``,
        additional: [
          {
            title: 'Sub-agent Configuration',
            content: `- **Type:** ${subagent.subagent_type}\n- **Model:** ${subagent.model || 'Inherits from parent agent'}\n- **Max Turns:** ${subagent.max_turns}`,
          },
          ...(toolsDesc
            ? [{ title: 'Available Tools', content: toolsDesc }]
            : []),
        ],
      })
    );

    return files;
  }

  /**
   * Get example Claude Code-optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
      kind: 'Agent',
      metadata: {
        name: 'claude-code-explorer',
        version: '1.0.0',
        description: 'Specialized sub-agent for code exploration and analysis',
      },
      spec: {
        role: 'You are a code exploration specialist. Your job is to deeply analyze codebases, identify patterns, and provide detailed insights about code structure and dependencies.',
        capabilities: [
          'code-analysis',
          'pattern-detection',
          'dependency-mapping',
        ] as any,
        tools: [
          {
            type: 'function',
            name: 'analyze_codebase',
            description: 'Analyze codebase structure and patterns',
          },
          {
            type: 'function',
            name: 'find_dependencies',
            description: 'Find and map code dependencies',
          },
        ],
      },
    };
  }

  /**
   * Convert OSSA manifest to Claude Code sub-agent
   */
  private convertToClaudeCodeSubAgent(manifest: OssaAgent): ClaudeCodeSubAgent {
    const name = this.getAgentName(manifest, 'claude-code-subagent');
    const description =
      manifest.metadata?.description || 'Claude Code sub-agent';
    const system_prompt = manifest.spec?.role || 'Specialized sub-agent';

    const subagent_type = this.determineSubagentType(manifest);
    const tools = this.convertTools(manifest);
    const max_turns = (manifest.spec as any)?.max_iterations ?? 10;
    const model = this.determineModel(manifest);

    return {
      name,
      description,
      system_prompt,
      subagent_type,
      max_turns,
      model,
      tools,
      metadata: {
        version: manifest.metadata?.version,
        author: manifest.metadata?.author,
        tags: manifest.metadata?.tags,
      },
    };
  }

  /**
   * Determine sub-agent type from manifest
   */
  private determineSubagentType(
    manifest: OssaAgent
  ): ClaudeCodeSubAgent['subagent_type'] {
    const capabilities = this.getCapabilities(manifest);

    // Map capabilities to sub-agent types
    if (
      capabilities.includes('explore') ||
      capabilities.includes('code-analysis')
    ) {
      return 'Explore';
    }
    if (capabilities.includes('plan') || capabilities.includes('planning')) {
      return 'Plan';
    }
    if (capabilities.includes('bash') || capabilities.includes('shell')) {
      return 'Bash';
    }

    return 'general-purpose';
  }

  /**
   * Determine model from manifest
   */
  private determineModel(
    manifest: OssaAgent
  ): ClaudeCodeSubAgent['model'] | undefined {
    const llmConfig = manifest.spec?.llm;
    if (!llmConfig) return undefined;

    const model = typeof llmConfig === 'string' ? llmConfig : llmConfig.model;

    if (model?.includes('opus')) return 'opus';
    if (model?.includes('sonnet')) return 'sonnet';
    if (model?.includes('haiku')) return 'haiku';

    return undefined;
  }

  /**
   * Convert OSSA tools to Claude Code tools
   */
  private convertTools(manifest: OssaAgent): ClaudeCodeTool[] {
    const tools: ClaudeCodeTool[] = [];
    const ossaTools = this.getTools(manifest);

    ossaTools.forEach((tool) => {
      const name = String(tool.name || 'unknown');
      const description = String(tool.description || `Tool: ${name}`);
      const schema = tool.inputSchema ||
        tool.schema || {
          type: 'object',
          properties: {},
        };

      tools.push({
        name,
        description,
        input_schema: this.convertToClaudeCodeSchema(schema),
        implementation: {
          type: 'bash',
          command: `./tools/${name}.sh`,
        },
      });
    });

    return tools;
  }

  /**
   * Convert JSON Schema to Claude Code input schema
   */
  private convertToClaudeCodeSchema(schema: any): ClaudeCodeInputSchema {
    const properties: Record<string, any> = {};

    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        const prop = value as any;
        properties[key] = {
          type: prop.type || 'string',
          description: prop.description || `Parameter: ${key}`,
          enum: prop.enum,
          items: prop.items,
          default: prop.default,
        };
      }
    }

    return {
      type: 'object',
      properties,
      required: schema.required || [],
    };
  }

  /**
   * Generate SKILL.md for Claude Code skills system
   */
  private generateSkillMd(
    manifest: OssaAgent,
    subagent: ClaudeCodeSubAgent
  ): string {
    const skillName = manifest.metadata?.name?.replace(/-/g, '') || 'subagent';

    return `# ${skillName}

${subagent.description}

## Claude Code Skill

This skill spawns a specialized sub-agent for ${subagent.description.toLowerCase()}.

## Usage

\`\`\`bash
# Invoke the skill in Claude Code
/${skillName}
\`\`\`

## Sub-agent Configuration

**Type:** ${subagent.subagent_type}
**Model:** ${subagent.model || 'inherited from parent'}
**Max Turns:** ${subagent.max_turns}

**System Prompt:**

\`\`\`
${subagent.system_prompt}
\`\`\`

## Available Tools

${subagent.tools
  .map(
    (t) => `### ${t.name}

${t.description}

**Parameters:**

\`\`\`json
${JSON.stringify(t.input_schema, null, 2)}
\`\`\`
`
  )
  .join('\n')}

## Installation

1. Copy this directory to your Claude Code skills directory
2. Restart Claude Code or reload skills
3. Use \`/${skillName}\` to invoke

## Generated from OSSA

This sub-agent was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '{{VERSION}}'} manifest.

Original manifest: \`agent.ossa.yaml\`
`;
  }

  /**
   * Generate bash tool implementation
   */
  private generateBashTool(tool: ClaudeCodeTool): string {
    const params = tool.input_schema.properties || {};
    const required = tool.input_schema.required || [];

    return `#!/usr/bin/env bash
# Claude Code Tool: ${tool.name}
# ${tool.description}
# Generated from OSSA manifest

set -euo pipefail

# Tool: ${tool.name}
# Description: ${tool.description}

${
  Object.keys(params).length > 0
    ? `# Parameters:\n${Object.entries(params)
        .map(
          ([name, param]) =>
            `# - ${name}: ${(param as any).description}${required.includes(name) ? ' (required)' : ''}`
        )
        .join('\n')}`
    : '# No parameters'
}

# Parse JSON input from stdin
INPUT=$(cat)

${Object.keys(params)
  .map(
    (name) =>
      `${name.toUpperCase()}=$(echo "$INPUT" | jq -r '.${name} // empty')`
  )
  .join('\n')}

# Validate required parameters
${required
  .map(
    (name) => `if [[ -z "$${name.toUpperCase()}" ]]; then
  echo '{"error": "Parameter ${name} is required"}' >&2
  exit 1
fi`
  )
  .join('\n')}

# Delegate to OSSA CLI when available (set OSSA_MANIFEST to manifest path)
if command -v ossa >/dev/null 2>&1 && [[ -n "\${OSSA_MANIFEST:-}" ]]; then
  ossa run "\${OSSA_MANIFEST}" --tool ${tool.name} -- "\$@"
  exit \$?
fi

# Fallback: output structured result
echo '{
  "success": true,
  "tool": "${tool.name}",
  "data": {}
}'
`;
  }
}
