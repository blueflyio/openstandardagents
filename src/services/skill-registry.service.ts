/**
 * Agent Skills Registry Service
 *
 * Implements Vercel agent-skills pattern for OSSA platform
 * - Automatic skill discovery and activation
 * - Context-based matching
 * - Priority-driven selection
 *
 * Based on: https://github.com/vercel-labs/agent-skills
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { injectable } from 'inversify';
import { ManifestRepository } from '../repositories/manifest.repository.js';
import type { OssaAgent } from '../types/index.js';

/**
 * Skill registration configuration
 */
export interface SkillRegistration {
  path: string;           // Path to .ossa.yaml manifest
  enabled?: boolean;      // Default: true
  priority?: number;      // Higher = preferred when multiple match (0-100)
  contexts?: string[];    // Limit to specific contexts (dev, prod, review, etc.)
}

/**
 * Context for matching skills to user requests
 */
export interface MatchContext {
  userInput: string;      // User's natural language request
  files?: string[];       // Files being edited or relevant to task
  framework?: string;     // Detected framework (next.js, react, vue, etc.)
  task?: string;          // Task type (optimize, debug, deploy, test, etc.)
  language?: string;      // Programming language
  keywords?: string[];    // Additional context keywords
}

/**
 * Skill match result with confidence score
 */
export interface SkillMatch {
  skill: RegisteredSkill;
  confidence: number;     // 0-1 confidence score
  matchedTriggers: {
    keywords: string[];
    filePatterns: string[];
    frameworks: string[];
  };
}

/**
 * Registered skill with metadata
 */
export interface RegisteredSkill {
  id: string;             // Skill identifier (metadata.name)
  manifest: OssaAgent;
  registration: SkillRegistration;
  triggers: {
    keywords: string[];
    filePatterns: string[];
    frameworks: string[];
  };
  capabilities: Array<{ name: string; description: string }>;
}

@injectable()
export class SkillRegistryService {
  private skills: Map<string, RegisteredSkill> = new Map();
  private manifestRepo: ManifestRepository;

  constructor(manifestRepo: ManifestRepository) {
    this.manifestRepo = manifestRepo;
  }

  /**
   * Register a skill from OSSA manifest
   */
  async register(registration: SkillRegistration): Promise<RegisteredSkill> {
    // Load and validate manifest
    const manifest = await this.manifestRepo.load(registration.path);

    if (!manifest || typeof manifest !== 'object' || !('metadata' in manifest)) {
      throw new Error(`Invalid skill manifest at ${registration.path}`);
    }

    const ossaManifest = manifest as OssaAgent;
    const skillId = ossaManifest.metadata?.name;

    if (!skillId) {
      throw new Error(`Skill manifest missing metadata.name: ${registration.path}`);
    }

    // Extract triggers from runtime configuration
    const runtime = (ossaManifest as any).runtime;
    const triggers = {
      keywords: runtime?.triggers?.keywords || [],
      filePatterns: runtime?.triggers?.file_patterns || [],
      frameworks: runtime?.triggers?.frameworks || []
    };

    // Extract capabilities
    const capabilities = ossaManifest.spec?.capabilities || [];

    const registeredSkill: RegisteredSkill = {
      id: skillId,
      manifest: ossaManifest,
      registration: {
        ...registration,
        enabled: registration.enabled !== false,
        priority: registration.priority || 50
      },
      triggers,
      capabilities
    };

    this.skills.set(skillId, registeredSkill);
    return registeredSkill;
  }

  /**
   * Register multiple skills from directory
   */
  async registerDirectory(dirPath: string): Promise<RegisteredSkill[]> {
    const files = await fs.readdir(dirPath);
    const yamlFiles = files.filter(f => f.endsWith('.ossa.yaml') || f.endsWith('.ossa.yml'));

    const registered: RegisteredSkill[] = [];
    for (const file of yamlFiles) {
      const skillPath = path.join(dirPath, file);
      try {
        const skill = await this.register({ path: skillPath });
        registered.push(skill);
      } catch (error) {
        console.warn(`Failed to register skill from ${file}:`, error);
      }
    }

    return registered;
  }

  /**
   * Get registered skill by ID
   */
  get(skillId: string): RegisteredSkill | undefined {
    return this.skills.get(skillId);
  }

  /**
   * List all registered skills
   */
  list(options?: { enabled?: boolean; context?: string }): RegisteredSkill[] {
    const allSkills = Array.from(this.skills.values());

    return allSkills.filter(skill => {
      // Filter by enabled status
      if (options?.enabled !== undefined && skill.registration.enabled !== options.enabled) {
        return false;
      }

      // Filter by context
      if (options?.context) {
        const contexts = skill.registration.contexts;
        if (contexts && contexts.length > 0 && !contexts.includes(options.context)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Match skills to user context with confidence scoring
   */
  async match(context: MatchContext): Promise<SkillMatch[]> {
    const candidates = this.list({ enabled: true });
    const matches: SkillMatch[] = [];

    for (const skill of candidates) {
      const match = this.calculateMatch(skill, context);

      // Only include matches above threshold
      const threshold = (skill.manifest as any).runtime?.activation?.confidence_threshold || 0.5;
      if (match.confidence >= threshold) {
        matches.push(match);
      }
    }

    // Sort by confidence (descending), then priority (descending)
    return matches.sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) > 0.1) {
        return b.confidence - a.confidence;
      }
      return (b.skill.registration.priority || 50) - (a.skill.registration.priority || 50);
    });
  }

  /**
   * Calculate match confidence for a skill given context
   */
  private calculateMatch(skill: RegisteredSkill, context: MatchContext): SkillMatch {
    let score = 0;
    let maxScore = 0;
    const matchedTriggers = {
      keywords: [] as string[],
      filePatterns: [] as string[],
      frameworks: [] as string[]
    };

    // 1. Keyword matching (weight: 30%)
    if (skill.triggers.keywords.length > 0) {
      maxScore += 30;
      const userInputLower = context.userInput.toLowerCase();
      const allKeywords = [
        ...context.keywords || [],
        ...userInputLower.split(/\s+/)
      ];

      for (const keyword of skill.triggers.keywords) {
        if (allKeywords.some(k => k.includes(keyword.toLowerCase()))) {
          matchedTriggers.keywords.push(keyword);
          score += 30 / skill.triggers.keywords.length;
        }
      }
    }

    // 2. File pattern matching (weight: 25%)
    if (skill.triggers.filePatterns.length > 0 && context.files) {
      maxScore += 25;
      for (const pattern of skill.triggers.filePatterns) {
        const matchingFiles = context.files.filter(file =>
          this.matchGlob(file, pattern)
        );
        if (matchingFiles.length > 0) {
          matchedTriggers.filePatterns.push(pattern);
          score += 25 / skill.triggers.filePatterns.length;
        }
      }
    }

    // 3. Framework matching (weight: 25%)
    if (skill.triggers.frameworks.length > 0 && context.framework) {
      maxScore += 25;
      if (skill.triggers.frameworks.includes(context.framework)) {
        matchedTriggers.frameworks.push(context.framework);
        score += 25;
      }
    }

    // 4. Task type matching (weight: 20%)
    if (context.task) {
      maxScore += 20;
      const taskLower = context.task.toLowerCase();

      // Check if any capability matches the task
      for (const cap of skill.capabilities) {
        const capName = cap.name.toLowerCase();
        if (capName.includes(taskLower) || taskLower.includes(capName)) {
          score += 20;
          break;
        }
      }
    }

    // Normalize score to 0-1 range
    const confidence = maxScore > 0 ? score / maxScore : 0;

    return {
      skill,
      confidence,
      matchedTriggers
    };
  }

  /**
   * Simple glob pattern matching
   */
  private matchGlob(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Unregister a skill
   */
  unregister(skillId: string): boolean {
    return this.skills.delete(skillId);
  }

  /**
   * Enable/disable a skill
   */
  setEnabled(skillId: string, enabled: boolean): void {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.registration.enabled = enabled;
    }
  }

  /**
   * Update skill priority
   */
  setPriority(skillId: string, priority: number): void {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.registration.priority = priority;
    }
  }

  /**
   * Get skill statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byCategory: Record<string, number>;
  } {
    const allSkills = Array.from(this.skills.values());

    const stats = {
      total: allSkills.length,
      enabled: allSkills.filter(s => s.registration.enabled).length,
      disabled: allSkills.filter(s => !s.registration.enabled).length,
      byCategory: {} as Record<string, number>
    };

    // Count by category label
    for (const skill of allSkills) {
      const category = skill.manifest.metadata?.labels?.['ossa.dev/category'] || 'uncategorized';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }

    return stats;
  }
}

/**
 * Global skill registry singleton
 */
export class SkillRegistry {
  private static instance: SkillRegistryService;

  static initialize(manifestRepo: ManifestRepository): void {
    this.instance = new SkillRegistryService(manifestRepo);
  }

  static getInstance(): SkillRegistryService {
    if (!this.instance) {
      throw new Error('SkillRegistry not initialized. Call SkillRegistry.initialize() first.');
    }
    return this.instance;
  }

  static async register(registration: SkillRegistration): Promise<RegisteredSkill> {
    return this.getInstance().register(registration);
  }

  static async registerDirectory(dirPath: string): Promise<RegisteredSkill[]> {
    return this.getInstance().registerDirectory(dirPath);
  }

  static get(skillId: string): RegisteredSkill | undefined {
    return this.getInstance().get(skillId);
  }

  static list(options?: { enabled?: boolean; context?: string }): RegisteredSkill[] {
    return this.getInstance().list(options);
  }

  static async match(context: MatchContext): Promise<SkillMatch[]> {
    return this.getInstance().match(context);
  }
}
