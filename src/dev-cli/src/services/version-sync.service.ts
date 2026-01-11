/**
 * Version Sync Service
 * 
 * Syncs {{VERSION}} placeholders with actual version from .version.json
 * SOLID: Single Responsibility - Sync only
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { VersionSyncRequest, VersionSyncResponse, VersionConfigSchema, VERSION_PLACEHOLDER_PATTERN } from '../schemas/version.schema';

export class VersionSyncService {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Sync {{VERSION}} placeholders
   * CRUD: Update operation (updates files)
   */
  async sync(request: VersionSyncRequest): Promise<VersionSyncResponse> {
    const versionFile = join(this.rootDir, '.version.json');
    
    if (!existsSync(versionFile)) {
      throw new Error('.version.json not found. Run from project root.');
    }

    const config = VersionConfigSchema.parse(JSON.parse(readFileSync(versionFile, 'utf-8')));
    const version = request.version || config.current;

    const filesToSync = request.files || await this.findFilesWithPlaceholders();
    const updatedFiles: string[] = [];
    let filesUpdated = 0;

    for (const file of filesToSync) {
      const filePath = join(this.rootDir, file);
      if (!existsSync(filePath)) continue;

      try {
        let content = readFileSync(filePath, 'utf-8');
        const original = content;

        // Replace {{VERSION}} with actual version
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
   * Find all files with {{VERSION}} placeholder
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
