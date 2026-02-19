/**
 * OSSA Constants - Single Source of Truth
 *
 * Centralized constants for directory names, file names, and common paths.
 * DRY: Prevents duplication across the codebase.
 */

/**
 * Default agents directory name
 */
export const AGENTS_DIR = '.agents';

/**
 * Default workspace directory name
 */
export const WORKSPACE_DIR = '.agents-workspace';

/**
 * Default manifest filename
 */
export const MANIFEST_NAME = 'agent.ossa.yaml';

/**
 * Default registry filename
 */
export const REGISTRY_NAME = 'registry.yaml';

/**
 * GitLab agents directory (legacy)
 */
export const GITLAB_AGENTS_DIR = '.gitlab/agents';

/**
 * GitLab manifest filename (legacy)
 */
export const GITLAB_MANIFEST_NAME = 'manifest.ossa.yaml';
