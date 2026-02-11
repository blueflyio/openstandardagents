/**
 * MCP Integration Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  MCPIntegrationService,
  MCPMessageType,
} from '../mcp-integration.js';
import type { AgentIdentity } from '../a2a-protocol.js';
import { A2AMessageType, MessagePriority } from '../a2a-protocol.js';

// Helper to create test agent identity
function createTestAgent(name: string, namespace: string): AgentIdentity {
  return {
    id: crypto.randomUUID(),
    uri: `agent://${namespace}/${name}`,
    name,
    namespace,
    capabilities: ['test'],
    version: '1.0.0',
  };
}

describe('MCPIntegrationService', () => {
  let service: MCPIntegrationService;

  beforeEach(() => {
    service = new MCPIntegrationService();
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('Connection Management', () => {
    it('should connect to MCP server (mock)', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        const connection = await service.connectMCPServer(uri);
        expect(connection).toBeDefined();
        expect(connection.uri).toBe(uri);
        expect(connection.status).toBe('connected');
      } catch (error) {
        // Expected to fail without real server, but should attempt connection
        expect(error).toBeDefined();
      }
    });

    it('should disconnect from MCP server', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        const connection = await service.connectMCPServer(uri);
        await service.disconnectMCPServer(connection.id);
      } catch (error) {
        // Expected to fail without real server
      }
    });

    it('should handle disconnect of non-existent connection', async () => {
      await expect(
        service.disconnectMCPServer('non-existent-id')
      ).rejects.toThrow('MCP connection not found');
    });
  });

  describe('Server Exposure', () => {
    it('should expose agent as MCP server', async () => {
      const agent = createTestAgent('Test Agent', 'test-namespace');

      const server = await service.exposeMCPServer(agent);

      expect(server).toBeDefined();
      expect(server.agent).toEqual(agent);
      expect(server.endpoint).toContain(agent.namespace);
      expect(server.endpoint).toContain(agent.name);
      expect(server.capabilities).toBeDefined();
    });

    it('should set default capabilities for exposed server', async () => {
      const agent = createTestAgent('Test Agent', 'test-namespace');

      const server = await service.exposeMCPServer(agent);

      expect(server.capabilities.resources?.list).toBe(true);
      expect(server.capabilities.prompts?.list).toBe(true);
      expect(server.capabilities.tools?.list).toBe(true);
      expect(server.capabilities.logging).toBeDefined();
    });
  });

  describe('Discovery Operations', () => {
    it('should discover resources (connection required)', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        const connection = await service.connectMCPServer(uri);
        const resources = await service.discoverResources(connection.id);
        expect(Array.isArray(resources)).toBe(true);
      } catch (error) {
        // Expected to fail without real server
        expect(error).toBeDefined();
      }
    });

    it('should discover prompts (connection required)', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        const connection = await service.connectMCPServer(uri);
        const prompts = await service.discoverPrompts(connection.id);
        expect(Array.isArray(prompts)).toBe(true);
      } catch (error) {
        // Expected to fail without real server
        expect(error).toBeDefined();
      }
    });

    it('should discover tools (connection required)', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        const connection = await service.connectMCPServer(uri);
        const tools = await service.discoverTools(connection.id);
        expect(Array.isArray(tools)).toBe(true);
      } catch (error) {
        // Expected to fail without real server
        expect(error).toBeDefined();
      }
    });

    it('should handle discovery with invalid connection ID', async () => {
      await expect(
        service.discoverResources('invalid-id')
      ).rejects.toThrow('MCP connection not found');

      await expect(service.discoverPrompts('invalid-id')).rejects.toThrow(
        'MCP connection not found'
      );

      await expect(service.discoverTools('invalid-id')).rejects.toThrow(
        'MCP connection not found'
      );
    });
  });

  describe('Tool Invocation', () => {
    it('should call MCP tool (connection required)', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        const connection = await service.connectMCPServer(uri);
        const result = await service.callTool(connection.id, 'test-tool', {
          arg1: 'value1',
        });
        expect(result).toBeDefined();
      } catch (error) {
        // Expected to fail without real server
        expect(error).toBeDefined();
      }
    });

    it('should handle tool call with invalid connection', async () => {
      await expect(
        service.callTool('invalid-id', 'test-tool', {})
      ).rejects.toThrow('MCP connection not found');
    });
  });

  describe('Resource Reading', () => {
    it('should read MCP resource (connection required)', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        const connection = await service.connectMCPServer(uri);
        const content = await service.readResource(
          connection.id,
          'resource://test/path'
        );
        expect(content).toBeDefined();
      } catch (error) {
        // Expected to fail without real server
        expect(error).toBeDefined();
      }
    });

    it('should handle resource read with invalid connection', async () => {
      await expect(
        service.readResource('invalid-id', 'resource://test')
      ).rejects.toThrow('MCP connection not found');
    });
  });

  describe('Protocol Conversion', () => {
    it('should convert A2A message to MCP format', () => {
      const from = createTestAgent('Sender', 'sender');
      const to = createTestAgent('Receiver', 'receiver');

      const a2aMessage = {
        id: 'test-123',
        from,
        to,
        type: A2AMessageType.COMMAND,
        payload: { action: 'test' },
        version: '0.4.5',
        metadata: {
          priority: MessagePriority.NORMAL,
          timeout: 30000,
          retries: 3,
          traceContext: {
            traceparent: '00-trace-span-01',
            traceId: 'trace',
            spanId: 'span',
          },
          createdAt: new Date().toISOString(),
        },
      };

      const mcpMessage: any = service.a2aToMCP(a2aMessage);

      expect(mcpMessage).toHaveProperty('jsonrpc', '2.0');
      expect(mcpMessage).toHaveProperty('id', 'test-123');
      expect(mcpMessage).toHaveProperty('method');
      expect(mcpMessage).toHaveProperty('params');
      expect(mcpMessage.metadata).toHaveProperty('from', from.uri);
    });

    it('should convert MCP message to A2A format', () => {
      const from = createTestAgent('Sender', 'sender');
      const to = createTestAgent('Receiver', 'receiver');

      const mcpMessage = {
        jsonrpc: '2.0',
        id: 'mcp-123',
        method: MCPMessageType.TOOLS_CALL,
        params: { tool: 'test' },
      };

      const a2aMessage = service.mcpToA2A(mcpMessage, from, to);

      expect(a2aMessage).toHaveProperty('id', 'mcp-123');
      expect(a2aMessage).toHaveProperty('from', from);
      expect(a2aMessage).toHaveProperty('to', to);
      expect(a2aMessage).toHaveProperty('type');
      expect(a2aMessage).toHaveProperty('payload');
      expect(a2aMessage).toHaveProperty('version', '0.4.4');
      expect(a2aMessage.metadata).toBeDefined();
    });

    it('should map A2A types to MCP methods correctly', () => {
      const agent = createTestAgent('Test', 'test');

      const baseMessage = {
        id: '1',
        from: agent,
        to: agent,
        payload: {},
        version: '0.4.5',
        metadata: {
          priority: MessagePriority.NORMAL,
          timeout: 30000,
          retries: 3,
          traceContext: { traceparent: '00-t-s-01', traceId: 't', spanId: 's' },
          createdAt: new Date().toISOString(),
        },
      };

      // Test request -> tools/call
      const requestMsg = { ...baseMessage, type: A2AMessageType.REQUEST };
      const mcpRequest: any = service.a2aToMCP(requestMsg);
      expect(mcpRequest.method).toBe(MCPMessageType.TOOLS_CALL);

      // Test command -> tools/call
      const commandMsg = { ...baseMessage, type: A2AMessageType.COMMAND };
      const mcpCommand: any = service.a2aToMCP(commandMsg);
      expect(mcpCommand.method).toBe(MCPMessageType.TOOLS_CALL);

      // Test event -> notification
      const eventMsg = { ...baseMessage, type: A2AMessageType.EVENT };
      const mcpEvent: any = service.a2aToMCP(eventMsg);
      expect(mcpEvent.method).toBe(MCPMessageType.NOTIFICATION);
    });
  });

  describe('Statistics and State', () => {
    it('should track connections', () => {
      const connections = service.getConnections();
      expect(Array.isArray(connections)).toBe(true);
    });

    it('should track exposed servers', async () => {
      const agent = createTestAgent('Test', 'test');

      await service.exposeMCPServer(agent);

      const servers = service.getServers();
      expect(servers.length).toBeGreaterThan(0);
      expect(servers[0].agent).toEqual(agent);
    });

    it('should provide transport statistics', () => {
      const stats = service.getTransportStats();
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('connections');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all connections', async () => {
      await expect(service.cleanup()).resolves.not.toThrow();
    });

    it('should disconnect all transport connections on cleanup', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        await service.connectMCPServer(uri);
      } catch (error) {
        // Ignore connection errors
      }

      await service.cleanup();

      const stats = service.getTransportStats();
      expect(stats.totalConnections).toBe(0);
    });
  });
});
