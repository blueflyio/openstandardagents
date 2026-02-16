/**
 * Skills Generator Service Tests
 */

import { SkillsGeneratorService } from '../../../src/services/skills-pipeline/skills-generator.service';
import { ManifestRepository } from '../../../src/repositories/manifest.repository';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('SkillsGeneratorService', () => {
  let service: SkillsGeneratorService;
  let manifestRepo: ManifestRepository;
  let tempDir: string;

  beforeEach(async () => {
    manifestRepo = new ManifestRepository();
    service = new SkillsGeneratorService(manifestRepo);

    // Create temp directory for tests
    tempDir = path.join(tmpdir(), `ossa-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('generate', () => {
    it('should generate skill from OSSA manifest', async () => {
      const inputPath = path.join(tempDir, 'agent.ossa.yaml');

      // Create test OSSA manifest
      await fs.writeFile(
        inputPath,
        `apiVersion: v0.4.5
kind: Agent
metadata:
  name: test-agent
  description: Test agent
  version: 1.0.0
spec:
  role: You are a test assistant
  capabilities:
    - testing
`
      );

      const result = await service.generate({
        inputPath,
        output: path.join(tempDir, 'skill-output'),
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
      expect(result.files).toContain('SKILL.md');
    });

    it('should handle dry run', async () => {
      const inputPath = path.join(tempDir, 'agent.ossa.yaml');

      await fs.writeFile(
        inputPath,
        `apiVersion: v0.4.5
kind: Agent
metadata:
  name: test-agent
spec:
  role: Test role
`
      );

      const result = await service.generate({
        inputPath,
        output: path.join(tempDir, 'skill-output-dry'),
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Dry run');
    });

    it('should detect OSSA format automatically', async () => {
      const inputPath = path.join(tempDir, 'agent.yaml');

      await fs.writeFile(
        inputPath,
        `apiVersion: v0.4.5
kind: Agent
metadata:
  name: auto-detect-test
spec:
  role: Auto-detected OSSA manifest
`
      );

      const result = await service.generate({
        inputPath,
        output: path.join(tempDir, 'skill-auto'),
        dryRun: true,
      });

      expect(result.success).toBe(true);
    });

    it('should detect Oracle format', async () => {
      const inputPath = path.join(tempDir, 'oracle.yaml');

      await fs.writeFile(
        inputPath,
        `name: oracle-agent
description: Oracle-format agent
instructions: Do something useful
capabilities:
  - search
  - analyze
`
      );

      const result = await service.generate({
        inputPath,
        output: path.join(tempDir, 'skill-oracle'),
        dryRun: true,
      });

      expect(result.success).toBe(true);
    });

    it('should detect AGENTS.md format', async () => {
      const inputPath = path.join(tempDir, 'AGENTS.md');

      await fs.writeFile(
        inputPath,
        `## Test Agent

A test agent from AGENTS.md

**Capabilities:** testing, validation

Instructions for the agent.
`
      );

      const result = await service.generate({
        inputPath,
        output: path.join(tempDir, 'skill-agents-md'),
        dryRun: true,
      });

      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const result = await service.generate({
        inputPath: '/nonexistent/path/agent.yaml',
        dryRun: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });
});
