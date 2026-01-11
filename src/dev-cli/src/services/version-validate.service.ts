/**
 * Version Validate Service
 * 
 * Validates version consistency across all files
 * SOLID: Single Responsibility - Validation only
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { VersionValidateResponse, VersionConfigSchema } from '../schemas/version.schema.js';

export class VersionValidateService {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Validate version consistency
   * CRUD: Read operation (validates files)
   */
  async validate(): Promise<VersionValidateResponse> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const details: Record<string, string> = {};

    // Check .version.json exists
    const versionFile = join(this.rootDir, '.version.json');
    if (!existsSync(versionFile)) {
      return {
        valid: false,
        errors: ['.version.json not found'],
        warnings: [],
      };
    }

    const config = VersionConfigSchema.parse(JSON.parse(readFileSync(versionFile, 'utf-8')));
    details['.version.json'] = config.current;

    // Check package.json
    const packageFile = join(this.rootDir, 'package.json');
    if (existsSync(packageFile)) {
      const pkg = JSON.parse(readFileSync(packageFile, 'utf-8'));
      if (pkg.version && pkg.version !== config.current && !pkg.version.includes('{{VERSION}}')) {
        errors.push(`package.json version (${pkg.version}) doesn't match .version.json (${config.current})`);
      }
      details['package.json'] = pkg.version || 'missing';
    }

    // TODO: Add more validation checks (README, CHANGELOG, etc.)

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      details,
    };
  }
}
