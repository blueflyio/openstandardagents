/**
 * Symfony AI Platform Adapter unit tests.
 * Covers export, validation, toConfig, and tool stub generation.
 */

import { describe, it, expect } from '@jest/globals';
import { SymfonyAiPlatformAdapter } from '../../../../src/adapters/symfony/platform-adapter.js';
import type { OssaAgent } from '../../../../src/types/index.js';
import { API_VERSION } from '../../../../src/version.js';

describe('SymfonyAiPlatformAdapter', () => {
  const adapter = new SymfonyAiPlatformAdapter();

  const minimalManifest: OssaAgent = {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { name: 'test-agent', version: '1.0.0', description: 'Test' },
    spec: { role: 'You are a test agent.' },
  };

  it('has platform id symfony', () => {
    expect(adapter.platform).toBe('symfony');
    expect(adapter.displayName).toBe('Symfony AI Agent');
    expect(adapter.status).toBe('alpha');
    expect(adapter.supportedVersions).toContain('v0.4.x');
  });

  describe('export', () => {
    it('exports minimal agent to composer.json, agent_bootstrap.php, README.md, agent.ossa.yaml', async () => {
      const result = await adapter.export(minimalManifest);

      expect(result.success).toBe(true);
      expect(result.platform).toBe('symfony');
      expect(result.files).toBeDefined();
      expect(result.files.length).toBe(4);

      const baseName = 'test_agent';
      const composerFile = result.files.find(
        (f) => f.path === `${baseName}/composer.json`
      );
      expect(composerFile).toBeDefined();
      expect(composerFile?.content).toContain('"symfony/ai-agent"');
      expect(composerFile?.content).toContain('"symfony/ai-platform"');
      expect(composerFile?.content).toContain('"php": ">=8.2"');

      const bootstrapFile = result.files.find(
        (f) => f.path === `${baseName}/agent_bootstrap.php`
      );
      expect(bootstrapFile).toBeDefined();
      expect(bootstrapFile?.content).toContain('You are a test agent.');
      expect(bootstrapFile?.content).toContain('PlatformFactory::create');
      expect(bootstrapFile?.content).toContain('declare(strict_types=1)');
      expect(bootstrapFile?.language).toBe('php');

      const readmeFile = result.files.find(
        (f) => f.path === `${baseName}/README.md`
      );
      expect(readmeFile).toBeDefined();

      const ossaFile = result.files.find(
        (f) => f.path === `${baseName}/agent.ossa.yaml`
      );
      expect(ossaFile).toBeDefined();
    });

    it('includes llm provider, model, and temperature in bootstrap PHP', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'my-agent', version: '1.0.0' },
        spec: {
          role: 'Assistant',
          llm: {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet',
            temperature: 0.5,
          },
          tools: [
            { type: 'function', name: 'search', description: 'Search the web' },
          ],
        },
      };

      const result = await adapter.export(manifest);

      expect(result.success).toBe(true);
      const baseName = 'my_agent';
      const bootstrapFile = result.files.find(
        (f) => f.path === `${baseName}/agent_bootstrap.php`
      );
      expect(bootstrapFile?.content).toContain("'anthropic'");
      expect(bootstrapFile?.content).toContain("'claude-3-5-sonnet'");
      expect(bootstrapFile?.content).toContain("'temperature' => 0.5");
    });

    it('sanitizes agent name for path', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'My Cool Agent!', version: '1.0.0' },
        spec: { role: 'Test' },
      };

      const result = await adapter.export(manifest);

      expect(result.success).toBe(true);
      const baseName = 'My_Cool_Agent';
      expect(result.files.some((f) => f.path.startsWith(baseName))).toBe(true);
    });

    it('generates tool stub PHP files when tools are present', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'tool-agent', version: '1.0.0' },
        spec: {
          role: 'Agent with tools',
          tools: [
            {
              type: 'function',
              name: 'web-search',
              description: 'Search the web',
            },
            {
              type: 'function',
              name: 'file_reader',
              description: 'Read files',
            },
          ],
        },
      };

      const result = await adapter.export(manifest);

      expect(result.success).toBe(true);
      // 4 base files + 2 tool stubs
      expect(result.files.length).toBe(6);

      const searchStub = result.files.find((f) =>
        f.path.includes('WebSearchTool.php')
      );
      expect(searchStub).toBeDefined();
      expect(searchStub?.content).toContain('#[AsTool(');
      expect(searchStub?.content).toContain("name: 'web-search'");
      expect(searchStub?.content).toContain('class WebSearchTool');

      const readerStub = result.files.find((f) =>
        f.path.includes('FileReaderTool.php')
      );
      expect(readerStub).toBeDefined();
      expect(readerStub?.content).toContain('class FileReaderTool');
    });

    it('registers tool classes in bootstrap Toolbox when tools present', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'tool-agent', version: '1.0.0' },
        spec: {
          role: 'Agent with tools',
          tools: [{ type: 'function', name: 'search', description: 'Search' }],
        },
      };

      const result = await adapter.export(manifest);
      const bootstrap = result.files.find((f) =>
        f.path.includes('agent_bootstrap.php')
      );
      expect(bootstrap?.content).toContain('SearchTool()');
      expect(bootstrap?.content).toContain('new \\App\\Agent\\Tool\\');
    });

    it('uses defaults when llm config is missing', async () => {
      const result = await adapter.export(minimalManifest);
      const bootstrap = result.files.find((f) =>
        f.path.includes('agent_bootstrap.php')
      );
      expect(bootstrap?.content).toContain("'openai'");
      expect(bootstrap?.content).toContain("'gpt-4o-mini'");
      expect(bootstrap?.content).toContain("'temperature' => 0.7");
      expect(bootstrap?.content).toContain("'max_tokens' => 4096");
    });

    it('returns metadata with duration', async () => {
      const result = await adapter.export(minimalManifest);
      expect(result.metadata?.duration).toBeDefined();
      expect(typeof result.metadata?.duration).toBe('number');
      expect(result.metadata?.version).toBe('1.0');
    });

    it('fails export when validation fails', async () => {
      const bad = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: '', version: '' },
        spec: {},
      } as unknown as OssaAgent;

      const result = await adapter.export(bad);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('skips validation when validate option is false', async () => {
      const bad = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: '', version: '' },
        spec: {},
      } as unknown as OssaAgent;

      const result = await adapter.export(bad, { validate: false });
      expect(result.success).toBe(true);
    });
  });

  describe('validate', () => {
    it('passes for valid manifest', async () => {
      const result = await adapter.validate(minimalManifest);
      expect(result.valid).toBe(true);
    });

    it('fails when metadata.name is missing', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: '', version: '1.0.0' },
        spec: { role: 'test' },
      };
      const result = await adapter.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e) => e.path === 'metadata.name')).toBe(true);
    });

    it('warns when spec.role is missing', async () => {
      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: {},
      } as unknown as OssaAgent;
      const result = await adapter.validate(manifest);
      expect(result.valid).toBe(true);
      expect(
        result.warnings?.some((w) => w.code === 'SYMFONY_PROMPT_RECOMMENDED')
      ).toBe(true);
    });

    it('warns for unsupported LLM provider', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: {
          role: 'test',
          llm: { provider: 'some-unknown-provider', model: 'some-model' },
        },
      };
      const result = await adapter.validate(manifest);
      expect(result.valid).toBe(true);
      expect(
        result.warnings?.some((w) => w.code === 'SYMFONY_UNSUPPORTED_PROVIDER')
      ).toBe(true);
    });

    it('warns when tool is missing description', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: {
          role: 'test',
          tools: [{ type: 'function', name: 'search' }],
        },
      };
      const result = await adapter.validate(manifest);
      expect(result.valid).toBe(true);
      expect(
        result.warnings?.some((w) => w.code === 'SYMFONY_TOOL_DESCRIPTION')
      ).toBe(true);
    });

    it('accepts supported providers without warning', async () => {
      for (const provider of [
        'openai',
        'anthropic',
        'google',
        'mistral',
        'ollama',
      ]) {
        const manifest: OssaAgent = {
          apiVersion: API_VERSION,
          kind: 'Agent',
          metadata: { name: 'test', version: '1.0.0' },
          spec: { role: 'test', llm: { provider, model: 'test-model' } },
        };
        const result = await adapter.validate(manifest);
        expect(
          result.warnings?.some(
            (w) => w.code === 'SYMFONY_UNSUPPORTED_PROVIDER'
          )
        ).toBeFalsy();
      }
    });
  });

  describe('toConfig', () => {
    it('returns lightweight config with model and provider', async () => {
      const result = await adapter.toConfig(minimalManifest);
      expect(result.config.platform).toBe('openai');
      expect(result.config.model).toBe('gpt-4o-mini');
      expect(result.config.temperature).toBe(0.7);
      expect(result.config.max_tokens).toBe(4096);
      expect(result.config.system_message).toBe('You are a test agent.');
      expect(result.filename).toBe('test_agent.symfony.json');
    });

    it('includes tools in config', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: {
          role: 'test',
          tools: [{ type: 'function', name: 'search', description: 'Search' }],
        },
      };
      const result = await adapter.toConfig(manifest);
      expect(result.config.tools).toEqual([
        { name: 'search', description: 'Search' },
      ]);
    });

    it('includes OSSA metadata', async () => {
      const result = await adapter.toConfig(minimalManifest);
      const meta = result.config.metadata as Record<string, unknown>;
      expect(meta.ossa_name).toBe('test-agent');
      expect(meta.ossa_version).toBe('1.0.0');
      expect(meta.api_version).toBe(API_VERSION);
    });

    it('uses custom LLM config', async () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: {
          role: 'Custom',
          llm: {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet',
            temperature: 0.2,
            maxTokens: 2048,
          },
        },
      };
      const result = await adapter.toConfig(manifest);
      expect(result.config.platform).toBe('anthropic');
      expect(result.config.model).toBe('claude-3-5-sonnet');
      expect(result.config.temperature).toBe(0.2);
      expect(result.config.max_tokens).toBe(2048);
    });
  });

  describe('getExample', () => {
    it('returns a valid example manifest', () => {
      const example = adapter.getExample();
      expect(example.apiVersion).toBe('ossa/v0.4');
      expect(example.kind).toBe('Agent');
      expect(example.metadata?.name).toBe('example-symfony-agent');
      expect(example.spec?.role).toBeDefined();
    });
  });

  describe('generateToolStubs', () => {
    it('generates PHP stub files with #[AsTool] attribute', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'my-agent', version: '1.0.0' },
        spec: {
          role: 'test',
          tools: [
            {
              type: 'function',
              name: 'web-search',
              description: 'Search the web for information',
            },
            {
              type: 'function',
              name: 'file_reader',
              description: 'Read file contents',
            },
          ],
        },
      };

      const stubs = adapter.generateToolStubs(manifest);
      expect(stubs.length).toBe(2);

      expect(stubs[0].path).toBe('my_agent/src/Tool/WebSearchTool.php');
      expect(stubs[0].content).toContain('#[AsTool(');
      expect(stubs[0].content).toContain("name: 'web-search'");
      expect(stubs[0].content).toContain(
        "description: 'Search the web for information'"
      );
      expect(stubs[0].content).toContain('final class WebSearchTool');
      expect(stubs[0].content).toContain('namespace App\\Agent\\Tool;');
      expect(stubs[0].language).toBe('php');

      expect(stubs[1].path).toBe('my_agent/src/Tool/FileReaderTool.php');
      expect(stubs[1].content).toContain('class FileReaderTool');
    });

    it('returns empty array when no tools', () => {
      const stubs = adapter.generateToolStubs(minimalManifest);
      expect(stubs).toEqual([]);
    });

    it('skips tools without names', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: {
          role: 'test',
          tools: [
            { type: 'function', name: 'valid' },
            { type: 'function', description: 'no name' } as any,
          ],
        },
      };
      const stubs = adapter.generateToolStubs(manifest);
      expect(stubs.length).toBe(1);
    });
  });
});
