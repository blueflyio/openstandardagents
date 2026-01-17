/**
 * Git Service
 * Handles git operations for loading files from git history
 */

import { execSync } from 'child_process';
import { injectable } from 'inversify';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';

export interface GitRef {
  ref: string;
  filePath: string;
}

@injectable()
export class GitService {
  /**
   * Check if we're in a git repository
   */
  isGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that a git ref exists
   */
  validateRef(ref: string): boolean {
    try {
      execSync(`git rev-parse --verify ${ref}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load file content from a git ref
   * @param ref - Git reference (branch, tag, commit SHA)
   * @param filePath - Path to file relative to repository root
   * @returns File content as string
   * @throws Error if ref or file doesn't exist
   */
  loadFileFromRef(ref: string, filePath: string): string {
    if (!this.isGitRepository()) {
      throw new Error('Not in a git repository');
    }

    if (!this.validateRef(ref)) {
      throw new Error(`Invalid git reference: ${ref}`);
    }

    // Validate file path to prevent path traversal
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.\/)+/, '');
    if (normalizedPath !== filePath && normalizedPath.startsWith('..')) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    try {
      const content = execSync(`git show ${ref}:${normalizedPath}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024, // 10MB max
      });
      return content;
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        throw new Error(`File ${filePath} does not exist in ${ref}`);
      }
      throw new Error(`Failed to load file from git: ${error.message}`);
    }
  }

  /**
   * Parse a git ref string (format: "ref:path/to/file")
   * @param refString - String in format "ref:path" or just "path"
   * @returns Parsed git ref and file path, or null if not a git ref
   */
  parseRefString(refString: string): GitRef | null {
    if (!refString.includes(':')) {
      return null;
    }

    const parts = refString.split(':');
    if (parts.length !== 2) {
      return null;
    }

    const [ref, filePath] = parts;
    if (!ref || !filePath) {
      return null;
    }

    return { ref: ref.trim(), filePath: filePath.trim() };
  }

  /**
   * Load and parse a manifest file from git ref
   * @param ref - Git reference
   * @param filePath - Path to manifest file
   * @returns Parsed manifest object
   */
  loadManifestFromRef(ref: string, filePath: string): any {
    const content = this.loadFileFromRef(ref, filePath);
    const ext = path.extname(filePath).toLowerCase();

    try {
      if (ext === '.json') {
        return JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        return parseYaml(content);
      } else {
        throw new Error(
          `Unsupported file format: ${ext}. Must be .json, .yaml, or .yml`
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to parse manifest from ${ref}:${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
