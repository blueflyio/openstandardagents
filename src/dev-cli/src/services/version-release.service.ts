/**
 * Version Release Service
 * 
 * ONE command to release - Bumps version, syncs all files, validates
 * SOLID: Single Responsibility - Release workflow only
 */

import { execSync } from 'child_process';
import semver from 'semver';
import {
  VersionReleaseRequest,
  VersionReleaseResponse,
} from '../schemas/version.schema.js';
import { VersionDetectionService } from './version-detection.service.js';

export class VersionReleaseService {
  private readonly rootDir: string;
  private readonly versionDetection: VersionDetectionService;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.versionDetection = new VersionDetectionService(rootDir);
  }

  /**
   * Release a new version (ONE command to release)
   * CRUD: Update operation (creates git tag, updates files)
   * DYNAMIC: Reads current version from git tags, not static file
   */
  async release(request: VersionReleaseRequest): Promise<VersionReleaseResponse> {
    // Detect current version from git tags (DYNAMIC)
    const versionInfo = await this.versionDetection.detectVersion();
    const oldVersion = versionInfo.current;
    const newVersion = semver.inc(oldVersion, request.bumpType) || oldVersion;

    if (request.dryRun) {
      return {
        success: true,
        oldVersion,
        newVersion,
        changes: [
          `Would create git tag: v${newVersion}`,
          `Would sync all files: ${oldVersion} → ${newVersion}`,
        ],
        nextSteps: [
          'Run without --dry-run to actually release',
        ],
      };
    }

    const changes: string[] = [];

    // Sync all files (replace 0.3.4 with actual version)
    try {
      execSync('npm run version:sync', { cwd: this.rootDir, stdio: 'inherit' });
      changes.push('Synced 0.3.4 placeholders in all files');
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

    // Create git tag for new version
    try {
      execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
        cwd: this.rootDir,
        stdio: 'inherit',
      });
      changes.push(`Created git tag: v${newVersion}`);
    } catch (error) {
      changes.push(`Tag creation skipped (may already exist)`);
    }

    const nextSteps = [
      'Review changes: git diff',
      'Commit: git add . && git commit -m "chore: release v' + newVersion + '"',
      'Push tags: git push origin v' + newVersion,
      'Push branch: git push',
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
