/**
 * HTTP Client - Single Responsibility for API Calls
 *
 * DRY: All HTTP logic in one place
 * SOLID: Single responsibility - only handles HTTP
 * Error handling: Consistent error types across all fetches
 */

import { z } from 'zod';
import { DATA_SOURCES } from './sources';

// =============================================================================
// ERROR TYPES
// =============================================================================

export class DataFetchError extends Error {
  constructor(
    message: string,
    public readonly source: 'gitlab' | 'npm' | 'github',
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DataFetchError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError: z.ZodError
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// =============================================================================
// RESULT TYPE (Functional Error Handling)
// =============================================================================

export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

interface FetchOptions {
  headers?: Record<string, string>;
  revalidate?: number; // Next.js cache revalidation in seconds
}

/**
 * GitLab API Client
 * Handles authentication and error handling for GitLab API
 */
export class GitLabClient {
  private readonly baseUrl: string;
  private readonly projectId: string;
  private readonly defaultRef: string;

  constructor() {
    const { openstandardagents } = DATA_SOURCES;
    this.baseUrl = openstandardagents.apiBase;
    this.projectId = openstandardagents.gitlabProjectId;
    this.defaultRef = openstandardagents.defaultRef;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const token = process.env.WEB_TOKEN || process.env.GITLAB_TOKEN;
    if (token) {
      headers['PRIVATE-TOKEN'] = token;
    }
    return headers;
  }

  /**
   * Fetch JSON from GitLab API with validation
   */
  async fetchJson<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
    options: FetchOptions = {}
  ): Promise<Result<T, DataFetchError | ValidationError>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: { ...this.getAuthHeaders(), ...options.headers },
        next: { revalidate: options.revalidate ?? 3600 },
      });

      if (!response.ok) {
        return err(
          new DataFetchError(
            `GitLab API error: ${response.status} ${response.statusText}`,
            'gitlab',
            response.status
          )
        );
      }

      const data = await response.json();
      const parsed = schema.safeParse(data);

      if (!parsed.success) {
        return err(new ValidationError('GitLab response validation failed', parsed.error));
      }

      return ok(parsed.data);
    } catch (error) {
      return err(
        new DataFetchError(
          `Failed to fetch from GitLab: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'gitlab',
          undefined,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Fetch raw file content from GitLab
   */
  async fetchFile(filePath: string): Promise<Result<string, DataFetchError>> {
    const encodedPath = encodeURIComponent(filePath);
    const url = `${this.baseUrl}/projects/${this.projectId}/repository/files/${encodedPath}/raw?ref=${this.defaultRef}`;

    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        next: { revalidate: 3600 },
      });

      if (response.status === 404) {
        return err(new DataFetchError(`File not found: ${filePath}`, 'gitlab', 404));
      }

      if (!response.ok) {
        return err(
          new DataFetchError(
            `Failed to fetch file: ${response.status}`,
            'gitlab',
            response.status
          )
        );
      }

      const content = await response.text();
      return ok(content);
    } catch (error) {
      return err(
        new DataFetchError(
          `Failed to fetch file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'gitlab',
          undefined,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Fetch repository tree (directory listing)
   */
  async fetchTree(path: string): Promise<Result<Array<{ type: string; name: string; path: string }>, DataFetchError>> {
    const url = `/projects/${this.projectId}/repository/tree?path=${encodeURIComponent(path)}&ref=${this.defaultRef}&per_page=100`;

    const result = await this.fetchJson(
      url,
      z.array(z.object({ type: z.string(), name: z.string(), path: z.string() }))
    );

    if (!result.ok) {
      return err(result.error instanceof DataFetchError ? result.error : new DataFetchError(result.error.message, 'gitlab'));
    }

    return ok(result.data);
  }

  /**
   * Fetch all tags from repository
   */
  async fetchTags(): Promise<Result<string[], DataFetchError>> {
    const url = `/projects/${this.projectId}/repository/tags?per_page=100`;

    const result = await this.fetchJson(
      url,
      z.array(z.object({ name: z.string() }))
    );

    if (!result.ok) {
      return err(result.error instanceof DataFetchError ? result.error : new DataFetchError(result.error.message, 'gitlab'));
    }

    return ok(result.data.map((t) => t.name));
  }
}

/**
 * npm Registry Client
 */
export class NpmClient {
  private readonly registryUrl: string;

  constructor() {
    this.registryUrl = DATA_SOURCES.npm.registryUrl;
  }

  /**
   * Fetch package info from npm registry
   */
  async fetchPackage(): Promise<Result<{ versions: string[]; distTags: Record<string, string> }, DataFetchError>> {
    try {
      const response = await fetch(this.registryUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        return err(new DataFetchError(`npm API error: ${response.status}`, 'npm', response.status));
      }

      const data = await response.json();
      return ok({
        versions: Object.keys(data.versions || {}),
        distTags: data['dist-tags'] || {},
      });
    } catch (error) {
      return err(
        new DataFetchError(
          `Failed to fetch from npm: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'npm',
          undefined,
          error instanceof Error ? error : undefined
        )
      );
    }
  }
}

// =============================================================================
// SINGLETON INSTANCES (Dependency Injection ready)
// =============================================================================

let gitlabClient: GitLabClient | null = null;
let npmClient: NpmClient | null = null;

export function getGitLabClient(): GitLabClient {
  if (!gitlabClient) {
    gitlabClient = new GitLabClient();
  }
  return gitlabClient;
}

export function getNpmClient(): NpmClient {
  if (!npmClient) {
    npmClient = new NpmClient();
  }
  return npmClient;
}
