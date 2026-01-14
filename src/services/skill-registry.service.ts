/**
 * Skill Registry Service
 * 
 * Implements Vercel agent-skills pattern for OSSA platform.
 * Provides context-aware skill discovery and activation.
 * 
 * @see https://agentskills.io/
 * @see https://github.com/vercel-labs/agent-skills
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';
import { glob } from 'glob';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

/**
 * Skill metadata schema
 */
const SkillMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  priority: z.number().min(0).max(100).default(50),
  contexts: z.array(z.enum(['development', 'production', 'review', 'testing'])).default(['development']),
  enabled: z.boolean().default(true),
  path: z.string(),
  manifest: z.any(), // OSSA manifest
});

export type SkillMetadata = z.infer<typeof SkillMetadataSchema>;

/**
 * Skill match context
 */
export interface SkillMatchContext {
  userInput?: string;
  files?: string[];
  framework?: string;
  projectType?: string;
  keywords?: string[];
}

/**
 * Skill match result
 */
export interface SkillMatch {
  skill: SkillMetadata;
  confidence: number;
  reasons: string[];
}

/**
 * Skill Registry Service
 * 
 * Manages skill discovery, registration, and context-based matching.
 */
export class SkillRegistry {
  private static skills: Map<string, SkillMetadata> = new Map();
  private static initialized = false;
  private static skillPaths: string[] = [];

  /**
   * Initialize the skill registry
   */
  static async initialize(skillPaths: string[] = []): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.skillPaths = skillPaths.length > 0 
      ? skillPaths 
      : [
          resolve(process.cwd(), 'examples/agent-skills'),
          resolve(process.cwd(), 'examples/ossa-templates'),
        ];

    await this.discoverSkills();
    this.initialized = true;
  }

  /**
   * Discover skills from configured paths
   * Supports both OSSA manifests (.ossa.yaml) and Vercel format (SKILL.md)
   */
  private static async discoverSkills(): Promise<void> {
    for (const skillPath of this.skillPaths) {
      if (!existsSync(skillPath)) {
        continue;
      }

      // Discover OSSA manifest skills
      const ossaFiles = await glob('**/*.ossa.yaml', {
        cwd: skillPath,
        absolute: true,
      });

      for (const file of ossaFiles) {
        try {
          await this.registerFromFile(file);
        } catch (error) {
          console.warn(`Failed to register OSSA skill from ${file}:`, error);
        }
      }

      // Discover Vercel format skills (SKILL.md)
      const skillMdFiles = await glob('**/SKILL.md', {
        cwd: skillPath,
        absolute: true,
      });

      for (const file of skillMdFiles) {
        try {
          await this.registerFromSkillMd(file);
        } catch (error) {
          console.warn(`Failed to register Vercel skill from ${file}:`, error);
        }
      }
    }
  }

  /**
   * Register a skill from Vercel format SKILL.md file
   */
  private static async registerFromSkillMd(filePath: string): Promise<SkillMetadata> {
    if (!existsSync(filePath)) {
      throw new Error(`Skill file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatterMatch) {
      throw new Error(`Invalid SKILL.md format: missing frontmatter`);
    }

    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/name:\s*(.+)/);
    const descMatch = frontmatter.match(/description:\s*(.+)/);

    const name = nameMatch ? nameMatch[1].trim() : 'unknown';
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract priority from directory structure or defaults
    const skillDir = filePath.replace('/SKILL.md', '');
    const priority = skillDir.includes('react-best-practices') ? 90 : 50;

    const skill: SkillMetadata = {
      name,
      description,
      priority,
      contexts: ['development', 'review'],
      enabled: true,
      path: filePath,
      manifest: {
        metadata: {
          name,
          description,
          labels: {
            'skill.priority': priority.toString(),
            'skill.contexts': 'development,review',
            'skill.enabled': 'true',
            'skill.format': 'vercel',
          },
        },
        spec: {
          role: description,
        },
        runtime: {
          triggers: {
            keywords: this.extractKeywords(content),
            file_patterns: this.extractFilePatterns(content),
            frameworks: this.extractFrameworks(content),
          },
        },
      },
    };

    const validated = SkillMetadataSchema.parse(skill);
    this.skills.set(validated.name, validated);
    return validated;
  }

  /**
   * Extract keywords from skill content
   */
  private static extractKeywords(content: string): string[] {
    const keywords: string[] = [];
    const keywordPatterns = [
      /keywords?:\s*\[(.*?)\]/i,
      /triggers?:\s*\[(.*?)\]/i,
      /when.*?:\s*\[(.*?)\]/i,
    ];

    for (const pattern of keywordPatterns) {
      const match = content.match(pattern);
      if (match) {
        const items = match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
        keywords.push(...items);
      }
    }

    // Default keywords for React best practices
    if (content.toLowerCase().includes('react') || content.toLowerCase().includes('performance')) {
      keywords.push('performance', 'optimize', 'slow', 'bundle', 'waterfall', 'react', 'next.js');
    }

    return [...new Set(keywords)];
  }

  /**
   * Extract file patterns from skill content
   */
  private static extractFilePatterns(content: string): string[] {
    const patterns: string[] = [];
    
    if (content.toLowerCase().includes('react') || content.toLowerCase().includes('tsx') || content.toLowerCase().includes('jsx')) {
      patterns.push('**/*.{tsx,jsx}', '**/components/**', '**/app/**', '**/pages/**');
    }
    if (content.toLowerCase().includes('typescript') || content.toLowerCase().includes('.ts')) {
      patterns.push('**/*.ts');
    }
    if (content.toLowerCase().includes('javascript') || content.toLowerCase().includes('.js')) {
      patterns.push('**/*.js');
    }

    return [...new Set(patterns)];
  }

  /**
   * Extract frameworks from skill content
   */
  private static extractFrameworks(content: string): string[] {
    const frameworks: string[] = [];
    const frameworkMap: Record<string, string[]> = {
      'next.js': ['next.js', 'next'],
      'react': ['react'],
      'remix': ['remix'],
      'gatsby': ['gatsby'],
    };

    const contentLower = content.toLowerCase();
    for (const [key, values] of Object.entries(frameworkMap)) {
      if (contentLower.includes(key)) {
        frameworks.push(...values);
      }
    }

    return [...new Set(frameworks)];
  }

  /**
   * Register a skill from a file path
   */
  static async registerFromFile(filePath: string): Promise<SkillMetadata> {
    if (!existsSync(filePath)) {
      throw new Error(`Skill file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    const manifest = parseYaml(content) as any;

    if (!manifest.metadata?.name) {
      throw new Error(`Invalid OSSA manifest: missing metadata.name`);
    }

    const skill: SkillMetadata = {
      name: manifest.metadata.name,
      description: manifest.metadata.description || '',
      priority: manifest.metadata.labels?.['skill.priority'] 
        ? parseInt(manifest.metadata.labels['skill.priority']) 
        : 50,
      contexts: manifest.metadata.labels?.['skill.contexts']
        ? manifest.metadata.labels['skill.contexts'].split(',').map((c: string) => c.trim())
        : ['development'],
      enabled: manifest.metadata.labels?.['skill.enabled'] !== 'false',
      path: filePath,
      manifest,
    };

    // Validate schema
    SkillMetadataSchema.parse(skill);

    this.skills.set(skill.name, skill);
    return skill;
  }

  /**
   * Register a skill manually
   */
  static register(skill: Partial<SkillMetadata> & { path: string; manifest: any }): SkillMetadata {
    const fullSkill: SkillMetadata = {
      name: skill.name || skill.manifest.metadata?.name || 'unknown',
      description: skill.description || skill.manifest.metadata?.description || '',
      priority: skill.priority ?? 50,
      contexts: skill.contexts || ['development'],
      enabled: skill.enabled ?? true,
      path: skill.path,
      manifest: skill.manifest,
    };

    const validated = SkillMetadataSchema.parse(fullSkill);
    this.skills.set(validated.name, validated);
    return validated;
  }

  /**
   * Match skills based on context
   */
  static async match(context: SkillMatchContext): Promise<SkillMatch[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const matches: SkillMatch[] = [];

    for (const [name, skill] of this.skills.entries()) {
      if (!skill.enabled) {
        continue;
      }

      const match = this.evaluateMatch(skill, context);
      if (match.confidence > 0) {
        matches.push(match);
      }
    }

    // Sort by confidence (descending), then by priority (descending)
    matches.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.skill.priority - a.skill.priority;
    });

    return matches;
  }

  /**
   * Evaluate a single skill match
   */
  private static evaluateMatch(skill: SkillMetadata, context: SkillMatchContext): SkillMatch {
    let confidence = 0;
    const reasons: string[] = [];

    const manifest = skill.manifest;
    const triggers = manifest.spec?.runtime?.triggers || {};

    // Keyword matching
    if (context.userInput && triggers.keywords) {
      const inputLower = context.userInput.toLowerCase();
      const matchedKeywords = triggers.keywords.filter((kw: string) => 
        inputLower.includes(kw.toLowerCase())
      );
      if (matchedKeywords.length > 0) {
        confidence += matchedKeywords.length * 0.2;
        reasons.push(`Matched keywords: ${matchedKeywords.join(', ')}`);
      }
    }

    // File pattern matching
    if (context.files && triggers.file_patterns) {
      let matchedFiles = 0;
      for (const pattern of triggers.file_patterns) {
        for (const file of context.files) {
          if (this.matchesPattern(file, pattern)) {
            matchedFiles++;
            reasons.push(`Matched file pattern: ${pattern} (${file})`);
            break;
          }
        }
      }
      if (matchedFiles > 0) {
        confidence += Math.min(matchedFiles * 0.15, 0.4);
      }
    }

    // Framework matching
    if (context.framework && triggers.frameworks) {
      const frameworks = Array.isArray(triggers.frameworks) 
        ? triggers.frameworks 
        : [triggers.frameworks];
      if (frameworks.some((f: string) => 
        context.framework?.toLowerCase().includes(f.toLowerCase())
      )) {
        confidence += 0.3;
        reasons.push(`Matched framework: ${context.framework}`);
      }
    }

    // Project type matching
    if (context.projectType && triggers.project_types) {
      const projectTypes = Array.isArray(triggers.project_types)
        ? triggers.project_types
        : [triggers.project_types];
      if (projectTypes.some((pt: string) =>
        context.projectType?.toLowerCase().includes(pt.toLowerCase())
      )) {
        confidence += 0.2;
        reasons.push(`Matched project type: ${context.projectType}`);
      }
    }

    // Explicit keyword matching (from context)
    if (context.keywords && triggers.keywords) {
      const matched = context.keywords.filter(kw =>
        triggers.keywords.some((tk: string) =>
          kw.toLowerCase().includes(tk.toLowerCase())
        )
      );
      if (matched.length > 0) {
        confidence += matched.length * 0.1;
        reasons.push(`Matched explicit keywords: ${matched.join(', ')}`);
      }
    }

    // Capability matching
    if (manifest.spec?.capabilities) {
      const capabilities = Array.isArray(manifest.spec.capabilities)
        ? manifest.spec.capabilities.map((c: any) => c.name || c)
        : [];
      
      if (context.userInput) {
        const inputLower = context.userInput.toLowerCase();
        const matchedCaps = capabilities.filter((cap: string) =>
          inputLower.includes(cap.toLowerCase())
        );
        if (matchedCaps.length > 0) {
          confidence += matchedCaps.length * 0.1;
          reasons.push(`Matched capabilities: ${matchedCaps.join(', ')}`);
        }
      }
    }

    // Normalize confidence to 0-1 range
    confidence = Math.min(confidence, 1.0);

    return {
      skill,
      confidence,
      reasons,
    };
  }

  /**
   * Check if a file matches a glob pattern
   */
  private static matchesPattern(file: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(file);
  }

  /**
   * Get all registered skills
   */
  static getAll(): SkillMetadata[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get a skill by name
   */
  static get(name: string): SkillMetadata | undefined {
    return this.skills.get(name);
  }

  /**
   * Enable a skill
   */
  static enable(name: string): boolean {
    const skill = this.skills.get(name);
    if (skill) {
      skill.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * Disable a skill
   */
  static disable(name: string): boolean {
    const skill = this.skills.get(name);
    if (skill) {
      skill.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * Clear all skills
   */
  static clear(): void {
    this.skills.clear();
    this.initialized = false;
  }

  /**
   * Get skills by context
   */
  static getByContext(context: 'development' | 'production' | 'review' | 'testing'): SkillMetadata[] {
    return Array.from(this.skills.values()).filter(skill =>
      skill.contexts.includes(context)
    );
  }

  /**
   * Get skills above confidence threshold
   */
  static async matchAboveThreshold(
    context: SkillMatchContext,
    threshold: number = 0.5
  ): Promise<SkillMatch[]> {
    const matches = await this.match(context);
    return matches.filter(m => m.confidence >= threshold);
  }
}
