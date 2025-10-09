import { describe, test, expect } from '@jest/globals';
import type { Agent, CreateAgentRequest } from '../../src/server/types/agent';
import type { BridgeConfig, MCPBridgeConfig } from '../../libs/packages/ossa-specification/dist/types/bridge';

/**
 * MCPB (Model Context Protocol Bridge) Integration Tests
 *
 * Tests for integrating MCPB support into OSSA agent schema
 * Following TDD approach - these tests will initially fail
 */

describe('OSSA Agent Schema - MCPB Integration', () => {
  describe('Agent Type with Bridge Configuration', () => {
    test('should support bridge configuration in Agent type', () => {
      const agent: Agent & { bridge?: BridgeConfig } = {
        id: 'test-agent-001',
        type: 'worker',
        name: 'Test MCP Agent',
        description: 'Agent with MCP bridge support',
        version: '1.0.0',
        status: 'active',
        capabilities: ['chat', 'file-operations'],
        configuration: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bridge: {
          mcp: {
            enabled: true,
            server_type: 'stdio',
            tools: [
              {
                name: 'analyze_text',
                description: 'Analyze text content',
                input_schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' }
                  }
                }
              }
            ]
          }
        }
      };

      expect(agent.bridge).toBeDefined();
      expect(agent.bridge?.mcp).toBeDefined();
      expect(agent.bridge?.mcp?.enabled).toBe(true);
      expect(agent.bridge?.mcp?.tools).toHaveLength(1);
    });

    test('should support multiple bridge types simultaneously', () => {
      const agent: Agent & { bridge?: BridgeConfig } = {
        id: 'multi-bridge-agent',
        type: 'orchestrator',
        name: 'Multi-Bridge Agent',
        version: '1.0.0',
        status: 'active',
        capabilities: ['orchestration', 'integration'],
        configuration: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bridge: {
          mcp: {
            enabled: true,
            server_type: 'websocket',
            tools: []
          },
          openapi: {
            enabled: true,
            spec_url: 'https://api.example.com/openapi.json',
            spec_version: '3.1'
          },
          langchain: {
            enabled: true,
            chain_type: 'agent'
          }
        }
      };

      expect(agent.bridge?.mcp?.enabled).toBe(true);
      expect(agent.bridge?.openapi?.enabled).toBe(true);
      expect(agent.bridge?.langchain?.enabled).toBe(true);
    });

    test('should validate MCP bridge configuration', () => {
      const mcpConfig: MCPBridgeConfig = {
        enabled: true,
        server_type: 'sse',
        tools: [
          {
            name: 'file_read',
            description: 'Read file contents',
            input_schema: {
              type: 'object',
              properties: {
                path: { type: 'string' }
              },
              required: ['path']
            },
            capability: 'file-operations'
          }
        ],
        resources: [
          {
            uri: 'ossa://files',
            name: 'File System',
            description: 'Access to file system',
            mimeType: 'application/json',
            readonly: false
          }
        ],
        prompts: [
          {
            name: 'analyze_code',
            description: 'Analyze source code',
            template: 'Analyze the following code: {{code}}',
            arguments: [
              {
                name: 'code',
                type: 'string',
                required: true
              }
            ]
          }
        ],
        config: {
          max_message_size: 1048576,
          timeout_ms: 30000,
          retry_count: 3
        }
      };

      expect(mcpConfig.enabled).toBe(true);
      expect(mcpConfig.server_type).toBe('sse');
      expect(mcpConfig.tools).toHaveLength(1);
      expect(mcpConfig.resources).toHaveLength(1);
      expect(mcpConfig.prompts).toHaveLength(1);
      expect(mcpConfig.config?.max_message_size).toBe(1048576);
    });
  });

  describe('CreateAgentRequest with Bridge Configuration', () => {
    test('should support bridge config in agent creation request', () => {
      const createRequest: CreateAgentRequest & { bridge?: BridgeConfig } = {
        type: 'worker',
        name: 'MCP Worker Agent',
        description: 'Worker agent with MCP bridge',
        version: '1.0.0',
        capabilities: ['data-processing', 'mcp-tools'],
        configuration: {},
        bridge: {
          mcp: {
            enabled: true,
            server_type: 'stdio',
            tools: [
              {
                name: 'process_data',
                description: 'Process data using agent capabilities'
              }
            ]
          }
        }
      };

      expect(createRequest.bridge).toBeDefined();
      expect(createRequest.bridge?.mcp?.enabled).toBe(true);
    });

    test('should handle optional bridge configuration', () => {
      const createRequest: CreateAgentRequest = {
        type: 'worker',
        name: 'Simple Agent',
        capabilities: ['basic-operations'],
        configuration: {}
      };

      // Bridge should be optional
      expect(createRequest).toBeDefined();
      expect((createRequest as any).bridge).toBeUndefined();
    });
  });

  describe('MCP Bridge Transport Types', () => {
    test('should support stdio transport', () => {
      const mcpConfig: MCPBridgeConfig = {
        enabled: true,
        server_type: 'stdio'
      };

      expect(mcpConfig.server_type).toBe('stdio');
    });

    test('should support SSE transport', () => {
      const mcpConfig: MCPBridgeConfig = {
        enabled: true,
        server_type: 'sse'
      };

      expect(mcpConfig.server_type).toBe('sse');
    });

    test('should support WebSocket transport', () => {
      const mcpConfig: MCPBridgeConfig = {
        enabled: true,
        server_type: 'websocket'
      };

      expect(mcpConfig.server_type).toBe('websocket');
    });
  });

  describe('MCP Tools Configuration', () => {
    test('should support tool mapping to agent capabilities', () => {
      const tool = {
        name: 'search_knowledge_base',
        description: 'Search the agent knowledge base',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'number' }
          },
          required: ['query']
        },
        capability: 'knowledge-search'
      };

      expect(tool.capability).toBe('knowledge-search');
      expect(tool.input_schema.required).toContain('query');
    });

    test('should support complex tool input schemas', () => {
      const tool = {
        name: 'execute_workflow',
        description: 'Execute a multi-step workflow',
        input_schema: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  params: { type: 'object' }
                }
              }
            }
          }
        },
        output_schema: {
          type: 'object',
          properties: {
            execution_id: { type: 'string' },
            status: { type: 'string', enum: ['completed', 'failed', 'running'] },
            results: { type: 'array' }
          }
        }
      };

      expect(tool.input_schema.properties.steps).toBeDefined();
      expect(tool.output_schema).toBeDefined();
    });
  });

  describe('MCP Resources Configuration', () => {
    test('should support read-only resources', () => {
      const resource = {
        uri: 'ossa://config',
        name: 'Agent Configuration',
        description: 'Read-only agent configuration',
        mimeType: 'application/json',
        readonly: true
      };

      expect(resource.readonly).toBe(true);
    });

    test('should support writable resources', () => {
      const resource = {
        uri: 'ossa://workspace',
        name: 'Agent Workspace',
        description: 'Read-write workspace',
        mimeType: 'application/json',
        readonly: false
      };

      expect(resource.readonly).toBe(false);
    });
  });

  describe('MCP Prompts Configuration', () => {
    test('should support prompts with template variables', () => {
      const prompt = {
        name: 'code_review',
        description: 'Review code changes',
        template: 'Review the following {{language}} code:\n{{code}}\n\nFocus on: {{focus_areas}}',
        arguments: [
          { name: 'language', type: 'string', required: true },
          { name: 'code', type: 'string', required: true },
          { name: 'focus_areas', type: 'string', required: false }
        ]
      };

      expect(prompt.template).toContain('{{language}}');
      expect(prompt.arguments).toHaveLength(3);
      expect(prompt.arguments?.find((a) => a.name === 'language')?.required).toBe(true);
    });
  });

  describe('Bridge Configuration Advanced Options', () => {
    test('should support MCP configuration with timeouts and retries', () => {
      const mcpConfig: MCPBridgeConfig = {
        enabled: true,
        server_type: 'websocket',
        config: {
          max_message_size: 2097152,
          timeout_ms: 60000,
          retry_count: 5
        }
      };

      expect(mcpConfig.config?.max_message_size).toBe(2097152);
      expect(mcpConfig.config?.timeout_ms).toBe(60000);
      expect(mcpConfig.config?.retry_count).toBe(5);
    });

    test('should support custom bridge configurations', () => {
      const bridgeConfig: BridgeConfig = {
        mcp: {
          enabled: true,
          server_type: 'stdio'
        },
        custom: {
          my_custom_bridge: {
            enabled: true,
            endpoint: 'https://custom.bridge.io',
            api_key: 'sk-custom-key'
          }
        }
      };

      expect(bridgeConfig.custom).toBeDefined();
      expect((bridgeConfig.custom as any).my_custom_bridge.enabled).toBe(true);
    });
  });

  describe('Integration with Agent Metadata', () => {
    test('should include bridge info in agent metadata', () => {
      const agent: Agent & { bridge?: BridgeConfig } = {
        id: 'mcp-enabled-agent',
        type: 'worker',
        name: 'MCP Enabled Agent',
        version: '1.0.0',
        status: 'active',
        capabilities: ['mcp-integration'],
        configuration: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          tags: ['mcp', 'bridge', 'integration'],
          documentation_url: 'https://docs.example.com/mcp-agent'
        },
        bridge: {
          mcp: {
            enabled: true,
            server_type: 'websocket',
            tools: []
          }
        }
      };

      expect(agent.metadata?.tags).toContain('mcp');
      expect(agent.bridge?.mcp?.enabled).toBe(true);
    });
  });
});
