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
  validate?: boolean; // Validate output SKILL.md before writing
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
 * Oracle Agent Spec Schema (expanded to match oracle/agent-spec)
 */
const OracleToolParameterSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
});

const OracleToolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  parameters: z.array(OracleToolParameterSchema).optional(),
});

const OracleGuardrailSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  rules: z.array(z.string()).optional(),
});

const OracleSubAgentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  role: z.string().optional(),
});

const OracleAgentSpecSchema = z.object({
  name: z.string(),
  description: z.string(),
  instructions: z.string(),
  capabilities: z.array(z.string()).optional(),
  tools: z.array(z.union([z.string(), OracleToolSchema])).optional(),
  knowledge: z.array(z.string()).optional(),
  guardrails: z.array(z.union([z.string(), OracleGuardrailSchema])).optional(),
  sub_agents: z.array(z.union([z.string(), OracleSubAgentSchema])).optional(),
  model: z.string().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

/**
 * Parsed AGENTS.md agent
 */
interface ParsedAgent {
  name: string;
  description: string;
  capabilities: string[];
  tools: Array<{ name: string; description?: string }>;
  instructions: string;
  knowledge: string[];
}

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
    const {
      inputPath,
      format,
      output,
      outputFormat = 'claude-skill',
      dryRun,
      validate: shouldValidate,
    } = options;

    try {
      // Detect input format
      const detectedFormat = format || (await this.detectFormat(inputPath));

      // Parse input
      const parsed = await this.parseInput(inputPath, detectedFormat);

      // Generate skill structure
      const skillData = await this.generateSkillData(parsed, detectedFormat);

      // Validate output if requested
      if (shouldValidate) {
        const validationErrors = this.validateSkillData(skillData);
        if (validationErrors.length > 0) {
          return {
            success: false,
            message: 'Skill validation failed',
            errors: validationErrors,
          };
        }
      }

      // Create output directory structure
      const outputPath = output || path.join(process.cwd(), 'generated-skill');

      if (!dryRun) {
        await this.writeSkillFiles(outputPath, skillData);
      }

      return {
        success: true,
        outputPath,
        files: ['SKILL.md', 'templates/', 'knowledge/', 'examples/'],
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
        const result = OracleAgentSpecSchema.safeParse(parsed);
        if (!result.success) {
          const issues = result.error.issues
            .map((i) => `  Line ~${i.path.join('.')}: ${i.message}`)
            .join('\n');
          throw new Error(`Oracle Agent Spec validation failed:\n${issues}`);
        }
        return result.data;
      }

      case 'agents-md':
        return this.parseAgentsMd(content);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Parse AGENTS.md format — handles multiple agent sections with structured fields
   */
  private parseAgentsMd(content: string): { agents: ParsedAgent[] } {
    const agents: ParsedAgent[] = [];
    // Split on ## headers (level 2) — these are agent sections
    const agentSections = content.split(/^## /m).filter((s) => s.trim());

    for (const section of agentSections) {
      const lines = section.split('\n');
      const name = lines[0]?.trim();
      if (!name) continue;

      // Extract description: first non-empty, non-heading, non-list line
      const description =
        lines
          .slice(1)
          .find(
            (l) =>
              l.trim() &&
              !l.startsWith('#') &&
              !l.startsWith('-') &&
              !l.startsWith('*') &&
              !l.startsWith('**') &&
              !l.startsWith('```')
          )
          ?.trim() || '';

      agents.push({
        name,
        description,
        capabilities: this.extractCapabilities(section),
        tools: this.extractTools(section),
        instructions: this.extractInstructions(section),
        knowledge: this.extractKnowledge(section),
      });
    }

    return { agents };
  }

  /**
   * Extract capabilities from AGENTS.md section
   * Handles: **Capabilities:** inline, ### Capabilities subsection, bullet lists
   */
  private extractCapabilities(section: string): string[] {
    const capabilities: string[] = [];

    // Pattern 1: **Capabilities:** inline or **Skills:** inline
    const inlineMatch = section.match(
      /\*\*(?:Capabilities|Skills)\s*:\*\*\s*(.*)/i
    );
    if (inlineMatch) {
      capabilities.push(
        ...inlineMatch[1]
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }

    // Pattern 2: ### Capabilities subsection with bullet list
    const subsectionMatch = section.match(
      /###\s*Capabilities\s*\n([\s\S]*?)(?=\n###|\n## |$)/i
    );
    if (subsectionMatch) {
      const bulletItems = subsectionMatch[1].match(/^[-*]\s+(.+)$/gm);
      if (bulletItems) {
        capabilities.push(
          ...bulletItems.map((item) =>
            item
              .replace(/^[-*]\s+/, '')
              .replace(/\*\*/g, '')
              .trim()
          )
        );
      }
    }

    // Pattern 3: Bullet list immediately after **Capabilities:**
    const bulletAfterInline = section.match(
      /\*\*(?:Capabilities|Skills)\s*:\*\*\s*\n((?:\s*[-*]\s+.+\n?)+)/i
    );
    if (bulletAfterInline) {
      const bulletItems = bulletAfterInline[1].match(/[-*]\s+(.+)/g);
      if (bulletItems) {
        capabilities.push(
          ...bulletItems.map((item) =>
            item
              .replace(/^[-*]\s+/, '')
              .replace(/\*\*/g, '')
              .trim()
          )
        );
      }
    }

    return [...new Set(capabilities)];
  }

  /**
   * Extract tools from AGENTS.md section
   * Handles: ### Tools subsection, **Tools:** inline, bullet lists with descriptions
   */
  private extractTools(
    section: string
  ): Array<{ name: string; description?: string }> {
    const tools: Array<{ name: string; description?: string }> = [];

    // Pattern 1: ### Tools subsection with bullet list
    const subsectionMatch = section.match(
      /###\s*Tools\s*\n([\s\S]*?)(?=\n###|\n## |$)/i
    );
    if (subsectionMatch) {
      const bulletItems = subsectionMatch[1].match(/^[-*]\s+(.+)$/gm);
      if (bulletItems) {
        for (const item of bulletItems) {
          const cleaned = item.replace(/^[-*]\s+/, '').trim();
          // Handle "**toolname** - description" or "toolname: description"
          const descMatch = cleaned.match(/^\*\*([^*]+)\*\*\s*[-–—:]\s*(.+)$/);
          if (descMatch) {
            tools.push({
              name: descMatch[1].trim(),
              description: descMatch[2].trim(),
            });
          } else {
            const colonMatch = cleaned.match(/^([^:]+):\s*(.+)$/);
            if (colonMatch) {
              tools.push({
                name: colonMatch[1].trim(),
                description: colonMatch[2].trim(),
              });
            } else {
              tools.push({ name: cleaned });
            }
          }
        }
      }
    }

    // Pattern 2: **Tools:** inline
    const inlineMatch = section.match(/\*\*Tools\s*:\*\*\s*(.*)/i);
    if (inlineMatch && tools.length === 0) {
      const toolNames = inlineMatch[1]
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      tools.push(...toolNames.map((name) => ({ name })));
    }

    return tools;
  }

  /**
   * Extract instructions from AGENTS.md section
   * Collects all non-structured text as instructions
   */
  private extractInstructions(section: string): string {
    const lines = section.split('\n');
    const instructionLines: string[] = [];
    let inCodeBlock = false;

    for (const line of lines.slice(1)) {
      // Skip subsection headers
      if (line.match(/^###\s/)) continue;
      // Track code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        instructionLines.push(line);
        continue;
      }
      if (inCodeBlock) {
        instructionLines.push(line);
        continue;
      }
      // Skip structured fields
      if (
        line.match(
          /^\*\*(?:Capabilities|Skills|Tools|Knowledge|References)\s*:\*\*/i
        )
      )
        continue;

      if (line.trim()) {
        instructionLines.push(line);
      }
    }

    return instructionLines.join('\n').trim();
  }

  /**
   * Extract knowledge references from AGENTS.md section
   */
  private extractKnowledge(section: string): string[] {
    const knowledge: string[] = [];

    // Pattern: ### Knowledge subsection or **Knowledge:**
    const subsectionMatch = section.match(
      /###\s*(?:Knowledge|References)\s*\n([\s\S]*?)(?=\n###|\n## |$)/i
    );
    if (subsectionMatch) {
      const bulletItems = subsectionMatch[1].match(/^[-*]\s+(.+)$/gm);
      if (bulletItems) {
        knowledge.push(
          ...bulletItems.map((item) => item.replace(/^[-*]\s+/, '').trim())
        );
      }
    }

    return knowledge;
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
      description:
        (metadata as any).description || spec.role || 'No description',
      trigger_keywords: this.extractKeywords(manifest),
      version: (metadata as any).version,
      author: (metadata as any).author,
      tags: this.extractTags(manifest),
    };

    const content = this.buildSkillContent(
      frontmatter,
      spec.role || '',
      spec.tools || [],
      spec.capabilities || [],
      []
    );

    return {
      frontmatter,
      content,
      name: frontmatter.name,
      tools: spec.tools || [],
      capabilities: spec.capabilities || [],
    };
  }

  /**
   * Generate skill data from Oracle Agent Spec
   */
  private generateFromOracle(spec: any): any {
    const frontmatter: SkillFrontmatter = {
      name: spec.name,
      description: spec.description,
      trigger_keywords: [
        ...(spec.capabilities || []),
        ...this.extractTriggersFromTools(spec.tools || []),
      ],
    };

    const content = this.buildSkillContent(
      frontmatter,
      spec.instructions,
      spec.tools || [],
      spec.capabilities || [],
      spec.knowledge || []
    );

    return {
      frontmatter,
      content,
      name: frontmatter.name,
      tools: spec.tools || [],
      capabilities: spec.capabilities || [],
      knowledge: spec.knowledge || [],
      guardrails: spec.guardrails || [],
      subAgents: spec.sub_agents || [],
    };
  }

  /**
   * Generate skill data from AGENTS.md
   */
  private generateFromAgentsMd(parsed: any): any {
    // For AGENTS.md with multiple agents, generate the first one
    const agent: ParsedAgent | undefined = parsed.agents?.[0];
    if (!agent) {
      throw new Error('No agents found in AGENTS.md');
    }

    const frontmatter: SkillFrontmatter = {
      name: agent.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
      description: agent.description,
      trigger_keywords: [
        ...agent.capabilities,
        ...agent.tools.map((t) => t.name),
      ],
    };

    const content = this.buildSkillContent(
      frontmatter,
      agent.instructions,
      agent.tools,
      agent.capabilities,
      agent.knowledge
    );

    return {
      frontmatter,
      content,
      name: frontmatter.name,
      tools: agent.tools,
      capabilities: agent.capabilities,
      knowledge: agent.knowledge,
    };
  }

  /**
   * Extract trigger keywords from tools list
   */
  private extractTriggersFromTools(tools: any[]): string[] {
    return tools
      .map((t) => (typeof t === 'string' ? t : t.name))
      .filter(Boolean);
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
    capabilities: any[],
    knowledge: string[]
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
        const capDesc =
          typeof cap === 'object' && cap.description
            ? `: ${cap.description}`
            : '';
        content += `- ${capName}${capDesc}\n`;
      }
      content += `\n`;
    }

    if (tools.length > 0) {
      content += `## Available Tools\n\n`;
      for (const tool of tools) {
        const toolName =
          typeof tool === 'string' ? tool : tool.name || 'unknown';
        const toolDesc =
          typeof tool === 'object' && tool.description
            ? `: ${tool.description}`
            : '';
        content += `- **${toolName}**${toolDesc}\n`;

        // Include parameters if present (Oracle spec)
        if (typeof tool === 'object' && tool.parameters) {
          for (const param of tool.parameters) {
            const paramType = param.type ? ` (${param.type})` : '';
            const paramReq = param.required ? ' *required*' : '';
            const paramDesc = param.description
              ? ` — ${param.description}`
              : '';
            content += `  - \`${param.name}\`${paramType}${paramReq}${paramDesc}\n`;
          }
        }
      }
      content += `\n`;
    }

    if (knowledge.length > 0) {
      content += `## Knowledge Base\n\n`;
      for (const item of knowledge) {
        content += `- ${item}\n`;
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
   * Validate generated skill data before writing
   */
  private validateSkillData(skillData: any): string[] {
    const errors: string[] = [];

    if (!skillData.frontmatter?.name) {
      errors.push('Missing required field: name');
    }
    if (!skillData.frontmatter?.description) {
      errors.push('Missing required field: description');
    }
    if (
      !skillData.frontmatter?.trigger_keywords ||
      skillData.frontmatter.trigger_keywords.length === 0
    ) {
      errors.push(
        'Missing required field: trigger_keywords (at least one keyword required)'
      );
    }
    if (!skillData.content || skillData.content.length < 50) {
      errors.push('Generated SKILL.md content is too short (< 50 chars)');
    }

    // Validate frontmatter against schema
    const parseResult = SkillFrontmatterSchema.safeParse(skillData.frontmatter);
    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) {
        errors.push(`Frontmatter: ${issue.path.join('.')} — ${issue.message}`);
      }
    }

    return errors;
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

    // Write knowledge files if present
    if (skillData.knowledge && skillData.knowledge.length > 0) {
      const knowledgeContent = skillData.knowledge
        .map((k: string) => `- ${k}`)
        .join('\n');
      await fs.writeFile(
        path.join(outputPath, 'knowledge', 'references.md'),
        `# Knowledge References\n\n${knowledgeContent}\n`,
        'utf-8'
      );
    } else {
      await fs.writeFile(
        path.join(outputPath, 'knowledge', '.gitkeep'),
        '',
        'utf-8'
      );
    }

    // Write tool templates if tools present
    if (skillData.tools && skillData.tools.length > 0) {
      const toolsContent = skillData.tools
        .map((t: any) => {
          const name = typeof t === 'string' ? t : t.name;
          const desc =
            typeof t === 'object' && t.description ? t.description : '';
          return `### ${name}\n\n${desc}\n`;
        })
        .join('\n');
      await fs.writeFile(
        path.join(outputPath, 'templates', 'tools.md'),
        `# Tool Templates\n\n${toolsContent}`,
        'utf-8'
      );
    } else {
      await fs.writeFile(
        path.join(outputPath, 'templates', '.gitkeep'),
        '',
        'utf-8'
      );
    }

    // Write example usage
    await fs.writeFile(
      path.join(outputPath, 'examples', 'example.md'),
      `# Example Usage\n\nUse this skill by mentioning any of these keywords: ${skillData.frontmatter.trigger_keywords.slice(0, 5).join(', ')}\n`,
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
