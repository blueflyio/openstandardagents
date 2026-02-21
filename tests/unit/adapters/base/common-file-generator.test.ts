/**
 * Common File Generator - Unit tests for package.json, README, tsconfig, gitignore, perfect bundle
 */

import { describe, it, expect } from '@jest/globals';
import {
  generatePackageJson,
  generateTsConfig,
  generateGitIgnore,
  generateDockerIgnore,
  generateReadme,
  generateLicense,
  generateChangelog,
  generatePerfectAgentBundle,
  generateAgentsMdFile,
} from '../../../../src/adapters/base/common-file-generator.js';
import type { OssaAgent } from '../../../../src/types/index.js';
import { API_VERSION } from '../../../../src/version.js';

const minimalManifest: OssaAgent = {
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: { name: 'my-agent', version: '1.0.0', description: 'Test agent' },
  spec: {
    role: 'You are helpful.',
    llm: { provider: 'openai', model: 'gpt-4' },
    tools: [
      { name: 'search', description: 'Search the web', type: 'function' },
    ],
  },
};

describe('generatePackageJson', () => {
  it('produces valid JSON with name, version, description', () => {
    const out = generatePackageJson(minimalManifest, 'npm');
    const pkg = JSON.parse(out);
    expect(pkg.name).toBe('my-agent');
    expect(pkg.version).toBe('1.0.0');
    expect(pkg.description).toContain('Test agent');
    expect(pkg.type).toBe('module');
    expect(pkg.scripts).toBeDefined();
    expect(pkg.keywords).toContain('ossa');
  });

  it('uses scope when provided', () => {
    const out = generatePackageJson(minimalManifest, 'npm', {
      scope: '@myorg',
    });
    const pkg = JSON.parse(out);
    expect(pkg.name).toBe('@myorg/my-agent');
  });

  it('merges platform scripts and optional scripts', () => {
    const out = generatePackageJson(minimalManifest, 'langchain', {
      scripts: { custom: 'echo custom' },
    });
    const pkg = JSON.parse(out);
    expect(pkg.scripts.start).toBeDefined();
    expect(pkg.scripts.custom).toBe('echo custom');
  });
});

describe('generateTsConfig', () => {
  it('produces valid tsconfig with defaults', () => {
    const out = generateTsConfig();
    const config = JSON.parse(out);
    expect(config.compilerOptions.target).toBe('ES2022');
    expect(config.compilerOptions.module).toBe('Node16');
    expect(config.compilerOptions.strict).toBe(true);
  });

  it('accepts overrides', () => {
    const out = generateTsConfig({
      target: 'ES2020',
      outDir: 'dist',
      strict: false,
    });
    const config = JSON.parse(out);
    expect(config.compilerOptions.target).toBe('ES2020');
    expect(config.compilerOptions.outDir).toBe('dist');
    expect(config.compilerOptions.strict).toBe(false);
  });
});

describe('generateGitIgnore', () => {
  it('returns string with node_modules and dist', () => {
    const out = generateGitIgnore('npm');
    expect(out).toContain('node_modules/');
    expect(out).toContain('dist/');
  });
});

describe('generateDockerIgnore', () => {
  it('returns string with node_modules and tests', () => {
    const out = generateDockerIgnore();
    expect(out).toContain('node_modules/');
    expect(out).toContain('tests/');
  });
});

describe('generateReadme', () => {
  it('includes name, description, role, installation, usage', () => {
    const out = generateReadme(minimalManifest, 'npm');
    expect(out).toContain('# my-agent');
    expect(out).toContain('Test agent');
    expect(out).toContain('You are helpful.');
    expect(out).toContain('## Installation');
    expect(out).toContain('npm install');
    expect(out).toContain('## Tools');
    expect(out).toContain('search');
  });

  it('accepts section overrides', () => {
    const out = generateReadme(minimalManifest, 'npm', {
      installation: 'custom install',
      usage: 'custom usage',
    });
    expect(out).toContain('custom install');
    expect(out).toContain('custom usage');
  });
});

describe('generateLicense', () => {
  it('returns MIT license with current year', () => {
    const out = generateLicense('MIT');
    expect(out).toContain('MIT License');
    expect(out).toContain(String(new Date().getFullYear()));
  });
});

describe('generateChangelog', () => {
  it('returns changelog content with agent name', () => {
    const out = generateChangelog(minimalManifest);
    expect(out).toContain('my-agent');
    expect(out).toContain('1.0.0');
  });
});

describe('generateAgentsMdFile', () => {
  it('returns ExportFile with path and AGENTS.md content', () => {
    const file = generateAgentsMdFile(minimalManifest);
    expect(file.path).toMatch(/AGENTS\.md$/);
    expect(file.content).toContain('# my-agent');
    expect(file.content).toContain('You are helpful.');
  });
});

describe('generatePerfectAgentBundle', () => {
  it('returns empty array when no options', () => {
    const files = generatePerfectAgentBundle(minimalManifest);
    expect(Array.isArray(files)).toBe(true);
  });

  it('includes evals when includeEvals true', () => {
    const files = generatePerfectAgentBundle(minimalManifest, {
      includeEvals: true,
    });
    const evals = files.find((f) => f.path.includes('clear-evals'));
    expect(evals).toBeDefined();
  });

  it('includes governance when includeGovernance true', () => {
    const files = generatePerfectAgentBundle(minimalManifest, {
      includeGovernance: true,
    });
    const gov = files.find((f) => f.path.includes('policy.json'));
    expect(gov).toBeDefined();
  });

  it('includes observability when includeObservability true', () => {
    const files = generatePerfectAgentBundle(minimalManifest, {
      includeObservability: true,
    });
    const otel = files.find((f) => f.path.includes('otel-config'));
    expect(otel).toBeDefined();
  });

  it('includes AGENTS.md when includeAgentsMd true', () => {
    const files = generatePerfectAgentBundle(minimalManifest, {
      includeAgentsMd: true,
    });
    const agentsMd = files.find((f) => f.path.endsWith('AGENTS.md'));
    expect(agentsMd).toBeDefined();
  });

  it('includes all when perfectAgent true', () => {
    const files = generatePerfectAgentBundle(minimalManifest, {
      perfectAgent: true,
    });
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.path.includes('clear-evals'))).toBe(true);
    expect(files.some((f) => f.path.includes('policy.json'))).toBe(true);
    expect(files.some((f) => f.path.includes('otel-config'))).toBe(true);
  });
});
