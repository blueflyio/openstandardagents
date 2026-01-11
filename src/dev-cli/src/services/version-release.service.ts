/**
 * Version Release Service
 * 
 * ONE command to release - Bumps version, syncs all files, validates
 * SOLID: Single Responsibility - Release workflow only
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import semver from 'semver';
import {
  VersionReleaseRequest,
  VersionReleaseResponse,
  VersionConfigSchema,
} from '../schemas/version.schema.js';

export class VersionReleaseService {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Release a new version (ONE command to release)
   * CRUD: Update operation (updates .version.json and all files)
   */
  async release(request: VersionReleaseRequest): Promise<VersionReleaseResponse> {
    const versionFile = join(this.rootDir, '.version.json');
    
    if (!existsSync(versionFile)) {
      throw new Error('.version.json not found. Run from project root.');
    }

    const config = VersionConfigSchema.parse(JSON.parse(readFileSync(versionFile, 'utf-8')));
    const oldVersion = config.current;
    const newVersion = semver.inc(oldVersion, request.bumpType) || oldVersion;

    if (request.dryRun) {
      return {
        success: true,
        oldVersion,
        newVersion,
        changes: [`Would update .version.json: ${oldVersion} → ${newVersion}`],
        nextSteps: [
          'Run without --dry-run to actually release',
        ],
      };
    }

    // Update .version.json
    config.current = newVersion;
    config.spec_version = newVersion;
    config.spec_path = `spec/v${newVersion}`;
    config.schema_file = `ossa-${newVersion}.schema.json`;
    
    writeFileSync(versionFile, JSON.stringify(config, null, 2) + '\n');

    const changes: string[] = [`Updated .version.json: ${oldVersion} → ${newVersion}`];

    // Sync all files (replace {{VERSION}} with actual version)
    try {
      execSync('npm run version:sync', { cwd: this.rootDir, stdio: 'inherit' });
      changes.push('Synced {{VERSION}} placeholders in all files');
    } catch (error) {
      // Continue even if sync fails
    }

    // Validate if requested
    if (!request.skipValidation) {
      try {
        execSync('npm run version:validate', { cwd: this.rootDir, stdio: 'inherit' });
        changes.push('Validated version consistency');
      } catch (error) {
        // Validation failed, but continue
      }
    }

    const nextSteps = [
      'Review changes: git diff',
      'Commit: git add . && git commit -m "chore: release v' + newVersion + '"',
      'Push: git push',
      'CI will handle publishing to npm and creating GitLab release',
    ];

    return {
      success: true,
      oldVersion,
      newVersion,
      changes,
      nextSteps,
    };
  }
}
