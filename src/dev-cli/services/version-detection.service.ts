/**
 * Version Detection Service
 *
 * DYNAMIC: Detects version from git tags and updates .version.json
 * SOLID: Single Responsibility - Version detection only
 * DRY: Single source of truth (git tags) → updates .version.json
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { VersionConfigSchema } from '../schemas/version.schema.js';

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
  private readonly versionFile: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.versionFile = join(rootDir, '.version.json');
  }

  /**
   * Detect version from git tags and update .version.json
   * DYNAMIC: Reads from git tags (or existing .version.json), writes to .version.json
   */
  async detectVersion(): Promise<VersionInfo> {
    // First check if .version.json exists and read current version
    let existingCurrent: string | undefined;
    if (existsSync(this.versionFile)) {
      try {
        const content = readFileSync(this.versionFile, 'utf-8');
        const config = JSON.parse(content);
        existingCurrent = config.current;
      } catch {
        // Continue if parse fails
      }
    }

    // Fetch all tags
    try {
      execSync('git fetch --tags --prune origin', {
        cwd: this.rootDir,
        stdio: 'ignore',
      });
    } catch {
      // Continue if fetch fails
    }

    // Get all version tags
    const allTags = this.getAllVersionTags();
    const latestStable = this.getLatestStableTag(allTags);
    const latestTag = allTags[0] || latestStable;

    // Determine current version: prefer existing .version.json, fallback to git
    const current =
      existingCurrent || this.determineCurrentVersion(latestStable, latestTag);

    const spec_version = current;

    // Use minor version for spec_path (e.g., spec/v0.3 for all 0.3.x versions)
    const minorVersion = this.extractMinorVersion(current);
    const spec_path = `spec/v${minorVersion}`;
    const schema_file = `ossa-${spec_version}.schema.json`;

    const versionInfo: VersionInfo = {
      current,
      latest_stable: latestStable || '0.0.0',
      latest_tag: latestTag || '0.0.0',
      all_tags: allTags,
      spec_version,
      spec_path,
      schema_file,
    };

    // UPDATE .version.json dynamically
    this.updateVersionFile(versionInfo);

    return versionInfo;
  }

  /**
   * Update .version.json with detected version
   */
  private updateVersionFile(info: VersionInfo): void {
    let config;

    if (existsSync(this.versionFile)) {
      try {
        const content = readFileSync(this.versionFile, 'utf-8');
        config = VersionConfigSchema.parse(JSON.parse(content));
      } catch {
        // If parse fails, create new config
        config = {
          current: '0.0.0',
          spec_version: '0.0.0',
          spec_path: 'spec/v0.0.0',
          schema_file: 'ossa-0.0.0.schema.json',
        };
      }
    } else {
      // Create new config
      config = {
        current: '0.0.0',
        spec_version: '0.0.0',
        spec_path: 'spec/v0.0.0',
        schema_file: 'ossa-0.0.0.schema.json',
      };
    }

    // Update with detected version
    config.current = info.current;
    config.spec_version = info.spec_version;
    config.spec_path = info.spec_path;
    config.schema_file = info.schema_file;

    // Write back to .version.json
    writeFileSync(
      this.versionFile,
      JSON.stringify(config, null, 2) + '\n',
      'utf-8'
    );
  }

  /**
   * Get all version tags (vX.Y.Z format)
   */
  private getAllVersionTags(): string[] {
    try {
      const tags = execSync('git tag -l "v*"', {
        cwd: this.rootDir,
        encoding: 'utf-8',
      })
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((tag) => tag.trim());

      // Sort by version (newest first)
      return tags.sort((a, b) => {
        const aVersion = a.replace(/^v/, '');
        const bVersion = b.replace(/^v/, '');
        try {
          const aSemver = aVersion.split('.').map(Number);
          const bSemver = bVersion.split('.').map(Number);

          for (let i = 0; i < 3; i++) {
            if (aSemver[i] > bSemver[i]) return -1;
            if (aSemver[i] < bSemver[i]) return 1;
          }
          return 0;
        } catch {
          return a.localeCompare(b);
        }
      });
    } catch {
      return [];
    }
  }

  /**
   * Get latest stable tag (not -dev, -rc, etc.)
   */
  private getLatestStableTag(tags: string[]): string | null {
    const stable = tags.find((tag) => {
      const version = tag.replace(/^v/, '');
      return !version.includes('-') && /^\d+\.\d+\.\d+$/.test(version);
    });
    return stable || null;
  }

  /**
   * Determine current version from branch or latest tag
   */
  private determineCurrentVersion(
    latestStable: string | null,
    latestTag: string | null
  ): string {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.rootDir,
        encoding: 'utf-8',
      }).trim();

      // If on release/v0.X.x branch, extract version
      const releaseMatch = branch.match(/^release\/v(\d+\.\d+)\.x$/);
      if (releaseMatch) {
        // Use latest patch from that minor version
        const minorVersion = releaseMatch[1];
        const patchTag = this.getLatestPatchForMinor(minorVersion);
        if (patchTag) {
          return patchTag.replace(/^v/, '');
        }
        // Fallback to minor.0
        return `${minorVersion}.0`;
      }

      // If on feature branch, use latest stable
      if (latestStable) {
        return latestStable.replace(/^v/, '');
      }

      // Fallback to latest tag
      if (latestTag) {
        return latestTag.replace(/^v/, '');
      }

      return '0.0.0';
    } catch {
      // Fallback to latest stable or 0.0.0
      if (latestStable) {
        return latestStable.replace(/^v/, '');
      }
      return '0.0.0';
    }
  }

  /**
   * Get latest patch version for a minor version (e.g., 0.3.4 for 0.3.x)
   */
  private getLatestPatchForMinor(minorVersion: string): string | null {
    try {
      const tags = execSync(`git tag -l "v${minorVersion}.*"`, {
        cwd: this.rootDir,
        encoding: 'utf-8',
      })
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((tag) => tag.trim())
        .filter((tag) => {
          const version = tag.replace(/^v/, '');
          return (
            /^\d+\.\d+\.\d+$/.test(version) && version.startsWith(minorVersion)
          );
        });

      if (tags.length === 0) return null;

      // Sort and return latest
      tags.sort((a, b) => {
        const aPatch = parseInt(a.split('.')[2]);
        const bPatch = parseInt(b.split('.')[2]);
        return bPatch - aPatch;
      });

      return tags[0];
    } catch {
      return null;
    }
  }

  /**
   * Extract minor version from full version (e.g., "0.3.5" → "0.3")
   */
  private extractMinorVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}`;
    }
    return version;
  }
}
