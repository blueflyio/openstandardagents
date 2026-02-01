/**
 * Version Audit Service
 *
 * Finds hardcoded versions that should use placeholders
 * API-First: Implements /version/audit from OpenAPI spec
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface HardcodedVersionFile {
  path: string;
  line: number;
  content: string;
  suggested: string;
}

export interface VersionAuditResult {
  files: HardcodedVersionFile[];
  total: number;
  fixed?: number;
}

export class VersionAuditService {
  private readonly ROOT = process.cwd();
  private readonly CURRENT_VERSION = '{{VERSION}}'; // Read from .version.json
  private readonly PLACEHOLDER = '{{VERSION}}';
  private readonly EXCLUDE_PATTERNS = [
    'node_modules',
    'dist',
    '.git',
    'coverage',
    '.version.json',
    'package.json',
    'package-lock.json',
    'CHANGELOG.md',
  ];

  async audit(options: { fix?: boolean } = {}): Promise<VersionAuditResult> {
    const hardcodedFiles: HardcodedVersionFile[] = [];

    // Read current version from .version.json
    const versionConfig = JSON.parse(
      readFileSync(join(this.ROOT, '.version.json'), 'utf-8')
    );
    const currentVersion = versionConfig.current;

    // Scan files for hardcoded versions
    this.scanDirectory(this.ROOT, currentVersion, hardcodedFiles);

    // Fix if requested
    let fixed = 0;
    if (options.fix) {
      fixed = this.fixHardcodedVersions(hardcodedFiles, currentVersion);
    }

    return {
      files: hardcodedFiles,
      total: hardcodedFiles.length,
      fixed: options.fix ? fixed : undefined,
    };
  }

  private scanDirectory(
    dir: string,
    version: string,
    results: HardcodedVersionFile[]
  ): void {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      // Skip excluded patterns
      if (this.EXCLUDE_PATTERNS.some((pattern) => fullPath.includes(pattern))) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        this.scanDirectory(fullPath, version, results);
      } else if (this.shouldScanFile(fullPath)) {
        this.scanFile(fullPath, version, results);
      }
    }
  }

  private shouldScanFile(path: string): boolean {
    const extensions = ['.ts', '.js', '.json', '.yaml', '.yml', '.md'];
    return extensions.some((ext) => path.endsWith(ext));
  }

  private scanFile(
    path: string,
    version: string,
    results: HardcodedVersionFile[]
  ): void {
    try {
      const content = readFileSync(path, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Look for version patterns like "{{VERSION}}", "v{{VERSION}}", "{{VERSION}}"
        const versionRegex = new RegExp(
          `(?<!\\{\\{)${version.replace(/\./g, '\\.')}(?!\\}\\})`,
          'g'
        );

        if (versionRegex.test(line)) {
          results.push({
            path: path.replace(this.ROOT + '/', ''),
            line: index + 1,
            content: line.trim(),
            suggested: line.replace(version, this.PLACEHOLDER),
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }

  private fixHardcodedVersions(
    files: HardcodedVersionFile[],
    version: string
  ): number {
    const fileGroups = new Map<string, HardcodedVersionFile[]>();

    // Group by file path
    files.forEach((file) => {
      if (!fileGroups.has(file.path)) {
        fileGroups.set(file.path, []);
      }
      fileGroups.get(file.path)!.push(file);
    });

    let fixed = 0;

    // Fix each file
    fileGroups.forEach((occurrences, path) => {
      try {
        const fullPath = join(this.ROOT, path);
        let content = readFileSync(fullPath, 'utf-8');

        // Replace all occurrences
        content = content.replace(
          new RegExp(version.replace(/\./g, '\\.'), 'g'),
          this.PLACEHOLDER
        );

        writeFileSync(fullPath, content, 'utf-8');
        fixed++;
      } catch (error) {
        // Skip files that can't be written
      }
    });

    return fixed;
  }
}
