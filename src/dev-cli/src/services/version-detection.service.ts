/**
 * Version Detection Service
 * 
 * DYNAMIC version detection from git tags - NO static .version.json
 * SOLID: Single Responsibility - Version detection only
 * DRY: Single source of truth (git tags)
 */

import { execSync } from 'child_process';
import semver from 'semver';

export interface VersionInfo {
  current: string;
  latest_stable: string;
  latest_tag: string;
  all_tags: string[];
  spec_version: string;
  spec_path: string;
  schema_file: string;
}

export class VersionDetectionService {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Detect version from git tags (DYNAMIC - no static file)
   * CRUD: Read operation (reads git tags)
   */
  async detectVersion(): Promise<VersionInfo> {
    // Fetch latest tags
    try {
      execSync('git fetch --tags --prune', { 
        cwd: this.rootDir, 
        stdio: 'ignore' 
      });
    } catch {
      // Continue if fetch fails
    }

    // Get all version tags (vX.Y.Z format)
    const allTags = this.getAllVersionTags();
    
    // Get latest stable tag (no -rc, -dev, -beta suffixes)
    const latestStable = this.getLatestStableTag(allTags);
    
    // Get latest tag (including pre-releases)
    const latestTag = allTags[0] || latestStable;
    
    // Current version is latest stable, or next patch if working on new version
    const current = this.determineCurrentVersion(latestStable, latestTag);
    
    // Spec version matches current
    const spec_version = current;
    const spec_path = `spec/v${spec_version}`;
    const schema_file = `ossa-${spec_version}.schema.json`;

    return {
      current,
      latest_stable: latestStable || '0.0.0',
      latest_tag: latestTag || '0.0.0',
      all_tags: allTags,
      spec_version,
      spec_path,
      schema_file,
    };
  }

  /**
   * Get all version tags sorted by version (newest first)
   */
  private getAllVersionTags(): string[] {
    try {
      const tags = execSync('git tag --sort=-v:refname', {
        cwd: this.rootDir,
        encoding: 'utf-8',
      })
        .trim()
        .split('\n')
        .filter(tag => tag.startsWith('v') && semver.valid(tag.substring(1)))
        .map(tag => tag.substring(1)); // Remove 'v' prefix

      return tags;
    } catch {
      return [];
    }
  }

  /**
   * Get latest stable tag (no pre-release suffixes)
   */
  private getLatestStableTag(tags: string[]): string {
    const stableTags = tags.filter(tag => semver.prerelease(tag) === null);
    return stableTags[0] || '0.0.0';
  }

  /**
   * Determine current version based on git state
   * - If on a release branch, use that version
   * - If latest tag is pre-release, use that version
   * - Otherwise, use latest stable
   */
  private determineCurrentVersion(latestStable: string, latestTag: string): string {
    try {
      // Check current branch
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.rootDir,
        encoding: 'utf-8',
      }).trim();

      // If on release branch, extract version
      const releaseMatch = branch.match(/release\/v?(\d+\.\d+\.\d+)/);
      if (releaseMatch) {
        return releaseMatch[1];
      }

      // If latest tag is newer than stable, use it
      if (semver.gt(latestTag, latestStable)) {
        return latestTag;
      }

      // Default to latest stable
      return latestStable || '0.0.0';
    } catch {
      return latestStable || '0.0.0';
    }
  }

  /**
   * Get version info as JSON (for compatibility with existing code)
   */
  async getVersionJson(): Promise<Record<string, string>> {
    const info = await this.detectVersion();
    return {
      current: info.current,
      latest_stable: info.latest_stable,
      spec_version: info.spec_version,
      spec_path: info.spec_path,
      schema_file: info.schema_file,
    };
  }
}
