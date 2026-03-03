/**
 * Version Validate Service
 *
 * Validates version consistency across all files
 * SOLID: Single Responsibility - Validation only
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { VersionValidateResponse } from '../schemas/version.schema.js';
import { VersionDetectionService } from './version-detection.service.js';

export class VersionValidateService {
  private readonly rootDir: string;
  private readonly versionDetection: VersionDetectionService;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.versionDetection = new VersionDetectionService(rootDir);
  }

  /**
   * Validate version consistency
   * CRUD: Read operation (validates files)
   * DYNAMIC: Reads version from git tags, updates .version.json
   */
  async validate(): Promise<VersionValidateResponse> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const details: Record<string, string> = {};

    // Detect version from git tags (DYNAMIC) and update .version.json
    const versionInfo = await this.versionDetection.detectVersion();
    details['git_tags'] = versionInfo.current;
    details['.version.json'] = versionInfo.current;

    // Check package.json
    const packageFile = join(this.rootDir, 'package.json');
    if (existsSync(packageFile)) {
      const pkg = JSON.parse(readFileSync(packageFile, 'utf-8'));
      if (pkg.version && pkg.version !== versionInfo.current) {
        errors.push(
          `package.json version (${pkg.version}) doesn't match git tags/.version.json (${versionInfo.current})`
        );
      }
      details['package.json'] = pkg.version || 'missing';
    }

    const readmeFile = join(this.rootDir, 'README.md');
    if (existsSync(readmeFile)) {
      const readme = readFileSync(readmeFile, 'utf-8');
      details['README.md'] = readme.includes(versionInfo.current)
        ? 'version mentioned'
        : 'no version';
    } else {
      warnings.push('README.md not found');
      details['README.md'] = 'missing';
    }
    const changelogFile = join(this.rootDir, 'CHANGELOG.md');
    if (existsSync(changelogFile)) {
      const changelog = readFileSync(changelogFile, 'utf-8');
      details['CHANGELOG.md'] = changelog.includes(versionInfo.current)
        ? 'version mentioned'
        : 'no version';
    } else {
      warnings.push('CHANGELOG.md not found');
      details['CHANGELOG.md'] = 'missing';
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      details,
    };
  }
}
