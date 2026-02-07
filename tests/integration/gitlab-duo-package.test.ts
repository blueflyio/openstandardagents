/**
 * GitLab Duo Package Generator Integration Tests
 * Tests complete package generation from OSSA manifests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { GitLabDuoPackageGenerator } from '../../src/adapters/gitlab/package-generator.js';
import type { OssaAgent } from '../../src/types/index.js';
import { API_VERSION } from '../../src/version.js';

describe('GitLab Duo Package Generator Integration', () => {
  let generator: GitLabDuoPackageGenerator;
  let tempDir: string;

  beforeEach(async () => {
    generator = new GitLabDuoPackageGenerator();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitlab-duo-test-'));
  });

  afterEach(async () => {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const createTestManifest = (overrides: Partial<OssaAgent> = {}): OssaAgent => ({
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: {
      name: 'test-agent',
      version: '1.0.0',
      description: 'Test agent for GitLab Duo',
      author: 'Test Author',
      license: 'MIT',
    },
    spec: {
      role: 'You are a helpful test agent that assists with code review.',
      instructions: 'Review code for quality and best practices.',
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        maxTokens: 4096,
      },
      tools: [
        {
          type: 'file',
          name: 'read',
          description: 'Read file contents',
        },
        {
          type: 'gitlab',
          name: 'create-issue',
          description: 'Create GitLab issue',
        },
      ],
      autonomy: {
        level: 'supervised',
        approval_required: true,
      },
    },
    ...overrides,
  });

  describe('Basic Package Generation', () => {
    it('should generate complete package structure', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
        includeSourceTemplates: true,
        includeDocker: true,
        includeCI: true,
      });

      expect(result.success).toBe(true);
      expect(result.packagePath).toBeDefined();
      expect(result.generatedFiles).toBeDefined();
      expect(result.generatedFiles!.length).toBeGreaterThan(0);

      // Verify package directory exists
      const packagePath = result.packagePath!;
      const packageStat = await fs.stat(packagePath);
      expect(packageStat.isDirectory()).toBe(true);
    });

    it('should generate all required files', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
        includeSourceTemplates: true,
        includeDocker: true,
        includeCI: true,
      });

      expect(result.success).toBe(true);

      const packagePath = result.packagePath!;

      // Check required files exist
      const requiredFiles = [
        '.gitlab/duo/flows/test-agent.yaml',
        '.gitlab/duo/agents/test-agent.yaml',
        '.gitlab/duo/AGENTS.md',
        'agent.ossa.yaml',
        'README.md',
        'DEPLOYMENT.md',
        'package.json',
        'Dockerfile',
        '.gitlab-ci.yml',
        '.gitignore',
        'src/index.ts',
        'src/agent.ts',
        'tsconfig.json',
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(packagePath, file);
        await expect(fs.access(filePath)).resolves.not.toThrow();
      }
    });

    it('should generate valid Flow Registry YAML', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(true);

      const flowPath = path.join(result.packagePath!, '.gitlab/duo/flows/test-agent.yaml');
      const flowContent = await fs.readFile(flowPath, 'utf8');

      // Check YAML structure
      expect(flowContent).toContain('version: v1');
      expect(flowContent).toContain('environment:');
      expect(flowContent).toContain('components:');
      expect(flowContent).toContain('routers:');
      expect(flowContent).toContain('prompts:');
      expect(flowContent).toContain('flow:');
    });

    it('should generate valid External Agent YAML', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(true);

      const agentPath = path.join(result.packagePath!, '.gitlab/duo/agents/test-agent.yaml');
      const agentContent = await fs.readFile(agentPath, 'utf8');

      // Check YAML structure
      expect(agentContent).toContain('name: test-agent');
      expect(agentContent).toContain('image:');
      expect(agentContent).toContain('commands:');
      expect(agentContent).toContain('variables:');
    });

    it('should generate valid AGENTS.md', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(true);

      const agentsMdPath = path.join(result.packagePath!, '.gitlab/duo/AGENTS.md');
      const agentsMdContent = await fs.readFile(agentsMdPath, 'utf8');

      // Check markdown structure
      expect(agentsMdContent).toContain('# test-agent');
      expect(agentsMdContent).toContain('## Role');
      expect(agentsMdContent).toContain('## Capabilities');
      expect(agentsMdContent).toContain('## Usage');
      expect(agentsMdContent).toContain('## Configuration');
      expect(agentsMdContent).toContain('## Deployment');
    });

    it('should generate valid package.json', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(true);

      const packageJsonPath = path.join(result.packagePath!, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      expect(packageJson.name).toBe('@gitlab-duo/test-agent');
      expect(packageJson.version).toBe('1.0.0');
      expect(packageJson.type).toBe('module');
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.dependencies).toBeDefined();
    });

    it('should generate valid Dockerfile', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
        includeDocker: true,
      });

      expect(result.success).toBe(true);

      const dockerfilePath = path.join(result.packagePath!, 'Dockerfile');
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf8');

      expect(dockerfileContent).toContain('FROM');
      expect(dockerfileContent).toContain('WORKDIR');
      expect(dockerfileContent).toContain('COPY');
      expect(dockerfileContent).toContain('CMD');
    });
  });

  describe('Package Generation Options', () => {
    it('should skip Docker when includeDocker is false', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
        includeDocker: false,
      });

      expect(result.success).toBe(true);

      const dockerfilePath = path.join(result.packagePath!, 'Dockerfile');
      await expect(fs.access(dockerfilePath)).rejects.toThrow();
    });

    it('should skip CI when includeCI is false', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
        includeCI: false,
      });

      expect(result.success).toBe(true);

      const ciPath = path.join(result.packagePath!, '.gitlab-ci.yml');
      await expect(fs.access(ciPath)).rejects.toThrow();
    });

    it('should skip source templates when includeSourceTemplates is false', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
        includeSourceTemplates: false,
      });

      expect(result.success).toBe(true);

      const srcIndexPath = path.join(result.packagePath!, 'src/index.ts');
      await expect(fs.access(srcIndexPath)).rejects.toThrow();
    });

    it('should fail without overwrite when package exists', async () => {
      const manifest = createTestManifest();

      // Generate first time
      const result1 = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result1.success).toBe(true);

      // Try to generate again without overwrite
      const result2 = await generator.generate(manifest, {
        outputDir: tempDir,
        overwrite: false,
      });

      expect(result2.success).toBe(false);
      expect(result2.errors).toBeDefined();
      expect(result2.errors![0]).toContain('already exists');
    });

    it('should succeed with overwrite when package exists', async () => {
      const manifest = createTestManifest();

      // Generate first time
      const result1 = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result1.success).toBe(true);

      // Generate again with overwrite
      const result2 = await generator.generate(manifest, {
        outputDir: tempDir,
        overwrite: true,
      });

      expect(result2.success).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should fail when manifest missing name', async () => {
      const manifest = createTestManifest();
      delete manifest.metadata?.name;

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('name');
    });

    it('should fail when manifest missing spec', async () => {
      const manifest = createTestManifest();
      delete manifest.spec;

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('spec');
    });

    it('should fail when manifest missing role', async () => {
      const manifest = createTestManifest();
      delete manifest.spec?.role;

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('role');
    });
  });

  describe('Different Agent Types', () => {
    it('should handle autonomous agent (ambient environment)', async () => {
      const manifest = createTestManifest({
        spec: {
          role: 'You are an autonomous code reviewer.',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [
            {
              type: 'file',
              name: 'read',
            },
          ],
          autonomy: {
            level: 'autonomous',
            approval_required: false,
          },
        },
      });

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(true);

      const flowPath = path.join(result.packagePath!, '.gitlab/duo/flows/test-agent.yaml');
      const flowContent = await fs.readFile(flowPath, 'utf8');

      // Should use ambient environment for autonomous agents
      expect(flowContent).toContain('environment: ambient');
    });

    it('should handle chat agent (supervised)', async () => {
      const manifest = createTestManifest({
        spec: {
          role: 'You are a chat assistant.',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [],
          autonomy: {
            level: 'supervised',
            approval_required: true,
          },
        },
      });

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(true);

      const flowPath = path.join(result.packagePath!, '.gitlab/duo/flows/test-agent.yaml');
      const flowContent = await fs.readFile(flowPath, 'utf8');

      // Should use chat environment for supervised agents
      expect(flowContent).toContain('environment: chat');
    });

    it('should handle Python runtime', async () => {
      const manifest = createTestManifest({
        spec: {
          role: 'You are a Python agent.',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          runtime: {
            type: 'python',
            image: 'python:3.12-slim',
          },
          tools: [],
        },
      });

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
        includeDocker: true,
      });

      expect(result.success).toBe(true);

      const agentPath = path.join(result.packagePath!, '.gitlab/duo/agents/test-agent.yaml');
      const agentContent = await fs.readFile(agentPath, 'utf8');

      expect(agentContent).toContain('python:3.12-slim');
      expect(agentContent).toContain('pip install');

      const dockerfilePath = path.join(result.packagePath!, 'Dockerfile');
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf8');

      expect(dockerfileContent).toContain('FROM python:3.12-slim');
      expect(dockerfileContent).toContain('requirements.txt');
    });
  });

  describe('Documentation Generation', () => {
    it('should include tool descriptions in AGENTS.md', async () => {
      const manifest = createTestManifest({
        spec: {
          role: 'You are a test agent.',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [
            {
              type: 'file',
              name: 'read',
              description: 'Read file contents from repository',
            },
            {
              type: 'gitlab',
              name: 'create-issue',
              description: 'Create a new GitLab issue',
            },
          ],
        },
      });

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(true);

      const agentsMdPath = path.join(result.packagePath!, '.gitlab/duo/AGENTS.md');
      const agentsMdContent = await fs.readFile(agentsMdPath, 'utf8');

      expect(agentsMdContent).toContain('Read file contents from repository');
      expect(agentsMdContent).toContain('Create a new GitLab issue');
    });

    it('should include LLM configuration in AGENTS.md', async () => {
      const manifest = createTestManifest({
        spec: {
          role: 'You are a test agent.',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.5,
            maxTokens: 2048,
          },
          tools: [],
        },
      });

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(true);

      const agentsMdPath = path.join(result.packagePath!, '.gitlab/duo/AGENTS.md');
      const agentsMdContent = await fs.readFile(agentsMdPath, 'utf8');

      expect(agentsMdContent).toContain('anthropic');
      expect(agentsMdContent).toContain('claude-sonnet-4-20250514');
      expect(agentsMdContent).toContain('0.5');
      expect(agentsMdContent).toContain('2048');
    });

    it('should include deployment instructions in DEPLOYMENT.md', async () => {
      const manifest = createTestManifest();

      const result = await generator.generate(manifest, {
        outputDir: tempDir,
      });

      expect(result.success).toBe(true);

      const deploymentPath = path.join(result.packagePath!, 'DEPLOYMENT.md');
      const deploymentContent = await fs.readFile(deploymentPath, 'utf8');

      expect(deploymentContent).toContain('# Deployment Guide');
      expect(deploymentContent).toContain('Flow Agent');
      expect(deploymentContent).toContain('External Agent');
      expect(deploymentContent).toContain('glab duo');
    });
  });
});
