/**
 * NPM Service
 * 
 * SOLID: Single Responsibility - NPM operations only
 * DRY: Centralizes all npm command execution
 * 
 * Abstraction for npm operations to eliminate duplication.
 */

import { execSync } from 'child_process';

export interface NpmPackageInfo {
  name: string;
  version: string;
  exists: boolean;
}

export class NpmService {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Run npm script
   */
  runScript(script: string, options: { silent?: boolean } = {}): void {
    execSync(`npm run ${script}`, {
      cwd: this.rootDir,
      stdio: options.silent ? 'ignore' : 'inherit',
    });
  }

  /**
   * Check if npm registry is accessible
   */
  ping(): boolean {
    try {
      execSync('npm ping', {
        cwd: this.rootDir,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * View package version from registry
   */
  viewVersion(packageName: string, version?: string): string | null {
    try {
      const versionArg = version ? `@${version}` : '';
      const output = execSync(`npm view ${packageName}${versionArg} version`, {
        cwd: this.rootDir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      return output || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if package version exists in registry
   */
  versionExists(packageName: string, version: string): boolean {
    const registryVersion = this.viewVersion(packageName, version);
    return registryVersion === version;
  }

  /**
   * Get package info from registry
   */
  getPackageInfo(packageName: string): NpmPackageInfo {
    const latestVersion = this.viewVersion(packageName);
    return {
      name: packageName,
      version: latestVersion || 'unknown',
      exists: latestVersion !== null,
    };
  }
}
