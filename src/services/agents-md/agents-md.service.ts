/**
 * Agents.md Service
 * Handles bidirectional conversion between OSSA manifests and OpenAI agents.md format
 */

import { injectable } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { OssaAgent, AgentsMdExtension, AgentsMdSection } from '../../types/index.js';

/**
 * Service for generating and managing agents.md files from OSSA manifests
 */
@injectable()
export class AgentsMdService {
  /**
   * Generate AGENTS.md content from OSSA manifest
   * @param manifest - OSSA agent manifest
   * @returns Generated AGENTS.md content as string
   */
  async generateAgentsMd(manifest: OssaAgent): Promise<string> {
    const extension = manifest.extensions?.agents_md as AgentsMdExtension | undefined;
    
    if (!extension?.enabled) {
      throw new Error('agents_md extension is not enabled in manifest');
    }

    const sections: string[] = [];
    const includeComments = extension.sync?.include_comments !== false;

    // Add header comment if enabled
    if (includeComments) {
      sections.push('<!-- Generated from OSSA manifest - DO NOT EDIT MANUALLY -->');
      sections.push('<!-- To update, modify the OSSA manifest and regenerate -->');
      sections.push('');
    }

    // Generate dev environment section
    if (extension.sections?.dev_environment?.enabled !== false) {
      const devSection = this.generateDevEnvironmentSection(
        manifest,
        extension.sections?.dev_environment
      );
      if (devSection) {
        sections.push(devSection);
      }
    }

    // Generate testing section
    if (extension.sections?.testing?.enabled !== false) {
      const testSection = this.generateTestingSection(
        manifest,
        extension.sections?.testing
      );
      if (testSection) {
        sections.push(testSection);
      }
    }

    // Generate PR instructions section
    if (extension.sections?.pr_instructions?.enabled !== false) {
      const prSection = this.generatePRInstructionsSection(
        manifest,
        extension.sections?.pr_instructions
      );
      if (prSection) {
        sections.push(prSection);
      }
    }

    return sections.join('\n\n');
  }

  /**
   * Generate development environment section
   */
  private generateDevEnvironmentSection(
    manifest: OssaAgent,
    config?: AgentsMdSection
  ): string {
    const lines: string[] = ['# Dev environment tips'];

    // Use custom content if provided
    if (config?.custom) {
      lines.push('', config.custom);
      return lines.join('\n');
    }

    // Derive from spec.tools if source is specified
    if (config?.source === 'spec.tools' && manifest.spec?.tools) {
      lines.push('');
      lines.push('## Tool Setup');
      
      manifest.spec.tools.forEach((tool) => {
        if (tool.type === 'mcp' && tool.server) {
          lines.push(`- **${tool.name || tool.server}**: MCP server integration`);
          if (tool.namespace) {
            lines.push(`  - Namespace: \`${tool.namespace}\``);
          }
        } else if (tool.type === 'http' && tool.endpoint) {
          lines.push(`- **${tool.name || 'HTTP Tool'}**: ${tool.endpoint}`);
        } else if (tool.type === 'kubernetes') {
          lines.push(`- **${tool.name || 'Kubernetes Tool'}**: Kubernetes integration`);
        }
      });
    } else {
      // Default content
      lines.push('');
      lines.push('- Review the OSSA manifest for tool configurations');
      lines.push('- Ensure all required dependencies are installed');
      lines.push('- Configure environment variables as needed');
    }

    return lines.join('\n');
  }

  /**
   * Generate testing section
   */
  private generateTestingSection(
    manifest: OssaAgent,
    config?: AgentsMdSection
  ): string {
    const lines: string[] = ['# Testing instructions'];

    // Use custom content if provided
    if (config?.custom) {
      lines.push('', config.custom);
      return lines.join('\n');
    }

    // Derive from spec.constraints if source is specified
    if (config?.source === 'spec.constraints' && manifest.spec?.constraints) {
      lines.push('');
      
      if (manifest.spec.constraints.performance) {
        lines.push('## Performance Requirements');
        const perf = manifest.spec.constraints.performance;
        if (perf.maxLatencySeconds) {
          lines.push(`- Maximum latency: ${perf.maxLatencySeconds}s`);
        }
        if (perf.timeoutSeconds) {
          lines.push(`- Timeout: ${perf.timeoutSeconds}s`);
        }
      }

      if (manifest.spec.constraints.cost) {
        lines.push('');
        lines.push('## Cost Constraints');
        const cost = manifest.spec.constraints.cost;
        if (cost.maxTokensPerRequest) {
          lines.push(`- Max tokens per request: ${cost.maxTokensPerRequest}`);
        }
      }
    } else {
      // Default content
      lines.push('');
      lines.push('- Run all tests before committing: `npm test`');
      lines.push('- Ensure code coverage meets project standards');
      lines.push('- Validate against OSSA schema: `ossa validate manifest.yaml`');
    }

    return lines.join('\n');
  }

  /**
   * Generate PR instructions section
   */
  private generatePRInstructionsSection(
    manifest: OssaAgent,
    config?: AgentsMdSection
  ): string {
    const lines: string[] = ['# PR instructions'];

    // Use custom content if provided
    if (config?.custom) {
      lines.push('', config.custom);
      return lines.join('\n');
    }

    // Derive from spec.autonomy if source is specified
    if (config?.source === 'spec.autonomy' && manifest.spec?.autonomy) {
      lines.push('');
      
      if (manifest.spec.autonomy.approval_required) {
        lines.push('- **Human approval required** for all changes');
      }

      if (manifest.spec.autonomy.level) {
        lines.push(`- Autonomy level: ${manifest.spec.autonomy.level}`);
      }

      if (manifest.spec.autonomy.allowed_actions?.length) {
        lines.push('');
        lines.push('## Allowed Actions');
        manifest.spec.autonomy.allowed_actions.forEach((action) => {
          lines.push(`- ${action}`);
        });
      }
    } else {
      // Default content with title format if specified
      lines.push('');
      
      if (config?.title_format) {
        const titleExample = this.formatTitle(config.title_format, manifest);
        lines.push(`## PR Title Format`);
        lines.push(`\`${titleExample}\``);
        lines.push('');
      }

      lines.push('- Follow conventional commit format');
      lines.push('- Include tests for new features');
      lines.push('- Update documentation as needed');
      lines.push('- Ensure CI passes before requesting review');
    }

    return lines.join('\n');
  }

  /**
   * Format title with template variables
   */
  private formatTitle(format: string, manifest: OssaAgent): string {
    let result = format;
    
    // Replace template variables
    if (manifest.metadata?.labels) {
      Object.entries(manifest.metadata.labels).forEach(([key, value]) => {
        result = result.replace(`{metadata.labels.${key}}`, value);
      });
    }
    
    result = result.replace('{title}', 'Your PR title here');
    
    return result;
  }

  /**
   * Write AGENTS.md file to disk
   * @param manifest - OSSA agent manifest
   * @param outputPath - Optional output path (defaults to extension config)
   */
  async writeAgentsMd(manifest: OssaAgent, outputPath?: string): Promise<void> {
    const extension = manifest.extensions?.agents_md as AgentsMdExtension | undefined;
    const targetPath = outputPath || extension?.output_path || 'AGENTS.md';
    
    const content = await this.generateAgentsMd(manifest);
    await fs.writeFile(targetPath, content, 'utf-8');
  }

  /**
   * Validate AGENTS.md against manifest
   * @param agentsMdPath - Path to AGENTS.md file
   * @param manifest - OSSA agent manifest
   * @returns Validation result with any warnings
   */
  async validateAgentsMd(
    agentsMdPath: string,
    manifest: OssaAgent
  ): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    try {
      // Check if file exists
      await fs.access(agentsMdPath);
    } catch {
      return {
        valid: false,
        warnings: ['AGENTS.md file not found'],
      };
    }

    // Read the file
    const content = await fs.readFile(agentsMdPath, 'utf-8');

    // Check for required sections
    const requiredSections = ['# Dev environment tips', '# Testing instructions', '# PR instructions'];
    const extension = manifest.extensions?.agents_md as AgentsMdExtension | undefined;

    if (extension?.sections?.dev_environment?.enabled !== false) {
      if (!content.includes('# Dev environment tips')) {
        warnings.push('Missing "Dev environment tips" section');
      }
    }

    if (extension?.sections?.testing?.enabled !== false) {
      if (!content.includes('# Testing instructions')) {
        warnings.push('Missing "Testing instructions" section');
      }
    }

    if (extension?.sections?.pr_instructions?.enabled !== false) {
      if (!content.includes('# PR instructions')) {
        warnings.push('Missing "PR instructions" section');
      }
    }

    // Check if it looks auto-generated
    if (content.includes('<!-- Generated from OSSA manifest')) {
      // Regenerate and compare
      const expected = await this.generateAgentsMd(manifest);
      if (content.trim() !== expected.trim()) {
        warnings.push('AGENTS.md content differs from manifest - consider regenerating');
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Parse AGENTS.md and extract hints for OSSA manifest
   * @param agentsMdPath - Path to AGENTS.md file
   * @returns Partial OSSA manifest with extracted information
   */
  async parseAgentsMd(agentsMdPath: string): Promise<Partial<OssaAgent>> {
    const content = await fs.readFile(agentsMdPath, 'utf-8');
    const manifest: Partial<OssaAgent> = {
      spec: {
        role: '', // Will be populated from content analysis
      },
    };

    // Extract role hints from content
    const roleHints: string[] = [];
    
    // Look for common patterns that indicate agent behavior
    if (content.toLowerCase().includes('code review')) {
      roleHints.push('code review');
    }
    if (content.toLowerCase().includes('testing')) {
      roleHints.push('testing');
    }
    if (content.toLowerCase().includes('deployment')) {
      roleHints.push('deployment');
    }

    if (roleHints.length > 0 && manifest.spec) {
      manifest.spec.role = `Agent for ${roleHints.join(', ')}`;
    }

    // Extract tool hints from commands mentioned
    const tools: Array<{ type: string; name: string }> = [];
    
    // Look for npm commands
    if (content.includes('npm test') || content.includes('npm run')) {
      tools.push({ type: 'function', name: 'npm_commands' });
    }

    // Look for git commands
    if (content.includes('git ')) {
      tools.push({ type: 'function', name: 'git_operations' });
    }

    if (tools.length > 0 && manifest.spec) {
      manifest.spec.tools = tools as any;
    }

    // Populate cursor extension context files
    const contextFiles: string[] = [];
    
    // Extract file references (simple pattern matching)
    const filePattern = /`([^`]+\.(md|json|yaml|yml|ts|js|py))`/g;
    let match;
    while ((match = filePattern.exec(content)) !== null) {
      contextFiles.push(match[1]);
    }

    if (contextFiles.length > 0) {
      manifest.extensions = {
        cursor: {
          workspace_config: {
            context_files: contextFiles,
          },
        },
      };
    }

    return manifest;
  }

  /**
   * Sync AGENTS.md with manifest changes
   * @param manifestPath - Path to OSSA manifest
   * @param watch - Whether to watch for changes
   */
  async syncAgentsMd(manifestPath: string, watch: boolean = false): Promise<void> {
    // Load manifest
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as OssaAgent;

    const extension = manifest.extensions?.agents_md as AgentsMdExtension | undefined;
    
    if (!extension?.enabled) {
      throw new Error('agents_md extension is not enabled');
    }

    if (!extension.sync?.on_manifest_change) {
      throw new Error('Sync on manifest change is not enabled');
    }

    // Generate and write AGENTS.md
    await this.writeAgentsMd(manifest);

    if (watch) {
      // Watch for changes (simplified - in production would use fs.watch)
      console.log(`Watching ${manifestPath} for changes...`);
      // TODO: Implement file watching with fs.watch
    }
  }
}
