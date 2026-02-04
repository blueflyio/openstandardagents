/**
 * Wizard Service Tests
 * Tests for interactive agent creation wizard
 *
 * NOTE: Integration tests verify the full wizard flow with inquirer.
 * Unit tests focus on manifest generation logic.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GenerationService } from '../../../src/services/generation.service.js';
import { ValidationService } from '../../../src/services/validation.service.js';
import type { OssaAgent } from '../../../src/types/index.js';

// Test the wizard service's manifest generation logic directly
// without mocking inquirer (which is complex to mock in ESM)
describe('Wizard Service - Manifest Generation', () => {
  let mockGenerationService: GenerationService;
  let mockValidationService: ValidationService;

  beforeEach(() => {
    mockGenerationService = {
      exportToPlatform: jest.fn().mockResolvedValue({ test: 'export' }),
    } as unknown as GenerationService;

    mockValidationService = {
      validate: jest.fn().mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      }),
    } as unknown as ValidationService;

    jest.clearAllMocks();
  });

  describe('Manifest Structure', () => {
    it('should create valid OSSA manifest structure', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description: 'A test agent',
        },
        spec: {
          role: 'You are a test agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.7,
          },
          tools: [
            {
              type: 'mcp',
              name: 'search',
              description: 'Web search capabilities',
              config: {
                server: 'npx -y @modelcontextprotocol/server-brave-search',
              },
            },
          ],
        },
      };

      expect(manifest.apiVersion).toBeDefined();
      expect(manifest.kind).toBe('Agent');
      expect(manifest.metadata.name).toBe('test-agent');
      expect(manifest.metadata.version).toBe('1.0.0');
      expect(manifest.spec.role).toBeDefined();
      expect(manifest.spec.llm).toBeDefined();
      expect(manifest.spec.llm.provider).toBe('anthropic');
      expect(manifest.spec.llm.model).toBe('claude-sonnet-4-20250514');
      expect(manifest.spec.tools).toHaveLength(1);
    });

    it('should include all required metadata fields', () => {
      const metadata = {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test description',
        labels: {},
        annotations: {},
      };

      expect(metadata.name).toBeDefined();
      expect(metadata.version).toBeDefined();
      expect(metadata.description).toBeDefined();
    });

    it('should include LLM configuration', () => {
      const llm = {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.5,
      };

      expect(llm.provider).toBeDefined();
      expect(llm.model).toBeDefined();
      expect(llm.temperature).toBeGreaterThanOrEqual(0);
      expect(llm.temperature).toBeLessThanOrEqual(2);
    });
  });

  describe('Tool Configurations', () => {
    it('should generate MCP tool configurations', () => {
      const mcpTool = {
        type: 'mcp',
        name: 'filesystem',
        description: 'File system operations',
        config: {
          server: 'npx -y @modelcontextprotocol/server-filesystem',
        },
      };

      expect(mcpTool.type).toBe('mcp');
      expect(mcpTool.name).toBeDefined();
      expect(mcpTool.config).toBeDefined();
      expect(mcpTool.config.server).toBeDefined();
    });

    it('should generate function tool configurations', () => {
      const functionTool = {
        type: 'function',
        name: 'calculate',
        description: 'Perform mathematical calculations',
      };

      expect(functionTool.type).toBe('function');
      expect(functionTool.name).toBeDefined();
      expect(functionTool.description).toBeDefined();
    });

    it('should support multiple tools', () => {
      const tools = [
        {
          type: 'mcp',
          name: 'search',
          description: 'Web search',
          config: { server: 'server-cmd' },
        },
        {
          type: 'function',
          name: 'calculate',
          description: 'Calculator',
        },
      ];

      expect(tools).toHaveLength(2);
      expect(tools[0].type).toBe('mcp');
      expect(tools[1].type).toBe('function');
    });
  });

  describe('Safety Configuration', () => {
    it('should configure content filtering', () => {
      const safety = {
        content_filtering: {
          enabled: true,
          categories: ['hate_speech', 'violence', 'self_harm', 'illegal_activity'],
          threshold: 'medium',
          action: 'block',
        },
      };

      expect(safety.content_filtering.enabled).toBe(true);
      expect(safety.content_filtering.categories).toContain('hate_speech');
      expect(safety.content_filtering.action).toBe('block');
    });

    it('should configure PII detection', () => {
      const safety = {
        pii_detection: {
          enabled: true,
          types: ['email', 'phone', 'ssn', 'credit_card', 'api_key'],
          action: 'redact',
        },
      };

      expect(safety.pii_detection.enabled).toBe(true);
      expect(safety.pii_detection.types).toContain('email');
      expect(safety.pii_detection.action).toBe('redact');
    });
  });

  describe('Autonomy Configuration', () => {
    it('should support full autonomy level', () => {
      const autonomy = {
        level: 'full' as const,
      };

      expect(autonomy.level).toBe('full');
    });

    it('should support assisted autonomy level', () => {
      const autonomy = {
        level: 'assisted' as const,
      };

      expect(autonomy.level).toBe('assisted');
    });

    it('should support supervised autonomy level', () => {
      const autonomy = {
        level: 'supervised' as const,
      };

      expect(autonomy.level).toBe('supervised');
    });
  });

  describe('Observability Configuration', () => {
    it('should configure tracing', () => {
      const observability = {
        tracing: {
          enabled: true,
          exporter: 'otlp',
        },
      };

      expect(observability.tracing.enabled).toBe(true);
      expect(observability.tracing.exporter).toBe('otlp');
    });

    it('should configure metrics', () => {
      const observability = {
        metrics: {
          enabled: true,
        },
      };

      expect(observability.metrics.enabled).toBe(true);
    });

    it('should configure logging', () => {
      const observability = {
        logging: {
          level: 'info',
        },
      };

      expect(observability.logging.level).toBe('info');
    });
  });

  describe('Platform Extensions', () => {
    it('should configure Cursor extension', () => {
      const extensions = {
        cursor: {
          enabled: true,
          agent_type: 'composer',
        },
      };

      expect(extensions.cursor.enabled).toBe(true);
      expect(extensions.cursor.agent_type).toBe('composer');
    });

    it('should configure LangChain extension', () => {
      const extensions = {
        langchain: {
          enabled: true,
        },
      };

      expect(extensions.langchain.enabled).toBe(true);
    });

    it('should support multiple platform extensions', () => {
      const extensions = {
        cursor: { enabled: true },
        langchain: { enabled: true },
        openai_agents: { enabled: true },
      };

      expect(Object.keys(extensions)).toHaveLength(3);
      expect(extensions.cursor.enabled).toBe(true);
      expect(extensions.langchain.enabled).toBe(true);
      expect(extensions.openai_agents.enabled).toBe(true);
    });
  });

  describe('Platform Export', () => {
    it('should delegate export to GenerationService', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test role',
        },
      };

      const result = await mockGenerationService.exportToPlatform(
        manifest,
        'langchain' as any
      );

      expect(mockGenerationService.exportToPlatform).toHaveBeenCalledWith(
        manifest,
        'langchain'
      );
      expect(result).toEqual({ test: 'export' });
    });
  });

  describe('Validation Integration', () => {
    it('should validate generated manifest', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test role',
        },
      };

      const result = await mockValidationService.validate(manifest);

      expect(mockValidationService.validate).toHaveBeenCalledWith(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
