/**
 * Skill Aggregator Service
 * Aggregates skills from 4 sources (local, built-in, GitHub, registry)
 * into a unified catalog for the daemon API.
 * In-memory TTL cache (5 min). Graceful per-source failure handling.
 *
 * @experimental This feature is experimental and may change without notice.
 */

import fg from 'fast-glob';
import { injectable } from 'inversify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { safeParseYAML } from '../../utils/yaml-parser.js';

export interface AggregatedSkill {
  name: string;
  source: 'local' | 'builtin' | 'github' | 'registry';
  description: string;
  version?: string;
  capabilities?: string[];
  tags?: string[];
  manifest?: unknown;
}

interface CacheEntry {
  skills: AggregatedSkill[];
  loadedAt: number;
}

interface SourceStatus {
  name: string;
  status: 'loaded' | 'error' | 'pending';
  count: number;
  lastLoaded?: string;
  error?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const BUILTIN_SKILLS: AggregatedSkill[] = [
  { name: 'web-search', source: 'builtin', description: 'Search the web for information', tags: ['search', 'web'] },
  { name: 'code-review', source: 'builtin', description: 'Review code for quality, security, and best practices', tags: ['code', 'review', 'quality'] },
  { name: 'text-summary', source: 'builtin', description: 'Summarize text content into concise form', tags: ['text', 'summary', 'nlp'] },
  { name: 'data-analysis', source: 'builtin', description: 'Analyze structured and unstructured data', tags: ['data', 'analysis', 'statistics'] },
  { name: 'image-generation', source: 'builtin', description: 'Generate images from text descriptions', tags: ['image', 'generation', 'creative'] },
  { name: 'translation', source: 'builtin', description: 'Translate text between languages', tags: ['translation', 'language', 'nlp'] },
  { name: 'file-management', source: 'builtin', description: 'Read, write, and manage files in the workspace', tags: ['file', 'io', 'workspace'] },
  { name: 'api-integration', source: 'builtin', description: 'Integrate with external REST and GraphQL APIs', tags: ['api', 'integration', 'http'] },
  { name: 'database-query', source: 'builtin', description: 'Query and manage database connections', tags: ['database', 'sql', 'query'] },
  { name: 'monitoring', source: 'builtin', description: 'Monitor system health, metrics, and alerts', tags: ['monitoring', 'observability', 'health'] },
  { name: 'testing', source: 'builtin', description: 'Run and manage test suites', tags: ['testing', 'quality', 'ci'] },
  { name: 'documentation', source: 'builtin', description: 'Generate and maintain documentation', tags: ['docs', 'documentation', 'writing'] },
];

@injectable()
export class SkillAggregatorService {
  private cache = new Map<string, CacheEntry>();
  private sourceStatuses = new Map<string, SourceStatus>();
  private workspacePath: string = process.cwd();

  constructor() {
    for (const name of ['local', 'builtin', 'github', 'registry']) {
      this.sourceStatuses.set(name, { name, status: 'pending', count: 0 });
    }
  }

  /**
   * Set the workspace root for local skill scanning.
   */
  setWorkspacePath(dir: string): void {
    this.workspacePath = path.resolve(dir);
  }

  /**
   * Load skills from all 4 sources. Uses cache if fresh.
   */
  async loadAll(): Promise<AggregatedSkill[]> {
    const sources = ['local', 'builtin', 'github', 'registry'] as const;
    const results = await Promise.all(sources.map((s) => this.loadSource(s)));
    return results.flat();
  }

  /**
   * Load skills from a single source. Uses cache if fresh.
   */
  async loadSource(source: string): Promise<AggregatedSkill[]> {
    const cached = this.cache.get(source);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      return cached.skills;
    }

    let skills: AggregatedSkill[] = [];
    try {
      switch (source) {
        case 'local':
          skills = await this.loadLocal();
          break;
        case 'builtin':
          skills = this.loadBuiltin();
          break;
        case 'github':
          skills = await this.loadGitHub();
          break;
        case 'registry':
          skills = await this.loadRegistry();
          break;
        default:
          return [];
      }

      const now = Date.now();
      this.cache.set(source, { skills, loadedAt: now });
      this.sourceStatuses.set(source, {
        name: source,
        status: 'loaded',
        count: skills.length,
        lastLoaded: new Date(now).toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[skill-aggregator] ${source} failed: ${msg}\n`);
      this.sourceStatuses.set(source, {
        name: source,
        status: 'error',
        count: 0,
        error: msg,
      });
      // Return stale cache if available
      if (cached) return cached.skills;
    }

    return skills;
  }

  /**
   * Search skills by query string (matches name, description, tags).
   */
  async search(query: string): Promise<AggregatedSkill[]> {
    const all = await this.loadAll();
    const q = query.toLowerCase();
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q)) ||
        s.capabilities?.some((c) => c.toLowerCase().includes(q))
    );
  }

  /**
   * Get skills filtered by source.
   */
  async getBySource(source: string): Promise<AggregatedSkill[]> {
    return this.loadSource(source);
  }

  /**
   * Force refresh one or all sources (clears cache).
   */
  async refresh(source?: string): Promise<void> {
    if (source) {
      this.cache.delete(source);
      await this.loadSource(source);
    } else {
      this.cache.clear();
      await this.loadAll();
    }
  }

  /**
   * Get status of all sources.
   */
  getSourceStatus(): Array<{ name: string; status: string; count: number; lastLoaded?: string }> {
    return Array.from(this.sourceStatuses.values()).map(({ name, status, count, lastLoaded }) => ({
      name,
      status,
      count,
      lastLoaded,
    }));
  }

  // --- Private loaders ---

  private async loadLocal(): Promise<AggregatedSkill[]> {
    const patterns = ['**/*.skill.yaml', '**/*.skill.yml', '**/SKILL.md'];
    const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/coverage/**'];

    const files = await fg(patterns, {
      cwd: this.workspacePath,
      ignore: ignorePatterns,
      absolute: true,
    });

    const skills: AggregatedSkill[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');

        if (file.endsWith('.md')) {
          // SKILL.md — extract name from first heading, rest is description
          const lines = content.split('\n');
          const heading = lines.find((l) => l.startsWith('#'));
          const name = heading ? heading.replace(/^#+\s*/, '').trim() : path.basename(path.dirname(file));
          const description = lines
            .filter((l) => !l.startsWith('#') && l.trim())
            .slice(0, 3)
            .join(' ')
            .trim();
          skills.push({ name, source: 'local', description: description || 'Local skill', manifest: content });
        } else {
          // YAML skill file
          const parsed = safeParseYAML<Record<string, unknown>>(content);
          const meta = parsed?.metadata as Record<string, unknown> | undefined;
          skills.push({
            name: (meta?.name as string) || path.basename(file, path.extname(file)).replace('.skill', ''),
            source: 'local',
            description: (meta?.description as string) || (parsed?.description as string) || 'Local skill',
            version: (meta?.version as string) || undefined,
            capabilities: Array.isArray(parsed?.capabilities) ? (parsed.capabilities as string[]) : undefined,
            tags: Array.isArray(parsed?.tags) ? (parsed.tags as string[]) : undefined,
            manifest: parsed,
          });
        }
      } catch {
        // Skip unparseable files
      }
    }

    return skills;
  }

  private loadBuiltin(): AggregatedSkill[] {
    return [...BUILTIN_SKILLS];
  }

  private async loadGitHub(): Promise<AggregatedSkill[]> {
    const url = 'https://api.github.com/repos/anthropics/skills/contents/';
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'ossa-daemon' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error(`GitHub rate limited (${response.status})`);
      }
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const items = (await response.json()) as Array<{ name: string; type: string; download_url?: string }>;
    const skills: AggregatedSkill[] = [];

    for (const item of items) {
      if (item.type === 'dir') {
        skills.push({
          name: item.name,
          source: 'github',
          description: `GitHub skill: ${item.name}`,
          tags: ['github', 'community'],
        });
      }
    }

    return skills;
  }

  private async loadRegistry(): Promise<AggregatedSkill[]> {
    const url = 'https://openstandardagents.org/api/skills';
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'ossa-daemon' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Registry returned ${response.status}`);
    }

    const data = (await response.json()) as Array<Record<string, unknown>>;
    return data.map((item) => ({
      name: (item.name as string) || 'unknown',
      source: 'registry' as const,
      description: (item.description as string) || 'Registry skill',
      version: (item.version as string) || undefined,
      capabilities: Array.isArray(item.capabilities) ? (item.capabilities as string[]) : undefined,
      tags: Array.isArray(item.tags) ? (item.tags as string[]) : undefined,
    }));
  }
}
