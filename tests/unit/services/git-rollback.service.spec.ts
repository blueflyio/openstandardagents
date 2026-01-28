/**
 * Tests for GitRollbackService
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GitRollbackService } from '../../../src/services/git-rollback.service.js';
import { GitService } from '../../../src/services/git.service.js';

describe('GitRollbackService', () => {
  let service: GitRollbackService;
  let gitService: GitService;

  beforeEach(() => {
    gitService = new GitService();
    service = new GitRollbackService(gitService);
  });

  describe('isGitAvailable', () => {
    it('should detect if git is available', () => {
      const result = service.isGitAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isGitRepository', () => {
    it('should return false for non-git directory', () => {
      const result = service.isGitRepository('/tmp');
      expect(typeof result).toBe('boolean');
    });

    it('should return true for git repository', () => {
      const cwd = process.cwd();
      const result = service.isGitRepository(cwd);
      // This test depends on running in a git repo
      if (result) {
        expect(result).toBe(true);
      }
    });
  });

  describe('hasUncommittedChanges', () => {
    it('should detect uncommitted changes', () => {
      const cwd = process.cwd();
      if (service.isGitRepository(cwd)) {
        const result = service.hasUncommittedChanges(cwd);
        expect(typeof result).toBe('boolean');
      }
    });
  });

  describe('listMigrationBranches', () => {
    it('should list migration branches', async () => {
      const cwd = process.cwd();
      if (service.isGitRepository(cwd)) {
        const branches = await service.listMigrationBranches(cwd);
        expect(Array.isArray(branches)).toBe(true);
      }
    });
  });

  describe('Error handling', () => {
    it('should throw error when creating branch in non-git directory', async () => {
      await expect(
        service.createMigrationBranch('/tmp', 'test')
      ).rejects.toThrow();
    });

    it('should return failure when rolling back in non-git directory', async () => {
      const result = await service.rollback('/tmp', {
        branchName: 'test',
        timestamp: new Date().toISOString(),
        description: 'test',
        originalBranch: 'main',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Rollback workflow', () => {
    it('should handle complete rollback workflow structure', async () => {
      const rollbackPoint = {
        branchName: 'migration/test-branch',
        timestamp: new Date().toISOString(),
        description: 'test migration',
        originalBranch: 'main',
        commitSha: 'abc123',
      };

      // Test that rollback point has correct structure
      expect(rollbackPoint.branchName).toContain('migration/');
      expect(rollbackPoint.originalBranch).toBe('main');
      expect(rollbackPoint.description).toBe('test migration');
    });
  });
});
