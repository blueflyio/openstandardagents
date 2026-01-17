/**
 * GitLab Configuration Utility
 *
 * Centralized GitLab API configuration management for CLI extensions.
 * Follows Single Responsibility Principle - only handles GitLab config.
 *
 * This module is used by:
 * - GitLab release commands (tag, milestone)
 * - GitLab Agent commands
 * - Sync commands
 * - Catalog commands
 */

import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

/**
 * GitLab configuration schema
 */
export const GitLabConfigSchema = z.object({
  token: z.string().min(1, 'GitLab token is required'),
  projectId: z.union([z.string(), z.number()]).optional(),
  apiUrl: z.string().url().optional().default('https://gitlab.com/api/v4'),
});

export type GitLabConfig = z.infer<typeof GitLabConfigSchema>;

/**
 * GitLab project reference schema
 */
export const GitLabProjectRefSchema = z.object({
  projectId: z.union([z.string(), z.number()]),
  ref: z.string().optional().default('main'),
});

export type GitLabProjectRef = z.infer<typeof GitLabProjectRefSchema>;

// ============================================================================
// Configuration Loading
// ============================================================================

/**
 * Token sources in priority order
 */
const TOKEN_SOURCES = [
  'SERVICE_ACCOUNT_OSSA_TOKEN',
  'SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN',
  'GITLAB_TOKEN',
  'CI_JOB_TOKEN',
] as const;

/**
 * Get GitLab token from environment
 * Checks multiple environment variables in priority order
 */
export function getGitLabToken(): string | undefined {
  for (const source of TOKEN_SOURCES) {
    const token = process.env[source];
    if (token) return token;
  }
  return undefined;
}

/**
 * Get GitLab project ID from environment
 */
export function getGitLabProjectId(): string | number | undefined {
  return process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID;
}

/**
 * Get GitLab API URL from environment
 */
export function getGitLabApiUrl(): string {
  return (
    process.env.CI_API_V4_URL ||
    process.env.GITLAB_API_URL ||
    'https://gitlab.com/api/v4'
  );
}

/**
 * Load GitLab configuration from environment
 * Throws if required values are missing
 */
export function loadGitLabConfig(): GitLabConfig {
  const token = getGitLabToken();

  if (!token) {
    throw new GitLabConfigError(
      'GitLab token required. Set one of: ' + TOKEN_SOURCES.join(', ')
    );
  }

  return GitLabConfigSchema.parse({
    token,
    projectId: getGitLabProjectId(),
    apiUrl: getGitLabApiUrl(),
  });
}

/**
 * Try to load GitLab configuration, returns undefined if not available
 */
export function tryLoadGitLabConfig(): GitLabConfig | undefined {
  try {
    return loadGitLabConfig();
  } catch {
    return undefined;
  }
}

/**
 * Check if GitLab is configured in the current environment
 */
export function isGitLabConfigured(): boolean {
  return !!getGitLabToken();
}

/**
 * Check if running in GitLab CI environment
 */
export function isInGitLabCI(): boolean {
  return !!process.env.GITLAB_CI || !!process.env.CI_JOB_TOKEN;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * GitLab configuration error
 */
export class GitLabConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitLabConfigError';
  }
}

/**
 * GitLab API error
 */
export class GitLabAPIError extends Error {
  public readonly statusCode?: number;
  public readonly response?: unknown;

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message);
    this.name = 'GitLabAPIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Build GitLab API URL for a resource
 */
export function buildGitLabUrl(
  config: GitLabConfig,
  path: string,
  params?: Record<string, string | number | boolean>
): string {
  const baseUrl = config.apiUrl || 'https://gitlab.com/api/v4';
  const url = new URL(path, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Get authorization headers for GitLab API
 */
export function getGitLabHeaders(config: GitLabConfig): Record<string, string> {
  return {
    'PRIVATE-TOKEN': config.token,
    'Content-Type': 'application/json',
  };
}

/**
 * URL-encode a project path for GitLab API
 */
export function encodeProjectPath(projectPath: string): string {
  return encodeURIComponent(projectPath);
}

/**
 * Parse a GitLab project URL into project ID/path
 */
export function parseGitLabUrl(
  url: string
): { projectPath: string; host: string } | undefined {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, '').replace(/\.git$/, '');
    return {
      projectPath: path,
      host: parsed.host,
    };
  } catch {
    return undefined;
  }
}
