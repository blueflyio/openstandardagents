/**
 * Claude Code Sub-agent Platform Adapter
 * Exports OSSA agent manifests to Claude Code sub-agent format
 *
 * Claude Code sub-agents are specialized agents that can be spawned
 * by the main Claude Code agent for specific tasks
 * https://code.claude.com/docs/en/sub-agents
 *
 * SOLID: Single Responsibility - Claude Code sub-agent generation only
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
  ClaudeCodeSubAgent,
  ClaudeCodeTool,
  ClaudeCodeInputSchema,
  ClaudeCodeSubAgentConfig,
} from './types.js';

export class ClaudeCodeAdapter extends BaseAdapter {
  readonly platform = 'claude-code';
  readonly displayName = 'Claude Code Sub-agent';
  readonly description =
    'Claude Code sub-agent for specialized task execution in Claude Code CLI';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v{{VERSION}}'];

  /**
   * Export OSSA manifest to Claude Code sub-agent format
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

      const agentName = manifest.metadata?.name || 'claude-code-subagent';
      const files = [];

      // Generate subagent.json - Claude Code sub-agent configuration
      const subagent = this.convertToClaudeCodeSubAgent(manifest);
      const config: ClaudeCodeSubAgentConfig = {
        version: '1.0',
        subagent,
      };

      files.push(
        this.createFile(
          `claude-code/${agentName}/subagent.json`,
          JSON.stringify(config, null, 2),
          'config',
          'json'
        )
      );

      // Generate SKILL.md for Claude Code skills system
      files.push(
        this.createFile(
          `claude-code/${agentName}/SKILL.md`,
          this.generateSkillMd(manifest, subagent),
          'documentation'
        )
      );

      // Generate tool implementations
      subagent.tools.forEach((tool) => {
        if (tool.implementation?.type === 'bash') {
          files.push(
            this.createFile(
              `claude-code/${agentName}/tools/${tool.name}.sh`,
              this.generateBashTool(tool),
              'code',
              'bash'
            )
          );
        }
      });

      // Generate README.md
      files.push(
        this.createFile(
          `claude-code/${agentName}/README.md`,
          this.generateReadme(manifest, subagent),
          'documentation'
        )
      );

      // Include source OSSA manifest for provenance
      files.push(this.createManifestFile(manifest));

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
   * Validate manifest for Claude Code compatibility
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Base validation
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // Claude Code-specific validation
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

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
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
        capabilities: ['code-analysis', 'pattern-detection', 'dependency-mapping'] as any,
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
    const name = manifest.metadata?.name || 'claude-code-subagent';
    const description =
      manifest.metadata?.description || 'Claude Code sub-agent';
    const system_prompt = manifest.spec?.role || 'Specialized sub-agent';

    // Determine subagent type based on capabilities
    const subagent_type = this.determineSubagentType(manifest);

    // Convert tools
    const tools = this.convertTools(manifest);

    // Determine max turns from manifest or default to 10
    const max_turns = (manifest.spec as any)?.max_iterations ?? 10;

    // Determine model based on spec
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
    const capabilities = (
      (manifest.spec?.capabilities || []) as Array<string | any>
    ).map((c: any) => (typeof c === 'string' ? c : c.name || ''));

    // Map capabilities to sub-agent types
    if (capabilities.includes('explore') || capabilities.includes('code-analysis')) {
      return 'Explore';
    }
    if (capabilities.includes('plan') || capabilities.includes('planning')) {
      return 'Plan';
    }
    if (capabilities.includes('bash') || capabilities.includes('shell')) {
      return 'Bash';
    }

    // Default to general-purpose
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

    // Map to Claude Code model names
    if (model?.includes('opus')) return 'opus';
    if (model?.includes('sonnet')) return 'sonnet';
    if (model?.includes('haiku')) return 'haiku';

    return undefined; // Use parent agent's model
  }

  /**
   * Convert OSSA tools to Claude Code tools
   */
  private convertTools(manifest: OssaAgent): ClaudeCodeTool[] {
    const tools: ClaudeCodeTool[] = [];
    const ossaTools = (manifest.spec?.tools || []) as any[];

    ossaTools.forEach((tool) => {
      const name = tool.name || 'unknown';
      const description = tool.description || `Tool: ${name}`;
      const schema = tool.inputSchema || tool.schema || {
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
            `# - ${name}: ${param.description}${required.includes(name) ? ' (required)' : ''}`
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

# TODO: Implement ${tool.name} logic here
echo "Executing ${tool.name}..."

# Example output (replace with actual implementation)
echo '{
  "success": true,
  "message": "Tool ${tool.name} not yet implemented",
  "data": {}
}'
`;
  }

  /**
   * Generate README.md
   */
  private generateReadme(
    manifest: OssaAgent,
    subagent: ClaudeCodeSubAgent
  ): string {
    const agentName = manifest.metadata?.name || 'claude-code-subagent';

    return `# ${agentName}

${subagent.description}

## Claude Code Sub-agent

This is a specialized sub-agent for [Claude Code CLI](https://code.claude.com/). It can be spawned by the main Claude Code agent to handle specific tasks.

## Sub-agent Type

**${subagent.subagent_type}** - ${this.getSubagentTypeDescription(subagent.subagent_type)}

## Installation

1. **Copy to Claude Code directory:**

\`\`\`bash
mkdir -p ~/.claude/subagents
cp -r claude-code/${agentName} ~/.claude/subagents/
\`\`\`

2. **Make tool scripts executable:**

\`\`\`bash
chmod +x ~/.claude/subagents/${agentName}/tools/*.sh
\`\`\`

3. **Configure in Claude Code:**

Add to your \`~/.claude/config.json\`:

\`\`\`json
{
  "subagents": [
    {
      "name": "${agentName}",
      "config": "~/.claude/subagents/${agentName}/subagent.json"
    }
  ]
}
\`\`\`

## System Prompt

\`\`\`
${subagent.system_prompt}
\`\`\`

## Configuration

- **Model:** ${subagent.model || 'Inherits from parent agent'}
- **Max Turns:** ${subagent.max_turns}
- **Tools:** ${subagent.tools.length}

## Available Tools

${subagent.tools
  .map(
    (t) => `### ${t.name}

${t.description}

**Parameters:**

\`\`\`json
${JSON.stringify(t.input_schema, null, 2)}
\`\`\`

**Implementation:** ${t.implementation?.type || 'Not specified'}
`
  )
  .join('\n')}

## Usage

### From Claude Code CLI

\`\`\`bash
# Claude Code will automatically spawn this sub-agent when appropriate
# You can also explicitly spawn it using the skill command
/${agentName.replace(/-/g, '')}
\`\`\`

### Programmatic Usage

\`\`\`typescript
import { spawnSubAgent } from '@anthropic-ai/claude-code';

const subagent = await spawnSubAgent('${agentName}', {
  prompt: 'Your task description here',
});

const result = await subagent.execute();
console.log(result);
\`\`\`

## Development

Tool implementations are in the \`tools/\` directory. Each tool is a bash script that:

1. Reads JSON input from stdin
2. Parses parameters using \`jq\`
3. Executes the tool logic
4. Outputs JSON result to stdout

To add or modify tools:

1. Edit \`subagent.json\` to add/update tool definitions
2. Create/modify the corresponding tool script in \`tools/\`
3. Make the script executable: \`chmod +x tools/<tool>.sh\`

## Generated from OSSA

This sub-agent was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '{{VERSION}}'} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

${manifest.metadata?.license || 'MIT'}
`;
  }

  /**
   * Get sub-agent type description
   */
  private getSubagentTypeDescription(
    type: ClaudeCodeSubAgent['subagent_type']
  ): string {
    const descriptions = {
      'general-purpose': 'Handles a variety of tasks with general capabilities',
      Explore:
        'Specialized in code exploration, analysis, and understanding codebases',
      Plan: 'Focuses on planning, breaking down tasks, and creating execution strategies',
      Bash: 'Executes shell commands and terminal operations',
    };

    return descriptions[type] || 'Custom sub-agent type';
  }
}
