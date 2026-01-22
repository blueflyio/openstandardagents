/**
 * Claude Skills Service
 * Discovery, generation, and synchronization of Claude Skills from OSSA manifests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { injectable } from 'inversify';
import type { OssaAgent } from '../../types/index.js';

export interface ClaudeSkill {
  name: string;
  description: string;
  triggerKeywords: string[];
  path: string;
  skillPath?: string;
}

export interface SkillGenerationOptions {
  outputPath?: string;
  skillName?: string;
  includeExamples?: boolean;
}

@injectable()
export class ClaudeSkillsService {
  /**
   * Discover Claude Skills from standard locations
   */
  async discoverSkills(): Promise<ClaudeSkill[]> {
    const skills: ClaudeSkill[] = [];
    const skillPaths = [
      path.join(process.env.HOME || '~', '.claude', 'skills'),
      path.join(process.cwd(), '.claude', 'skills'),
      path.join(process.cwd(), 'skills'),
    ];

    for (const skillPath of skillPaths) {
      const resolvedPath = path.resolve(skillPath);
      if (fs.existsSync(resolvedPath)) {
        const discovered = await this.scanSkillsDirectory(resolvedPath);
        skills.push(...discovered);
      }
    }

    return skills;
  }

  /**
   * Scan directory for Claude Skills
   */
  private async scanSkillsDirectory(dir: string): Promise<ClaudeSkill[]> {
    const skills: ClaudeSkill[] = [];

    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      return skills;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDir = path.join(dir, entry.name);
        const skillFile = path.join(skillDir, 'SKILL.md');

        if (fs.existsSync(skillFile)) {
          try {
            const skill = await this.parseSkillFile(skillFile);
            skills.push({
              ...skill,
              path: skillFile,
              skillPath: skillDir,
            });
          } catch (error) {
            // Skip invalid skill files
            if (process.env.DEBUG) {
              console.warn(`Failed to parse skill: ${skillFile}`, error);
            }
          }
        }
      }
    }

    return skills;
  }

  /**
   * Parse Claude Skill file (SKILL.md)
   */
  private async parseSkillFile(skillPath: string): Promise<ClaudeSkill> {
    const content = fs.readFileSync(skillPath, 'utf-8');

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('No frontmatter found in SKILL.md');
    }

    const frontmatter = yaml.parse(frontmatterMatch[1]) as {
      name?: string;
      description?: string;
      trigger_keywords?: string[];
    };

    // Extract description from content if not in frontmatter
    let description = frontmatter.description || '';
    if (!description) {
      const contentAfterFrontmatter = content.replace(
        /^---\n[\s\S]*?\n---\n/,
        ''
      );
      const firstParagraph = contentAfterFrontmatter
        .split('\n\n')
        .find((p) => p.trim().length > 0);
      description = firstParagraph?.trim() || '';
    }

    return {
      name: frontmatter.name || path.basename(path.dirname(skillPath)),
      description,
      triggerKeywords: frontmatter.trigger_keywords || [],
      path: skillPath,
    };
  }

  /**
   * Generate Claude Skill from OSSA manifest
   */
  async generateSkillFromOSSA(
    manifest: OssaAgent,
    options: SkillGenerationOptions = {}
  ): Promise<string> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const skillName = options.skillName || agentName;
    const outputPath =
      options.outputPath ||
      path.join(process.cwd(), '.claude', 'skills', skillName);

    // Ensure directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const skillPath = path.join(outputPath, 'SKILL.md');

    // Extract trigger keywords from taxonomy and capabilities
    const triggerKeywords: string[] = [];
    const taxonomy = (manifest.spec as Record<string, unknown>)?.taxonomy as
      | {
          domain?: string;
          subdomain?: string;
          capability?: string;
        }
      | undefined;

    if (taxonomy?.domain) {
      triggerKeywords.push(taxonomy.domain);
    }
    if (taxonomy?.subdomain) {
      triggerKeywords.push(taxonomy.subdomain);
    }
    if (taxonomy?.capability) {
      triggerKeywords.push(taxonomy.capability);
    }

    // Extract from capabilities (if exists in spec)
    const specRecord = manifest.spec as Record<string, unknown>;
    if (specRecord.capabilities) {
      const capabilities = specRecord.capabilities as unknown[];
      for (const cap of capabilities) {
        if (typeof cap === 'string') {
          triggerKeywords.push(cap);
        } else if (cap && typeof cap === 'object' && 'name' in cap) {
          triggerKeywords.push(String((cap as { name: string }).name));
        }
      }
    }

    // Extract from role/system prompt
    const role = manifest.spec?.role || '';
    const roleKeywords = role
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 5);
    triggerKeywords.push(...roleKeywords);

    // Generate skill content
    const skillContent = this.generateSkillContent(
      manifest,
      triggerKeywords,
      options.includeExamples || false
    );

    fs.writeFileSync(skillPath, skillContent, 'utf-8');

    return skillPath;
  }

  /**
   * Generate skill content from OSSA manifest
   */
  private generateSkillContent(
    manifest: OssaAgent,
    triggerKeywords: string[],
    includeExamples: boolean
  ): string {
    const agentName = manifest.metadata?.name || 'agent';
    const description =
      manifest.metadata?.description || manifest.spec?.role || 'OSSA agent';

    const frontmatter: Record<string, unknown> = {
      name: agentName,
      description: description.substring(0, 200),
      trigger_keywords: [...new Set(triggerKeywords)].slice(0, 10),
    };

    let content = `---\n${yaml.stringify(frontmatter)}---\n\n`;
    content += `# ${agentName}\n\n`;
    content += `${description}\n\n`;

    content += `## Purpose\n\n`;
    content += `This skill enables Claude to work with the ${agentName} OSSA agent.\n\n`;

    content += `## OSSA Manifest\n\n`;
    content += `- **Agent Name**: ${agentName}\n`;
    content += `- **Version**: ${manifest.metadata?.version || '0.1.0'}\n`;
    if (manifest.metadata?.labels?.['ossa.ai/domain']) {
      content += `- **Domain**: ${manifest.metadata.labels['ossa.ai/domain']}\n`;
    }
    content += `\n`;

    if (manifest.spec?.tools && manifest.spec.tools.length > 0) {
      content += `## Available Tools\n\n`;
      for (const tool of manifest.spec.tools) {
        const toolName =
          typeof tool === 'string' ? tool : tool.name || 'unknown';
        content += `- ${toolName}\n`;
      }
      content += `\n`;
    }

    if (includeExamples && manifest.spec?.role) {
      content += `## Example Usage\n\n`;
      content += `\`\`\`\n`;
      content += `Use ${agentName} to: ${description}\n`;
      content += `\`\`\`\n\n`;
    }

    content += `## When to Use\n\n`;
    content += `This skill activates when:\n`;
    for (const keyword of triggerKeywords.slice(0, 5)) {
      content += `- Task involves: ${keyword}\n`;
    }
    content += `\n`;

    return content;
  }

  /**
   * Sync OSSA manifest with Claude Skill
   */
  async syncSkillToOSSA(
    skillPath: string,
    manifestPath: string
  ): Promise<void> {
    const skill = await this.parseSkillFile(skillPath);
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = yaml.parse(manifestContent) as OssaAgent;

    // Update manifest metadata with skill info
    if (!manifest.metadata) {
      manifest.metadata = { name: '' };
    }
    if (!manifest.metadata.labels) {
      manifest.metadata.labels = {};
    }

    manifest.metadata.labels['claude.skill.path'] = skillPath;
    manifest.metadata.labels['claude.skill.name'] = skill.name;

    // Update taxonomy from trigger keywords if not set
    if (!(manifest.spec as Record<string, unknown>)?.taxonomy) {
      const specRecord = manifest.spec as Record<string, unknown>;
      if (!specRecord.taxonomy) {
        specRecord.taxonomy = {};
      }
      const taxonomy = specRecord.taxonomy as Record<string, unknown>;
      if (skill.triggerKeywords.length > 0 && !taxonomy.domain) {
        taxonomy.domain = skill.triggerKeywords[0];
      }
    }

    // Write updated manifest
    const updatedContent = yaml.stringify(manifest);
    fs.writeFileSync(manifestPath, updatedContent, 'utf-8');
  }

  /**
   * Validate skill against OSSA schema
   */
  async validateSkill(skillPath: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const skill = await this.parseSkillFile(skillPath);

      if (!skill.name) {
        errors.push('Skill name is required');
      }

      if (!skill.description || skill.description.length < 10) {
        errors.push('Skill description must be at least 10 characters');
      }

      if (skill.triggerKeywords.length === 0) {
        errors.push('At least one trigger keyword is required');
      }
    } catch (error) {
      errors.push(
        `Failed to parse skill: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
