/**
 * Agent Skills Exporter
 * Exports OSSA manifests to Agent Skills standard (SKILL.md format)
 *
 * Agent Skills Standard: https://github.com/anthropics/agent-skills
 * Format: YAML frontmatter + Markdown body
 * Adopted by: Claude Code, OpenAI Codex, Cursor, and 25+ other tools
 *
 * Generated files:
 * - SKILL.md - Main skill definition
 * - scripts/ - Executable scripts (optional)
 * - references/ - Reference documentation (optional)
 * - assets/ - Assets and resources (optional)
 */

import type { OssaAgent } from '../../types/index.js';
import * as yaml from 'yaml';
import { getVersion } from '../../utils/version.js';

export interface AgentSkillsExportResult {
  success: boolean;
  files: Array<{
    path: string;
    content: string;
  }>;
  metadata?: {
    skillName: string;
    version: string;
    hasScripts: boolean;
    hasReferences: boolean;
    toolsCount: number;
  };
  error?: string;
}

export interface AgentSkillsExportOptions {
  includeScripts?: boolean;
  includeReferences?: boolean;
  includeAssets?: boolean;
}

export class AgentSkillsExporter {
  /**
   * Export OSSA manifest to Agent Skills format
   */
  async export(
    manifest: OssaAgent,
    options: AgentSkillsExportOptions = {}
  ): Promise<AgentSkillsExportResult> {
    try {
      const files: Array<{ path: string; content: string }> = [];

      // Generate main SKILL.md
      const skillMd = this.generateSkillMd(manifest);
      files.push({
        path: 'SKILL.md',
        content: skillMd,
      });

      // Generate README
      const readme = this.generateReadme(manifest);
      files.push({
        path: 'README.md',
        content: readme,
      });

      // Generate scripts directory if tools exist
      if (options.includeScripts && manifest.spec?.tools && manifest.spec.tools.length > 0) {
        const setupScript = this.generateSetupScript(manifest);
        files.push({
          path: 'scripts/setup.sh',
          content: setupScript,
        });
      }

      // Generate references if knowledge sources exist
      if (options.includeReferences && (manifest.spec as any)?.knowledge_sources) {
        const references = this.generateReferences(manifest);
        files.push({
          path: 'references/knowledge-sources.md',
          content: references,
        });
      }

      const metadata = {
        skillName: manifest.metadata?.name || 'unnamed-skill',
        version: manifest.metadata?.version || '1.0.0',
        hasScripts: options.includeScripts || false,
        hasReferences: options.includeReferences || false,
        toolsCount: manifest.spec?.tools?.length || 0,
      };

      return {
        success: true,
        files,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate SKILL.md with YAML frontmatter + Markdown body
   */
  private generateSkillMd(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const metadata = manifest.metadata;

    // YAML frontmatter
    const frontmatter: any = {
      name: metadata?.name || 'unnamed-skill',
      version: metadata?.version || '1.0.0',
      description: metadata?.description || spec?.role || 'OSSA Agent Skill',
      author: metadata?.author || 'OSSA Agent Platform',
      category: this.inferCategory(manifest),
      tags: this.generateTags(manifest),
      platforms: this.generatePlatforms(manifest),
      requirements: this.generateRequirements(manifest),
    };

    if (spec?.llm) {
      frontmatter.model = {
        provider: spec.llm.provider,
        model: spec.llm.model,
        temperature: spec.llm.temperature,
        maxTokens: spec.llm.maxTokens,
      };
    }

    if (spec?.tools && spec.tools.length > 0) {
      frontmatter.tools = spec.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
      }));
    }

    const yamlContent = yaml.stringify(frontmatter);

    // Markdown body
    const body = `
# ${metadata?.name || 'Unnamed Skill'}

${metadata?.description || spec?.role || ''}

## Overview

This skill was generated from an OSSA (Open Standard for Standalone Agents) manifest and follows the Agent Skills standard format.

**Agent Type:** ${spec?.type?.agent_type || 'general'}
**Autonomy Level:** ${spec?.autonomy?.level || 'supervised'}
**LLM Provider:** ${spec?.llm?.provider || 'Not specified'}
**Model:** ${spec?.llm?.model || 'Not specified'}

## System Prompt

${spec?.role || 'No system prompt defined'}

## Tools & Capabilities

${this.generateToolsSection(manifest)}

## Usage

\`\`\`bash
# Use this skill with Claude Code
claude --skill ${metadata?.name || 'skill-name'}

# Or with other AI tools that support Agent Skills standard
\`\`\`

## Configuration

${this.generateConfigSection(manifest)}

## Examples

${this.generateExamplesSection(manifest)}

## Limitations

${this.generateLimitationsSection(manifest)}

## References

- [OSSA Specification](https://openstandardagents.org)
- [Agent Skills Standard](https://github.com/anthropics/agent-skills)

---

**Generated from OSSA v${metadata?.version || getVersion()}**
**Exported:** ${new Date().toISOString()}
`.trim();

    return `---\n${yamlContent}---\n\n${body}\n`;
  }

  /**
   * Generate README.md
   */
  private generateReadme(manifest: OssaAgent): string {
    const metadata = manifest.metadata;
    const spec = manifest.spec as any;

    return `# ${metadata?.name || 'OSSA Agent Skill'}

${metadata?.description || spec?.role || ''}

## Quick Start

\`\`\`bash
# Install this skill
# (Instructions depend on your AI tool)

# Use with Claude Code
claude --skill ${metadata?.name || 'skill-name'}
\`\`\`

## Features

${this.generateFeaturesList(manifest)}

## Requirements

${this.generateRequirementsSection(manifest)}

## Installation

1. Download this skill directory
2. Place it in your AI tool's skills directory
3. Restart your AI tool or reload skills

## Configuration

See \`SKILL.md\` for detailed configuration options.

## Contributing

This skill was generated from an OSSA manifest. To contribute:

1. Modify the source OSSA manifest
2. Re-export to Agent Skills format
3. Submit changes upstream

## License

${metadata?.license || 'See LICENSE file'}

---

**Part of the OSSA Agent Platform**
**Agent Skills Standard Compatible**
`;
  }

  /**
   * Generate setup script
   */
  private generateSetupScript(manifest: OssaAgent): string {
    const spec = manifest.spec as any;

    return `#!/bin/bash
# Setup script for ${manifest.metadata?.name || 'OSSA Agent Skill'}
# Generated from OSSA manifest

set -e

echo "Setting up ${manifest.metadata?.name || 'skill'}..."

# Install dependencies based on tools
${spec?.tools?.map((tool: any) => `# ${tool.name}: ${tool.description || 'No description'}`).join('\n') || '# No tools configured'}

echo "✅ Setup complete!"
`;
  }

  /**
   * Generate references documentation
   */
  private generateReferences(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const knowledgeSources = spec?.knowledge_sources || [];

    return `# Knowledge Sources

${knowledgeSources.map((source: any) => `
## ${source.name || 'Unnamed Source'}

- **Type:** ${source.type || 'Not specified'}
- **Location:** ${source.location || 'Not specified'}
- **Description:** ${source.description || 'No description'}
`).join('\n') || 'No knowledge sources configured'}
`;
  }

  /**
   * Infer category from manifest
   */
  private inferCategory(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const taxonomy = spec?.taxonomy;

    if (taxonomy?.domain) {
      return taxonomy.domain;
    }

    const agentType = spec?.type?.agent_type;
    if (agentType === 'orchestrator') return 'orchestration';
    if (agentType === 'specialist') return 'specialized';
    if (agentType === 'worker') return 'automation';

    return 'general';
  }

  /**
   * Generate tags
   */
  private generateTags(manifest: OssaAgent): string[] {
    const spec = manifest.spec as any;
    const tags: string[] = [];

    if (spec?.llm?.provider) tags.push(spec.llm.provider);
    if (spec?.type?.agent_type) tags.push(spec.type.agent_type);
    if (spec?.taxonomy?.domain) tags.push(spec.taxonomy.domain);
    if (spec?.taxonomy?.cross_cutting) tags.push(...spec.taxonomy.cross_cutting);
    if (spec?.messaging?.enabled) tags.push('a2a', 'messaging');

    return tags;
  }

  /**
   * Generate supported platforms
   */
  private generatePlatforms(manifest: OssaAgent): string[] {
    const platforms = ['claude-code', 'anthropic-sdk'];

    const spec = manifest.spec as any;
    if (spec?.adapters) {
      spec.adapters.forEach((adapter: any) => {
        if (adapter.type?.includes('gitlab')) platforms.push('gitlab');
        if (adapter.type?.includes('github')) platforms.push('github');
        if (adapter.type?.includes('kubernetes')) platforms.push('kubernetes');
      });
    }

    return [...new Set(platforms)];
  }

  /**
   * Generate requirements
   */
  private generateRequirements(manifest: OssaAgent): any {
    const spec = manifest.spec as any;
    const requirements: any = {};

    if (spec?.resources) {
      requirements.memory = spec.resources.memory;
      requirements.cpu = spec.resources.cpu;
      if (spec.resources.gpu) requirements.gpu = spec.resources.gpu;
    }

    if (spec?.llm) {
      requirements.llm = {
        provider: spec.llm.provider,
        model: spec.llm.model,
      };
    }

    return requirements;
  }

  /**
   * Generate tools section
   */
  private generateToolsSection(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const tools = spec?.tools || [];

    if (tools.length === 0) {
      return '*No tools configured*';
    }

    return tools.map((tool: any) => `
### ${tool.name || 'Unnamed Tool'}

${tool.description || 'No description'}

${tool.capabilities ? `**Capabilities:** ${tool.capabilities.join(', ')}` : ''}
`).join('\n');
  }

  /**
   * Generate config section
   */
  private generateConfigSection(manifest: OssaAgent): string {
    const spec = manifest.spec as any;

    const sections: string[] = [];

    if (spec?.llm) {
      sections.push(`
**LLM Configuration:**
- Provider: ${spec.llm.provider}
- Model: ${spec.llm.model}
- Temperature: ${spec.llm.temperature || 0.7}
- Max Tokens: ${spec.llm.maxTokens || 2048}
`);
    }

    if (spec?.autonomy) {
      sections.push(`
**Autonomy:**
- Level: ${spec.autonomy.level}
- Approval Required: ${spec.autonomy.approval_required ? 'Yes' : 'No'}
`);
    }

    return sections.join('\n') || '*No configuration needed*';
  }

  /**
   * Generate examples section
   */
  private generateExamplesSection(manifest: OssaAgent): string {
    return `
\`\`\`bash
# Example 1: Basic usage
claude --skill ${manifest.metadata?.name || 'skill-name'} "Your task here"

# Example 2: With specific tools
claude --skill ${manifest.metadata?.name || 'skill-name'} --tools read,write "Your task here"
\`\`\`
`;
  }

  /**
   * Generate limitations section
   */
  private generateLimitationsSection(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const limitations: string[] = [];

    if (spec?.constraints?.max_execution_time_seconds) {
      limitations.push(`- Maximum execution time: ${spec.constraints.max_execution_time_seconds} seconds`);
    }

    if (spec?.constraints?.max_memory_mb) {
      limitations.push(`- Maximum memory: ${spec.constraints.max_memory_mb} MB`);
    }

    if (spec?.lifecycle?.max_turns) {
      limitations.push(`- Maximum agentic turns: ${spec.lifecycle.max_turns}`);
    }

    if (limitations.length === 0) {
      return '*No specific limitations*';
    }

    return limitations.join('\n');
  }

  /**
   * Generate features list
   */
  private generateFeaturesList(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const features: string[] = [];

    if (spec?.tools && spec.tools.length > 0) {
      features.push(`- ${spec.tools.length} integrated tools`);
    }

    if (spec?.messaging?.enabled) {
      features.push('- Agent-to-Agent (A2A) communication');
    }

    if (spec?.token_efficiency?.enabled) {
      features.push('- Token efficiency optimizations');
    }

    if (spec?.compliance?.frameworks && spec.compliance.frameworks.length > 0) {
      features.push(`- Compliance: ${spec.compliance.frameworks.join(', ')}`);
    }

    if (features.length === 0) {
      return '- General-purpose agent capabilities';
    }

    return features.join('\n');
  }

  /**
   * Generate requirements section
   */
  private generateRequirementsSection(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const requirements: string[] = [];

    if (spec?.llm) {
      requirements.push(`- LLM: ${spec.llm.provider} ${spec.llm.model}`);
    }

    if (spec?.resources) {
      if (spec.resources.memory) requirements.push(`- Memory: ${spec.resources.memory}`);
      if (spec.resources.cpu) requirements.push(`- CPU: ${spec.resources.cpu}`);
      if (spec.resources.gpu) requirements.push(`- GPU: ${spec.resources.gpu}`);
    }

    if (requirements.length === 0) {
      return '- No specific requirements';
    }

    return requirements.join('\n');
  }
}
