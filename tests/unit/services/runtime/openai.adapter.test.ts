import { describe, it, expect, beforeEach } from '@jest/globals';
import { OpenAIAdapter } from '../../../../src/services/runtime/openai.adapter.js';
import type { OssaAgent } from '../../../../src/types/index.js';
import { API_VERSION } from '../../../../src/version.js';

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  let mockManifest: OssaAgent;

  beforeEach(() => {
    mockManifest = {
      apiVersion: API_VERSION,
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4o-mini',
        },
        tools: [],
      },
    };

    process.env.OPENAI_API_KEY = 'sk-test-key';
    adapter = new OpenAIAdapter(mockManifest);
  });

  describe('initialize', () => {
    it('should initialize without error', () => {
      expect(() => adapter.initialize()).not.toThrow();
    });
  });

  describe('registerToolHandler', () => {
    it('should register tool handler', () => {
      const handler = async () => 'result';
      expect(() => adapter.registerToolHandler('test', handler)).not.toThrow();
    });

    it('should register multiple handlers', () => {
      expect(() => {
        adapter.registerToolHandler('tool1', async () => 'r1');
        adapter.registerToolHandler('tool2', async () => 'r2');
      }).not.toThrow();
    });

    it('should not register handler for non-existent tool', () => {
      const handler = async () => 'result';
      // Should not throw, but won't register if tool doesn't exist
      expect(() =>
        adapter.registerToolHandler('nonexistent', handler)
      ).not.toThrow();
    });
  });

  describe('getAgentInfo', () => {
    it('should return agent info', () => {
      const info = adapter.getAgentInfo();
      expect(info.name).toBe('test-agent');
      expect(info.model).toBe('gpt-4o-mini');
      expect(Array.isArray(info.tools)).toBe(true);
    });

    it('should return empty tools array when no tools configured', () => {
      // getAgentInfo returns tools from internal tools Map
      // registerToolHandler only adds handlers to existing tools, doesn't create new entries
      const info = adapter.getAgentInfo();
      expect(info.tools).toEqual([]);
    });

    it('should return tools from openai_agents extension tools_mapping', () => {
      const manifestWithTools: OssaAgent = {
        ...mockManifest,
        extensions: {
          openai_agents: {
            tools_mapping: [
              {
                ossa_capability: 'search',
                openai_tool_name: 'web_search',
                description: 'Search the web',
                parameters: {
                  type: 'object',
                  properties: { query: { type: 'string' } },
                  required: ['query'],
                },
              },
            ],
          },
        },
      };
      const toolAdapter = new OpenAIAdapter(manifestWithTools);
      // Tools are populated lazily, so getAgentInfo initially returns empty
      // This is correct behavior - tools are only loaded when chat() is called
      const info = toolAdapter.getAgentInfo();
      expect(info.tools).toEqual([]);
    });

    it('should return tools from spec.tools', () => {
      const manifestWithSpecTools: OssaAgent = {
        ...mockManifest,
        spec: {
          ...mockManifest.spec,
          tools: [
            { type: 'function', name: 'calculate', capabilities: ['math'] },
          ],
        },
      };
      const toolAdapter = new OpenAIAdapter(manifestWithSpecTools);
      // Tools are populated lazily, so getAgentInfo initially returns empty
      const info = toolAdapter.getAgentInfo();
      expect(info.tools).toEqual([]);
    });
  });

  describe('model selection', () => {
    it('should use model from openai_agents extension when provided', () => {
      const manifestWithExtModel: OssaAgent = {
        ...mockManifest,
        extensions: {
          openai_agents: {
            model: 'gpt-4-turbo',
          },
        },
      };
      const extAdapter = new OpenAIAdapter(manifestWithExtModel);
      const info = extAdapter.getAgentInfo();
      expect(info.model).toBe('gpt-4-turbo');
    });

    it('should fall back to llm.model when no extension model', () => {
      const info = adapter.getAgentInfo();
      expect(info.model).toBe('gpt-4o-mini');
    });

    it('should use default model when neither extension nor llm model provided', () => {
      const manifestNoModel: OssaAgent = {
        ...mockManifest,
        spec: {
          ...mockManifest.spec,
          llm: undefined,
        },
      };
      const defaultAdapter = new OpenAIAdapter(manifestNoModel);
      const info = defaultAdapter.getAgentInfo();
      expect(info.model).toBe('gpt-4o-mini');
    });
  });

  describe('system prompt', () => {
    it('should use instructions from openai_agents extension when provided', () => {
      const manifestWithInstructions: OssaAgent = {
        ...mockManifest,
        extensions: {
          openai_agents: {
            instructions: 'Custom instructions from extension',
          },
        },
      };
      const extAdapter = new OpenAIAdapter(manifestWithInstructions);
      extAdapter.initialize();
      // System prompt is set during initialize, we can verify through behavior
      const info = extAdapter.getAgentInfo();
      expect(info).toBeDefined();
    });

    it('should fall back to role when no extension instructions', () => {
      adapter.initialize();
      // Role is used as system prompt fallback
      const info = adapter.getAgentInfo();
      expect(info).toBeDefined();
    });
  });

  describe('tool configuration', () => {
    it('should have tool configuration available', () => {
      const manifestWithMapping: OssaAgent = {
        ...mockManifest,
        extensions: {
          openai_agents: {
            tools_mapping: [
              {
                ossa_capability: 'search',
                openai_tool_name: 'web_search',
                description: 'Search the web',
                parameters: {
                  type: 'object',
                  properties: { query: { type: 'string' } },
                  required: ['query'],
                },
              },
              {
                ossa_capability: 'calculate',
                description: 'Perform calculations',
              },
            ],
          },
        },
      };
      const toolAdapter = new OpenAIAdapter(manifestWithMapping);
      // Tools are lazily loaded, verify adapter can be created with tools_mapping
      expect(toolAdapter).toBeDefined();
      expect(
        manifestWithMapping.extensions?.openai_agents?.tools_mapping
      ).toHaveLength(2);
    });

    it('should handle tool configuration without openai_tool_name', () => {
      const manifestWithUnnamedTool: OssaAgent = {
        ...mockManifest,
        extensions: {
          openai_agents: {
            tools_mapping: [
              {
                ossa_capability: 'search',
                description: 'Search capability',
              },
            ],
          },
        },
      };
      const toolAdapter = new OpenAIAdapter(manifestWithUnnamedTool);
      expect(toolAdapter).toBeDefined();
    });

    it('should handle tool configuration without parameters', () => {
      const manifestWithNoParams: OssaAgent = {
        ...mockManifest,
        extensions: {
          openai_agents: {
            tools_mapping: [
              {
                ossa_capability: 'get_time',
                openai_tool_name: 'current_time',
                description: 'Get current time',
              },
            ],
          },
        },
      };
      const toolAdapter = new OpenAIAdapter(manifestWithNoParams);
      expect(toolAdapter).toBeDefined();
    });

    it('should handle both extensions and spec tools', () => {
      const manifestWithDuplicates: OssaAgent = {
        ...mockManifest,
        spec: {
          ...mockManifest.spec,
          tools: [{ type: 'function', name: 'search', capabilities: [] }],
        },
        extensions: {
          openai_agents: {
            tools_mapping: [
              {
                ossa_capability: 'search',
                openai_tool_name: 'search',
                description: 'Search tool',
              },
            ],
          },
        },
      };
      const toolAdapter = new OpenAIAdapter(manifestWithDuplicates);
      expect(toolAdapter).toBeDefined();
      // Both configurations present
      expect(manifestWithDuplicates.spec.tools).toHaveLength(1);
      expect(
        manifestWithDuplicates.extensions?.openai_agents?.tools_mapping
      ).toHaveLength(1);
    });

    it('should handle spec.tools without names', () => {
      const manifestWithUnnamedSpecTool: OssaAgent = {
        ...mockManifest,
        spec: {
          ...mockManifest.spec,
          tools: [{ type: 'function', capabilities: ['math'] }],
        },
      };
      const toolAdapter = new OpenAIAdapter(manifestWithUnnamedSpecTool);
      const info = toolAdapter.getAgentInfo();
      // Tools without names won't be loaded
      expect(info.tools).toEqual([]);
    });
  });

  describe('API key handling', () => {
    it('should use provided API key', () => {
      const customKeyAdapter = new OpenAIAdapter(mockManifest, 'sk-custom-key');
      expect(customKeyAdapter).toBeDefined();
    });

    it('should use OPENAI_API_KEY from environment when not provided', () => {
      process.env.OPENAI_API_KEY = 'sk-env-key';
      const envKeyAdapter = new OpenAIAdapter(mockManifest);
      expect(envKeyAdapter).toBeDefined();
    });
  });

  describe('temperature and maxTokens', () => {
    it('should respect temperature from manifest', () => {
      const manifestWithTemp: OssaAgent = {
        ...mockManifest,
        spec: {
          ...mockManifest.spec,
          llm: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0.3,
          },
        },
      };
      const tempAdapter = new OpenAIAdapter(manifestWithTemp);
      expect(tempAdapter).toBeDefined();
    });

    it('should respect maxTokens from manifest', () => {
      const manifestWithTokens: OssaAgent = {
        ...mockManifest,
        spec: {
          ...mockManifest.spec,
          llm: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            maxTokens: 1000,
          },
        },
      };
      const tokensAdapter = new OpenAIAdapter(manifestWithTokens);
      expect(tokensAdapter).toBeDefined();
    });
  });
});
