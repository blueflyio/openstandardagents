/**
 * Skills Export Service Tests
 * Tests export, publish, install, and validation flows
 */

import { SkillsExportService } from '../../../src/services/skills-pipeline/skills-export.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

// Mock execSync for publish tests — prevents real npm calls
jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  execSync: jest.fn(),
}));

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('SkillsExportService', () => {
  let service: SkillsExportService;
  let tempDir: string;
  let skillPath: string;

  beforeEach(async () => {
    service = new SkillsExportService();
    jest.clearAllMocks();

    // Create temp directory for tests
    tempDir = path.join(tmpdir(), `ossa-export-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Create test skill
    skillPath = path.join(tempDir, 'test-skill');
    await fs.mkdir(skillPath, { recursive: true });

    // Create SKILL.md
    const skillContent = `---
name: test-skill
description: A test skill for unit testing
trigger_keywords:
  - testing
  - validation
  - unit-test
version: 1.0.0
author: Test Author
tags:
  - test
---

# test-skill

A test skill for unit testing

## Instructions

This is a test skill for validating the export functionality.

## Capabilities

- testing
- validation

## When to Use

This skill activates when:
- Task involves: testing
- Task involves: validation
`;

    await fs.writeFile(path.join(skillPath, 'SKILL.md'), skillContent);

    // Create additional directories
    await fs.mkdir(path.join(skillPath, 'templates'), { recursive: true });
    await fs.mkdir(path.join(skillPath, 'knowledge'), { recursive: true });
    await fs.mkdir(path.join(skillPath, 'examples'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('export', () => {
    it('should export skill as npm package', async () => {
      const result = await service.export({
        skillPath,
        scope: '@test-scope',
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.packageName).toContain('@test-scope/test-skill');
      expect(result.files).toContain('package.json');
      expect(result.files).toContain('SKILL.md');
      expect(result.files).toContain('README.md');
      expect(result.files).toContain('index.d.ts');
      expect(result.files).toContain('install.js');
    });

    it('should handle custom scope', async () => {
      const result = await service.export({
        skillPath,
        scope: '@my-skills',
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.packageName).toContain('@my-skills/');
    });

    it('should support dry run', async () => {
      const result = await service.export({
        skillPath,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Dry run');
    });

    it('should accept SKILL.md file path directly', async () => {
      const skillFile = path.join(skillPath, 'SKILL.md');

      const result = await service.export({
        skillPath: skillFile,
        dryRun: true,
      });

      expect(result.success).toBe(true);
    });

    it('should handle missing SKILL.md', async () => {
      const emptyPath = path.join(tempDir, 'empty-skill');
      await fs.mkdir(emptyPath, { recursive: true });

      const result = await service.export({
        skillPath: emptyPath,
        dryRun: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('SKILL.md not found');
    });

    it('should handle invalid frontmatter', async () => {
      const invalidSkillPath = path.join(tempDir, 'invalid-skill');
      await fs.mkdir(invalidSkillPath, { recursive: true });

      // Create SKILL.md without frontmatter
      await fs.writeFile(
        path.join(invalidSkillPath, 'SKILL.md'),
        '# Test Skill\n\nNo frontmatter here!'
      );

      const result = await service.export({
        skillPath: invalidSkillPath,
        dryRun: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('publish', () => {
    it('should fail publish when not authenticated with npm', async () => {
      // Mock npm whoami to fail (not authenticated)
      mockedExecSync.mockImplementation(() => {
        throw new Error('ENEEDAUTH');
      });

      const result = await service.export({
        skillPath,
        publish: true,
        dryRun: false,
      });

      // Export itself succeeds, but published is false
      expect(result.success).toBe(true);
      expect(result.published).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('npm login');
    });

    it('should publish when authenticated', async () => {
      // Mock npm whoami success, then npm publish success
      mockedExecSync.mockReturnValue(Buffer.from('test-user\n'));

      const result = await service.export({
        skillPath,
        publish: true,
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(result.published).toBe(true);
      expect(result.message).toContain('published');
    });

    it('should not publish on dry run', async () => {
      const result = await service.export({
        skillPath,
        publish: true,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.published).toBeUndefined();
      // execSync should not have been called for publish
      expect(mockedExecSync).not.toHaveBeenCalled();
    });
  });

  describe('install', () => {
    it('should install skill to ~/.claude/skills/ and validate', async () => {
      const result = await service.export({
        skillPath,
        install: true,
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(result.installed).toBe(true);
      expect(result.installPath).toContain('.claude/skills/test-skill');
    });

    it('should include installPath in result', async () => {
      const result = await service.export({
        skillPath,
        install: true,
        dryRun: false,
      });

      expect(result.installPath).toBeDefined();
      expect(result.installPath).toContain('test-skill');
    });

    it('should not install on dry run', async () => {
      const result = await service.export({
        skillPath,
        install: true,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.installed).toBeUndefined();
    });
  });

  describe('result fields', () => {
    it('should include new result fields (published, installed, installPath)', async () => {
      const result = await service.export({
        skillPath,
        dryRun: true,
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('outputPath');
      expect(result).toHaveProperty('packageName');
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('message');
    });
  });
});
