/**
 * Skills Export Service Tests
 */

import { SkillsExportService } from '../../../src/services/skills-pipeline/skills-export.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('SkillsExportService', () => {
  let service: SkillsExportService;
  let tempDir: string;
  let skillPath: string;

  beforeEach(async () => {
    service = new SkillsExportService();

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
    } catch (error) {
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
});
