/**
 * Git Service
 * 
 * SOLID: Single Responsibility - Git operations only
 * DRY: Centralizes all git command execution
 * 
 * Abstraction for git operations to eliminate duplication across services.
 */

import { execSync } from 'child_process';

export interface GitTag {
  name: string;
  version: string; // Without 'v' prefix
  isStable: boolean;
  isRC: boolean;
  isDev: boolean;
}

export interface GitRepositoryState {
  remoteUrl: string;
  currentBranch: string;
  isClean: boolean;
  hasUncommittedChanges: boolean;
}

export class GitService {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Fetch all tags from remote
   */
  async fetchTags(): Promise<void> {
    try {
      execSync('git fetch --tags --prune origin', {
        cwd: this.rootDir,
        stdio: 'ignore',
      });
    } catch {
      // Continue if fetch fails (not a git repo, no remote, etc.)
    }
  }

  /**
   * Get all version tags (vX.Y.Z format)
   */
  async getAllVersionTags(): Promise<GitTag[]> {
    try {
      const tags = execSync('git tag -l "v*"', {
        cwd: this.rootDir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(tag => tag.trim());

      return tags
        .map(tag => {
          const version = tag.replace(/^v/, '');
          return {
            name: tag,
            version,
            isStable: /^\d+\.\d+\.\d+$/.test(version) && !version.includes('-'),
            isRC: version.includes('-rc'),
            isDev: version.includes('-dev'),
          };
        })
        .sort((a, b) => {
          // Sort by version (newest first)
          const aParts = a.version.split(/[.-]/).map(Number);
          const bParts = b.version.split(/[.-]/).map(Number);
          
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aVal = aParts[i] ?? 0;
            const bVal = bParts[i] ?? 0;
            if (aVal > bVal) return -1;
            if (aVal < bVal) return 1;
          }
          return 0;
        });
    } catch {
      return [];
    }
  }

  /**
   * Get latest stable tag
   */
  async getLatestStableTag(): Promise<GitTag | null> {
    const tags = await this.getAllVersionTags();
    return tags.find(tag => tag.isStable) || null;
  }

  /**
   * Get latest tag (any type)
   */
  async getLatestTag(): Promise<GitTag | null> {
    const tags = await this.getAllVersionTags();
    return tags[0] || null;
  }

  /**
   * Get tags matching a pattern (e.g., "v0.3.*")
   */
  async getTagsMatching(pattern: string): Promise<GitTag[]> {
    try {
      const tags = execSync(`git tag -l "${pattern}"`, {
        cwd: this.rootDir,
        encoding: 'utf-8',
      })
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(tag => tag.trim());

      return tags.map(tag => {
        const version = tag.replace(/^v/, '');
        return {
          name: tag,
          version,
          isStable: /^\d+\.\d+\.\d+$/.test(version) && !version.includes('-'),
          isRC: version.includes('-rc'),
          isDev: version.includes('-dev'),
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Get current branch name
   */
  getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.rootDir,
        encoding: 'utf-8',
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get remote URL
   */
  getRemoteUrl(remote: string = 'origin'): string {
    try {
      return execSync(`git remote get-url ${remote}`, {
        cwd: this.rootDir,
        encoding: 'utf-8',
      }).trim();
    } catch {
      return '';
    }
  }

  /**
   * Check if working directory is clean
   */
  isClean(): boolean {
    try {
      const status = execSync('git status --porcelain', {
        cwd: this.rootDir,
        encoding: 'utf-8',
      }).trim();
      return status.length === 0;
    } catch {
      return false;
    }
  }

  /**
   * Get repository state
   */
  async getRepositoryState(): Promise<GitRepositoryState> {
    return {
      remoteUrl: this.getRemoteUrl(),
      currentBranch: this.getCurrentBranch(),
      isClean: this.isClean(),
      hasUncommittedChanges: !this.isClean(),
    };
  }

  /**
   * Create a git tag
   */
  createTag(tag: string, message: string): void {
    // Validate tag format
    if (!/^v\d+\.\d+\.\d+/.test(tag)) {
      throw new Error(`Invalid tag format: ${tag}. Must be vX.Y.Z format.`);
    }

    execSync(`git tag -a ${tag} -m "${message}"`, {
      cwd: this.rootDir,
      stdio: 'inherit',
    });
  }

  /**
   * Check if tag exists
   */
  tagExists(tag: string): boolean {
    try {
      const output = execSync(`git tag -l "${tag}"`, {
        cwd: this.rootDir,
        encoding: 'utf-8',
      }).trim();
      return output.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get all remotes
   */
  getRemotes(): Array<{ name: string; url: string }> {
    try {
      const output = execSync('git remote -v', {
        cwd: this.rootDir,
        encoding: 'utf-8',
      }).trim();

      const remotes: Array<{ name: string; url: string }> = [];
      const seen = new Set<string>();

      for (const line of output.split('\n')) {
        const match = line.match(/^(\S+)\s+(\S+)/);
        if (match) {
          const name = match[1];
          const url = match[2];
          if (!seen.has(name)) {
            remotes.push({ name, url });
            seen.add(name);
          }
        }
      }

      return remotes;
    } catch {
      return [];
    }
  }
}
