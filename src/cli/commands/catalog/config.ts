/**
 * Catalog Configuration
 *
 * Centralized config for OSSA → GitLab Duo catalog operations.
 * Reads from environment variables with sensible defaults.
 */

import * as path from 'path';
import * as fs from 'fs';

export interface AgentInfo {
  id: string;
  manifestPath: string;
  duoOutputPath: string;
  exists: boolean;
}

export class CatalogConfig {
  readonly ossaPackagesPath: string;
  readonly duoOutputPath: string;
  readonly gitlabTokenPath: string;
  readonly ossaNamespace: string;
  readonly gitlabApiUrl: string;

  constructor() {
    const home = process.env.HOME || '/tmp';

    this.ossaPackagesPath =
      process.env.OSSA_PACKAGES_PATH || './packages/@ossa';
    this.duoOutputPath =
      process.env.GITLAB_DUO_OUTPUT_PATH || './.gitlab/duo/agents';
    this.gitlabTokenPath =
      process.env.GITLAB_TOKEN_PATH || path.join(home, '.tokens/gitlab');
    this.ossaNamespace = process.env.OSSA_NAMESPACE || 'bluefly';
    this.gitlabApiUrl =
      process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4';
  }

  /**
   * Get GitLab token from file or environment
   */
  getGitLabToken(): string {
    // Try environment first
    if (process.env.GITLAB_TOKEN) {
      return process.env.GITLAB_TOKEN;
    }

    // Fall back to token file
    if (fs.existsSync(this.gitlabTokenPath)) {
      const content = fs.readFileSync(this.gitlabTokenPath, 'utf-8').trim();
      // Handle potential file corruption
      if (content.startsWith('glpat-') || content.startsWith('glptt-')) {
        return content;
      }
    }

    throw new Error(
      `GitLab token not found. Set GITLAB_TOKEN env var or create ${this.gitlabTokenPath}`
    );
  }

  /**
   * Get manifest path for an agent
   */
  getManifestPath(agentId: string): string {
    return path.join(this.ossaPackagesPath, agentId, 'agent.ossa.yaml');
  }

  /**
   * Get Duo output path for an agent
   */
  getDuoOutputPath(agentId: string): string {
    return path.join(this.duoOutputPath, `${agentId}.yaml`);
  }

  /**
   * List all agent IDs in the packages directory
   */
  listAgentIds(): string[] {
    if (!fs.existsSync(this.ossaPackagesPath)) {
      return [];
    }

    return fs
      .readdirSync(this.ossaPackagesPath)
      .filter((name) => {
        const stat = fs.statSync(path.join(this.ossaPackagesPath, name));
        return stat.isDirectory() && !name.startsWith('.');
      })
      .sort();
  }

  /**
   * Get detailed info for all agents
   */
  getAgentInfos(): AgentInfo[] {
    return this.listAgentIds().map((id) => ({
      id,
      manifestPath: this.getManifestPath(id),
      duoOutputPath: this.getDuoOutputPath(id),
      exists: fs.existsSync(this.getManifestPath(id)),
    }));
  }

  /**
   * Validate agent ID exists
   */
  validateAgentId(agentId: string): boolean {
    const manifestPath = this.getManifestPath(agentId);
    return fs.existsSync(manifestPath);
  }

  /**
   * Get agent IDs based on options (single or all)
   */
  resolveAgentIds(agent?: string, all?: boolean): string[] {
    if (all) {
      return this.listAgentIds();
    }
    if (agent) {
      return [agent];
    }
    return [];
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir(): void {
    if (!fs.existsSync(this.duoOutputPath)) {
      fs.mkdirSync(this.duoOutputPath, { recursive: true });
    }
  }
}

// Export singleton for convenience
export const catalogConfig = new CatalogConfig();
