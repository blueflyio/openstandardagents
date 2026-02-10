/**
 * Skills Research Service
 * Research and index skills from various sources (awesome-claude-code, claude-code-showcase, etc.)
 */

import { injectable } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

/**
 * Skill Research Result Schema
 */
export const SkillResearchResultSchema = z.object({
  name: z.string(),
  description: z.string(),
  triggers: z.array(z.string()),
  sourceUrl: z.string().url(),
  installCommand: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().optional(),
  lastUpdated: z.string().optional(),
});

export type SkillResearchResult = z.infer<typeof SkillResearchResultSchema>;

/**
 * Research Source Configuration
 */
export interface ResearchSource {
  name: string;
  type: 'github' | 'awesome-list' | 'showcase' | 'registry';
  url: string;
  enabled: boolean;
}

/**
 * Research Options
 */
export interface ResearchOptions {
  query: string;
  sources?: string[]; // Filter by source names
  limit?: number;
  updateIndex?: boolean;
  json?: boolean;
}

/**
 * Default Research Sources
 */
const DEFAULT_SOURCES: ResearchSource[] = [
  {
    name: 'awesome-claude-code',
    type: 'awesome-list',
    url: 'https://github.com/anthropics/awesome-claude-code',
    enabled: true,
  },
  {
    name: 'claude-code-showcase',
    type: 'showcase',
    url: 'https://github.com/anthropics/claude-code-showcase',
    enabled: true,
  },
  {
    name: 'skills-library',
    type: 'registry',
    url: 'https://claude-skills.dev',
    enabled: false, // Mock for now
  },
];

@injectable()
export class SkillsResearchService {
  private readonly indexPath: string;
  private sources: ResearchSource[] = DEFAULT_SOURCES;

  constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    this.indexPath = path.join(homeDir, '.ossa', 'skills-index.json');
  }

  /**
   * Research skills from configured sources
   */
  async research(options: ResearchOptions): Promise<SkillResearchResult[]> {
    const { query, sources, limit = 20, updateIndex = false } = options;

    // Filter sources if specified
    const activeSources = sources
      ? this.sources.filter((s) => sources.includes(s.name))
      : this.sources.filter((s) => s.enabled);

    if (activeSources.length === 0) {
      throw new Error('No active research sources configured');
    }

    // Load existing index
    let indexData = await this.loadIndex();

    // Update index if requested or if empty
    if (updateIndex || indexData.length === 0) {
      indexData = await this.updateIndex(activeSources);
    }

    // Search index
    const results = this.searchIndex(indexData, query);

    // Apply limit
    return results.slice(0, limit);
  }

  /**
   * Load skills index from disk
   */
  private async loadIndex(): Promise<SkillResearchResult[]> {
    try {
      const data = await fs.readFile(this.indexPath, 'utf-8');
      const parsed = JSON.parse(data);
      return z.array(SkillResearchResultSchema).parse(parsed.skills || []);
    } catch (error) {
      // Return empty array if file doesn't exist or is invalid
      return [];
    }
  }

  /**
   * Save skills index to disk
   */
  private async saveIndex(skills: SkillResearchResult[]): Promise<void> {
    const indexDir = path.dirname(this.indexPath);
    await fs.mkdir(indexDir, { recursive: true });

    const data = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      skills,
    };

    await fs.writeFile(this.indexPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Update skills index from sources
   */
  private async updateIndex(
    sources: ResearchSource[]
  ): Promise<SkillResearchResult[]> {
    const allSkills: SkillResearchResult[] = [];

    for (const source of sources) {
      try {
        const skills = await this.fetchFromSource(source);
        allSkills.push(...skills);
      } catch (error) {
        console.warn(
          `Warning: Failed to fetch from ${source.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Save updated index
    await this.saveIndex(allSkills);

    return allSkills;
  }

  /**
   * Fetch skills from a research source
   * TODO: Implement actual API calls to GitHub, registries, etc.
   */
  private async fetchFromSource(
    source: ResearchSource
  ): Promise<SkillResearchResult[]> {
    // Mock implementation - returns sample data
    // In production, this would make API calls to GitHub, fetch README files, etc.

    const mockSkills: SkillResearchResult[] = [
      {
        name: 'drupal-development',
        description:
          'Expert Drupal module development with best practices and PHPCS compliance',
        triggers: [
          'drupal',
          'module',
          'php',
          'cms',
          'content management',
          'drupal development',
        ],
        sourceUrl: `${source.url}/skills/drupal-development`,
        installCommand:
          'ossa skills export @claude-skills/drupal-development --install',
        author: 'Anthropic Community',
        tags: ['drupal', 'php', 'web', 'cms'],
        rating: 4.5,
        lastUpdated: '2026-02-01',
      },
      {
        name: 'typescript-refactoring',
        description:
          'Refactor TypeScript code with type safety and best practices',
        triggers: [
          'typescript',
          'refactor',
          'types',
          'javascript',
          'code quality',
        ],
        sourceUrl: `${source.url}/skills/typescript-refactoring`,
        installCommand:
          'ossa skills export @claude-skills/typescript-refactoring --install',
        author: 'Anthropic Community',
        tags: ['typescript', 'refactoring', 'code-quality'],
        rating: 4.8,
        lastUpdated: '2026-01-28',
      },
      {
        name: 'api-design',
        description: 'Design RESTful APIs with OpenAPI 3.1 specifications',
        triggers: ['api', 'openapi', 'rest', 'swagger', 'api design'],
        sourceUrl: `${source.url}/skills/api-design`,
        installCommand:
          'ossa skills export @claude-skills/api-design --install',
        author: 'Anthropic Community',
        tags: ['api', 'openapi', 'design'],
        rating: 4.6,
        lastUpdated: '2026-02-05',
      },
    ];

    // Filter by source type
    return mockSkills;
  }

  /**
   * Search index for skills matching query
   */
  private searchIndex(
    skills: SkillResearchResult[],
    query: string
  ): SkillResearchResult[] {
    const lowerQuery = query.toLowerCase();

    return skills
      .filter((skill) => {
        // Search in name, description, and triggers
        const searchText = [
          skill.name,
          skill.description,
          ...(skill.triggers || []),
          ...(skill.tags || []),
        ]
          .join(' ')
          .toLowerCase();

        return searchText.includes(lowerQuery);
      })
      .sort((a, b) => {
        // Sort by rating (if available), then alphabetically
        if (a.rating && b.rating) {
          return b.rating - a.rating;
        }
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Get configured research sources
   */
  getSources(): ResearchSource[] {
    return [...this.sources];
  }

  /**
   * Add a custom research source
   */
  addSource(source: ResearchSource): void {
    this.sources.push(source);
  }

  /**
   * Get index path
   */
  getIndexPath(): string {
    return this.indexPath;
  }
}
