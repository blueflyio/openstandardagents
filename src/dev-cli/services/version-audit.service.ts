/**
 * Version Audit Service
 * 
 * Finds all hardcoded versions (not using 0.3.4 placeholder).
 * SOLID: Single Responsibility - Audit version usage
 * DRY: Reuses Zod schemas from schemas/version.schema.ts
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { glob } from 'glob';
import {
  VersionAuditResponse,
  HardcodedVersionFile,
  HARDCODED_VERSION_PATTERN,
  VERSION_PLACEHOLDER_PATTERN,
} from '../schemas/version.schema.js';

export class VersionAuditService {
  private readonly rootDir: string;
  private readonly excludePatterns: string[];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.excludePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'coverage/**',
      '.next/**',
      'build/**',
      'spec/v*/**', // Spec directories contain versioned files (expected)
      '.version.json', // This IS the source of truth
    ];
  }

  /**
   * Audit for hardcoded versions
   * CRUD: Read operation (audits files)
   */
  async audit(fix: boolean = false): Promise<VersionAuditResponse> {
    const files: HardcodedVersionFile[] = [];
    const filePatterns = [
      '**/*.ts',
      '**/*.js',
      '**/*.json',
      '**/*.yaml',
      '**/*.yml',
      '**/*.md',
      '**/*.txt',
    ];

    for (const pattern of filePatterns) {
      const matches = await glob(pattern, {
        cwd: this.rootDir,
        ignore: this.excludePatterns,
        absolute: false,
      });

      for (const file of matches) {
        const filePath = join(this.rootDir, file);
        if (!existsSync(filePath)) continue;

        const fileIssues = this.auditFile(filePath, file);
        files.push(...fileIssues);
      }
    }

    let fixed = 0;
    if (fix) {
      fixed = await this.fixFiles(files);
    }

    return {
      files,
      total: files.length,
      fixed: fix ? fixed : undefined,
    };
  }

  /**
   * Audit a single file for hardcoded versions
   */
  private auditFile(filePath: string, relativePath: string): HardcodedVersionFile[] {
    const issues: HardcodedVersionFile[] = [];

    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Skip if line already uses 0.3.4 placeholder
        if (VERSION_PLACEHOLDER_PATTERN.test(line)) {
          return;
        }

        // Check for hardcoded versions
        const matches = Array.from(line.matchAll(HARDCODED_VERSION_PATTERN));
        for (const match of matches) {
          const version = match[1];
          
          // Skip if it's a comment or example
          if (this.isCommentOrExample(line)) {
            continue;
          }

          // Skip if it's in a migration guide (expected to have old versions)
          if (relativePath.includes('migrations/guides/')) {
            continue;
          }

          // Skip if it's in package.json version field (handled separately)
          if (relativePath === 'package.json' && line.includes('"version"')) {
            continue;
          }

          issues.push({
            path: relativePath,
            line: index + 1,
            content: line.trim(),
            suggested: line.replace(version, '0.3.4'),
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read (binary, etc.)
    }

    return issues;
  }

  /**
   * Check if line is a comment or example
   */
  private isCommentOrExample(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('#') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('<!--') ||
      trimmed.includes('example') ||
      trimmed.includes('Example') ||
      trimmed.includes('EXAMPLE')
    );
  }

  /**
   * Fix files by replacing hardcoded versions with 0.3.4
   */
  private async fixFiles(files: HardcodedVersionFile[]): Promise<number> {
    const filesToFix = new Map<string, HardcodedVersionFile[]>();

    // Group by file
    for (const issue of files) {
      if (!filesToFix.has(issue.path)) {
        filesToFix.set(issue.path, []);
      }
      filesToFix.get(issue.path)!.push(issue);
    }

    let fixed = 0;
    for (const [filePath, issues] of filesToFix.entries()) {
      const fullPath = join(this.rootDir, filePath);
      if (!existsSync(fullPath)) continue;

      try {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        let changed = false;

        for (const issue of issues) {
          const lineIndex = issue.line - 1;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const originalLine = lines[lineIndex];
            const newLine = issue.suggested;
            if (originalLine !== newLine) {
              lines[lineIndex] = newLine;
              changed = true;
            }
          }
        }

        if (changed) {
          const { writeFileSync } = await import('fs');
          writeFileSync(fullPath, lines.join('\n'));
          fixed++;
        }
      } catch (error) {
        // Skip files that can't be written
      }
    }

    return fixed;
  }
}
