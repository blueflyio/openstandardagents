/**
 * Version Sync Service
 * 
 * Syncs 0.3.4 placeholders with actual version from git tags (DYNAMIC)
 * SOLID: Single Responsibility - Sync only
 * DRY: Single source of truth (git tags)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { VersionSyncRequest, VersionSyncResponse, VERSION_PLACEHOLDER_PATTERN } from '../schemas/version.schema.js';
import { VersionDetectionService } from './version-detection.service.js';

export class VersionSyncService {
  private readonly rootDir: string;
  private readonly versionDetection: VersionDetectionService;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.versionDetection = new VersionDetectionService(rootDir);
  }

  /**
   * Sync 0.3.4 placeholders
   * CRUD: Update operation (updates files)
   * DYNAMIC: Reads version from git tags, not static file
   */
  async sync(request: VersionSyncRequest): Promise<VersionSyncResponse> {
    // Detect version from git tags (DYNAMIC)
    const versionInfo = await this.versionDetection.detectVersion();
    const version = request.version || versionInfo.current;

    const filesToSync = request.files || await this.findFilesWithPlaceholders();
    const updatedFiles: string[] = [];
    let filesUpdated = 0;

    for (const file of filesToSync) {
      const filePath = join(this.rootDir, file);
      if (!existsSync(filePath)) continue;

      try {
        let content = readFileSync(filePath, 'utf-8');
        const original = content;

        // Replace 0.3.4 with actual version
        content = content.replace(VERSION_PLACEHOLDER_PATTERN, version);

        if (content !== original) {
          writeFileSync(filePath, content);
          updatedFiles.push(file);
          filesUpdated++;
        }
      } catch (error) {
        // Skip files that can't be read/written
      }
    }

    return {
      success: true,
      filesUpdated,
      files: updatedFiles,
    };
  }

  /**
   * Find all files with 0.3.4 placeholder
   */
  private async findFilesWithPlaceholders(): Promise<string[]> {
    const patterns = [
      '**/*.ts',
      '**/*.js',
      '**/*.json',
      '**/*.yaml',
      '**/*.yml',
      '**/*.md',
    ];

    const files: string[] = [];
    const excludePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'coverage/**',
    ];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: this.rootDir,
        ignore: excludePatterns,
        absolute: false,
      });

      for (const file of matches) {
        const filePath = join(this.rootDir, file);
        if (!existsSync(filePath)) continue;

        try {
          const content = readFileSync(filePath, 'utf-8');
          if (VERSION_PLACEHOLDER_PATTERN.test(content)) {
            files.push(file);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    return files;
  }
}
