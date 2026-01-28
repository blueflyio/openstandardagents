/**
 * Git Rollback Service
 * Provides git-based atomic rollback for migration operations
 */

import { injectable, inject } from 'inversify';
import { GitService } from './git.service.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Rollback point information
 */
export interface RollbackPoint {
  branchName: string;
  timestamp: string;
  description: string;
  originalBranch: string;
  commitSha?: string;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  success: boolean;
  message: string;
  branchRestored?: string;
  errors?: string[];
}

@injectable()
export class GitRollbackService {
  constructor(@inject(GitService) private gitService: GitService) {}

  /**
   * Check if git is available and working directory is a git repo
   */
  isGitAvailable(): boolean {
    try {
      execSync('git --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if current directory is a git repository
   */
  isGitRepository(directory: string): boolean {
    try {
      const result = execSync('git rev-parse --git-dir', {
        cwd: directory,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Create a migration branch for safe rollback
   * Returns the branch name
   */
  async createMigrationBranch(
    directory: string,
    description: string = 'ossa-migration'
  ): Promise<RollbackPoint> {
    if (!this.isGitAvailable()) {
      throw new Error('Git is not available');
    }

    if (!this.isGitRepository(directory)) {
      throw new Error(`Directory is not a git repository: ${directory}`);
    }

    // Get current branch
    const originalBranch = execSync('git branch --show-current', {
      cwd: directory,
      encoding: 'utf-8',
    }).trim();

    // Generate unique branch name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const branchName = `migration/${description}-${timestamp}`;

    // Create new branch
    execSync(`git checkout -b ${branchName}`, {
      cwd: directory,
      stdio: 'ignore',
    });

    const rollbackPoint: RollbackPoint = {
      branchName,
      timestamp,
      description,
      originalBranch,
    };

    return rollbackPoint;
  }

  /**
   * Commit changes in migration branch
   */
  async commitChanges(
    directory: string,
    message: string,
    files?: string[]
  ): Promise<string> {
    if (!this.isGitRepository(directory)) {
      throw new Error(`Directory is not a git repository: ${directory}`);
    }

    try {
      // Add specified files or all changes
      if (files && files.length > 0) {
        for (const file of files) {
          if (existsSync(file)) {
            execSync(`git add "${file}"`, {
              cwd: directory,
              stdio: 'ignore',
            });
          }
        }
      } else {
        execSync('git add -A', {
          cwd: directory,
          stdio: 'ignore',
        });
      }

      // Commit changes
      execSync(`git commit -m "${message}"`, {
        cwd: directory,
        stdio: 'ignore',
      });

      // Get commit SHA
      const commitSha = execSync('git rev-parse HEAD', {
        cwd: directory,
        encoding: 'utf-8',
      }).trim();

      return commitSha;
    } catch (error) {
      throw new Error(
        `Failed to commit changes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Rollback to original branch and delete migration branch
   */
  async rollback(
    directory: string,
    rollbackPoint: RollbackPoint
  ): Promise<RollbackResult> {
    if (!this.isGitRepository(directory)) {
      return {
        success: false,
        message: 'Not a git repository',
        errors: [`Directory is not a git repository: ${directory}`],
      };
    }

    const errors: string[] = [];

    try {
      // Switch back to original branch
      execSync(`git checkout ${rollbackPoint.originalBranch}`, {
        cwd: directory,
        stdio: 'ignore',
      });

      // Delete migration branch
      try {
        execSync(`git branch -D ${rollbackPoint.branchName}`, {
          cwd: directory,
          stdio: 'ignore',
        });
      } catch (error) {
        errors.push(
          `Warning: Could not delete migration branch: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      return {
        success: true,
        message: `Rolled back to ${rollbackPoint.originalBranch}`,
        branchRestored: rollbackPoint.originalBranch,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Rollback failed',
        errors: [
          ...errors,
          error instanceof Error ? error.message : 'Unknown error',
        ],
      };
    }
  }

  /**
   * Merge migration branch into original branch
   * Call this after successful migration to finalize changes
   */
  async finalizeMigration(
    directory: string,
    rollbackPoint: RollbackPoint
  ): Promise<RollbackResult> {
    if (!this.isGitRepository(directory)) {
      return {
        success: false,
        message: 'Not a git repository',
        errors: [`Directory is not a git repository: ${directory}`],
      };
    }

    try {
      // Switch back to original branch
      execSync(`git checkout ${rollbackPoint.originalBranch}`, {
        cwd: directory,
        stdio: 'ignore',
      });

      // Merge migration branch
      execSync(
        `git merge --no-ff ${rollbackPoint.branchName} -m "Finalize OSSA migration: ${rollbackPoint.description}"`,
        {
          cwd: directory,
          stdio: 'ignore',
        }
      );

      // Delete migration branch
      execSync(`git branch -d ${rollbackPoint.branchName}`, {
        cwd: directory,
        stdio: 'ignore',
      });

      return {
        success: true,
        message: `Migration finalized and merged into ${rollbackPoint.originalBranch}`,
        branchRestored: rollbackPoint.originalBranch,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Migration finalization failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Check if there are uncommitted changes
   */
  hasUncommittedChanges(directory: string): boolean {
    if (!this.isGitRepository(directory)) {
      return false;
    }

    try {
      const status = execSync('git status --porcelain', {
        cwd: directory,
        encoding: 'utf-8',
      });
      return status.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Stash current changes for safety
   */
  async stashChanges(directory: string, message?: string): Promise<boolean> {
    if (!this.isGitRepository(directory)) {
      return false;
    }

    try {
      const stashMessage =
        message || `OSSA migration stash - ${new Date().toISOString()}`;
      execSync(`git stash push -m "${stashMessage}"`, {
        cwd: directory,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pop stashed changes
   */
  async popStash(directory: string): Promise<boolean> {
    if (!this.isGitRepository(directory)) {
      return false;
    }

    try {
      execSync('git stash pop', {
        cwd: directory,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of migration branches
   */
  async listMigrationBranches(directory: string): Promise<string[]> {
    if (!this.isGitRepository(directory)) {
      return [];
    }

    try {
      const branches = execSync('git branch --list "migration/*"', {
        cwd: directory,
        encoding: 'utf-8',
      });

      return branches
        .split('\n')
        .map((b) => b.trim().replace(/^\*\s*/, ''))
        .filter((b) => b.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Clean up old migration branches
   */
  async cleanupMigrationBranches(
    directory: string,
    olderThanDays: number = 7
  ): Promise<number> {
    const branches = await this.listMigrationBranches(directory);
    let cleanedCount = 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    for (const branch of branches) {
      try {
        // Get branch creation date
        const dateStr = execSync(`git log -1 --format=%ci ${branch}`, {
          cwd: directory,
          encoding: 'utf-8',
        }).trim();

        const branchDate = new Date(dateStr);

        if (branchDate < cutoffDate) {
          execSync(`git branch -D ${branch}`, {
            cwd: directory,
            stdio: 'ignore',
          });
          cleanedCount++;
        }
      } catch {
        // Skip branches we can't process
        continue;
      }
    }

    return cleanedCount;
  }
}
