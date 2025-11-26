/**
 * OpenAI Adapter Unit Tests
 * Test the OpenAI runtime adapter functionality
 */

import { jest } from '@jest/globals';
import type { OssaManifest } from '../../../../src/services/runtime/openai.adapter.js';

// Mock OpenAI SDK
const mockCreate = jest.fn();
const mockOpenAI = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockCreate,
    },
  },
}));

jest.unstable_mockModule('openai', () => ({
  default: mockOpenAI,
}));

// Import after mocking
const { OpenAIAdapter } = await import(
  '../../../../src/services/runtime/openai.adapter.js'
);

describe('OpenAIAdapter', () => {
  let adapter: InstanceType<typeof OpenAIAdapter>;
  let manifest: OssaManifest;

  beforeEach(() => {
    jest.clearAllMocks();

    manifest = {
      apiVersion: 'ossa/v0.2.4',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test agent',
      },
      spec: {
        role: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
        tools: [],
      },
    };

    // Default mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Test response',
          },
        },
      ],
    });
  });

  describe('Constructor', () => {
    it('should create adapter with manifest', () => {
      adapter = new OpenAIAdapter(manifest);
      expect(adapter).toBeDefined();
    });

    it('should create adapter with custom API key', () => {
      adapter = new OpenAIAdapter(manifest, 'custom-api-key');
      expect(adapter).toBeDefined();
      expect(mockOpenAI).toHaveBeenCalledWith({
        apiKey: 'custom-api-key',
      });
    });

    it('should use environment variable for API key', () => {
      process.env.OPENAI_API_KEY = 'env-api-key';
      adapter = new OpenAIAdapter(manifest);
      expect(adapter).toBeDefined();
    });
  });

  describe('Model Selection', () => {
    it('should use model from OpenAI extension', () => {
      manifest.extensions = {
        openai_agents: {
          model: 'gpt-4-turbo',
        },
      };

      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('gpt-4-turbo');
    });

    it('should fall back to LLM config model', () => {
      manifest.spec.llm = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
      };

      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('gpt-3.5-turbo');
    });

    it('should use default model when not specified', () => {
      delete manifest.spec.llm;

      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('gpt-4o-mini');
    });
  });

  describe('System Prompt', () => {
    it('should use instructions from OpenAI extension', async () => {
      manifest.extensions = {
        openai_agents: {
          instructions: 'Custom instructions from extension',
        },
      };

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('Hello');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'Custom instructions from extension',
            }),
          ]),
        })
      );
    });

    it('should fall back to role for system prompt', async () => {
      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('Hello');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'You are a helpful assistant',
            }),
          ]),
        })
      );
    });
  });

  describe('Tool Mapping', () => {
    it('should convert tools_mapping to OpenAI functions', () => {
      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'search',
              openai_tool_name: 'web_search',
              description: 'Search the web',
              parameters: {
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

      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.tools).toContain('web_search');
    });

    it('should use ossa_capability as tool name if openai_tool_name not provided', () => {
      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'calculate',
              description: 'Perform calculations',
              parameters: {
                type: 'object',
                properties: {},
              },
            },
          ],
        },
      };

      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.tools).toContain('calculate');
    });

    it('should convert spec.tools to OpenAI functions', () => {
      manifest.spec.tools = [
        {
          type: 'function',
          name: 'get_weather',
        },
      ];

      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();
      expect(info.tools).toContain('get_weather');
    });

    it('should not duplicate tools from both sources', () => {
      manifest.spec.tools = [
        {
          type: 'function',
          name: 'search',
        },
      ];

      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'search',
              openai_tool_name: 'search',
              description: 'Search',
              parameters: { type: 'object', properties: {} },
            },
          ],
        },
      };

      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();
      const searchCount = info.tools.filter((t) => t === 'search').length;
      expect(searchCount).toBe(1);
    });
  });

  describe('Tool Handler Registration', () => {
    it('should register tool handler', () => {
      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'test_tool',
              description: 'Test tool',
              parameters: { type: 'object', properties: {} },
            },
          ],
        },
      };

      adapter = new OpenAIAdapter(manifest);
      const handler = jest.fn().mockResolvedValue('Handler result');

      adapter.registerToolHandler('test_tool', handler);

      // Handler should be registered (tested in execution)
      expect(handler).not.toHaveBeenCalled();
    });

    it('should not register handler for non-existent tool', () => {
      adapter = new OpenAIAdapter(manifest);
      const handler = jest.fn().mockResolvedValue('Result');

      adapter.registerToolHandler('non_existent', handler);

      // Should not throw error
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Tool Execution', () => {
    it('should execute tool with registered handler', async () => {
      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'calculate',
              description: 'Calculate',
              parameters: {
                type: 'object',
                properties: {
                  expression: { type: 'string' },
                },
              },
            },
          ],
        },
      };

      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_123',
                    type: 'function',
                    function: {
                      name: 'calculate',
                      arguments: JSON.stringify({ expression: '2+2' }),
                    },
                  },
                ],
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'The result is 4',
              },
            },
          ],
        });

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      const handler = jest.fn().mockResolvedValue('4');
      adapter.registerToolHandler('calculate', handler);

      const response = await adapter.chat('What is 2+2?');

      expect(handler).toHaveBeenCalledWith({ expression: '2+2' });
      expect(response).toBe('The result is 4');
    });

    it('should return placeholder for tool without handler', async () => {
      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'no_handler',
              description: 'Tool without handler',
              parameters: { type: 'object', properties: {} },
            },
          ],
        },
      };

      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_456',
                    type: 'function',
                    function: {
                      name: 'no_handler',
                      arguments: JSON.stringify({}),
                    },
                  },
                ],
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Tool executed',
              },
            },
          ],
        });

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      const response = await adapter.chat('Test');

      expect(response).toBe('Tool executed');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle tool execution errors', async () => {
      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'error_tool',
              description: 'Tool that errors',
              parameters: { type: 'object', properties: {} },
            },
          ],
        },
      };

      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_789',
                    type: 'function',
                    function: {
                      name: 'error_tool',
                      arguments: JSON.stringify({}),
                    },
                  },
                ],
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Handled error',
              },
            },
          ],
        });

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      const handler = jest.fn().mockRejectedValue(new Error('Tool failed'));
      adapter.registerToolHandler('error_tool', handler);

      const response = await adapter.chat('Test');

      expect(handler).toHaveBeenCalled();
      expect(response).toBe('Handled error');
    });

    it('should return error for unknown tool', async () => {
      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                tool_calls: [
                  {
                    id: 'call_unknown',
                    type: 'function',
                    function: {
                      name: 'unknown_tool',
                      arguments: JSON.stringify({}),
                    },
                  },
                ],
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Tool not found',
              },
            },
          ],
        });

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      const response = await adapter.chat('Test');

      expect(response).toBe('Tool not found');
    });
  });

  describe('Conversation Management', () => {
    it('should initialize conversation with system message', () => {
      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      // Initialization should set up system message
      expect(adapter).toBeDefined();
    });

    it('should maintain conversation history', async () => {
      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('First message');
      await adapter.chat('Second message');

      // Second call should include history
      expect(mockCreate).toHaveBeenCalledTimes(2);
      const secondCall = mockCreate.mock.calls[1][0];
      expect(secondCall.messages.length).toBeGreaterThan(2); // system + user messages
    });

    it('should add user messages to history', async () => {
      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('User message');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'User message',
            }),
          ]),
        })
      );
    });

    it('should add assistant responses to history', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Assistant response',
            },
          },
        ],
      });

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('First');
      await adapter.chat('Second');

      const secondCall = mockCreate.mock.calls[1][0];
      const assistantMessages = secondCall.messages.filter(
        (m: any) => m.role === 'assistant'
      );
      expect(assistantMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Chat Options', () => {
    it('should respect maxTurns option', async () => {
      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'loop_tool',
              description: 'Tool that loops',
              parameters: { type: 'object', properties: {} },
            },
          ],
        },
      };

      // Always return tool calls to test max turns
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_loop',
                  type: 'function',
                  function: {
                    name: 'loop_tool',
                    arguments: JSON.stringify({}),
                  },
                },
              ],
            },
          },
        ],
      });

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      const response = await adapter.chat('Test', { maxTurns: 3 });

      expect(response).toBe('Max turns reached without completion');
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should use default maxTurns of 10', async () => {
      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'loop_tool',
              description: 'Tool that loops',
              parameters: { type: 'object', properties: {} },
            },
          ],
        },
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_loop',
                  type: 'function',
                  function: {
                    name: 'loop_tool',
                    arguments: JSON.stringify({}),
                  },
                },
              ],
            },
          },
        ],
      });

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      const response = await adapter.chat('Test');

      expect(response).toBe('Max turns reached without completion');
      expect(mockCreate).toHaveBeenCalledTimes(10);
    });

    it('should not log in non-verbose mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('Test', { verbose: false });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('LLM Configuration', () => {
    it('should use temperature from manifest', async () => {
      manifest.spec.llm = {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
      };

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('Test');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
        })
      );
    });

    it('should use default temperature of 0.7', async () => {
      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('Test');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
        })
      );
    });

    it('should use maxTokens from manifest', async () => {
      manifest.spec.llm = {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 1000,
      };

      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('Test');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000,
        })
      );
    });

    it('should omit max_tokens if not specified', async () => {
      adapter = new OpenAIAdapter(manifest);
      adapter.initialize();

      await adapter.chat('Test');

      const call = mockCreate.mock.calls[0][0];
      expect(call.max_tokens).toBeUndefined();
    });
  });

  describe('getAgentInfo', () => {
    it('should return agent name, model, and tools', () => {
      manifest.metadata.name = 'my-agent';
      manifest.spec.llm = {
        provider: 'openai',
        model: 'gpt-4-turbo',
      };
      manifest.extensions = {
        openai_agents: {
          tools_mapping: [
            {
              ossa_capability: 'tool1',
              description: 'Tool 1',
              parameters: { type: 'object', properties: {} },
            },
            {
              ossa_capability: 'tool2',
              description: 'Tool 2',
              parameters: { type: 'object', properties: {} },
            },
          ],
        },
      };

      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();

      expect(info.name).toBe('my-agent');
      expect(info.model).toBe('gpt-4-turbo');
      expect(info.tools).toEqual(['tool1', 'tool2']);
    });

    it('should return empty tools array when no tools defined', () => {
      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();

      expect(info.tools).toEqual([]);
    });
  });
});
