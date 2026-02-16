/**
 * Skills Research Service
 * Research and index skills from various sources (awesome-claude-code, claude-code-showcase, npm registry)
 */

import { injectable } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import axios from 'axios';

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
    name: 'npm-registry',
    type: 'registry',
    url: 'https://registry.npmjs.org',
    enabled: true,
  },
];

/**
 * Common English stop words to exclude from trigger extraction
 */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
  'can', 'her', 'was', 'one', 'our', 'out', 'has', 'have',
  'with', 'this', 'that', 'from', 'they', 'been', 'said',
  'each', 'which', 'their', 'will', 'other', 'about', 'many',
  'then', 'them', 'these', 'some', 'would', 'make', 'like',
  'into', 'could', 'time', 'very', 'when', 'come', 'made',
  'use', 'using', 'used',
]);

@injectable()
export class SkillsResearchService {
  private readonly indexPath: string;
  private sources: ResearchSource[] = DEFAULT_SOURCES;
  private octokit: Octokit;

  constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    this.indexPath = path.join(homeDir, '.ossa', 'skills-index.json');

    // Use GITHUB_TOKEN if available (higher rate limits), otherwise unauthenticated
    const token = process.env.GITHUB_TOKEN;
    this.octokit = new Octokit(token ? { auth: token } : {});
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
    } catch {
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

    // Deduplicate by name
    const seen = new Set<string>();
    const deduped = allSkills.filter((skill) => {
      if (seen.has(skill.name)) return false;
      seen.add(skill.name);
      return true;
    });

    // Save updated index
    await this.saveIndex(deduped);

    return deduped;
  }

  /**
   * Fetch skills from a research source — dispatches by source type
   */
  private async fetchFromSource(
    source: ResearchSource
  ): Promise<SkillResearchResult[]> {
    switch (source.type) {
      case 'awesome-list':
        return this.fetchFromAwesomeList(source);
      case 'showcase':
        return this.fetchFromShowcase(source);
      case 'registry':
        return this.fetchFromNpmRegistry(source);
      case 'github':
        return this.fetchFromGitHubRepo(source);
      default:
        console.warn(`Unknown source type: ${source.type}`);
        return [];
    }
  }

  /**
   * Fetch skills from an awesome-list repo (e.g., awesome-claude-code)
   * Parses the README.md for markdown links to skill repos/tools
   */
  private async fetchFromAwesomeList(
    source: ResearchSource
  ): Promise<SkillResearchResult[]> {
    const { owner, repo } = this.parseGitHubUrl(source.url);
    const skills: SkillResearchResult[] = [];

    const response = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'README.md',
    });

    if (!('content' in response.data)) return skills;

    const content = Buffer.from(response.data.content, 'base64').toString(
      'utf-8'
    );

    // Parse markdown links: - [Name](url) - Description
    const linkPattern =
      /^[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*[-–—:]*\s*(.*?)$/gm;
    let match: RegExpExecArray | null;

    while ((match = linkPattern.exec(content)) !== null) {
      const [, name, url, description] = match;
      if (!name || !url) continue;

      // Skip non-project links (anchors, images, badges)
      if (url.startsWith('#') || url.endsWith('.png') || url.endsWith('.svg'))
        continue;

      const cleanName = name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      skills.push({
        name: cleanName || name,
        description: description?.trim() || name,
        triggers: this.extractTriggersFromText(`${name} ${description}`),
        sourceUrl: url.startsWith('http')
          ? url
          : `https://github.com/${url.replace(/^\//, '')}`,
        author: owner,
        tags: ['awesome-list', 'claude-code'],
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }

    return skills;
  }

  /**
   * Fetch skills from a showcase repo (e.g., claude-code-showcase)
   * Lists top-level directories and reads their README for metadata
   */
  private async fetchFromShowcase(
    source: ResearchSource
  ): Promise<SkillResearchResult[]> {
    const { owner, repo } = this.parseGitHubUrl(source.url);
    const skills: SkillResearchResult[] = [];

    // Get the repo tree to find directories
    const treeResponse = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
    });

    const dirs = treeResponse.data.tree.filter(
      (entry) =>
        entry.type === 'tree' &&
        entry.path &&
        !entry.path.startsWith('.') &&
        !['node_modules', 'dist', '__pycache__'].includes(entry.path)
    );

    // Read README from each directory (up to 30 to respect rate limits)
    for (const dir of dirs.slice(0, 30)) {
      if (!dir.path) continue;

      try {
        const readmeResponse = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: `${dir.path}/README.md`,
        });

        let description = dir.path;
        if ('content' in readmeResponse.data) {
          const readmeContent = Buffer.from(
            readmeResponse.data.content,
            'base64'
          ).toString('utf-8');
          // Extract first non-heading, non-empty line as description
          const lines = readmeContent.split('\n');
          const descLine = lines.find(
            (l) => l.trim() && !l.startsWith('#') && !l.startsWith('!')
          );
          if (descLine) description = descLine.trim();
        }

        skills.push({
          name: dir.path,
          description,
          triggers: this.extractTriggersFromText(
            `${dir.path} ${description}`
          ),
          sourceUrl: `https://github.com/${owner}/${repo}/tree/main/${dir.path}`,
          author: owner,
          tags: ['showcase', 'claude-code'],
          lastUpdated: new Date().toISOString().split('T')[0],
        });
      } catch {
        // No README — still list the directory
        skills.push({
          name: dir.path,
          description: `Claude Code showcase: ${dir.path}`,
          triggers: this.extractTriggersFromText(dir.path),
          sourceUrl: `https://github.com/${owner}/${repo}/tree/main/${dir.path}`,
          author: owner,
          tags: ['showcase', 'claude-code'],
          lastUpdated: new Date().toISOString().split('T')[0],
        });
      }
    }

    return skills;
  }

  /**
   * Fetch skills from npm registry search
   * Searches for packages with keyword "claude-skill" or "ossa-agent"
   */
  private async fetchFromNpmRegistry(
    source: ResearchSource
  ): Promise<SkillResearchResult[]> {
    const skills: SkillResearchResult[] = [];

    const searchTerms = [
      'keywords:claude-skill',
      'keywords:ossa-agent',
      'keywords:claude-code-skill',
    ];

    for (const term of searchTerms) {
      try {
        const response = await axios.get(
          `${source.url}/-/v1/search`,
          {
            params: { text: term, size: 50 },
            timeout: 10000,
          }
        );

        const packages = response.data?.objects || [];

        for (const pkg of packages) {
          const p = pkg.package;
          if (!p?.name) continue;

          skills.push({
            name: p.name,
            description: p.description || p.name,
            triggers: p.keywords || [],
            sourceUrl: p.links?.npm || `https://www.npmjs.com/package/${p.name}`,
            installCommand: `npm install ${p.name}`,
            author: p.author?.name || p.publisher?.username,
            tags: p.keywords || [],
            rating: pkg.score?.final
              ? Math.round(pkg.score.final * 5 * 10) / 10
              : undefined,
            lastUpdated: p.date?.split('T')[0],
          });
        }
      } catch {
        // Individual search term failure is non-fatal
      }
    }

    return skills;
  }

  /**
   * Fetch skills from a generic GitHub repo
   * Lists YAML/MD files that look like agent definitions
   */
  private async fetchFromGitHubRepo(
    source: ResearchSource
  ): Promise<SkillResearchResult[]> {
    const { owner, repo } = this.parseGitHubUrl(source.url);
    const skills: SkillResearchResult[] = [];

    const treeResponse = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: 'true',
    });

    const agentFiles = treeResponse.data.tree.filter(
      (entry) =>
        entry.type === 'blob' &&
        entry.path &&
        (entry.path.endsWith('.ossa.yaml') ||
          entry.path.endsWith('.ossa.yml') ||
          entry.path === 'SKILL.md' ||
          entry.path.endsWith('/SKILL.md'))
    );

    for (const file of agentFiles.slice(0, 30)) {
      if (!file.path) continue;

      skills.push({
        name: path.basename(file.path, path.extname(file.path)),
        description: `Agent definition from ${owner}/${repo}`,
        triggers: this.extractTriggersFromText(file.path),
        sourceUrl: `https://github.com/${owner}/${repo}/blob/main/${file.path}`,
        author: owner,
        tags: ['github', 'ossa'],
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }

    return skills;
  }

  /**
   * Extract trigger keywords from text
   */
  private extractTriggersFromText(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    return [...new Set(words)].slice(0, 10);
  }

  /**
   * Parse GitHub URL into owner/repo
   */
  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(
      /github\.com\/([^/]+)\/([^/]+)/
    );
    if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
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
