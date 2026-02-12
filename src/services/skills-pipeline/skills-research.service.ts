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
   *
   * For GitHub-based sources, fetches the repository README and parses skill entries.
   * For registry sources, calls the registry API.
   */
  private async fetchFromSource(
    source: ResearchSource
  ): Promise<SkillResearchResult[]> {
    switch (source.type) {
      case 'github':
      case 'awesome-list':
      case 'showcase':
        return this.fetchFromGitHub(source);
      case 'registry':
        return this.fetchFromRegistry(source);
      default:
        console.warn(`Unknown source type: ${source.type}`);
        return [];
    }
  }

  /**
   * Fetch skills from a GitHub repository (awesome-list or showcase format)
   */
  private async fetchFromGitHub(
    source: ResearchSource
  ): Promise<SkillResearchResult[]> {
    const skills: SkillResearchResult[] = [];

    try {
      // Convert GitHub URL to raw README URL
      const urlParts = source.url.replace('https://github.com/', '').split('/');
      if (urlParts.length < 2) return skills;

      const [owner, repo] = urlParts;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;

      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ossa-skills-research',
      };

      // Use GITHUB_TOKEN if available to avoid rate limits
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      const response = await fetch(apiUrl, {
        headers,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(
          `GitHub API returned ${response.status} for ${source.name}`
        );
        return skills;
      }

      const data = (await response.json()) as { content?: string };
      if (!data.content) return skills;

      const readme = Buffer.from(data.content, 'base64').toString('utf-8');

      // Parse markdown list items that look like skill/tool entries
      // Pattern: - [Name](url) - Description
      const linkPattern =
        /^[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*[-:]?\s*(.+)$/gm;
      let match;

      while ((match = linkPattern.exec(readme)) !== null) {
        const [, name, url, description] = match;
        const skillName = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Extract tags from description keywords
        const descLower = description.toLowerCase();
        const tags: string[] = [];
        const tagKeywords = [
          'typescript',
          'python',
          'rust',
          'go',
          'api',
          'cli',
          'web',
          'agent',
          'mcp',
          'llm',
          'ai',
          'drupal',
          'react',
        ];
        for (const keyword of tagKeywords) {
          if (descLower.includes(keyword)) tags.push(keyword);
        }

        skills.push({
          name: skillName,
          description: description.trim(),
          triggers: [skillName, ...tags],
          sourceUrl: url.startsWith('http') ? url : `${source.url}/${url}`,
          author: `${owner}/${repo}`,
          tags,
          lastUpdated: new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.warn(
        `Failed to fetch from GitHub source ${source.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return skills;
  }

  /**
   * Fetch skills from a registry API endpoint
   */
  private async fetchFromRegistry(
    source: ResearchSource
  ): Promise<SkillResearchResult[]> {
    try {
      const response = await fetch(`${source.url}/api/skills`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ossa-skills-research',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(
          `Registry API returned ${response.status} for ${source.name}`
        );
        return [];
      }

      const data = (await response.json()) as { skills?: unknown[] };
      const rawSkills = data.skills || data;

      if (!Array.isArray(rawSkills)) return [];

      // Validate each skill against the schema
      return rawSkills
        .map((skill: unknown) => {
          const result = SkillResearchResultSchema.safeParse(skill);
          return result.success ? result.data : null;
        })
        .filter((s): s is SkillResearchResult => s !== null);
    } catch (error) {
      console.warn(
        `Failed to fetch from registry ${source.name}: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
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
