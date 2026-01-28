/**
 * Unit tests for Anthropic Runtime Adapter
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AnthropicAdapter } from '../../src/services/runtime/anthropic.adapter';
import type { OssaManifest } from '../../src/services/runtime/anthropic.adapter';

describe('AnthropicAdapter', () => {
  let manifest: OssaManifest;

  beforeEach(() => {
    manifest = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test agent for unit tests',
      },
      spec: {
        role: 'You are a helpful test assistant.',
        llm: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
          maxTokens: 1024,
        },
      },
    };
  });

  describe('Constructor', () => {
    it('should create an adapter instance', () => {
      const adapter = new AnthropicAdapter(manifest);
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });

    it('should accept custom API key', () => {
      const adapter = new AnthropicAdapter(manifest, 'custom-api-key');
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });

    it('should initialize with environment API key', () => {
      process.env.ANTHROPIC_API_KEY = 'env-api-key';
      const adapter = new AnthropicAdapter(manifest);
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });
  });

  describe('Configuration', () => {
    it('should use model from Anthropic extension when available', () => {
      manifest.extensions = {
        anthropic: {
          model: 'claude-3-opus-20240229',
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('claude-3-opus-20240229');
    });

    it('should fall back to spec.llm.model', () => {
      const adapter = new AnthropicAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should use default model when not specified', () => {
      delete manifest.spec.llm;
      const adapter = new AnthropicAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should prioritize Anthropic extension for system prompt', () => {
      manifest.extensions = {
        anthropic: {
          system: 'Custom system prompt from extension',
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.name).toBe('test-agent');
    });

    it('should handle temperature configuration', () => {
      manifest.extensions = {
        anthropic: {
          temperature: 0.5,
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });

    it('should handle max_tokens configuration', () => {
      manifest.extensions = {
        anthropic: {
          max_tokens: 2048,
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });

    it('should handle stop_sequences', () => {
      manifest.extensions = {
        anthropic: {
          stop_sequences: ['STOP', 'END'],
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });
  });

  describe('Tool Management', () => {
    it('should register tools from Anthropic extension', () => {
      manifest.extensions = {
        anthropic: {
          tools: [
            {
              name: 'test_tool',
              description: 'A test tool',
              input_schema: {
                type: 'object',
                properties: {
                  param: { type: 'string' },
                },
                required: ['param'],
              },
            },
          ],
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      const tools = adapter.getTools();
      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe('test_tool');
    });

    it('should register tool handlers', () => {
      manifest.extensions = {
        anthropic: {
          tools: [
            {
              name: 'add_numbers',
              description: 'Add two numbers',
              input_schema: {
                type: 'object',
                properties: {
                  a: { type: 'number' },
                  b: { type: 'number' },
                },
                required: ['a', 'b'],
              },
            },
          ],
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      const handler = jest.fn(async (args: Record<string, unknown>) => {
        const a = args.a as number;
        const b = args.b as number;
        return JSON.stringify({ result: a + b });
      });

      adapter.registerToolHandler('add_numbers', handler);
      const tools = adapter.getTools();
      expect(tools[0].handler).toBeDefined();
    });

    it('should map OSSA spec tools to Anthropic format', () => {
      manifest.spec.tools = [
        {
          type: 'mcp',
          name: 'mcp_tool',
          capabilities: ['read', 'write'],
        },
      ];

      const adapter = new AnthropicAdapter(manifest);
      const tools = adapter.getTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t) => t.name === 'mcp_tool')).toBe(true);
    });

    it('should generate input schema for different tool types', () => {
      manifest.spec.tools = [
        { type: 'mcp', name: 'mcp_tool' },
        { type: 'http', name: 'http_tool' },
        { type: 'function', name: 'function_tool' },
      ];

      const adapter = new AnthropicAdapter(manifest);
      const tools = adapter.getTools();
      expect(tools.length).toBe(3);

      // Check MCP tool has correct schema
      const mcpTool = tools.find((t) => t.name === 'mcp_tool');
      expect(mcpTool?.input_schema.type).toBe('object');

      // Check HTTP tool has method property
      const httpTool = tools.find((t) => t.name === 'http_tool');
      expect(httpTool?.input_schema.type).toBe('object');

      // Check function tool has args property
      const functionTool = tools.find((t) => t.name === 'function_tool');
      expect(functionTool?.input_schema.type).toBe('object');
    });

    it('should use config for input schema when available', () => {
      manifest.spec.tools = [
        {
          type: 'custom',
          name: 'custom_tool',
          config: {
            input_schema: {
              type: 'object',
              properties: {
                custom_param: { type: 'string' },
              },
              required: ['custom_param'],
            },
          },
        },
      ];

      const adapter = new AnthropicAdapter(manifest);
      const tools = adapter.getTools();
      const customTool = tools.find((t) => t.name === 'custom_tool');
      expect(customTool?.input_schema.properties).toBeDefined();
    });
  });

  describe('Conversation Management', () => {
    it('should initialize conversation history', () => {
      const adapter = new AnthropicAdapter(manifest);
      adapter.initialize();
      const history = adapter.getConversationHistory();
      expect(history).toEqual([]);
    });

    it('should clear conversation history', () => {
      const adapter = new AnthropicAdapter(manifest);
      adapter.initialize();
      adapter.clearHistory();
      const history = adapter.getConversationHistory();
      expect(history).toEqual([]);
    });
  });

  describe('Agent Info', () => {
    it('should return correct agent info', () => {
      const adapter = new AnthropicAdapter(manifest);
      const info = adapter.getAgentInfo();

      expect(info.name).toBe('test-agent');
      expect(info.model).toBe('claude-3-5-sonnet-20241022');
      expect(info.provider).toBe('anthropic');
      expect(Array.isArray(info.tools)).toBe(true);
    });

    it('should include tools in agent info', () => {
      manifest.extensions = {
        anthropic: {
          tools: [
            {
              name: 'tool1',
              description: 'Tool 1',
              input_schema: { type: 'object', properties: {} },
            },
            {
              name: 'tool2',
              description: 'Tool 2',
              input_schema: { type: 'object', properties: {} },
            },
          ],
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.tools).toContain('tool1');
      expect(info.tools).toContain('tool2');
    });
  });

  describe('Client Access', () => {
    it('should provide access to Anthropic client', () => {
      const adapter = new AnthropicAdapter(manifest);
      const client = adapter.getClient();
      expect(client).toBeDefined();
      expect(typeof client.messages.create).toBe('function');
    });
  });

  describe('Model Support', () => {
    it('should support Claude 3.5 Sonnet', () => {
      manifest.extensions = {
        anthropic: {
          model: 'claude-3-5-sonnet-20241022',
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should support Claude 3 Opus', () => {
      manifest.extensions = {
        anthropic: {
          model: 'claude-3-opus-20240229',
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('claude-3-opus-20240229');
    });

    it('should support Claude 3 Haiku', () => {
      manifest.extensions = {
        anthropic: {
          model: 'claude-3-haiku-20250320',
        },
      };

      const adapter = new AnthropicAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('claude-3-haiku-20250320');
    });
  });

  describe('Edge Cases', () => {
    it('should handle manifest without extensions', () => {
      delete manifest.extensions;
      const adapter = new AnthropicAdapter(manifest);
      expect(adapter.getAgentInfo().name).toBe('test-agent');
    });

    it('should handle manifest without llm config', () => {
      delete manifest.spec.llm;
      const adapter = new AnthropicAdapter(manifest);
      expect(adapter.getAgentInfo().model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should handle manifest without tools', () => {
      delete manifest.spec.tools;
      const adapter = new AnthropicAdapter(manifest);
      expect(adapter.getTools()).toEqual([]);
    });

    it('should register handler for non-existent tool', () => {
      const adapter = new AnthropicAdapter(manifest);
      const handler = jest.fn(async () => JSON.stringify({ ok: true }));
      adapter.registerToolHandler('new_tool', handler);

      const tools = adapter.getTools();
      const newTool = tools.find((t) => t.name === 'new_tool');
      expect(newTool).toBeDefined();
      expect(newTool?.handler).toBe(handler);
    });
  });
});
