/**
 * Skills Generator Service
 * Generate Claude Skills from OSSA manifests, Oracle Agent Specs, or AGENTS.md
 */

import { injectable, inject } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { z } from 'zod';
import type { OssaAgent } from '../../types/index.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';

/**
 * Input Format Types
 */
export type InputFormat = 'ossa' | 'oracle' | 'agents-md';

/**
 * Output Format Types
 */
export type OutputFormat = 'claude-skill' | 'npm-package';

/**
 * Generation Options
 */
export interface GenerationOptions {
  inputPath: string;
  format?: InputFormat; // Auto-detect if not specified
  output?: string; // Output directory
  outputFormat?: OutputFormat;
  dryRun?: boolean;
}

/**
 * Generation Result
 */
export interface GenerationResult {
  success: boolean;
  outputPath?: string;
  files?: string[];
  message?: string;
  errors?: string[];
}

/**
 * Claude Skill Frontmatter Schema
 */
const SkillFrontmatterSchema = z.object({
  name: z.string(),
  description: z.string(),
  trigger_keywords: z.array(z.string()),
  version: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;

/**
 * Oracle Agent Spec Schema (simplified)
 */
const OracleAgentSpecSchema = z.object({
  name: z.string(),
  description: z.string(),
  instructions: z.string(),
  capabilities: z.array(z.string()).optional(),
  tools: z.array(z.any()).optional(),
});

@injectable()
export class SkillsGeneratorService {
  constructor(
    @inject(ManifestRepository)
    private manifestRepo: ManifestRepository
  ) {}

  /**
   * Generate Claude Skill from input file
   */
  async generate(options: GenerationOptions): Promise<GenerationResult> {
    const { inputPath, format, output, outputFormat = 'claude-skill', dryRun } =
      options;

    try {
      // Detect input format
      const detectedFormat = format || (await this.detectFormat(inputPath));

      // Parse input
      const parsed = await this.parseInput(inputPath, detectedFormat);

      // Generate skill structure
      const skillData = await this.generateSkillData(parsed, detectedFormat);

      // Create output directory structure
      const outputPath = output || path.join(process.cwd(), 'generated-skill');

      if (!dryRun) {
        await this.writeSkillFiles(outputPath, skillData);
      }

      return {
        success: true,
        outputPath,
        files: [
          'SKILL.md',
          'templates/',
          'knowledge/',
          'examples/',
        ],
        message: dryRun
          ? 'Dry run completed (no files written)'
          : `Skill generated successfully at ${outputPath}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate skill',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Detect input format from file content
   */
  private async detectFormat(filePath: string): Promise<InputFormat> {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();

    // Check file extension and name
    if (basename === 'agents.md') return 'agents-md';
    if (ext === '.yaml' || ext === '.yml') {
      // Check content to distinguish OSSA from Oracle
      const content = await fs.readFile(filePath, 'utf-8');
      if (content.includes('apiVersion:') && content.includes('kind: Agent')) {
        return 'ossa';
      }
      return 'oracle';
    }
    if (ext === '.json') return 'oracle';
    if (ext === '.md') return 'agents-md';

    throw new Error(
      `Unable to detect format for ${filePath}. Supported: .yaml (OSSA/Oracle), .json (Oracle), .md (AGENTS.md)`
    );
  }

  /**
   * Parse input file based on format
   */
  private async parseInput(
    filePath: string,
    format: InputFormat
  ): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');

    switch (format) {
      case 'ossa':
        return this.manifestRepo.load(filePath);

      case 'oracle': {
        const parsed = filePath.endsWith('.json')
          ? JSON.parse(content)
          : yaml.parse(content);
        return OracleAgentSpecSchema.parse(parsed);
      }

      case 'agents-md':
        return this.parseAgentsMd(content);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Parse AGENTS.md format
   */
  private parseAgentsMd(content: string): any {
    // Extract agent metadata from AGENTS.md
    const agents = [];
    const agentSections = content.split(/^## /m).filter((s) => s.trim());

    for (const section of agentSections) {
      const lines = section.split('\n');
      const name = lines[0]?.trim();
      if (!name) continue;

      const description =
        lines
          .slice(1)
          .find((l) => l.trim() && !l.startsWith('-') && !l.startsWith('**'))
          ?.trim() || '';

      agents.push({
        name,
        description,
        capabilities: this.extractCapabilities(section),
        instructions: this.extractInstructions(section),
      });
    }

    return { agents };
  }

  /**
   * Extract capabilities from AGENTS.md section
   */
  private extractCapabilities(section: string): string[] {
    const capabilities: string[] = [];
    const lines = section.split('\n');

    for (const line of lines) {
      if (line.includes('**Capabilities:**') || line.includes('**Skills:**')) {
        const match = line.match(/\*\*(.*?)\*\*/g);
        if (match) {
          capabilities.push(
            ...match.map((m) => m.replace(/\*\*/g, '').toLowerCase())
          );
        }
      }
    }

    return capabilities;
  }

  /**
   * Extract instructions from AGENTS.md section
   */
  private extractInstructions(section: string): string {
    const lines = section.split('\n');
    const instructionLines = lines.filter(
      (l) => l.trim() && !l.startsWith('#') && !l.startsWith('**')
    );
    return instructionLines.join('\n').trim();
  }

  /**
   * Generate skill data structure
   */
  private async generateSkillData(
    parsed: any,
    format: InputFormat
  ): Promise<any> {
    if (format === 'ossa') {
      return this.generateFromOSSA(parsed);
    } else if (format === 'oracle') {
      return this.generateFromOracle(parsed);
    } else if (format === 'agents-md') {
      return this.generateFromAgentsMd(parsed);
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Generate skill data from OSSA manifest
   */
  private generateFromOSSA(manifest: OssaAgent): any {
    const metadata = manifest.metadata || {};
    const spec = (manifest.spec || {}) as any;

    const frontmatter: SkillFrontmatter = {
      name: (metadata as any).name || 'unnamed-skill',
      description: (metadata as any).description || spec.role || 'No description',
      trigger_keywords: this.extractKeywords(manifest),
      version: (metadata as any).version,
      author: (metadata as any).author,
      tags: this.extractTags(manifest),
    };

    const content = this.buildSkillContent(
      frontmatter,
      spec.role || '',
      spec.tools || [],
      spec.capabilities || []
    );

    return {
      frontmatter,
      content,
      name: frontmatter.name,
    };
  }

  /**
   * Generate skill data from Oracle Agent Spec
   */
  private generateFromOracle(spec: any): any {
    const frontmatter: SkillFrontmatter = {
      name: spec.name,
      description: spec.description,
      trigger_keywords: spec.capabilities || [],
    };

    const content = this.buildSkillContent(
      frontmatter,
      spec.instructions,
      spec.tools || [],
      spec.capabilities || []
    );

    return {
      frontmatter,
      content,
      name: frontmatter.name,
    };
  }

  /**
   * Generate skill data from AGENTS.md
   */
  private generateFromAgentsMd(parsed: any): any {
    // For AGENTS.md with multiple agents, generate the first one
    const agent = parsed.agents?.[0];
    if (!agent) {
      throw new Error('No agents found in AGENTS.md');
    }

    const frontmatter: SkillFrontmatter = {
      name: agent.name,
      description: agent.description,
      trigger_keywords: agent.capabilities || [],
    };

    const content = this.buildSkillContent(
      frontmatter,
      agent.instructions,
      [],
      agent.capabilities || []
    );

    return {
      frontmatter,
      content,
      name: frontmatter.name,
    };
  }

  /**
   * Extract keywords from OSSA manifest
   */
  private extractKeywords(manifest: OssaAgent): string[] {
    const keywords: string[] = [];
    const spec = manifest.spec as any;

    // From taxonomy
    if (spec?.taxonomy) {
      if (spec.taxonomy.domain) keywords.push(spec.taxonomy.domain);
      if (spec.taxonomy.subdomain) keywords.push(spec.taxonomy.subdomain);
      if (spec.taxonomy.capability) keywords.push(spec.taxonomy.capability);
    }

    // From capabilities
    if (spec?.capabilities) {
      for (const cap of spec.capabilities) {
        if (typeof cap === 'string') {
          keywords.push(cap);
        } else if (cap?.name) {
          keywords.push(cap.name);
        }
      }
    }

    // From labels
    if (manifest.metadata?.labels) {
      keywords.push(...Object.values(manifest.metadata.labels));
    }

    return [...new Set(keywords)];
  }

  /**
   * Extract tags from OSSA manifest
   */
  private extractTags(manifest: OssaAgent): string[] {
    const tags: string[] = [];

    if (manifest.metadata?.labels) {
      tags.push(...Object.values(manifest.metadata.labels));
    }

    return [...new Set(tags)];
  }

  /**
   * Build skill content with frontmatter
   */
  private buildSkillContent(
    frontmatter: SkillFrontmatter,
    instructions: string,
    tools: any[],
    capabilities: any[]
  ): string {
    let content = '---\n';
    content += yaml.stringify(frontmatter);
    content += '---\n\n';

    content += `# ${frontmatter.name}\n\n`;
    content += `${frontmatter.description}\n\n`;

    content += `## Instructions\n\n`;
    content += `${instructions}\n\n`;

    if (capabilities.length > 0) {
      content += `## Capabilities\n\n`;
      for (const cap of capabilities) {
        const capName = typeof cap === 'string' ? cap : cap.name || 'unknown';
        content += `- ${capName}\n`;
      }
      content += `\n`;
    }

    if (tools.length > 0) {
      content += `## Available Tools\n\n`;
      for (const tool of tools) {
        const toolName = typeof tool === 'string' ? tool : tool.name || 'unknown';
        const toolDesc = typeof tool === 'object' && tool.description ? `: ${tool.description}` : '';
        content += `- **${toolName}**${toolDesc}\n`;
      }
      content += `\n`;
    }

    content += `## When to Use\n\n`;
    content += `This skill activates when:\n`;
    for (const keyword of frontmatter.trigger_keywords.slice(0, 5)) {
      content += `- Task involves: ${keyword}\n`;
    }

    return content;
  }

  /**
   * Write skill files to output directory
   */
  private async writeSkillFiles(
    outputPath: string,
    skillData: any
  ): Promise<void> {
    // Create directory structure
    await fs.mkdir(outputPath, { recursive: true });
    await fs.mkdir(path.join(outputPath, 'templates'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'knowledge'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'examples'), { recursive: true });

    // Write SKILL.md
    await fs.writeFile(
      path.join(outputPath, 'SKILL.md'),
      skillData.content,
      'utf-8'
    );

    // Write README.md
    const readme = this.generateReadme(skillData.frontmatter);
    await fs.writeFile(path.join(outputPath, 'README.md'), readme, 'utf-8');

    // Create placeholder files
    await fs.writeFile(
      path.join(outputPath, 'templates', '.gitkeep'),
      '',
      'utf-8'
    );
    await fs.writeFile(
      path.join(outputPath, 'knowledge', '.gitkeep'),
      '',
      'utf-8'
    );
    await fs.writeFile(
      path.join(outputPath, 'examples', 'example.md'),
      `# Example Usage\n\nTODO: Add usage examples for ${skillData.name}\n`,
      'utf-8'
    );
  }

  /**
   * Generate README.md for skill
   */
  private generateReadme(frontmatter: SkillFrontmatter): string {
    let content = `# ${frontmatter.name}\n\n`;
    content += `${frontmatter.description}\n\n`;

    content += `## Installation\n\n`;
    content += `\`\`\`bash\n`;
    content += `# Install via OSSA CLI\n`;
    content += `ossa skills export ./${frontmatter.name} --install\n`;
    content += `\`\`\`\n\n`;

    content += `## Trigger Keywords\n\n`;
    for (const keyword of frontmatter.trigger_keywords) {
      content += `- ${keyword}\n`;
    }
    content += `\n`;

    if (frontmatter.tags && frontmatter.tags.length > 0) {
      content += `## Tags\n\n`;
      for (const tag of frontmatter.tags) {
        content += `\`${tag}\` `;
      }
      content += `\n\n`;
    }

    content += `## Directory Structure\n\n`;
    content += `\`\`\`\n`;
    content += `${frontmatter.name}/\n`;
    content += `├── SKILL.md          # Main skill definition\n`;
    content += `├── README.md         # This file\n`;
    content += `├── templates/        # Prompt templates\n`;
    content += `├── knowledge/        # Domain knowledge files\n`;
    content += `└── examples/         # Usage examples\n`;
    content += `\`\`\`\n\n`;

    content += `## Generated by OSSA\n\n`;
    content += `This skill was generated using [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)\n`;

    return content;
  }
}
