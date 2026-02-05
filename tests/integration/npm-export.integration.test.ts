/**
 * NPM Export Integration Test
 *
 * Validates that generated packages are valid and compilable
 */

import { describe, it, expect } from '@jest/globals';
import { NPMExporter } from '../../src/services/export/npm/npm-exporter.js';
import type { OssaAgent } from '../../src/types/index.js';
import * as yaml from 'yaml';

describe('NPM Export Integration', () => {
  it('should generate valid package.json', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test agent',
      },
      spec: {
        role: 'Test role',
      },
    };

    const exporter = new NPMExporter();
    const result = await exporter.export(manifest);

    expect(result.success).toBe(true);

    // Parse and validate package.json
    const pkgFile = result.files.find((f) => f.path === 'package.json');
    expect(pkgFile).toBeDefined();

    const pkg = JSON.parse(pkgFile!.content);

    // Validate package.json structure
    expect(pkg.name).toBe('test-agent');
    expect(pkg.version).toBe('1.0.0');
    expect(pkg.type).toBe('module');
    expect(pkg.main).toBe('dist/index.js');
    expect(pkg.types).toBe('dist/index.d.ts');
    expect(pkg.dependencies).toBeDefined();
    expect(pkg.devDependencies).toBeDefined();
    expect(pkg.scripts).toBeDefined();

    // Validate scripts
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.start).toBeDefined();
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });

  it('should generate valid OpenAPI spec', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'api-agent',
        version: '2.0.0',
      },
      spec: {
        role: 'API agent',
      },
    };

    const exporter = new NPMExporter();
    const result = await exporter.export(manifest);

    const openapiFile = result.files.find((f) => f.path === 'openapi.yaml');
    expect(openapiFile).toBeDefined();

    // Parse and validate OpenAPI spec
    const spec = yaml.parse(openapiFile!.content);

    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('api-agent');
    expect(spec.info.version).toBe('2.0.0');
    expect(spec.paths).toBeDefined();
    expect(spec.paths['/chat']).toBeDefined();
    expect(spec.paths['/health']).toBeDefined();
    expect(spec.components).toBeDefined();
    expect(spec.components.schemas).toBeDefined();
  });

  it('should generate valid TypeScript files', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'ts-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'TypeScript agent',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
      },
    };

    const exporter = new NPMExporter();
    const result = await exporter.export(manifest);

    // Check all TypeScript files
    const tsFiles = result.files.filter((f) => f.path.endsWith('.ts'));
    expect(tsFiles.length).toBeGreaterThan(0);

    for (const file of tsFiles) {
      // Validate basic TypeScript syntax
      const content = file.content;

      // Should have balanced braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Should have proper imports/exports
      expect(
        content.includes('import') ||
          content.includes('export') ||
          content.includes('interface')
      ).toBe(true);
    }
  });

  it('should generate working Dockerfile', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'docker-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Docker agent',
      },
    };

    const exporter = new NPMExporter();
    const result = await exporter.export(manifest);

    const dockerfile = result.files.find((f) => f.path === 'Dockerfile');
    expect(dockerfile).toBeDefined();

    const content = dockerfile!.content;

    // Validate Dockerfile structure
    expect(content).toContain('FROM node');
    expect(content).toContain('WORKDIR');
    expect(content).toContain('COPY');
    expect(content).toContain('RUN npm ci');
    expect(content).toContain('EXPOSE 3000');
    expect(content).toContain('CMD');
  });

  it('should generate valid docker-compose.yaml', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'compose-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Compose agent',
      },
    };

    const exporter = new NPMExporter();
    const result = await exporter.export(manifest);

    const dockerCompose = result.files.find(
      (f) => f.path === 'docker-compose.yaml'
    );
    expect(dockerCompose).toBeDefined();

    // Parse and validate docker-compose
    const compose = yaml.parse(dockerCompose!.content);

    expect(compose.version).toBeDefined();
    expect(compose.services).toBeDefined();
    expect(Object.keys(compose.services).length).toBeGreaterThan(0);

    const serviceName = Object.keys(compose.services)[0];
    const service = compose.services[serviceName];

    expect(service.build).toBeDefined();
    expect(service.ports).toBeDefined();
    expect(service.environment).toBeDefined();
  });

  it('should generate complete publishable package', async () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'complete-agent',
        version: '3.2.1',
        description: 'A complete publishable agent',
        author: 'Test Author',
        license: 'MIT',
        annotations: {
          repository: 'https://github.com/test/complete-agent',
        },
      },
      spec: {
        role: 'Complete agent for testing',
        llm: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
        },
        tools: [
          {
            name: 'test-tool',
            description: 'Test tool',
          },
        ],
      },
    };

    const exporter = new NPMExporter();
    const result = await exporter.export(manifest, {
      scope: '@test',
      includeDocker: true,
      includeTests: true,
    });

    expect(result.success).toBe(true);

    // Required files for npm publish
    const requiredFiles = [
      'package.json',
      'README.md',
      'tsconfig.json',
      'src/index.ts',
      'src/types.ts',
      'src/server.ts',
    ];

    for (const file of requiredFiles) {
      const found = result.files.find((f) => f.path === file);
      expect(found).toBeDefined();
    }

    // Validate package name with scope
    expect(result.packageName).toBe('@test/complete-agent');

    const pkg = JSON.parse(
      result.files.find((f) => f.path === 'package.json')!.content
    );
    expect(pkg.name).toBe('@test/complete-agent');
    expect(pkg.version).toBe('3.2.1');
    expect(pkg.files).toContain('dist/');
  });
});
