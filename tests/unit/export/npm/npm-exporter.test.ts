/**
 * NPM Exporter Tests
 *
 * Tests for NPM package generation functionality
 * Target: >80% coverage
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NPMExporter } from '../../../../src/services/export/npm/npm-exporter.js';
import type { OssaAgent } from '../../../../src/types/index.js';

describe('NPMExporter', () => {
  let exporter: NPMExporter;
  let basicManifest: OssaAgent;
  let fullManifest: OssaAgent;

  beforeEach(() => {
    exporter = new NPMExporter();

    // Basic minimal manifest
    basicManifest = {
      apiVersion: 'ossa/v0.4.0',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'You are a helpful assistant.',
      },
    };

    // Full featured manifest
    fullManifest = {
      apiVersion: 'ossa/v0.4.0',
      kind: 'Agent',
      metadata: {
        name: 'advanced-agent',
        version: '2.1.0',
        description: 'An advanced AI agent with multiple capabilities',
        author: 'OSSA Team',
        license: 'Apache-2.0',
        annotations: {
          repository: 'https://github.com/ossa/advanced-agent',
          homepage: 'https://ossa.org/agents/advanced-agent',
        },
        labels: {
          category: 'productivity',
          framework: 'ossa',
        },
      },
      spec: {
        role: 'You are an advanced AI agent that helps with productivity tasks.',
        llm: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
          maxTokens: 4000,
        },
        tools: [
          {
            name: 'search',
            description: 'Search the web for information',
            type: 'api',
          },
          {
            name: 'calculator',
            description: 'Perform mathematical calculations',
            type: 'function',
          },
        ],
        capabilities: ['conversation', 'tool-use', 'reasoning'],
      },
    };
  });

  describe('export()', () => {
    it('should export basic manifest successfully', async () => {
      const result = await exporter.export(basicManifest);

      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.packageName).toBe('test-agent');
      expect(result.version).toBe('1.0.0');
    });

    it('should export full manifest successfully', async () => {
      const result = await exporter.export(fullManifest);

      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(10);
      expect(result.packageName).toBe('advanced-agent');
      expect(result.version).toBe('2.1.0');
    });

    it('should generate package.json', async () => {
      const result = await exporter.export(basicManifest);

      const packageJson = result.files.find((f) => f.path === 'package.json');
      expect(packageJson).toBeDefined();
      expect(packageJson?.type).toBe('config');
      expect(packageJson?.language).toBe('json');

      const pkg = JSON.parse(packageJson!.content);
      expect(pkg.name).toBe('test-agent');
      expect(pkg.version).toBe('1.0.0');
      expect(pkg.type).toBe('module');
    });

    it('should generate TypeScript agent class', async () => {
      const result = await exporter.export(basicManifest);

      const indexTs = result.files.find((f) => f.path === 'src/index.ts');
      expect(indexTs).toBeDefined();
      expect(indexTs?.type).toBe('code');
      expect(indexTs?.language).toBe('typescript');
      expect(indexTs?.content).toContain('class');
      expect(indexTs?.content).toContain('async chat');
    });

    it('should generate TypeScript types', async () => {
      const result = await exporter.export(basicManifest);

      const typesTs = result.files.find((f) => f.path === 'src/types.ts');
      expect(typesTs).toBeDefined();
      expect(typesTs?.content).toContain('ChatRequest');
      expect(typesTs?.content).toContain('ChatResponse');
      expect(typesTs?.content).toContain('AgentMetadata');
    });

    it('should generate Express server', async () => {
      const result = await exporter.export(basicManifest);

      const serverTs = result.files.find((f) => f.path === 'src/server.ts');
      expect(serverTs).toBeDefined();
      expect(serverTs?.content).toContain('express');
      expect(serverTs?.content).toContain("post('/chat'");
      expect(serverTs?.content).toContain("get('/health'");
    });

    it('should generate OpenAPI spec', async () => {
      const result = await exporter.export(basicManifest);

      const openapi = result.files.find((f) => f.path === 'openapi.yaml');
      expect(openapi).toBeDefined();
      expect(openapi?.type).toBe('config');
      expect(openapi?.language).toBe('yaml');
      expect(openapi?.content).toContain('openapi: 3.1.0');
      expect(openapi?.content).toContain('/chat');
    });

    it('should generate tsconfig.json', async () => {
      const result = await exporter.export(basicManifest);

      const tsconfig = result.files.find((f) => f.path === 'tsconfig.json');
      expect(tsconfig).toBeDefined();
      expect(tsconfig?.content).toContain('compilerOptions');
      expect(tsconfig?.content).toContain('ES2022');
    });

    it('should generate README.md', async () => {
      const result = await exporter.export(basicManifest);

      const readme = result.files.find((f) => f.path === 'README.md');
      expect(readme).toBeDefined();
      expect(readme?.type).toBe('documentation');
      expect(readme?.content).toContain('# test-agent');
      expect(readme?.content).toContain('Installation');
      expect(readme?.content).toContain('Usage');
    });

    it('should generate .gitignore', async () => {
      const result = await exporter.export(basicManifest);

      const gitignore = result.files.find((f) => f.path === '.gitignore');
      expect(gitignore).toBeDefined();
      expect(gitignore?.content).toContain('node_modules');
      expect(gitignore?.content).toContain('dist');
    });

    it('should generate .npmignore', async () => {
      const result = await exporter.export(basicManifest);

      const npmignore = result.files.find((f) => f.path === '.npmignore');
      expect(npmignore).toBeDefined();
      expect(npmignore?.content).toContain('src/');
      expect(npmignore?.content).toContain('tests/');
    });

    it('should generate Docker files by default', async () => {
      const result = await exporter.export(basicManifest);

      const dockerfile = result.files.find((f) => f.path === 'Dockerfile');
      const dockerCompose = result.files.find((f) => f.path === 'docker-compose.yaml');

      expect(dockerfile).toBeDefined();
      expect(dockerfile?.type).toBe('docker');
      expect(dockerfile?.content).toContain('FROM node');

      expect(dockerCompose).toBeDefined();
      expect(dockerCompose?.type).toBe('docker');
      expect(dockerCompose?.content).toContain('version:');
    });

    it('should skip Docker files when includeDocker is false', async () => {
      const result = await exporter.export(basicManifest, {
        includeDocker: false,
      });

      const dockerfile = result.files.find((f) => f.path === 'Dockerfile');
      const dockerCompose = result.files.find((f) => f.path === 'docker-compose.yaml');

      expect(dockerfile).toBeUndefined();
      expect(dockerCompose).toBeUndefined();
    });

    it('should generate tests when includeTests is true', async () => {
      const result = await exporter.export(basicManifest, {
        includeTests: true,
      });

      const tests = result.files.find((f) => f.path === 'tests/agent.test.ts');
      expect(tests).toBeDefined();
      expect(tests?.type).toBe('code');
      expect(tests?.content).toContain('describe');
      expect(tests?.content).toContain('it');
    });

    it('should apply custom scope to package name', async () => {
      const result = await exporter.export(basicManifest, {
        scope: '@mycompany',
      });

      expect(result.packageName).toBe('@mycompany/test-agent');

      const pkg = JSON.parse(
        result.files.find((f) => f.path === 'package.json')!.content
      );
      expect(pkg.name).toBe('@mycompany/test-agent');
    });

    it('should handle tools correctly', async () => {
      const result = await exporter.export(fullManifest);

      // Should generate tool files
      const toolIndex = result.files.find((f) => f.path === 'src/tools/index.ts');
      expect(toolIndex).toBeDefined();

      const searchTool = result.files.find((f) => f.path === 'src/tools/search.ts');
      expect(searchTool).toBeDefined();
      expect(searchTool?.content).toContain('search');

      const calcTool = result.files.find((f) => f.path === 'src/tools/calculator.ts');
      expect(calcTool).toBeDefined();
      expect(calcTool?.content).toContain('calculator');
    });

    it('should include metadata in result', async () => {
      const result = await exporter.export(basicManifest);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.fileCount).toBeGreaterThan(0);
      expect(result.metadata?.hasDocker).toBe(true);
    });

    it('should handle different LLM providers', async () => {
      const providers = ['openai', 'anthropic', 'google-ai', 'bedrock'];

      for (const provider of providers) {
        const manifest = {
          ...basicManifest,
          spec: {
            ...basicManifest.spec,
            llm: {
              provider,
              model: 'test-model',
            },
          },
        };

        const result = await exporter.export(manifest);
        expect(result.success).toBe(true);

        // Check package.json has correct dependencies
        const pkg = JSON.parse(
          result.files.find((f) => f.path === 'package.json')!.content
        );
        expect(pkg.dependencies).toBeDefined();
      }
    });

    it('should sanitize package names', async () => {
      const manifest = {
        ...basicManifest,
        metadata: {
          ...basicManifest.metadata,
          name: 'My Test Agent!!!',
        },
      };

      const result = await exporter.export(manifest);
      expect(result.packageName).toBe('my-test-agent');
    });
  });

  describe('validation', () => {
    it('should fail when metadata.name is missing', async () => {
      const invalidManifest = {
        ...basicManifest,
        metadata: {
          version: '1.0.0',
        } as any,
      };

      const result = await exporter.export(invalidManifest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should fail when metadata.version is missing', async () => {
      const invalidManifest = {
        ...basicManifest,
        metadata: {
          name: 'test',
        } as any,
      };

      const result = await exporter.export(invalidManifest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('version');
    });

    it('should fail when spec is missing', async () => {
      const invalidManifest = {
        ...basicManifest,
        spec: undefined as any,
      };

      const result = await exporter.export(invalidManifest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('spec');
    });
  });

  describe('TypeScript compilation', () => {
    it('should generate valid TypeScript code', async () => {
      const result = await exporter.export(fullManifest);

      // Check all .ts files have basic syntax
      const tsFiles = result.files.filter((f) => f.path.endsWith('.ts'));
      expect(tsFiles.length).toBeGreaterThan(0);

      for (const file of tsFiles) {
        // Basic syntax checks
        expect(file.content).not.toContain('undefined');
        expect(file.content.split('{').length).toBe(file.content.split('}').length);
      }
    });
  });

  describe('integration', () => {
    it('should generate complete publishable package', async () => {
      const result = await exporter.export(fullManifest, {
        scope: '@ossa',
        includeTests: true,
        includeDocker: true,
      });

      expect(result.success).toBe(true);

      // Required files
      const requiredFiles = [
        'package.json',
        'src/index.ts',
        'src/types.ts',
        'src/server.ts',
        'openapi.yaml',
        'tsconfig.json',
        'README.md',
        '.gitignore',
        '.npmignore',
        'Dockerfile',
        'docker-compose.yaml',
        'tests/agent.test.ts',
      ];

      for (const file of requiredFiles) {
        const found = result.files.find((f) => f.path === file);
        expect(found).toBeDefined();
      }

      // Check package.json is valid
      const pkg = JSON.parse(
        result.files.find((f) => f.path === 'package.json')!.content
      );
      expect(pkg.name).toBe('@ossa/advanced-agent');
      expect(pkg.version).toBe('2.1.0');
      expect(pkg.dependencies).toBeDefined();
      expect(pkg.devDependencies).toBeDefined();
      expect(pkg.scripts).toBeDefined();
    });
  });
});
