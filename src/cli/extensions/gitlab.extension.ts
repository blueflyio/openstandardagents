/**
 * OSSA GitLab Extension
 *
 * Contains GitLab-specific CLI commands that are NOT part of the core OSSA spec.
 * These commands require GitLab API access and are intended for:
 * - GitLab CI/CD integration
 * - GitLab Agent for Kubernetes
 * - GitLab Duo catalog management
 * - GitLab-specific release automation
 *
 * To enable this extension:
 *   export OSSA_EXTENSIONS=true
 *   export OSSA_EXTENSIONS_LIST=gitlab
 */

import { Command } from 'commander';
import type { OSSAExtension } from './index.js';

/**
 * Load GitLab extension commands
 *
 * These are lazy-loaded to avoid import errors when GitLab dependencies
 * are not installed.
 */
export async function loadGitLabExtension(): Promise<OSSAExtension> {
  const commands: Command[] = [];

  // Load GitLab Agent command
  try {
    const { gitlabAgentCommand } =
      await import('../commands/gitlab-agent.command.js');
    commands.push(gitlabAgentCommand);
  } catch {
    // Command not available
  }

  // Load Sync command (GitHub → GitLab mirror)
  try {
    const { syncCommand } = await import('../commands/sync.command.js');
    commands.push(syncCommand);
  } catch {
    // Command not available
  }

  // Load Catalog command (GitLab Duo)
  try {
    const { createCatalogCommand } =
      await import('../commands/catalog/index.js');
    commands.push(createCatalogCommand());
  } catch {
    // Command not available
  }

  // Load GitLab-specific release commands (tag, milestone)
  // Note: version commands stay in core CLI
  try {
    const { gitlabReleaseCommandGroup } =
      await import('./gitlab-release.commands.js');
    commands.push(gitlabReleaseCommandGroup);
  } catch {
    // Command not available
  }

  return {
    name: 'gitlab',
    description: 'GitLab integration (Agent, Duo Catalog, CI/CD)',
    version: '0.3.3',
    commands,
  };
}

export default loadGitLabExtension;
