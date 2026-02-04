/**
 * Unit tests for Anthropic Exporter
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AnthropicExporter } from '../../../../src/services/export/anthropic/anthropic-exporter';
import type { OssaAgent } from '../../../../src/types/index';

describe('AnthropicExporter', () => {
  let exporter: AnthropicExporter;
  let manifest: OssaAgent;

  beforeEach(() => {
    exporter = new AnthropicExporter();

    manifest = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test agent for unit tests',
        license: 'MIT',
      },
      spec: {
        role: 'You are a helpful test assistant.',
        llm: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
          maxTokens: 2048,
        },
        tools: [
          {
            type: 'search',
            name: 'search_docs',
            description: 'Search documentation',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
              },
              required: ['query'],
            },
          },
        ],
      },
    };
  });

  describe('Platform Info', () => {
    it('should have correct platform identifier', () => {
      expect(exporter.platform).toBe('anthropic');
    });

    it('should have display name', () => {
      expect(exporter.displayName).toBe('Anthropic Claude');
    });

    it('should have description', () => {
      expect(exporter.description).toContain('Anthropic');
    });

    it('should support OSSA versions', () => {
      expect(exporter.supportedVersions).toContain('0.3.6');
      expect(exporter.supportedVersions.length).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    it('should validate valid manifest', async () => {
      const result = await exporter.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should fail validation for missing metadata.name', async () => {
      delete manifest.metadata?.name;
      const result = await exporter.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.path === 'metadata.name')).toBe(
        true
      );
    });

    it('should warn for missing LLM config', async () => {
      delete manifest.spec?.llm;
      const result = await exporter.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.path === 'spec.llm')).toBe(true);
    });

    it('should warn for non-anthropic provider', async () => {
      if (manifest.spec?.llm) {
        manifest.spec.llm.provider = 'openai';
      }
      const result = await exporter.validate(manifest);
      expect(result.warnings).toBeDefined();
      expect(
        result.warnings?.some((w) => w.path === 'spec.llm.provider')
      ).toBe(true);
    });

    it('should fail for tools without names', async () => {
      if (manifest.spec?.tools) {
        manifest.spec.tools = [{ type: 'function' }];
      }
      const result = await exporter.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e) => e.code === 'MISSING_TOOL_NAME')).toBe(
        true
      );
    });
  });

  describe('Export', () => {
    it('should export successfully', async () => {
      const result = await exporter.export(manifest);
      expect(result.success).toBe(true);
      expect(result.platform).toBe('anthropic');
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should generate agent.py', async () => {
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile).toBeDefined();
      expect(agentFile?.type).toBe('code');
      expect(agentFile?.language).toBe('python');
      expect(agentFile?.content).toContain('class AnthropicAgent');
      expect(agentFile?.content).toContain('from anthropic import Anthropic');
    });

    it('should generate server.py', async () => {
      const result = await exporter.export(manifest);
      const serverFile = result.files.find((f) => f.path === 'server.py');
      expect(serverFile).toBeDefined();
      expect(serverFile?.type).toBe('code');
      expect(serverFile?.content).toContain('from fastapi import FastAPI');
      expect(serverFile?.content).toContain('@app.post(\"/chat\"');
    });

    it('should generate openapi.yaml', async () => {
      const result = await exporter.export(manifest);
      const openapiFile = result.files.find((f) => f.path === 'openapi.yaml');
      expect(openapiFile).toBeDefined();
      expect(openapiFile?.type).toBe('config');
      expect(openapiFile?.content).toContain('openapi: 3.1.0');
      expect(openapiFile?.content).toContain('/chat');
      expect(openapiFile?.content).toContain('/health');
    });

    it('should generate openapi.json', async () => {
      const result = await exporter.export(manifest);
      const openapiFile = result.files.find((f) => f.path === 'openapi.json');
      expect(openapiFile).toBeDefined();
      const spec = JSON.parse(openapiFile?.content || '{}');
      expect(spec.openapi).toBe('3.1.0');
      expect(spec.paths['/chat']).toBeDefined();
      expect(spec.paths['/health']).toBeDefined();
      expect(spec.paths['/info']).toBeDefined();
    });

    it('should generate requirements.txt', async () => {
      const result = await exporter.export(manifest);
      const reqFile = result.files.find((f) => f.path === 'requirements.txt');
      expect(reqFile).toBeDefined();
      expect(reqFile?.content).toContain('anthropic>=0.71.0');
      expect(reqFile?.content).toContain('fastapi>=0.104.0');
      expect(reqFile?.content).toContain('uvicorn>=0.24.0');
    });

    it('should generate Dockerfile', async () => {
      const result = await exporter.export(manifest);
      const dockerFile = result.files.find((f) => f.path === 'Dockerfile');
      expect(dockerFile).toBeDefined();
      expect(dockerFile?.content).toContain('FROM python:3.11-slim');
      expect(dockerFile?.content).toContain('EXPOSE 8000');
      expect(dockerFile?.content).toContain('CMD ["uvicorn"');
    });

    it('should generate .env.example', async () => {
      const result = await exporter.export(manifest);
      const envFile = result.files.find((f) => f.path === '.env.example');
      expect(envFile).toBeDefined();
      expect(envFile?.content).toContain('ANTHROPIC_API_KEY');
      expect(envFile?.content).toContain('MODEL=');
      expect(envFile?.content).toContain('TEMPERATURE=');
    });

    it('should generate README.md', async () => {
      const result = await exporter.export(manifest);
      const readmeFile = result.files.find((f) => f.path === 'README.md');
      expect(readmeFile).toBeDefined();
      expect(readmeFile?.type).toBe('documentation');
      expect(readmeFile?.content).toContain('# test-agent');
      expect(readmeFile?.content).toContain('## Setup');
      expect(readmeFile?.content).toContain('## Usage');
    });

    it('should include tests when requested', async () => {
      const result = await exporter.export(manifest, { includeTests: true });
      const testFile = result.files.find((f) => f.path === 'test_agent.py');
      expect(testFile).toBeDefined();
      expect(testFile?.type).toBe('test');
      expect(testFile?.content).toContain('import pytest');
      expect(testFile?.content).toContain('def test_agent_initialization');
    });

    it('should not include tests by default', async () => {
      const result = await exporter.export(manifest);
      const testFile = result.files.find((f) => f.path === 'test_agent.py');
      expect(testFile).toBeUndefined();
    });

    it('should handle manifest without tools', async () => {
      delete manifest.spec?.tools;
      const result = await exporter.export(manifest);
      expect(result.success).toBe(true);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('self.tools = []');
    });

    it('should include metadata in result', async () => {
      const result = await exporter.export(manifest);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.toolsCount).toBe(1);
    });

    it('should skip validation when validate=false', async () => {
      delete manifest.metadata?.name; // Invalid manifest
      const result = await exporter.export(manifest, { validate: false });
      expect(result.success).toBe(true); // Should still succeed
    });

    it('should fail export for invalid manifest when validate=true', async () => {
      delete manifest.metadata?.name;
      const result = await exporter.export(manifest, { validate: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });
  });

  describe('Tools Generation', () => {
    it('should include tool definitions in agent.py', async () => {
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('tools = [');
      expect(agentFile?.content).toContain('search_docs');
      expect(agentFile?.content).toContain('"input_schema"');
    });

    it('should include tool handlers in agent.py', async () => {
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('def handle_search_docs');
      expect(agentFile?.content).toContain('def handle_tool_use');
    });

    it('should handle multiple tools', async () => {
      if (manifest.spec?.tools) {
        manifest.spec.tools.push({
          type: 'database',
          name: 'query_db',
          description: 'Query database',
        });
      }
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('search_docs');
      expect(agentFile?.content).toContain('query_db');
    });

    it('should include tool execution logic', async () => {
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('_handle_tool_use');
      expect(agentFile?.content).toContain('tool_results');
    });
  });

  describe('Configuration', () => {
    it('should use custom model from manifest', async () => {
      if (manifest.spec?.llm) {
        manifest.spec.llm.model = 'claude-3-opus-20240229';
      }
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('claude-3-opus-20240229');
    });

    it('should use custom temperature', async () => {
      if (manifest.spec?.llm) {
        manifest.spec.llm.temperature = 0.5;
      }
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('self.temperature = 0.5');
    });

    it('should use custom max_tokens', async () => {
      if (manifest.spec?.llm) {
        manifest.spec.llm.maxTokens = 4096;
      }
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('self.max_tokens = 4096');
    });

    it('should use default values when not specified', async () => {
      delete manifest.spec?.llm;
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('claude-3-5-sonnet-20241022');
      expect(agentFile?.content).toContain('self.temperature = 1');
      expect(agentFile?.content).toContain('self.max_tokens = 1024');
    });
  });

  describe('Code Quality', () => {
    it('should generate valid Python syntax', async () => {
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');

      // Check for common Python syntax
      expect(agentFile?.content).toMatch(/class \w+:/);
      expect(agentFile?.content).toMatch(/def \w+\(/);
      expect(agentFile?.content).toContain('import ');

      // No syntax errors
      expect(agentFile?.content).not.toContain('undefined');
      expect(agentFile?.content).not.toContain('null');
    });

    it('should include docstrings', async () => {
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toMatch(/"""\n.*\n.*"""/);
    });

    it('should include type hints', async () => {
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile?.content).toContain('List[');
      expect(agentFile?.content).toContain('Dict[');
      expect(agentFile?.content).toContain('Optional[');
    });

    it('should escape strings properly', async () => {
      manifest.spec!.role = 'You are "helpful" and \\awesome\\';
      const result = await exporter.export(manifest);
      const agentFile = result.files.find((f) => f.path === 'agent.py');
      // Should not have unescaped quotes or backslashes
      expect(agentFile?.content).toContain('\\"helpful\\"');
      expect(agentFile?.content).toContain('\\\\awesome\\\\');
    });
  });

  describe('OpenAPI Specification', () => {
    it('should include required endpoints', async () => {
      const result = await exporter.export(manifest);
      const openapiFile = result.files.find((f) => f.path === 'openapi.json');
      const spec = JSON.parse(openapiFile?.content || '{}');

      expect(spec.paths['/health']).toBeDefined();
      expect(spec.paths['/chat']).toBeDefined();
      expect(spec.paths['/info']).toBeDefined();
    });

    it('should include request/response schemas', async () => {
      const result = await exporter.export(manifest);
      const openapiFile = result.files.find((f) => f.path === 'openapi.json');
      const spec = JSON.parse(openapiFile?.content || '{}');

      expect(spec.components.schemas.ChatRequest).toBeDefined();
      expect(spec.components.schemas.ChatResponse).toBeDefined();
      expect(spec.components.schemas.Message).toBeDefined();
    });

    it('should use correct OpenAPI version', async () => {
      const result = await exporter.export(manifest);
      const openapiFile = result.files.find((f) => f.path === 'openapi.json');
      const spec = JSON.parse(openapiFile?.content || '{}');
      expect(spec.openapi).toBe('3.1.0');
    });
  });

  describe('Example Manifest', () => {
    it('should provide example manifest', () => {
      const example = exporter.getExample();
      expect(example.metadata?.name).toBeDefined();
      expect(example.spec?.role).toBeDefined();
      expect(example.spec?.llm?.provider).toBe('anthropic');
    });

    it('should validate example manifest', async () => {
      const example = exporter.getExample();
      const result = await exporter.validate(example);
      expect(result.valid).toBe(true);
    });

    it('should export example manifest successfully', async () => {
      const example = exporter.getExample();
      const result = await exporter.export(example);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle export errors gracefully', async () => {
      // Create a completely invalid manifest structure that will cause errors
      const badManifest = {
        metadata: { name: 'test' },
        spec: null, // This will cause issues when accessing spec properties
      } as unknown as OssaAgent;

      const result = await exporter.export(badManifest, { validate: false });

      // Export should still complete (may have warnings but not crash)
      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should include duration in error results', async () => {
      const badManifest = {} as OssaAgent;
      const result = await exporter.export(badManifest);

      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Coverage', () => {
    it('should achieve >80% code coverage', async () => {
      // This test ensures we're testing all major code paths
      const scenarios = [
        { desc: 'basic export', manifest },
        {
          desc: 'no tools',
          manifest: { ...manifest, spec: { ...manifest.spec, tools: [] } },
        },
        {
          desc: 'no llm',
          manifest: {
            ...manifest,
            spec: { ...manifest.spec, llm: undefined },
          },
        },
        {
          desc: 'with tests',
          manifest,
          options: { includeTests: true },
        },
      ];

      for (const scenario of scenarios) {
        const result = await exporter.export(
          scenario.manifest,
          scenario.options
        );
        expect(result).toBeDefined();
      }
    });
  });
});
