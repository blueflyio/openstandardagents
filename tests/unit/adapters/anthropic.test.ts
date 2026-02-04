import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AnthropicAdapter } from '../../../src/adapters/anthropic/runtime.js';
import { AnthropicClient } from '../../../src/adapters/anthropic/client.js';
import { ToolMapper } from '../../../src/adapters/anthropic/tools.js';
import {
  createTextMessage,
  validateMessage,
  mergeMessages,
} from '../../../src/adapters/anthropic/messages.js';
import {
  mergeConfig,
  validateConfig,
  calculateCost,
  getRecommendedModel,
  DEFAULT_MODELS,
} from '../../../src/adapters/anthropic/config.js';
import type { OssaAgent } from '../../../src/types/index.js';

describe('AnthropicAdapter', () => {
  let mockAgent: OssaAgent;
  let adapter: AnthropicAdapter;

  beforeEach(() => {
    mockAgent = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test agent for unit tests',
      },
      spec: {
        role: 'You are a helpful test assistant',
        llm: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
          maxTokens: 4096,
        },
        tools: [],
      },
    };

    // Mock environment variable
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-12345';
  });

  describe('AnthropicAdapter', () => {
    it('should create adapter from manifest', () => {
      expect(() => new AnthropicAdapter(mockAgent)).not.toThrow();
    });

    it('should extract agent configuration', () => {
      const adapter = new AnthropicAdapter(mockAgent);
      const info = adapter.getAgentInfo();

      expect(info.name).toBe('test-agent');
      expect(info.version).toBe('1.0.0');
      expect(info.model).toBe('claude-3-5-sonnet-20241022');
      expect(info.provider).toBe('anthropic');
      expect(info.role).toBe('You are a helpful test assistant');
    });

    it('should initialize without error', () => {
      const adapter = new AnthropicAdapter(mockAgent);
      expect(() => adapter.initialize()).not.toThrow();
    });

    it('should clear conversation history', () => {
      const adapter = new AnthropicAdapter(mockAgent);
      adapter.clearHistory();
      expect(adapter.getConversationHistory()).toEqual([]);
    });

    it('should register tool handler', () => {
      const agentWithTools: OssaAgent = {
        ...mockAgent,
        spec: {
          ...mockAgent.spec,
          tools: [
            {
              type: 'function',
              name: 'test_tool',
              config: {
                description: 'Test tool',
                input_schema: {
                  type: 'object',
                  properties: {
                    input: { type: 'string' },
                  },
                },
              },
            },
          ],
        },
      };

      const adapter = new AnthropicAdapter(agentWithTools);
      const handler = async (args: Record<string, unknown>) =>
        `Received: ${args.input}`;

      const registered = adapter.registerToolHandler('test_tool', handler);
      expect(registered).toBe(true);
    });

    it('should not register handler for non-existent tool', () => {
      const adapter = new AnthropicAdapter(mockAgent);
      const handler = async () => 'result';

      const registered = adapter.registerToolHandler('nonexistent', handler);
      expect(registered).toBe(false);
    });

    it('should get agent info with tools', () => {
      const agentWithTools: OssaAgent = {
        ...mockAgent,
        spec: {
          ...mockAgent.spec,
          tools: [
            { type: 'function', name: 'tool1' },
            { type: 'function', name: 'tool2' },
          ],
        },
      };

      const adapter = new AnthropicAdapter(agentWithTools);
      const info = adapter.getAgentInfo();

      expect(info.tools).toContain('tool1');
      expect(info.tools).toContain('tool2');
    });

    it('should update configuration', () => {
      const adapter = new AnthropicAdapter(mockAgent);
      expect(() => adapter.updateConfig({ temperature: 0.5 })).not.toThrow();
    });

    it('should get client and tool mapper', () => {
      const adapter = new AnthropicAdapter(mockAgent);
      expect(adapter.getClient()).toBeInstanceOf(AnthropicClient);
      expect(adapter.getToolMapper()).toBeInstanceOf(ToolMapper);
    });

    it('should handle anthropic extension configuration', () => {
      const agentWithExtension: OssaAgent = {
        ...mockAgent,
        extensions: {
          anthropic: {
            model: 'claude-3-opus-20240229',
            temperature: 0.9,
            max_tokens: 8192,
          },
        },
      };

      const adapter = new AnthropicAdapter(agentWithExtension);
      const config = adapter.getClient().getConfig();

      expect(config.model).toBe('claude-3-opus-20240229');
      expect(config.temperature).toBe(0.9);
      expect(config.maxTokens).toBe(8192);
    });
  });

  describe('AnthropicClient', () => {
    it('should create client with config', () => {
      expect(
        () =>
          new AnthropicClient({
            apiKey: 'test-key',
            model: 'claude-3-5-sonnet-20241022',
          })
      ).not.toThrow();
    });

    it('should throw on invalid config', () => {
      expect(
        () =>
          new AnthropicClient({
            apiKey: 'test-key',
            temperature: 2.0, // Invalid
          })
      ).toThrow();
    });

    it('should get and reset stats', () => {
      const client = new AnthropicClient({ apiKey: 'test-key' });
      const stats = client.getStats();

      expect(stats.requestCount).toBe(0);
      expect(stats.totalInputTokens).toBe(0);
      expect(stats.totalOutputTokens).toBe(0);

      client.resetStats();
      expect(client.getStats().requestCount).toBe(0);
    });

    it('should update config', () => {
      const client = new AnthropicClient({ apiKey: 'test-key' });
      expect(() => client.updateConfig({ temperature: 0.5 })).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should merge config with defaults', () => {
      const config = mergeConfig({
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229',
      });

      expect(config.apiKey).toBe('test-key');
      expect(config.model).toBe('claude-3-opus-20240229');
      expect(config.temperature).toBe(0.7);
      expect(config.maxTokens).toBe(4096);
    });

    it('should validate valid config', () => {
      const result = validateConfig(
        mergeConfig({
          apiKey: 'test-key',
          temperature: 0.5,
        })
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should invalidate config without API key', () => {
      const originalEnv = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      const result = validateConfig(
        mergeConfig({
          apiKey: '',
        })
      );
      if (originalEnv) process.env.ANTHROPIC_API_KEY = originalEnv;

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should invalidate config with invalid temperature', () => {
      const result = validateConfig(
        mergeConfig({
          apiKey: 'test-key',
          temperature: 2.0,
        })
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Temperature must be between 0 and 1');
    });

    it('should calculate cost correctly', () => {
      const cost = calculateCost('claude-3-5-sonnet-20241022', 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });

    it('should recommend models based on criteria', () => {
      expect(getRecommendedModel({ complexity: 'high' })).toBe(
        DEFAULT_MODELS.opus
      );

      expect(getRecommendedModel({ complexity: 'low' })).toBe(
        DEFAULT_MODELS.haiku
      );

      expect(getRecommendedModel({ complexity: 'medium', speed: 'fast' })).toBe(
        DEFAULT_MODELS.haiku
      );
    });
  });

  describe('Messages', () => {
    it('should create text message', () => {
      const message = createTextMessage('user', 'Hello');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
    });

    it('should validate valid message', () => {
      const message = createTextMessage('user', 'Test');
      const result = validateMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should invalidate message with empty content', () => {
      const message = createTextMessage('user', '');
      const result = validateMessage(message);

      expect(result.valid).toBe(false);
    });

    it('should merge consecutive messages', () => {
      const messages = [
        createTextMessage('user', 'Hello'),
        createTextMessage('user', 'World'),
        createTextMessage('assistant', 'Hi'),
      ];

      const merged = mergeMessages(messages);
      expect(merged).toHaveLength(2);
      expect(merged[0].role).toBe('user');
      expect(merged[1].role).toBe('assistant');
    });
  });

  describe('ToolMapper', () => {
    it('should map agent tools', () => {
      const agentWithTools: OssaAgent = {
        ...mockAgent,
        spec: {
          ...mockAgent.spec,
          tools: [
            {
              type: 'function',
              name: 'test_tool',
              config: {
                description: 'Test tool',
                input_schema: {
                  type: 'object',
                  properties: {
                    arg: { type: 'string' },
                  },
                  required: ['arg'],
                },
              },
            },
          ],
        },
      };

      const mapper = new ToolMapper();
      const tools = mapper.mapAgentTools(agentWithTools);

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test_tool');
      expect(tools[0].description).toBe('Test tool');
    });

    it('should register and execute tool handler', async () => {
      const mapper = new ToolMapper();
      mapper.mapAgentTools({
        ...mockAgent,
        spec: {
          ...mockAgent.spec,
          tools: [{ type: 'function', name: 'test_tool' }],
        },
      });

      const handler = async (args: Record<string, unknown>) =>
        `Result: ${args.input}`;
      mapper.registerToolHandler('test_tool', handler);

      const result = await mapper.executeTool('test_tool', { input: 'test' });
      expect(result).toContain('Result: test');
    });

    it('should return error for non-existent tool', async () => {
      const mapper = new ToolMapper();
      const result = await mapper.executeTool('nonexistent', {});
      expect(result).toContain('not found');
    });

    it('should return error when no handler registered', async () => {
      const mapper = new ToolMapper();
      mapper.mapAgentTools({
        ...mockAgent,
        spec: {
          ...mockAgent.spec,
          tools: [{ type: 'function', name: 'test_tool' }],
        },
      });

      const result = await mapper.executeTool('test_tool', {});
      expect(result).toContain('No handler registered');
    });

    it('should clear all tools', () => {
      const mapper = new ToolMapper();
      mapper.mapAgentTools({
        ...mockAgent,
        spec: {
          ...mockAgent.spec,
          tools: [{ type: 'function', name: 'test_tool' }],
        },
      });

      expect(mapper.getTools()).toHaveLength(1);
      mapper.clear();
      expect(mapper.getTools()).toHaveLength(0);
    });
  });
});
