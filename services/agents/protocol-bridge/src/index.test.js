import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ProtocolConverter } from './protocol-converter.js';
import { MCPBridge } from './mcp-bridge.js';
import { A2ABridge } from './a2a-bridge.js';

describe('Protocol Bridge Agent Tests', () => {
  describe('ProtocolConverter', () => {
    it('should convert OpenAPI to MCP tools', async () => {
      const converter = new ProtocolConverter();
      const openAPISpec = {
        openapi: '3.1.0',
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
              summary: 'Get all users',
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: { type: 'array' }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const mcpTools = await converter.openAPIToMCP(openAPISpec);
      assert.strictEqual(mcpTools.length, 1);
      assert.strictEqual(mcpTools[0].name, 'getUsers');
      assert.strictEqual(mcpTools[0].description, 'Get all users');
    });

    it('should convert MCP to OpenAPI', async () => {
      const converter = new ProtocolConverter();
      const mcpDefinition = {
        tools: [
          {
            name: 'searchData',
            description: 'Search for data',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' }
              }
            }
          }
        ]
      };

      const openAPISpec = await converter.MCPToOpenAPI(mcpDefinition);
      assert.strictEqual(openAPISpec.openapi, '3.1.0');
      assert.ok(openAPISpec.paths['/search-data']);
      assert.strictEqual(openAPISpec.paths['/search-data'].post.operationId, 'searchData');
    });

    it('should validate conversion integrity', async () => {
      const converter = new ProtocolConverter();
      const openAPISpec = {
        paths: {
          '/test': {
            get: { operationId: 'test1' },
            post: { operationId: 'test2' }
          }
        }
      };

      const mcpTools = await converter.openAPIToMCP(openAPISpec);
      const validation = await converter.validateConversion(openAPISpec, mcpTools, 'openapi-to-mcp');
      
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(mcpTools.length, 2);
    });
  });

  describe('MCPBridge', () => {
    it('should get available tools', async () => {
      const bridge = new MCPBridge();
      const tools = await bridge.getAvailableTools();
      
      assert.ok(Array.isArray(tools));
      assert.ok(tools.length > 0);
      assert.ok(tools.some(t => t.name === 'search'));
    });

    it('should execute search tool', async () => {
      const bridge = new MCPBridge();
      const result = await bridge.executeTool('search', { query: 'test query' });
      
      assert.ok(result.results);
      assert.strictEqual(result.results[0].title, 'Result for: test query');
    });

    it('should validate tool parameters', async () => {
      const bridge = new MCPBridge();
      
      await assert.rejects(
        bridge.executeTool('search', {}),
        /Missing required parameter: query/
      );
    });

    it('should handle unknown tools', async () => {
      const bridge = new MCPBridge();
      
      await assert.rejects(
        bridge.executeTool('unknownTool', {}),
        /Tool 'unknownTool' not found/
      );
    });
  });

  describe('A2ABridge', () => {
    it('should discover agents', async () => {
      const bridge = new A2ABridge();
      const agents = await bridge.discoverAgents();
      
      assert.ok(Array.isArray(agents));
      assert.ok(agents.length > 0);
      assert.ok(agents.some(a => a.id === 'protocol-bridge'));
    });

    it('should filter agents by capabilities', async () => {
      const bridge = new A2ABridge();
      const agents = await bridge.discoverAgents({ 
        capabilities: ['protocol_conversion'] 
      });
      
      assert.ok(agents.every(a => a.capabilities.includes('protocol_conversion')));
    });

    it('should handle task handoff', async () => {
      const bridge = new A2ABridge();
      const result = await bridge.handoffTask({
        fromAgent: 'protocol-bridge',
        toAgent: 'protocol-bridge',
        context: { test: true },
        task: { description: 'Test task' }
      });
      
      assert.strictEqual(result.status, 'success');
      assert.ok(result.handoffId);
      assert.ok(result.result);
    });

    it('should reject handoff to inactive agent', async () => {
      const bridge = new A2ABridge();
      
      await assert.rejects(
        bridge.handoffTask({
          fromAgent: 'protocol-bridge',
          toAgent: 'framework-integration',
          context: {},
          task: {}
        }),
        /Target agent 'framework-integration' is not active/
      );
    });

    it('should get agent capabilities', async () => {
      const bridge = new A2ABridge();
      const capabilities = await bridge.getAgentCapabilities('protocol-bridge');
      
      assert.strictEqual(capabilities.id, 'protocol-bridge');
      assert.ok(capabilities.capabilities.includes('protocol_conversion'));
    });
  });
});

// Run tests
console.log('Running Protocol Bridge Agent tests...');